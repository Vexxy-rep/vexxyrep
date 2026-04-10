// ============================================================
//  VexxyRep — Serveur Express + PostgreSQL
// ============================================================

require("dotenv").config();
const express = require("express");
const path    = require("path");
const multer  = require("multer");
const db      = require("./db/index");

const app         = express();
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const PORT        = process.env.PORT || 3000;

// ---- Middlewares ----
app.use(express.json());

// ---- Upload images (multer) ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "images")),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Fichier non image"));
  },
});

// ---- Auth middleware admin ----
function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: "ADMIN_PASSWORD non défini dans .env" });
  }
  if (!auth || auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: "Non autorisé." });
  }
  next();
}

// ---- Rate limiter signalements ----
const reportLog      = new Map();
const MAX_REPORTS    = 2;
const WINDOW_MS      = 60 * 1000;
const allReports     = [];
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function countLast30Days() {
  const cutoff = Date.now() - THIRTY_DAYS_MS;
  return allReports.filter(t => t >= cutoff).length;
}
function isRateLimited(ip) {
  const now        = Date.now();
  const timestamps = (reportLog.get(ip) || []).filter(t => now - t < WINDOW_MS);
  reportLog.set(ip, timestamps);
  return timestamps.length >= MAX_REPORTS;
}

// ================================================================
//  PUBLIC — GET /api/products
// ================================================================
app.get("/api/products", async (_req, res) => {
  try {
    const [catRows, prodRows] = await Promise.all([
      db.query("SELECT id, label FROM categories ORDER BY sort_order"),
      db.query("SELECT id, name, category_id AS category, brand, image, link, price, coup_de_coeur, quality FROM products WHERE visible = TRUE ORDER BY id"),
    ]);
    const config = require("./data/products.json").config;
    res.json({
      config,
      categories: [{ id: "all", label: "Tous" }, ...catRows.rows],
      products:   prodRows.rows,
    });
  } catch (err) {
    console.error("Erreur /api/products :", err.message);
    res.status(500).json({ error: "Erreur base de données." });
  }
});

// ================================================================
//  PUBLIC — POST /api/report
// ================================================================
app.post("/api/report", async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress;
  if (isRateLimited(ip)) return res.status(429).json({ error: "Limite atteinte (2/minute)." });

  const { name, link } = req.body;
  if (!name || typeof name !== "string")
    return res.status(400).json({ error: "Données invalides." });
  if (name.length > 200 || (link && link.length > 500))
    return res.status(400).json({ error: "Données trop longues." });
  if (!WEBHOOK_URL)
    return res.status(500).json({ error: "Webhook non configuré." });

  try {
    const total30j = countLast30Days();
    const response = await fetch(WEBHOOK_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "@everyone",
        embeds: [{
          title: "🔴 Lien mort signalé",
          color: 0xE53E3E,
          fields: [
            { name: "Produit",            value: name,                    inline: true  },
            { name: "Lien",               value: link || "*(non renseigné)*", inline: false },
            { name: "Signalements (30j)", value: `${total30j + 1}`, inline: true  },
          ],
          timestamp: new Date().toISOString(),
          footer:    { text: "VexxyRep — Signalement automatique" },
        }],
      }),
    });
    if (response.ok || response.status === 204) {
      allReports.push(Date.now());
      const ts = reportLog.get(ip) || [];
      ts.push(Date.now());
      reportLog.set(ip, ts);
      return res.json({ success: true });
    }
    return res.status(502).json({ error: "Discord a refusé le message." });
  } catch (err) {
    return res.status(500).json({ error: "Erreur réseau." });
  }
});

// ================================================================
//  ADMIN — Login
// ================================================================
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password && password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Mot de passe incorrect." });
  }
});

// ================================================================
//  ADMIN — Upload image
// ================================================================
app.post("/api/admin/upload", adminAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu." });
  res.json({ path: `images/${req.file.filename}` });
});

// ================================================================
//  ADMIN — Catégories
// ================================================================
app.get("/api/admin/categories", adminAuth, async (_req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM categories ORDER BY sort_order");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/categories", adminAuth, async (req, res) => {
  try {
    const { id, label } = req.body;
    if (!id || !label) return res.status(400).json({ error: "id et label requis." });
    const { rows } = await db.query(
      `INSERT INTO categories (id, label, sort_order)
       VALUES ($1, $2, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))
       RETURNING *`,
      [id.toLowerCase().replace(/\s+/g, "-"), label]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/categories/:id", adminAuth, async (req, res) => {
  try {
    await db.query("DELETE FROM categories WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
//  ADMIN — Produits (CRUD)
// ================================================================
app.get("/api/admin/products", adminAuth, async (_req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, c.label AS category_label, p.visible
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/products", adminAuth, async (req, res) => {
  try {
    const { name, category_id, brand, image, link, price, visible, coup_de_coeur, quality } = req.body;
    if (!name) return res.status(400).json({ error: "Le nom est requis." });
    const { rows } = await db.query(
      `INSERT INTO products (name, category_id, brand, image, link, price, visible, coup_de_coeur, quality)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, category_id || null, brand || "", image || "", link || "", price || "", visible !== false, !!coup_de_coeur, quality || null]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/products/:id", adminAuth, async (req, res) => {
  try {
    const { name, category_id, brand, image, link, price, visible, coup_de_coeur, quality } = req.body;
    const { rows } = await db.query(
      `UPDATE products
       SET name=$1, category_id=$2, brand=$3, image=$4, link=$5, price=$6, visible=$7, coup_de_coeur=$8, quality=$9
       WHERE id=$10 RETURNING *`,
      [name, category_id || null, brand || "", image || "", link || "", price || "", visible !== false, !!coup_de_coeur, quality || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Produit introuvable." });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/products/:id", adminAuth, async (req, res) => {
  try {
    await db.query("DELETE FROM products WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
//  Démarrage
// ================================================================
// Fichiers statiques — après toutes les routes API
app.use(express.static(path.join(__dirname)));

async function start() {
  try {
    await db.query("SELECT 1");
    console.log("   Base de données : ✓ connectée");
  } catch (err) {
    console.error("   Base de données : ✗", err.message);
  }
  app.listen(PORT, () => {
    console.log(`\n✅  VexxyRep → http://localhost:${PORT}`);
    console.log(`    Admin       → http://localhost:${PORT}/admin.html`);
    console.log(`    Webhook     : ${WEBHOOK_URL ? "✓" : "✗ MANQUANT"}\n`);
  });
}

start();
