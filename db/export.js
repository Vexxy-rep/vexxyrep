// ============================================================
//  VexxyRep — Export DB locale → SQL pour Railway
//  Usage : node db/export.js
//  Génère : db/export.sql (à importer sur Railway)
// ============================================================

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const db   = require("./index");
const fs   = require("fs");
const path = require("path");

async function run() {
  console.log("\n📦 Export de la base de données locale...\n");
  const client = await db.pool.connect();
  try {
    const { rows: cats }  = await client.query("SELECT * FROM categories ORDER BY sort_order");
    const { rows: prods } = await client.query("SELECT * FROM products ORDER BY id");

    let sql = "-- VexxyRep — Export DB locale\n";
    sql += "-- À coller dans l'éditeur SQL de Railway\n\n";

    // Catégories
    sql += "-- Catégories\n";
    for (const c of cats) {
      sql += `INSERT INTO categories (id, label, sort_order) VALUES ('${esc(c.id)}', '${esc(c.label)}', ${c.sort_order}) ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;\n`;
    }

    // Produits
    sql += "\n-- Produits\n";
    sql += "TRUNCATE products RESTART IDENTITY CASCADE;\n\n";
    for (const p of prods) {
      sql += `INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('${esc(p.name)}', ${p.category_id ? `'${esc(p.category_id)}'` : "NULL"}, '${esc(p.brand || "")}', '${esc(p.image || "")}', '${esc(p.link || "")}', '${esc(p.price || "")}');\n`;
    }

    const outPath = path.join(__dirname, "export.sql");
    fs.writeFileSync(outPath, sql, "utf8");

    console.log(`✅ Export terminé !`);
    console.log(`   ${cats.length} catégories, ${prods.length} produits`);
    console.log(`   → Fichier : db/export.sql\n`);
  } catch (err) {
    console.error("❌ Erreur :", err.message);
    process.exit(1);
  } finally {
    client.release();
    db.pool.end();
  }
}

function esc(str) {
  return String(str || "").replace(/'/g, "''");
}

run();
