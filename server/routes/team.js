// server/routes/team.js
import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import db from "../db.js";

const router = express.Router();
const API_URL = process.env.FRONTEND_URL || "https://www.aigrowthpilot.app";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "GrowthPILOT <team@aigrowthpilot.app>";
const MAX_MEMBERS_BUSINESS = 5;
const MAX_MEMBERS_AGENCY   = 20;
const MAX_MEMBERS = 5;

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

// ─── Business plan check ──────────────────────────────────────────────────────
const requireBusiness = async (req, res, next) => {
  try {
    const result = await db.query("SELECT plan FROM users WHERE id=$1", [req.user.id]);
    const plan = result.rows[0]?.plan || "Free";
    if (plan !== "Business" && plan !== "Agency") {
      return res.status(403).json({
        error: "business_required",
        message: "Team Console is available on the Business plan and above.",
      });
    }
    req.userPlan = plan;
    req.maxMembers = plan === "Agency" ? MAX_MEMBERS_AGENCY : MAX_MEMBERS_BUSINESS;
    next();
  } catch (err) {
    console.error("Business check error:", err.message);
    next();
  }
};

// ─── Send invitation email via Resend ─────────────────────────────────────────
async function sendInviteEmail({ to, ownerName, ownerEmail, role, inviteUrl }) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — email not sent");
    return false;
  }

  const roleLabels = { admin: "Admin", editor: "Editor", publisher: "Publisher" };
  const roleLabel = roleLabels[role] || "Editor";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:28px;font-weight:900;font-style:italic;color:#000;-webkit-text-stroke:1px white;text-shadow:1px 1px 0 #ef4444;letter-spacing:1px;">
        GrowthPILOT
      </div>
      <div style="color:#475569;font-size:12px;letter-spacing:2px;margin-top:4px;">AI CONTENT OS</div>
    </div>

    <!-- Card -->
    <div style="background:linear-gradient(145deg,#1a2235,#111827);border-radius:20px;border:1px solid rgba(220,38,38,0.25);border-left:3px solid #ef4444;padding:36px;box-shadow:0 20px 60px rgba(0,0,0,0.4);">

      <div style="display:inline-block;background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.3);border-radius:20px;padding:4px 14px;font-size:11px;font-weight:700;color:#ef4444;letter-spacing:1.5px;margin-bottom:24px;">
        👥 TEAM INVITATION
      </div>

      <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 12px;line-height:1.3;">
        You've been invited to join a team
      </h1>

      <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;">
        <strong style="color:#e2e8f0;">${ownerName || ownerEmail}</strong> has invited you to collaborate on GrowthPILOT as a <strong style="color:#ef4444;">${roleLabel}</strong>.
      </p>

      <!-- Role badge -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px 20px;margin-bottom:28px;">
        <div style="color:#64748b;font-size:11px;letter-spacing:1.5px;margin-bottom:8px;">YOUR ROLE</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:8px;height:8px;border-radius:50%;background:#ef4444;"></div>
          <span style="color:#ef4444;font-size:16px;font-weight:800;letter-spacing:1px;">${roleLabel.toUpperCase()}</span>
        </div>
        <div style="color:#475569;font-size:12px;margin-top:6px;">
          ${role === "admin" ? "Full access — manage team, generate, publish & analyze" :
            role === "editor" ? "Generate content, analyze posts & access brand memory" :
            "Publish content across all connected platforms"}
        </div>
      </div>

      <!-- CTA Button -->
      <a href="${inviteUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;text-decoration:none;font-weight:800;font-size:15px;letter-spacing:0.5px;padding:16px 32px;border-radius:12px;box-shadow:0 4px 20px rgba(220,38,38,0.35);margin-bottom:20px;">
        ⚡ Accept Invitation &amp; Create Account →
      </a>

      <p style="color:#334155;font-size:12px;text-align:center;margin:0;">
        This invitation expires in 7 days. If you didn't expect this, ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:28px;">
      <p style="color:#1e293b;font-size:12px;">
        © 2026 GrowthPILOT · <a href="https://www.aigrowthpilot.app" style="color:#334155;">aigrowthpilot.app</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject: `${ownerName || "Someone"} invited you to join their GrowthPILOT team`,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) { console.error("Resend error:", data); return false; }
    return true;
  } catch (err) {
    console.error("Email send error:", err.message);
    return false;
  }
}

// ─── GET /team/members ────────────────────────────────────────────────────────
router.get("/members", auth, requireBusiness, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT tm.id, tm.member_email, tm.role, tm.status, tm.permissions,
              tm.invited_at, tm.joined_at,
              u.linkedin_name as member_name
       FROM team_members tm
       LEFT JOIN users u ON u.id = tm.member_id
       WHERE tm.owner_id = $1
       ORDER BY tm.invited_at DESC`,
      [req.user.id]
    );

    // Owner info
    const ownerResult = await db.query(
      "SELECT email, linkedin_name FROM users WHERE id=$1",
      [req.user.id]
    );
    const owner = ownerResult.rows[0];

    res.json({
      members: result.rows,
      owner: { email: owner.email, name: owner.linkedin_name || owner.email },
      maxMembers: req.maxMembers || MAX_MEMBERS,
      remaining: (req.maxMembers || MAX_MEMBERS) - result.rows.length,
    });
  } catch (err) {
    console.error("GET /team/members:", err.message);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// ─── POST /team/invite ────────────────────────────────────────────────────────
router.post("/invite", auth, requireBusiness, async (req, res) => {
  const { email, role = "editor", permissions } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    // Check member limit
    const countResult = await db.query(
      "SELECT COUNT(*) FROM team_members WHERE owner_id=$1",
      [req.user.id]
    );
    if (parseInt(countResult.rows[0].count) >= (req.maxMembers || MAX_MEMBERS)) {
      return res.status(403).json({
        error: "member_limit",
        message: `Business plan allows up to ${MAX_MEMBERS} team members.`,
      });
    }

    // Check not already invited
    const existing = await db.query(
      "SELECT id, status FROM team_members WHERE owner_id=$1 AND member_email=$2",
      [req.user.id, email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: "already_invited",
        message: `${email} has already been invited (status: ${existing.rows[0].status}).`,
      });
    }

    // Generate invite token (24 chars)
    const inviteToken = crypto.randomBytes(20).toString("hex");
    const defaultPerms = {
      canGenerate:    role !== "publisher",
      canPublish:     role !== "editor",
      canAnalyze:     true,
      canViewMemory:  role === "admin",
      canManageTeam:  role === "admin",
      ...permissions,
    };

    await db.query(
      `INSERT INTO team_members (owner_id, member_email, role, status, invite_token, permissions)
       VALUES ($1, $2, $3, 'pending', $4, $5)`,
      [req.user.id, email.toLowerCase(), role, inviteToken, JSON.stringify(defaultPerms)]
    );

    // Get owner info for email
    const ownerResult = await db.query(
      "SELECT email, linkedin_name FROM users WHERE id=$1",
      [req.user.id]
    );
    const owner = ownerResult.rows[0];
    const inviteUrl = `${API_URL}?invite=${inviteToken}`;

    const emailSent = await sendInviteEmail({
      to: email,
      ownerName: owner.linkedin_name || owner.email,
      ownerEmail: owner.email,
      role,
      inviteUrl,
    });

    res.json({
      success: true,
      inviteUrl,
      emailSent,
      message: emailSent
        ? `Invitation sent to ${email}`
        : `Invitation created. Email not sent (check RESEND_API_KEY). Share this link: ${inviteUrl}`,
    });
  } catch (err) {
    console.error("POST /team/invite:", err.message);
    res.status(500).json({ error: "Invitation failed" });
  }
});

// ─── GET /team/invite/:token — validate token (public) ───────────────────────
router.get("/invite/:token", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT tm.member_email, tm.role, tm.status, tm.invited_at,
              u.email as owner_email, u.linkedin_name as owner_name
       FROM team_members tm
       JOIN users u ON u.id = tm.owner_id
       WHERE tm.invite_token = $1`,
      [req.params.token]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Invalid or expired invitation" });
    }

    const inv = result.rows[0];
    if (inv.status === "active") {
      return res.status(400).json({ error: "Invitation already accepted" });
    }

    // Check expiry (7 days)
    const invited = new Date(inv.invited_at);
    if (Date.now() - invited.getTime() > 7 * 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: "Invitation expired" });
    }

    res.json({
      email: inv.member_email,
      role: inv.role,
      ownerName: inv.owner_name || inv.owner_email,
      valid: true,
    });
  } catch (err) {
    console.error("GET /team/invite/:token:", err.message);
    res.status(500).json({ error: "Failed to validate invitation" });
  }
});

// ─── POST /team/accept — accept invitation after registration ─────────────────
router.post("/accept", auth, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });

  try {
    const result = await db.query(
      "SELECT * FROM team_members WHERE invite_token=$1 AND status='pending'",
      [token]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Invalid or already used invitation" });
    }

    await db.query(
      `UPDATE team_members
       SET member_id=$1, status='active', joined_at=NOW()
       WHERE invite_token=$2`,
      [req.user.id, token]
    );

    // Log activity
    await db.query(
      `INSERT INTO team_activity (team_owner_id, user_id, action, resource)
       VALUES ($1, $2, 'joined_team', 'team')`,
      [result.rows[0].owner_id, req.user.id]
    );

    // Log user_logs
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [req.user.id, "team_joined", JSON.stringify({ role: result.rows[0].role, owner_id: result.rows[0].owner_id })]
    ).catch(() => {});

    res.json({ success: true, role: result.rows[0].role });
  } catch (err) {
    console.error("POST /team/accept:", err.message);
    res.status(500).json({ error: "Failed to accept invitation" });
  }
});

// ─── PATCH /team/members/:id — update role or permissions ────────────────────
router.patch("/members/:id", auth, requireBusiness, async (req, res) => {
  const { role, permissions } = req.body;
  try {
    const updates = [];
    const values = [];
    let i = 1;

    if (role) { updates.push(`role=$${i++}`); values.push(role); }
    if (permissions) { updates.push(`permissions=$${i++}`); values.push(JSON.stringify(permissions)); }

    if (!updates.length) return res.status(400).json({ error: "Nothing to update" });

    values.push(req.params.id, req.user.id);
    const result = await db.query(
      `UPDATE team_members SET ${updates.join(",")} WHERE id=$${i} AND owner_id=$${i+1} RETURNING member_id, member_email`,
      values
    );

    // Log admin_logs
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,$2,$3,$4,NOW())`,
      [req.user.id, "team_update_role", result.rows[0]?.member_id || null, JSON.stringify({ role, member_email: result.rows[0]?.member_email })]
    ).catch(() => {});

    // Log user_logs du membre concerné
    if (result.rows[0]?.member_id) {
      await db.query(
        `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
        [result.rows[0].member_id, "team_role_updated", JSON.stringify({ role, by: "team_admin" })]
      ).catch(() => {});
    }

    res.json({ success: true });
  } catch (err) {
    console.error("PATCH /team/members:", err.message);
    res.status(500).json({ error: "Update failed" });
  }
});

// ─── DELETE /team/members/:id — remove member ─────────────────────────────────
router.delete("/members/:id", auth, requireBusiness, async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM team_members WHERE id=$1 AND owner_id=$2 RETURNING member_id, member_email",
      [req.params.id, req.user.id]
    );
    // Log admin_logs
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,$2,$3,$4,NOW())`,
      [req.user.id, "team_remove_member", result.rows[0]?.member_id || null, JSON.stringify({ member_email: result.rows[0]?.member_email })]
    ).catch(() => {});
    // Log user_logs du membre
    if (result.rows[0]?.member_id) {
      await db.query(
        `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
        [result.rows[0].member_id, "team_removed", JSON.stringify({ by: "team_admin" })]
      ).catch(() => {});
    }
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /team/members:", err.message);
    res.status(500).json({ error: "Remove failed" });
  }
});
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /team/members:", err.message);
    res.status(500).json({ error: "Remove failed" });
  }
});

// ─── GET /team/activity — real team activity ──────────────────────────────────
router.get("/activity", auth, requireBusiness, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ta.action, ta.resource, ta.created_at,
              u.email, u.linkedin_name
       FROM team_activity ta
       JOIN users u ON u.id = ta.user_id
       WHERE ta.team_owner_id = $1
       ORDER BY ta.created_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    res.json({ activity: result.rows });
  } catch (err) {
    console.error("GET /team/activity:", err.message);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

// ─── GET /team/my-teams — get teams the user belongs to ──────────────────────
router.get("/my-teams", auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT tm.role, tm.permissions, tm.joined_at,
              u.email as owner_email, u.linkedin_name as owner_name, u.id as owner_id
       FROM team_members tm
       JOIN users u ON u.id = tm.owner_id
       WHERE tm.member_id = $1 AND tm.status = 'active'`,
      [req.user.id]
    );
    res.json({ teams: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// ─── Middleware : vérifier le rôle du membre dans une équipe ──────────────────
const requireTeamRole = (roles) => async (req, res, next) => {
  try {
    // L'owner a toujours accès
    const ownerCheck = await db.query(
      "SELECT plan FROM users WHERE id=$1",
      [req.user.id]
    );
    const plan = ownerCheck.rows[0]?.plan || "Free";
    if (plan === "Business" || plan === "Agency") return next();

    // Vérifier le rôle du membre
    const memberCheck = await db.query(
      "SELECT role FROM team_members WHERE member_id=$1 AND status='active'",
      [req.user.id]
    );
    const role = memberCheck.rows[0]?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    req.memberRole = role;
    next();
  } catch (err) {
    console.error("requireTeamRole error:", err.message);
    res.status(500).json({ error: "Permission check failed" });
  }
};

// ─── GET /team/logs — historique des actions de tous les membres ──────────────
router.get("/logs", auth, requireBusiness, async (req, res) => {
  try {
    // Récupérer tous les member_ids de cette équipe
    const membersResult = await db.query(
      "SELECT member_id FROM team_members WHERE owner_id=$1 AND status='active'",
      [req.user.id]
    );
    const memberIds = membersResult.rows.map(r => r.member_id).filter(Boolean);
    const allIds = [req.user.id, ...memberIds];

    const result = await db.query(
      `SELECT ul.id, ul.user_id, ul.action, ul.details, ul.created_at,
              u.email, u.first_name, u.last_name, u.display_name
       FROM user_logs ul
       JOIN users u ON u.id = ul.user_id
       WHERE ul.user_id = ANY($1)
       ORDER BY ul.created_at DESC
       LIMIT 100`,
      [allIds]
    );

    // Log l'accès aux logs
    await db.query(
      "INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1, $2, $3, NOW())",
      [req.user.id, "team_view_logs", JSON.stringify({ members: memberIds.length })]
    );

    res.json({ logs: result.rows });
  } catch (err) {
    console.error("GET /team/logs:", err.message);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// ─── PATCH /team/members/:id/plan — modifier le plan d'un membre ─────────────
router.patch("/members/:id/plan", auth, requireBusiness, async (req, res) => {
  const { plan } = req.body;
  const VALID_PLANS = ["Free", "Pro", "Business", "Agency"];
  if (!plan || !VALID_PLANS.includes(plan)) {
    return res.status(400).json({ error: "Invalid plan" });
  }

  try {
    // Vérifier que le membre appartient bien à cette équipe
    const memberCheck = await db.query(
      "SELECT member_id, member_email FROM team_members WHERE id=$1 AND owner_id=$2",
      [req.params.id, req.user.id]
    );
    if (!memberCheck.rows.length) {
      return res.status(404).json({ error: "Member not found" });
    }

    const { member_id, member_email } = memberCheck.rows[0];
    if (!member_id) {
      return res.status(400).json({ error: "Member has not joined yet" });
    }

    // Modifier le plan
    await db.query("UPDATE users SET plan=$1 WHERE id=$2", [plan, member_id]);

    // Log admin
    await db.query(
      "INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1, $2, $3, NOW())",
      [req.user.id, "team_update_plan", JSON.stringify({ member_id, member_email, plan })]
    );
    // Log member
    await db.query(
      "INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1, $2, $3, NOW())",
      [member_id, "plan_upgrade", JSON.stringify({ plan, changed_by: "team_admin" })]
    );

    res.json({ success: true, plan });
  } catch (err) {
    console.error("PATCH /team/members/:id/plan:", err.message);
    res.status(500).json({ error: "Failed to update plan" });
  }
});

export default router;
