// server/routes/calendar.js
// GrowthPILOT — Sprint 1 : Calendar CRUD (migration localStorage → DB)

import express from "express";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// ─── GET /calendar — récupère toutes les cards de l'utilisateur ───────────────
router.get("/", authenticateToken, async (req, res) => {
  const { col } = req.query;
  try {
    const result = await db.query(
      `SELECT id, title, content, col, platform, media_url,
              scheduled_date AS date, created_at, updated_at
       FROM calendar_posts
       WHERE user_id = $1 ${col ? "AND col = $2" : ""}
       ORDER BY created_at ASC`,
      col ? [req.user.id, col] : [req.user.id]
    );
    res.json({ cards: result.rows });
  } catch (err) {
    console.error("calendar GET error:", err.message);
    res.status(500).json({ error: "Failed to fetch calendar" });
  }
});

// ─── POST /calendar — crée une nouvelle card ──────────────────────────────────
router.post("/", authenticateToken, async (req, res) => {
  const { title, content = "", col = "ideas", platform = "LinkedIn", date, scheduled_at, media_url } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "Title is required" });

  // scheduled_at override date si fourni
  const finalDate = scheduled_at ? scheduled_at.split("T")[0] : date || null;

  try {
    const result = await db.query(
      `INSERT INTO calendar_posts (user_id, title, content, col, platform, scheduled_date, media_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, content, col, platform, scheduled_date AS date, media_url, created_at`,
      [req.user.id, title.trim(), content, col, platform, finalDate, media_url || null]
    );
    res.status(201).json({ card: result.rows[0] });
  } catch (err) {
    console.error("calendar POST error:", err.message);
    res.status(500).json({ error: "Failed to create card" });
  }
});

// ─── PATCH /calendar/:id — met à jour une card (col, titre, contenu, date…) ──
router.patch("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, content, col, platform, date } = req.body;

  // Construire dynamiquement les champs à mettre à jour
  const fields = [];
  const values = [];
  let idx = 1;

  if (title     !== undefined) { fields.push(`title = $${idx++}`);          values.push(title); }
  if (content   !== undefined) { fields.push(`content = $${idx++}`);        values.push(content); }
  if (col       !== undefined) { fields.push(`col = $${idx++}`);            values.push(col); }
  if (platform  !== undefined) { fields.push(`platform = $${idx++}`);       values.push(platform); }
  if (date      !== undefined) { fields.push(`scheduled_date = $${idx++}`); values.push(date || null); }

  if (fields.length === 0) return res.status(400).json({ error: "Nothing to update" });

  values.push(id, req.user.id);

  try {
    const result = await db.query(
      `UPDATE calendar_posts
       SET ${fields.join(", ")}
       WHERE id = $${idx} AND user_id = $${idx + 1}
       RETURNING id, title, content, col, platform, scheduled_date AS date, updated_at`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Card not found" });
    res.json({ card: result.rows[0] });
  } catch (err) {
    console.error("calendar PATCH error:", err.message);
    res.status(500).json({ error: "Failed to update card" });
  }
});

// ─── DELETE /calendar/:id — supprime une card ─────────────────────────────────
router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      "DELETE FROM calendar_posts WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Card not found" });
    res.json({ deleted: id });
  } catch (err) {
    console.error("calendar DELETE error:", err.message);
    res.status(500).json({ error: "Failed to delete card" });
  }
});

// ─── POST /calendar/import — importe en masse depuis localStorage (migration) ─
// Appelé une seule fois au premier chargement si localStorage contient des données
router.post("/import", authenticateToken, async (req, res) => {
  const { cards } = req.body;
  if (!Array.isArray(cards) || cards.length === 0)
    return res.status(400).json({ error: "cards array required" });

  try {
    let imported = 0;
    for (const card of cards) {
      if (!card.title?.trim()) continue;
      await db.query(
        `INSERT INTO calendar_posts (user_id, title, content, col, platform, scheduled_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [
          req.user.id,
          card.title.trim(),
          card.content || "",
          ["ideas","draft","scheduled","published"].includes(card.col) ? card.col : "ideas",
          ["LinkedIn","Threads","X","Instagram"].includes(card.platform) ? card.platform : "LinkedIn",
          card.date || null,
        ]
      );
      imported++;
    }
    res.json({ imported });
  } catch (err) {
    console.error("calendar import error:", err.message);
    res.status(500).json({ error: "Import failed" });
  }
});

export default router;
