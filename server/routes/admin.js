// server/routes/admin.js
// GrowthPILOT — Sprint 4 : Admin Dashboard
// Protégé par email admin uniquement

import express from "express";
import jwt     from "jsonwebtoken";
import bcrypt  from "bcryptjs";
import db      from "../db.js";

const router = express.Router();
const ADMIN_EMAIL = "admin@growthpilot.admin";

// ─── Auth + Admin middleware ──────────────────────────────────────────────────
const adminAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.query("SELECT email, is_admin FROM users WHERE id=$1", [user.id]);
    const row = result.rows[0];
    if (!row || (row.email !== ADMIN_EMAIL && !row.is_admin)) {
      return res.status(403).json({ message: "Admin only" });
    }
    req.user = user;
    next();
  } catch { return res.status(403).json({ message: "Invalid token" }); }
};

// ─── Helper : log action admin ────────────────────────────────────────────────
const logAction = async (adminId, action, targetId = null, details = null) => {
  try {
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [adminId, action, targetId ? parseInt(targetId) : null, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error("admin log error:", err.message);
  }
};

// ─── GET /admin/admins — Liste des administrateurs ───────────────────────────
router.get("/admins", adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, plan, is_admin FROM users 
       WHERE is_admin = true OR email = $1
       ORDER BY id ASC`,
      [ADMIN_EMAIL]
    );
    res.json({ admins: result.rows });
  } catch (err) {
    console.error("Get admins error:", err.message);
    res.status(500).json({ error: "Failed to fetch admins" });
  }
});

// ─── POST /admin/admins — Créer un administrateur ─────────────────────────────
router.post("/admins", adminAuth, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 8)
    return res.status(400).json({ message: "Email et mot de passe requis (min. 8 caractères)" });
  try {
    const exists = await db.query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rows.length) return res.status(400).json({ message: "Cet email existe déjà" });
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (email, password, plan, email_verified, is_admin) VALUES ($1, $2, 'Agency', true, true) RETURNING id, email",
      [email, hashed]
    );
    await logAction(req.user.id, "create_admin", result.rows[0].id, { email });
    res.json({ success: true, admin: result.rows[0] });
  } catch (err) {
    console.error("Create admin error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /admin/admins/:id — Supprimer un administrateur ───────────────────
router.delete("/admins/:id", adminAuth, async (req, res) => {
  try {
    const userRes = await db.query("SELECT email FROM users WHERE id=$1", [req.params.id]);
    if (!userRes.rows.length) return res.status(404).json({ message: "Admin introuvable" });
    if (userRes.rows[0].email === ADMIN_EMAIL)
      return res.status(403).json({ message: "Impossible de supprimer l'admin principal" });
    await db.query("DELETE FROM users WHERE id=$1", [req.params.id]);
    await logAction(req.user.id, "delete_admin", req.params.id, { email: userRes.rows[0].email });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete admin error:", err.message);
    res.status(500).json({ error: "Failed to delete admin" });
  }
});

// ─── PATCH /admin/admins/:id/password — Reset mdp admin ───────────────────────
router.patch("/admins/:id/password", adminAuth, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8)
    return res.status(400).json({ message: "Mot de passe min. 8 caractères" });
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    const result = await db.query(
      "UPDATE users SET password=$1 WHERE id=$2 RETURNING email",
      [hashed, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Admin introuvable" });
    await logAction(req.user.id, "reset_admin_password", req.params.id, { email: result.rows[0].email });
    res.json({ success: true });
  } catch (err) {
    console.error("Reset admin password error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats", adminAuth, async (req, res) => {
  try {
    const [usersRes, plansRes, postsRes, activeRes, bannedRes] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS total FROM users WHERE email != $1", [ADMIN_EMAIL]),
      db.query(`SELECT plan, COUNT(*)::int AS count FROM users WHERE email != $1 GROUP BY plan ORDER BY count DESC`, [ADMIN_EMAIL]),
      db.query("SELECT COUNT(*)::int AS total FROM posts"),
      db.query(`SELECT COUNT(DISTINCT user_id)::int AS total FROM posts WHERE created_at > NOW() - INTERVAL '30 days'`),
      db.query("SELECT COUNT(*)::int AS total FROM users WHERE banned = true AND email != $1", [ADMIN_EMAIL]),
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
      bannedUsers:  bannedRes.rows[0].total,
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
    const { search, plan, page = 1, banned, verified } = req.query;
    const limit  = 20;
    const offset = (page - 1) * limit;
    const conditions = ["email != $1", "(is_admin IS NULL OR is_admin = false)"];
    const values     = [ADMIN_EMAIL];
    let i = 2;

    if (search)   { conditions.push(`(email ILIKE $${i} OR linkedin_name ILIKE $${i})`); values.push(`%${search}%`); i++; }
    if (plan)     { conditions.push(`plan = $${i}`); values.push(plan); i++; }
    if (banned !== undefined)  { conditions.push(`banned = $${i}`);          values.push(banned === "true"); i++; }
    if (verified !== undefined){ conditions.push(`email_verified = $${i}`);  values.push(verified === "true"); i++; }

    const where = conditions.join(" AND ");

    const [usersRes, countRes] = await Promise.all([
      db.query(
        `SELECT u.id, u.email, u.plan, u.generations_count, u.quota_reset_date,
                u.linkedin_name, u.stripe_customer_id, u.stripe_subscription_id,
                u.banned, u.email_verified, u.first_name, u.last_name, u.display_name,
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
  const { plan, generations_count, banned, email_verified } = req.body;
  const fields = [];
  const values = [];
  let i = 1;

  if (plan               !== undefined) { fields.push(`plan=$${i++}`);               values.push(plan); }
  if (generations_count  !== undefined) { fields.push(`generations_count=$${i++}`);  values.push(parseInt(generations_count)); }
  if (banned             !== undefined) { fields.push(`banned=$${i++}`);             values.push(banned); }
  if (email_verified     !== undefined) { fields.push(`email_verified=$${i++}`);     values.push(email_verified); }

  if (!fields.length) return res.status(400).json({ error: "Nothing to update" });
  values.push(req.params.id);

  try {
    const result = await db.query(
      `UPDATE users SET ${fields.join(",")} WHERE id=$${i} RETURNING id, email, plan, generations_count`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    await logAction(req.user.id, 
      banned !== undefined ? (banned ? "ban_user" : "unban_user") : 
      email_verified !== undefined ? "verify_email" : "edit_user", 
      req.params.id, { plan, generations_count, banned, email_verified });
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
    await logAction(req.user.id, "reset_quota", req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Reset quota error:", err.message);
    res.status(500).json({ error: "Failed to reset quota" });
  }
});

// ─── DELETE /admin/users/:id ──────────────────────────────────────────────────
router.delete("/users/:id", adminAuth, async (req, res) => {
  const id = req.params.id;
  try {
    // Supprimer dans l'ordre pour respecter les contraintes FK
    await db.query("DELETE FROM publish_log    WHERE user_id=$1", [id]);
    await db.query("DELETE FROM calendar_posts WHERE user_id=$1", [id]);
    await db.query("DELETE FROM user_logs      WHERE user_id=$1", [id]);
    await db.query("DELETE FROM brand_memory WHERE project_name IN (SELECT name FROM projects WHERE user_id=$1)", [id]);
    await db.query("DELETE FROM posts          WHERE user_id=$1", [id]);
    await db.query("DELETE FROM projects       WHERE user_id=$1", [id]);
    await db.query("DELETE FROM team_members   WHERE owner_id=$1 OR member_id=$1", [id]);
    await db.query("DELETE FROM agency_clients WHERE agency_id=$1", [id]);
    await db.query("DELETE FROM users          WHERE id=$1", [id]);
    await logAction(req.user.id, "delete_user", id);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete user error:", err.message);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ─── POST /admin/logs — Enregistrer une action admin ─────────────────────────
router.post("/logs", adminAuth, async (req, res) => {
  const { action, target_user_id, details } = req.body;
  if (!action) return res.status(400).json({ error: "action required" });
  try {
    await logAction(req.user.id, action, target_user_id || null, details ? JSON.parse(details) : null);
    res.json({ success: true });
  } catch (err) {
    console.error("Post log error:", err.message);
    res.status(500).json({ error: "Log failed" });
  }
});

// ─── GET /admin/logs ──────────────────────────────────────────────────────────
router.get("/logs", adminAuth, async (req, res) => {
  try {
    const { page = 1, type } = req.query;
    const limit  = 30;
    const offset = (page - 1) * limit;

    // Actions admin vs user
    const ADMIN_ACTIONS = ["create_admin","delete_admin","reset_admin_password"];
    const USER_ACTIONS  = ["edit_user","ban_user","unban_user","reset_quota","delete_user","verify_email","resend_verification","force_password_reset","send_password_reset"];

    let whereClause = "";
    if (type === "admin") whereClause = `WHERE l.action = ANY(ARRAY[${ADMIN_ACTIONS.map(a => `'${a}'`).join(",")}])`;
    if (type === "users") whereClause = `WHERE l.action = ANY(ARRAY[${USER_ACTIONS.map(a => `'${a}'`).join(",")}])`;

    const [logsRes, countRes] = await Promise.all([
      db.query(
        `SELECT l.*, u.email AS target_email
         FROM admin_logs l
         LEFT JOIN users u ON u.id = l.target_user_id::integer
         ${whereClause}
         ORDER BY l.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      db.query(`SELECT COUNT(*)::int AS total FROM admin_logs l ${whereClause}`),
    ]);
    res.json({ logs: logsRes.rows, total: countRes.rows[0].total, pages: Math.ceil(countRes.rows[0].total / limit) });
  } catch (err) {
    console.error("Admin logs error:", err.message);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// ─── GET /admin/analytics/yearly ─────────────────────────────────────────────
router.get("/analytics/yearly", adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
              COUNT(*)::int AS views
       FROM page_views
       WHERE created_at >= DATE_TRUNC('year', NOW())
       GROUP BY month ORDER BY month ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Admin analytics yearly error:", err.message);
    res.status(500).json({ error: "Failed to fetch yearly analytics" });
  }
});

// ─── GET /admin/analytics/last30 ─────────────────────────────────────────────
router.get("/analytics/last30", adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DATE(created_at) AS day, COUNT(*)::int AS views
       FROM page_views
       WHERE created_at > NOW() - INTERVAL '30 days'
       GROUP BY day ORDER BY day ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Admin analytics last30 error:", err.message);
    res.status(500).json({ error: "Failed to fetch last30 analytics" });
  }
});

// ─── GET /admin/analytics ─────────────────────────────────────────────────────
router.get("/analytics", adminAuth, async (req, res) => {
  try {
    const [totalRes, byPageRes, last7Res, last30Res] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS total FROM page_views"),
      db.query(`SELECT page, COUNT(*)::int AS views FROM page_views GROUP BY page ORDER BY views DESC`),
      db.query(
        `SELECT DATE(created_at) AS day, COUNT(*)::int AS views
         FROM page_views
         WHERE created_at > NOW() - INTERVAL '7 days'
         GROUP BY day ORDER BY day ASC`
      ),
      db.query(
        `SELECT DATE(created_at) AS day, COUNT(*)::int AS views
         FROM page_views
         WHERE created_at > NOW() - INTERVAL '30 days'
         GROUP BY day ORDER BY day ASC`
      ),
    ]);
    res.json({
      total:   totalRes.rows[0].total,
      byPage:  byPageRes.rows,
      last7:   last7Res.rows,
      last30:  last30Res.rows,
    });
  } catch (err) {
    console.error("Admin analytics error:", err.message);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ─── GET /admin/user-logs ─────────────────────────────────────────────────────
router.get("/user-logs", adminAuth, async (req, res) => {
  try {
    const { page = 1, action, user_id } = req.query;
    const limit  = 50;
    const offset = (page - 1) * limit;
    const conditions = [];
    const values     = [];
    let i = 1;

    if (action)  { conditions.push(`l.action ILIKE $${i++}`); values.push(`%${action}%`); }
    if (user_id) { conditions.push(`l.user_id = $${i++}`);    values.push(parseInt(user_id)); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [logsRes, countRes] = await Promise.all([
      db.query(
        `SELECT l.*, u.email AS user_email, u.plan AS user_plan
         FROM user_logs l
         LEFT JOIN users u ON u.id = l.user_id
         ${where}
         ORDER BY l.created_at DESC
         LIMIT $${i} OFFSET $${i+1}`,
        [...values, limit, offset]
      ),
      db.query(`SELECT COUNT(*)::int AS total FROM user_logs l ${where}`, values),
    ]);

    res.json({
      logs:  logsRes.rows,
      total: countRes.rows[0].total,
      pages: Math.ceil(countRes.rows[0].total / limit),
    });
  } catch (err) {
    console.error("Admin user-logs error:", err.message);
    res.status(500).json({ error: "Failed to fetch user logs" });
  }
});

export default router;
