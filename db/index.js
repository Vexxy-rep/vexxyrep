// ============================================================
//  VexxyRep — Pool de connexion PostgreSQL
// ============================================================
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("❌ Erreur PostgreSQL inattendue :", err.message);
});

module.exports = {
  query : (text, params) => pool.query(text, params),
  pool,
};
