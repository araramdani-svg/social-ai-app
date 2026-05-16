// server/routes/admin.js
// GrowthPILOT — Sprint 4 : Admin Dashboard
// Protégé par email admin uniquement

import express from "express";
import jwt     from "jsonwebtoken";
import db      from "../db.js";

const router = express.Router();
const ADMIN_EMAIL = "admin@growthpilot.com";

// ─── Auth + Admin middleware ──────────────────────────────────────────────────
const adminAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.query("SELECT email FROM users WHERE id=$1", [user.id]);
    if (result.rows[0]?.email !== ADMIN_EMAIL) return res.status(403).json({ message: "Admin only" });
    req.user = user;
    next();
  } catch { return res.status(403).json({ message: "Invalid token" }); }
};

// ─── GET /admin/stats ─────────────────────────────────────────────────────────
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const [usersRes, plansRes, postsRes, activeRes] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS total FROM users WHERE email != $1", [ADMIN_EMAIL]),
      db.query(`SELECT plan, COUNT(*)::int AS count FROM users WHERE email != $1 GROUP BY plan ORDER BY count DESC`, [ADMIN_EMAIL]),
      db.query("SELECT COUNT(*)::int AS total FROM posts"),
      db.query(`SELECT COUNT(DISTINCT user_id)::int AS total FROM posts WHERE created_at > NOW() - INTERVAL '30 days'`),
    ]);

    const planCounts = {};
    plansRes.rows.forEach(r => { planCounts[r.plan] = r.count; });

    const mrr =
      (planCounts["Pro"]      || 0) * 19 +
      (planCounts["Business"] || 0) * 49 +
      (planCounts["Agency"]   || 0) * 99;

    res.json({
      totalUsers:   usersRes.rows[0].total,
      totalPosts:   postsRes.rows[0].total,
      activeUsers:  activeRes.rows[0].total,
      mrr,
      plans: planCounts,
    });
  } catch (err) {
    console.error("Admin stats error:", err.message);
    res.status(500).json({ error: "Stats failed" });
  }
});

// ─── GET /admin/users ─────────────────────────────────────────────────────────
router.get("/users", adminAuth, async (req, res) => {
  try {
    const { search, plan, page = 1 } = req.query;
    const limit  = 20;
    const offset = (page - 1) * limit;
    const conditions = ["email != $1"];
    const values     = [ADMIN_EMAIL];
    let i = 2;

    if (search) { conditions.push(`(email ILIKE $${i} OR linkedin_name ILIKE $${i})`); values.push(`%${search}%`); i++; }
    if (plan)   { conditions.push(`plan = $${i}`); values.push(plan); i++; }

    const where = conditions.join(" AND ");

    const [usersRes, countRes] = await Promise.all([
      db.query(
        `SELECT u.id, u.email, u.plan, u.generations_count, u.quota_reset_date,
                u.linkedin_name, u.stripe_customer_id, u.stripe_subscription_id,
                (SELECT COUNT(*)::int FROM posts p WHERE p.user_id = u.id) AS post_count
         FROM users u
         WHERE ${where}
         ORDER BY u.id DESC
         LIMIT $${i} OFFSET $${i+1}`,
        [...values, limit, offset]
      ),
      db.query(`SELECT COUNT(*)::int AS total FROM users WHERE ${where}`, values),
    ]);

    res.json({
      users: usersRes.rows,
      total: countRes.rows[0].total,
      page:  parseInt(page),
      pages: Math.ceil(countRes.rows[0].total / limit),
    });
  } catch (err) {
    console.error("Admin users error:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ─── PATCH /admin/users/:id ───────────────────────────────────────────────────
router.patch("/users/:id", adminAuth, async (req, res) => {
  const { plan, generations_count, banned } = req.body;
  const fields = [];
  const values = [];
  let i = 1;

  if (plan               !== undefined) { fields.push(`plan=$${i++}`);               values.push(plan); }
  if (generations_count  !== undefined) { fields.push(`generations_count=$${i++}`);  values.push(parseInt(generations_count)); }
  if (banned             !== undefined) { fields.push(`banned=$${i++}`);             values.push(banned); }

  if (!fields.length) return res.status(400).json({ error: "Nothing to update" });
  values.push(req.params.id);

  try {
    const result = await db.query(
      `UPDATE users SET ${fields.join(",")} WHERE id=$${i} RETURNING id, email, plan, generations_count`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Admin patch user error:", err.message);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// ─── POST /admin/users/:id/reset-quota ───────────────────────────────────────
router.post("/users/:id/reset-quota", adminAuth, async (req, res) => {
  try {
    await db.query(
      "UPDATE users SET generations_count=0, quota_reset_date=NOW() WHERE id=$1",
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Reset quota error:", err.message);
    res.status(500).json({ error: "Failed to reset quota" });
  }
});

// ─── DELETE /admin/users/:id ──────────────────────────────────────────────────
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    await db.query("DELETE FROM posts WHERE user_id=$1", [req.params.id]);
    await db.query("DELETE FROM team_members WHERE owner_id=$1 OR member_id=$1", [req.params.id]);
    await db.query("DELETE FROM agency_clients WHERE agency_id=$1", [req.params.id]);
    await db.query("DELETE FROM users WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete user error:", err.message);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
