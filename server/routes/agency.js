// server/routes/agency.js
// GrowthPILOT — Sprint 3 : Mode Agence
// Routes : CRUD clients, stats agence, switch contexte

import express from "express";
import jwt     from "jsonwebtoken";
import db      from "../db.js";

const router = express.Router();

// ─── Auth middleware ──────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// ─── Agency plan check ────────────────────────────────────────────────────────
const requireAgency = async (req, res, next) => {
  try {
    const result = await db.query("SELECT plan FROM users WHERE id=$1", [req.user.id]);
    const plan = result.rows[0]?.plan || "Free";
    if (plan !== "Agency" && plan !== "Business") {
      return res.status(403).json({
        error: "agency_required",
        message: "Agency mode is available on the Agency plan only.",
      });
    }
    req.userPlan = plan;
    next();
  } catch (err) {
    console.error("Agency check error:", err.message);
    next();
  }
};

// ─── GET /agency/clients ──────────────────────────────────────────────────────
router.get("/clients", auth, requireAgency, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ac.*, 0 AS post_count
       FROM agency_clients ac
       WHERE ac.agency_id = $1
       ORDER BY ac.created_at DESC`,
      [req.user.id]
    );
    res.json({ clients: result.rows });
  } catch (err) {
    console.error("GET /agency/clients:", err.message);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// ─── POST /agency/clients ─────────────────────────────────────────────────────
router.post("/clients", auth, requireAgency, async (req, res) => {
  const { name, email, brand, niche, notes, color, monthly_rate } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Client name required" });

  try {
    const result = await db.query(
      `INSERT INTO agency_clients (agency_id, name, email, brand, niche, notes, color, monthly_rate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [req.user.id, name.trim(), email||null, brand||null, niche||null, notes||null, color||"#ef4444", monthly_rate||0]
    );
    res.status(201).json({ client: result.rows[0] });
  } catch (err) {
    console.error("POST /agency/clients:", err.message);
    res.status(500).json({ error: "Failed to create client" });
  }
});

// ─── PATCH /agency/clients/:id ────────────────────────────────────────────────
router.patch("/clients/:id", auth, requireAgency, async (req, res) => {
  const { name, email, brand, niche, notes, color, monthly_rate } = req.body;
  const fields = [];
  const values = [];
  let i = 1;

  if (name  !== undefined) { fields.push(`name=$${i++}`);  values.push(name); }
  if (email !== undefined) { fields.push(`email=$${i++}`); values.push(email); }
  if (brand !== undefined) { fields.push(`brand=$${i++}`); values.push(brand); }
  if (niche !== undefined) { fields.push(`niche=$${i++}`); values.push(niche); }
  if (notes !== undefined) { fields.push(`notes=$${i++}`); values.push(notes); }
  if (color         !== undefined) { fields.push(`color=$${i++}`);         values.push(color); }
  if (monthly_rate  !== undefined) { fields.push(`monthly_rate=$${i++}`);  values.push(parseFloat(monthly_rate)||0); }

  if (!fields.length) return res.status(400).json({ error: "Nothing to update" });

  values.push(req.params.id, req.user.id);

  try {
    const result = await db.query(
      `UPDATE agency_clients SET ${fields.join(",")}
       WHERE id=$${i} AND agency_id=$${i+1}
       RETURNING *`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: "Client not found" });
    res.json({ client: result.rows[0] });
  } catch (err) {
    console.error("PATCH /agency/clients:", err.message);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// ─── DELETE /agency/clients/:id ───────────────────────────────────────────────
router.delete("/clients/:id", auth, requireAgency, async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM agency_clients WHERE id=$1 AND agency_id=$2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Client not found" });
    res.json({ deleted: req.params.id });
  } catch (err) {
    console.error("DELETE /agency/clients:", err.message);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

// ─── GET /agency/dashboard ────────────────────────────────────────────────────
// Stats globales agence : nb clients, posts total, répartition
router.get("/dashboard", auth, requireAgency, async (req, res) => {
  try {
    const clientsResult = await db.query(
      "SELECT COUNT(*)::int AS total FROM agency_clients WHERE agency_id=$1",
      [req.user.id]
    );

    const postsResult = await db.query(
      `SELECT COUNT(*)::int AS total,
              COALESCE(SUM(likes+comments+shares),0)::int AS total_engagement
       FROM posts
       WHERE user_id=$1 AND linkedin_post_id IS NOT NULL`,
      [req.user.id]
    );

    const recentResult = await db.query(
      `SELECT ac.name, ac.color, 0 AS posts
       FROM agency_clients ac
       WHERE ac.agency_id = $1
       ORDER BY ac.created_at DESC
       LIMIT 5`,
      [req.user.id]
    );

    const mrrResult = await db.query(
      "SELECT COALESCE(SUM(monthly_rate),0)::float AS mrr FROM agency_clients WHERE agency_id=$1",
      [req.user.id]
    );

    res.json({
      totalClients:    clientsResult.rows[0].total,
      totalPosts:      postsResult.rows[0].total,
      totalEngagement: postsResult.rows[0].total_engagement,
      topClients:      recentResult.rows,
      mrr:             mrrResult.rows[0].mrr,
    });
  } catch (err) {
    console.error("GET /agency/dashboard:", err.message);
    res.status(500).json({ error: "Dashboard failed" });
  }
});

export default router;
