import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./growthpilot.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      user_email TEXT
    )
  `);
});

db.run(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    workspace TEXT,
    campaign TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS brand_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT UNIQUE,
    niche TEXT,
    audience TEXT,
    tone TEXT,
    cta TEXT,
    banned_words TEXT
  )
`);

export default db;