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

// ─── Helper : créer notification admin ───────────────────────────────────────
const addAdminNotif = async (type, title, body = null) => {
  try {
    await db.query(
      `INSERT INTO admin_notifications (type, title, body, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [type, title, body]
    );
  } catch (err) {
    console.error("admin notif error:", err.message);
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
                u.plan_managed_by, u.team_owner_id,
                CASE WHEN u.plan_managed_by = 'team' THEN (
                  SELECT tm.team_name FROM team_members tm
                  WHERE tm.member_id = u.id AND tm.status = 'active' LIMIT 1
                ) ELSE NULL END AS team_name,
                CASE WHEN u.plan_managed_by = 'team' THEN (
                  SELECT owner.email FROM users owner WHERE owner.id = u.team_owner_id LIMIT 1
                ) ELSE NULL END AS team_owner_email,
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
  const { plan, generations_count, banned, email_verified,
          override_duration, override_reason } = req.body;
  // override_duration : "7d" | "30d" | "90d" | "permanent" | null (= sync Stripe)

  try {
    const userRes = await db.query("SELECT * FROM users WHERE id=$1", [req.params.id]);
    if (!userRes.rows.length) return res.status(404).json({ message: "User introuvable" });
    const user = userRes.rows[0];

    const fields = [];
    const values = [];
    let i = 1;

    if (plan !== undefined) {
      fields.push(`plan=$${i++}`); values.push(plan);
      // Override admin
      if (override_duration) {
        let expiresAt = null;
        if (override_duration === "7d")        expiresAt = new Date(Date.now() + 7*86400000);
        else if (override_duration === "30d")  expiresAt = new Date(Date.now() + 30*86400000);
        else if (override_duration === "90d")  expiresAt = new Date(Date.now() + 90*86400000);
        // permanent → null

        fields.push(`admin_override=true`);
        fields.push(`admin_override_plan=$${i++}`); values.push(plan);
        fields.push(`override_expires_at=$${i++}`); values.push(expiresAt);
        fields.push(`override_reason=$${i++}`);     values.push(override_reason || null);
        fields.push(`override_granted_by=$${i++}`); values.push(req.user.id);
      }
    }
    if (generations_count !== undefined) { fields.push(`generations_count=$${i++}`); values.push(generations_count); }
    if (banned !== undefined)             { fields.push(`banned=$${i++}`);             values.push(banned); }
    if (email_verified !== undefined)     { fields.push(`email_verified=$${i++}`);     values.push(email_verified); }

    if (!fields.length) return res.status(400).json({ message: "Nothing to update" });

    values.push(req.params.id);
    await db.query(`UPDATE users SET ${fields.join(",")} WHERE id=$${i}`, values);

    const details = { plan, generations_count, banned, email_verified, override_duration, override_reason };
    await logAction(req.user.id, banned !== undefined ? (banned ? "ban_user" : "unban_user") : "edit_user", req.params.id, details);

    res.json({ success: true });
  } catch (err) {
    console.error("Patch user error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /admin/users/:id ──────────────────────────────────────────────────
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    const userRes = await db.query("SELECT email FROM users WHERE id=$1", [req.params.id]);
    if (!userRes.rows.length) return res.status(404).json({ message: "User introuvable" });
    if (userRes.rows[0].email === ADMIN_EMAIL)
      return res.status(403).json({ message: "Impossible de supprimer l'admin principal" });
    await db.query("DELETE FROM users WHERE id=$1", [req.params.id]);
    await logAction(req.user.id, "delete_user", req.params.id, { email: userRes.rows[0].email });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete user error:", err.message);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ─── GET /admin/logs ──────────────────────────────────────────────────────────
router.get("/logs", adminAuth, async (req, res) => {
  try {
    const { page = 1, type = "admin" } = req.query;
    const limit  = 50;
    const offset = (page - 1) * limit;

    const ADMIN_ACTIONS   = ["edit_user","ban_user","unban_user","reset_quota","delete_user","verify_email","resend_verification","force_password_reset","send_password_reset","create_admin","delete_admin","reset_admin_password","edit_user_plan","override_expired","promo_code_created","promo_code_deleted","promo_code_toggled"];
    const BILLING_ACTIONS = ["plan_upgrade","cancel_subscription","subscription_renewed","payment_failed","renewal_reminder_3d","renewal_reminder_30d","grace_period_warning_24h","grace_period_expired_downgrade","winback_7d","winback_30d","winback_90d"];
    const USER_ACTIONS    = ["register","login","save_post","generate","promo_code_used","referral_reward"];
    const TEAM_ACTIONS    = ["post_approved","post_rejected","post_assigned","post_assigned_to_me","post_comment_added","post_comment_deleted","post_linked_to_client","post_unlinked_from_client","team_calendar_add","team_calendar_move","team_calendar_delete","team_calendar_published","team_permissions_updated","webhook_subscribed","webhook_deleted","agency_analytics_view"];

    let whereClause = "";
    if (type === "admin")   whereClause = `WHERE l.action = ANY(ARRAY[${ADMIN_ACTIONS.map(a   => `'${a}'`).join(",")}])`;
    if (type === "users")   whereClause = `WHERE l.action = ANY(ARRAY[${USER_ACTIONS.map(a    => `'${a}'`).join(",")}])`;
    if (type === "team") {
      const actionFilter = req.query.action_filter || "";
      if (actionFilter) {
        whereClause = `WHERE l.action ILIKE '%${actionFilter.replace(/'/g,"''")}%'`;
      } else {
        whereClause = `WHERE l.action = ANY(ARRAY[${TEAM_ACTIONS.map(a => `'${a}'`).join(",")}])`;
      }
    }
    if (type === "billing") {
      const actionFilter = req.query.action_filter || "";
      if (actionFilter) {
        whereClause = `WHERE l.action ILIKE '%${actionFilter.replace(/'/g,"''")}%'`;
      } else {
        whereClause = `WHERE l.action = ANY(ARRAY[${BILLING_ACTIONS.map(a => `'${a}'`).join(",")}])`;
      }
    }

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
        `SELECT l.*, u.email AS user_email, u.plan AS user_plan,
                -- Contenu du message chat si action = team_chat_message
                CASE WHEN l.action = 'team_chat_message'
                  THEN (
                    SELECT tm.content FROM team_messages tm
                    WHERE tm.sender_id = l.user_id
                    ORDER BY ABS(EXTRACT(EPOCH FROM (tm.created_at - l.created_at)))
                    LIMIT 1
                  )
                  ELSE NULL
                END AS chat_content,
                -- Team name si membre
                tm_member.team_name AS user_team_name,
                owner_u.email AS team_owner_email
         FROM user_logs l
         LEFT JOIN users u ON u.id = l.user_id
         LEFT JOIN team_members tm_member ON tm_member.member_id = l.user_id AND tm_member.status = 'active'
         LEFT JOIN users owner_u ON owner_u.id = u.team_owner_id
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

// ─── GET /admin/overrides — liste des overrides admin actifs ─────────────────
router.get("/overrides", adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.plan, u.admin_override_plan,
              u.override_expires_at, u.override_reason, u.override_granted_by,
              u.had_paid_plan, u.highest_plan_ever,
              a.email as granted_by_email
       FROM users u
       LEFT JOIN users a ON a.id = u.override_granted_by
       WHERE u.admin_override = TRUE
       ORDER BY u.override_expires_at ASC NULLS LAST`
    );
    res.json({ overrides: result.rows });
  } catch (err) {
    console.error("Admin overrides error:", err.message);
    res.status(500).json({ error: "Failed to fetch overrides" });
  }
});

// ─── GET /admin/billing-stats — stats billing 30 derniers jours ──────────────
router.get("/billing-stats", adminAuth, async (req, res) => {
  try {
    const [upgrades, cancels, failed, winbacks] = await Promise.all([
      db.query(
        `SELECT COUNT(*)::int AS count FROM admin_logs WHERE action='plan_upgrade' AND created_at > NOW()-INTERVAL '30 days'`
      ),
      db.query(
        `SELECT COUNT(*)::int AS count FROM admin_logs WHERE action='cancel_subscription' AND created_at > NOW()-INTERVAL '30 days'`
      ),
      db.query(
        `SELECT COUNT(*)::int AS count FROM admin_logs WHERE action='payment_failed' AND created_at > NOW()-INTERVAL '30 days'`
      ),
      db.query(
        `SELECT COUNT(*)::int AS count FROM admin_logs WHERE action IN ('winback_7d','winback_30d','winback_90d')`
      ),
    ]);

    res.json({
      upgrades_30d:   upgrades.rows[0].count,
      cancels_30d:    cancels.rows[0].count,
      failed_30d:     failed.rows[0].count,
      winbacks_total: winbacks.rows[0].count,
    });
  } catch (err) {
    console.error("Billing stats error:", err.message);
    res.status(500).json({ error: "Failed to fetch billing stats" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CODES PROMO ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /admin/promo-codes — Liste tous les codes ───────────────────────────
router.get("/promo-codes", adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT pc.*, u.email AS created_by_email
       FROM promo_codes pc
       LEFT JOIN users u ON u.id = pc.created_by
       ORDER BY pc.created_at DESC`
    );
    res.json({ codes: result.rows });
  } catch (err) {
    console.error("promo-codes list error:", err.message);
    res.status(500).json({ error: "Failed to fetch promo codes" });
  }
});

// ─── POST /admin/promo-codes — Créer un code ────────────────────────────────
router.post("/promo-codes", adminAuth, async (req, res) => {
  const {
    code, type, plan, duration_days,
    discount_percent, discount_months,
    max_uses, expires_at, note,
  } = req.body;

  if (!code || !type) return res.status(400).json({ message: "code et type requis" });
  if (type === "access" && !plan) return res.status(400).json({ message: "plan requis pour type=access" });
  if (type === "discount" && (!discount_percent || !discount_months))
    return res.status(400).json({ message: "discount_percent et discount_months requis pour type=discount" });

  try {
    const result = await db.query(
      `INSERT INTO promo_codes
         (code, type, plan, duration_days, discount_percent, discount_months,
          max_uses, expires_at, created_by, note, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)
       RETURNING *`,
      [
        code.toUpperCase().trim(),
        type,
        plan || null,
        duration_days || null,
        discount_percent || null,
        discount_months || null,
        max_uses || 1,
        expires_at || null,
        req.user.id,
        note || null,
      ]
    );

    await logAction(req.user.id, "promo_code_created", null, { code, type, plan, max_uses });
    await addAdminNotif(
      "promo_created",
      `🎁 Code créé : ${code.toUpperCase()}`,
      `Type: ${type} | Plan: ${plan || "-"} | Max usages: ${max_uses || 1}`
    );

    res.json({ success: true, code: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ message: "Ce code existe déjà" });
    console.error("promo-codes create error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /admin/promo-codes/:id — Supprimer un code ──────────────────────
router.delete("/promo-codes/:id", adminAuth, async (req, res) => {
  try {
    const codeRes = await db.query("SELECT code FROM promo_codes WHERE id=$1", [req.params.id]);
    if (!codeRes.rows.length) return res.status(404).json({ message: "Code introuvable" });
    await db.query("DELETE FROM promo_codes WHERE id=$1", [req.params.id]);
    await logAction(req.user.id, "promo_code_deleted", null, { code: codeRes.rows[0].code });
    res.json({ success: true });
  } catch (err) {
    console.error("promo-codes delete error:", err.message);
    res.status(500).json({ error: "Failed to delete promo code" });
  }
});

// ─── PATCH /admin/promo-codes/:id/toggle — Activer/désactiver un code ───────
router.patch("/promo-codes/:id/toggle", adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      "UPDATE promo_codes SET active = NOT active WHERE id=$1 RETURNING code, active",
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Code introuvable" });
    await logAction(req.user.id, "promo_code_toggled", null, { code: result.rows[0].code, active: result.rows[0].active });
    res.json({ success: true, active: result.rows[0].active });
  } catch (err) {
    console.error("promo-codes toggle error:", err.message);
    res.status(500).json({ error: "Failed to toggle promo code" });
  }
});

// ─── GET /admin/promo-codes/:id/uses — Usages d'un code ─────────────────────
router.get("/promo-codes/:id/uses", adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT pu.*, u.email AS user_email, u.plan AS user_plan
       FROM promo_uses pu
       LEFT JOIN users u ON u.id = pu.user_id
       WHERE pu.code_id = $1
       ORDER BY pu.used_at DESC`,
      [req.params.id]
    );
    res.json({ uses: result.rows });
  } catch (err) {
    console.error("promo-codes uses error:", err.message);
    res.status(500).json({ error: "Failed to fetch uses" });
  }
});

// ─── GET /admin/promo-stats — Stats globales codes promo ────────────────────
router.get("/promo-stats", adminAuth, async (req, res) => {
  try {
    const [totalCodes, activeCodes, totalUses, referrals] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS total FROM promo_codes"),
      db.query("SELECT COUNT(*)::int AS total FROM promo_codes WHERE active=true"),
      db.query("SELECT COUNT(*)::int AS total FROM promo_uses"),
      db.query("SELECT COUNT(*)::int AS total FROM users WHERE referred_by IS NOT NULL"),
    ]);
    res.json({
      totalCodes:  totalCodes.rows[0].total,
      activeCodes: activeCodes.rows[0].total,
      totalUses:   totalUses.rows[0].total,
      totalReferrals: referrals.rows[0].total,
    });
  } catch (err) {
    console.error("promo-stats error:", err.message);
    res.status(500).json({ error: "Failed to fetch promo stats" });
  }
});

// ─── GET /admin/referrals — Liste des parrainages ────────────────────────────
router.get("/referrals", adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.referral_code, u.referral_count, u.referral_reward_days,
              COUNT(r.id)::int AS actual_referrals
       FROM users u
       LEFT JOIN users r ON r.referred_by = u.id
       WHERE u.referral_code IS NOT NULL
       GROUP BY u.id
       ORDER BY actual_referrals DESC
       LIMIT 100`
    );
    res.json({ referrals: result.rows });
  } catch (err) {
    console.error("referrals error:", err.message);
    res.status(500).json({ error: "Failed to fetch referrals" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── NOTIFICATIONS ADMIN ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /admin/notifications — Liste des notifs (non lues en premier) ───────
router.get("/notifications", adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM admin_notifications
       ORDER BY read ASC, created_at DESC
       LIMIT 50`
    );
    const unread = result.rows.filter(n => !n.read).length;
    res.json({ notifications: result.rows, unread });
  } catch (err) {
    console.error("notifications error:", err.message);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ─── PATCH /admin/notifications/:id/read — Marquer comme lue ─────────────────
router.patch("/notifications/:id/read", adminAuth, async (req, res) => {
  try {
    await db.query("UPDATE admin_notifications SET read=true WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("notification read error:", err.message);
    res.status(500).json({ error: "Failed to mark notification" });
  }
});

// ─── PATCH /admin/notifications/read-all — Tout marquer comme lu ─────────────
router.patch("/notifications/read-all", adminAuth, async (req, res) => {
  try {
    await db.query("UPDATE admin_notifications SET read=true WHERE read=false");
    res.json({ success: true });
  } catch (err) {
    console.error("notifications read-all error:", err.message);
    res.status(500).json({ error: "Failed to mark all notifications" });
  }
});

// ─── DELETE /admin/notifications — Vider toutes les notifs ───────────────────
router.delete("/notifications", adminAuth, async (req, res) => {
  try {
    await db.query("DELETE FROM admin_notifications");
    res.json({ success: true });
  } catch (err) {
    console.error("notifications clear error:", err.message);
    res.status(500).json({ error: "Failed to clear notifications" });
  }
});

export default router;
// export addAdminNotif pour usage dans auth.js / server.js
export { addAdminNotif };
