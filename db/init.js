// ============================================================
//  VexxyRep — Initialisation DB + Migration JSON → PostgreSQL
//
//  Lance UNE SEULE FOIS après avoir créé la base de données :
//    node db/init.js
//
//  Ce script :
//    1. Crée les tables (categories + products)
//    2. Importe les données de data/products.json
// ============================================================

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const db   = require("./index");
const data = require("../data/products.json");

async function createTables(client) {
  // Table catégories
  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id         VARCHAR(50)  PRIMARY KEY,
      label      VARCHAR(100) NOT NULL,
      sort_order INT          DEFAULT 0
    );
  `);

  // Table produits
  await client.query(`
    CREATE TABLE IF NOT EXISTS products (
      id          SERIAL       PRIMARY KEY,
      name        VARCHAR(200) NOT NULL,
      category_id VARCHAR(50)  REFERENCES categories(id) ON DELETE SET NULL,
      brand       VARCHAR(100) DEFAULT '',
      image       TEXT         DEFAULT '',
      link        TEXT         DEFAULT '',
      price       VARCHAR(50)  DEFAULT '',
      created_at  TIMESTAMPTZ  DEFAULT NOW()
    );
  `);
  // Migration : ajoute brand si la table existait déjà sans cette colonne
  await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100) DEFAULT '';`);

  console.log("   ✓ Tables créées (ou déjà existantes)");
}

async function migrateData(client) {
  let catCount  = 0;
  let prodCount = 0;

  // Insérer les catégories (sauf "all" qui est virtuelle)
  for (const [i, cat] of data.categories.entries()) {
    if (cat.id === "all") continue;
    await client.query(
      `INSERT INTO categories (id, label, sort_order)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label`,
      [cat.id, cat.label, i]
    );
    catCount++;
  }
  console.log(`   ✓ ${catCount} catégories importées`);

  // Insérer les produits
  for (const p of data.products) {
    await client.query(
      `INSERT INTO products (id, name, category_id, description, image, link, price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name        = EXCLUDED.name,
         category_id = EXCLUDED.category_id,
         description = EXCLUDED.description,
         image       = EXCLUDED.image,
         link        = EXCLUDED.link,
         price       = EXCLUDED.price`,
      [p.id, p.name, p.category, p.description, p.image, p.link, p.price]
    );
    prodCount++;
  }

  // Resynchroniser la séquence d'auto-incrément
  await client.query(
    `SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products))`
  );
  console.log(`   ✓ ${prodCount} produits importés`);
}

async function run() {
  console.log("\n🚀 Initialisation de la base de données VexxyRep...\n");
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    await createTables(client);
    await migrateData(client);
    await client.query("COMMIT");
    console.log("\n✅ Base de données prête !\n");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌ Erreur lors de l'initialisation :", err.message);
    console.error("   → Vérifie que DATABASE_URL est correct dans .env\n");
    process.exit(1);
  } finally {
    client.release();
    db.pool.end();
  }
}

run();
