import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name TEXT,
    workspace TEXT,
    campaign TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS brand_memory (
    id SERIAL PRIMARY KEY,
    project_name TEXT UNIQUE,
    niche TEXT,
    audience TEXT,
    tone TEXT,
    cta TEXT,
    banned_words TEXT
  )
`);

export default pool;