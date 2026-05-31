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

  const roleDescription = role === "admin"
    ? "Full access — manage team, generate, publish &amp; analyze"
    : role === "editor"
    ? "Generate content, analyze posts &amp; access brand memory"
    : "Publish content across all connected platforms";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation — GrowthPILOT</title>
</head>
<body style="margin:0;padding:0;background-color:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#020617;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0" border="0" style="background-color:#111827;border-radius:12px;padding:16px 28px;">
                <tr>
                  <td>
                    <div style="font-size:26px;font-weight:900;font-style:italic;color:#ffffff;letter-spacing:1px;text-shadow:2px 2px 0 #ef4444;">
                      Growth<span style="color:#ef4444;">PILOT</span>
                    </div>
                    <div style="color:#475569;font-size:11px;letter-spacing:3px;margin-top:4px;text-align:center;">AI CONTENT COMMAND CENTER</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color:#111827;border-radius:20px;border:1px solid #1e3a5f;border-left:4px solid #ef4444;padding:36px;">

              <!-- Badge -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#1f1418;border:1px solid #7f1d1d;border-radius:20px;padding:5px 14px;font-size:11px;font-weight:700;color:#ef4444;letter-spacing:1.5px;">
                    👥 TEAM INVITATION
                  </td>
                </tr>
              </table>

              <!-- Title -->
              <p style="color:#ffffff;font-size:22px;font-weight:800;margin:0 0 14px;line-height:1.3;">
                You've been invited to join a team
              </p>

              <!-- Body -->
              <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 28px;">
                <strong style="color:#e2e8f0;">${ownerName || ownerEmail}</strong>
                has invited you to collaborate on GrowthPILOT as a
                <strong style="color:#ef4444;">${roleLabel}</strong>.
              </p>

              <!-- Role badge -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1e293b;border:1px solid #334155;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="color:#64748b;font-size:11px;letter-spacing:1.5px;margin:0 0 10px;">YOUR ROLE</p>
                    <p style="margin:0 0 6px;">
                      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#ef4444;margin-right:8px;vertical-align:middle;"></span>
                      <span style="color:#ef4444;font-size:16px;font-weight:800;letter-spacing:1px;vertical-align:middle;">${roleLabel.toUpperCase()}</span>
                    </p>
                    <p style="color:#64748b;font-size:12px;margin:0;">${roleDescription}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}"
                       style="display:inline-block;background-color:#dc2626;color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;letter-spacing:0.5px;padding:16px 40px;border-radius:12px;border:none;">
                      ⚡ Accept Invitation &amp; Create Account →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry note -->
              <p style="color:#475569;font-size:12px;text-align:center;margin:0;">
                This invitation expires in 7 days. If you didn't expect this, ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="color:#334155;font-size:12px;margin:0;">
                © 2026 GrowthPILOT ·
                <a href="https://www.aigrowthpilot.app" style="color:#475569;text-decoration:none;">aigrowthpilot.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
      `SELECT tm.id, tm.member_id, tm.member_email, tm.role, tm.status, tm.permissions,
              tm.invited_at, tm.joined_at,
              u.linkedin_name as member_name,
              u.plan as current_plan,
              u.generations_count
       FROM team_members tm
       LEFT JOIN users u ON u.id = tm.member_id
       WHERE tm.owner_id = $1
       ORDER BY tm.invited_at DESC`,
      [req.user.id]
    );

    // Owner info
    const ownerResult = await db.query(
      "SELECT email, linkedin_name, team_name FROM users WHERE id=$1",
      [req.user.id]
    );
    const owner = ownerResult.rows[0];

    res.json({
      members: result.rows,
      owner: { email: owner.email, name: owner.linkedin_name || owner.email, teamName: owner.team_name || "" },
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

    // Log user_logs de l'owner
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [req.user.id, "team_invite", JSON.stringify({ email, role, emailSent })]
    ).catch(() => {});

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

// ─── POST /team/resend/:id — resend invitation email ─────────────────────────
router.post("/resend/:id", auth, requireBusiness, async (req, res) => {
  try {
    // Vérifier que le membre appartient à cet owner et est encore pending
    const result = await db.query(
      `SELECT tm.id, tm.member_email, tm.role, tm.invite_token, tm.status
       FROM team_members tm
       WHERE tm.id=$1 AND tm.owner_id=$2`,
      [req.params.id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Member not found" });
    }

    const member = result.rows[0];

    if (member.status !== "pending") {
      return res.status(400).json({ error: "Member has already joined the team" });
    }

    // Récupérer les infos de l'owner
    const ownerResult = await db.query(
      "SELECT email, linkedin_name FROM users WHERE id=$1",
      [req.user.id]
    );
    const owner = ownerResult.rows[0];
    const inviteUrl = `${API_URL}?invite=${member.invite_token}`;

    const emailSent = await sendInviteEmail({
      to: member.member_email,
      ownerName: owner.linkedin_name || owner.email,
      ownerEmail: owner.email,
      role: member.role,
      inviteUrl,
    });

    // Log user_logs de l'owner
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [req.user.id, "team_invite_resent", JSON.stringify({
        email: member.member_email,
        role: member.role,
        emailSent,
        member_id: req.params.id,
      })]
    ).catch(() => {});

    // Log admin_logs
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,$2,$3,$4,NOW())`,
      [req.user.id, "team_invite_resent", null, JSON.stringify({
        email: member.member_email,
        role: member.role,
        emailSent,
      })]
    ).catch(() => {});

    res.json({
      success: true,
      emailSent,
      message: emailSent
        ? `Invitation resent to ${member.member_email}`
        : `Email not sent (check RESEND_API_KEY). Share this link: ${inviteUrl}`,
    });
  } catch (err) {
    console.error("POST /team/resend:", err.message);
    res.status(500).json({ error: "Failed to resend invitation" });
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

    // Set plan Member + team_owner_id sur le user
    await db.query(
      "UPDATE users SET plan='Member', team_owner_id=$1, plan_managed_by='team' WHERE id=$2",
      [result.rows[0].owner_id, req.user.id]
    );

    // Log team_activity
    await db.query(
      `INSERT INTO team_activity (team_owner_id, user_id, action, resource)
       VALUES ($1, $2, 'joined_team', 'team')`,
      [result.rows[0].owner_id, req.user.id]
    );

    // Log user_logs du membre
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [req.user.id, "team_joined", JSON.stringify({ role: result.rows[0].role, owner_id: result.rows[0].owner_id, plan: "Member" })]
    ).catch(() => {});

    // Log user_logs de l'owner
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [result.rows[0].owner_id, "team_member_joined", JSON.stringify({ member_id: req.user.id, role: result.rows[0].role })]
    ).catch(() => {});

    // Log admin_logs
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,$2,$3,$4,NOW())`,
      [result.rows[0].owner_id, "team_member_joined", req.user.id, JSON.stringify({ role: result.rows[0].role })]
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
  const VALID_PLANS = ["Free", "Pro"]; // Business/Agency non disponibles pour les membres
  if (!plan || !VALID_PLANS.includes(plan)) {
    return res.status(400).json({ error: "Invalid plan. Members can only have Free or Pro plans." });
  }

  try {
    const memberCheck = await db.query(
      "SELECT tm.member_id, tm.member_email, u.plan as current_plan FROM team_members tm LEFT JOIN users u ON u.id = tm.member_id WHERE tm.id=$1 AND tm.owner_id=$2",
      [req.params.id, req.user.id]
    );
    if (!memberCheck.rows.length) return res.status(404).json({ error: "Member not found" });

    const { member_id, member_email, current_plan } = memberCheck.rows[0];
    if (!member_id) return res.status(400).json({ error: "Member has not joined yet" });
    if (current_plan === plan) return res.json({ success: true, plan, message: "No change needed" });

    // Si upgrade vers Pro → facturer 5€/mois sur le Stripe de l'owner
    let stripeInfo = null;
    if (plan === "Pro") {
      const ownerResult = await db.query(
        "SELECT stripe_customer_id, stripe_subscription_id FROM users WHERE id=$1",
        [req.user.id]
      );
      const owner = ownerResult.rows[0];
      if (owner?.stripe_subscription_id && process.env.STRIPE_MEMBER_SEAT_PRICE_ID) {
        try {
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          // Ajouter un siège 5€/mois à l'abonnement de l'owner
          const subscription = await stripe.subscriptions.retrieve(owner.stripe_subscription_id);
          const existingItem = subscription.items.data.find(
            i => i.price.id === process.env.STRIPE_MEMBER_SEAT_PRICE_ID
          );
          if (existingItem) {
            await stripe.subscriptionItems.update(existingItem.id, {
              quantity: existingItem.quantity + 1,
            });
          } else {
            await stripe.subscriptionItems.create({
              subscription: owner.stripe_subscription_id,
              price: process.env.STRIPE_MEMBER_SEAT_PRICE_ID,
              quantity: 1,
            });
          }
          stripeInfo = { seat_added: true, price: "5€/month" };
        } catch (stripeErr) {
          console.error("Stripe seat billing error:", stripeErr.message);
          stripeInfo = { seat_added: false, error: stripeErr.message };
        }
      }
    }

    // Si downgrade vers Free → retirer un siège Stripe
    if (plan === "Free" && current_plan === "Pro") {
      const ownerResult = await db.query(
        "SELECT stripe_subscription_id FROM users WHERE id=$1",
        [req.user.id]
      );
      const owner = ownerResult.rows[0];
      if (owner?.stripe_subscription_id && process.env.STRIPE_MEMBER_SEAT_PRICE_ID) {
        try {
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          const subscription = await stripe.subscriptions.retrieve(owner.stripe_subscription_id);
          const existingItem = subscription.items.data.find(
            i => i.price.id === process.env.STRIPE_MEMBER_SEAT_PRICE_ID
          );
          if (existingItem) {
            if (existingItem.quantity > 1) {
              await stripe.subscriptionItems.update(existingItem.id, {
                quantity: existingItem.quantity - 1,
              });
            } else {
              await stripe.subscriptionItems.del(existingItem.id);
            }
          }
        } catch (stripeErr) {
          console.error("Stripe seat remove error:", stripeErr.message);
        }
      }
    }

    // Mettre à jour le plan en DB
    await db.query("UPDATE users SET plan=$1 WHERE id=$2", [plan, member_id]);

    // Logs
    await db.query(
      "INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())",
      [req.user.id, "team_update_plan", JSON.stringify({ member_id, member_email, plan, previous_plan: current_plan, stripe: stripeInfo })]
    ).catch(() => {});
    await db.query(
      "INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())",
      [member_id, "plan_upgrade", JSON.stringify({ plan, previous_plan: current_plan, changed_by: "team_admin" })]
    ).catch(() => {});
    await db.query(
      "INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,$2,$3,$4,NOW())",
      [req.user.id, "team_update_plan", member_id, JSON.stringify({ plan, previous_plan: current_plan, member_email, stripe: stripeInfo })]
    ).catch(() => {});

    res.json({ success: true, plan, stripe: stripeInfo });
  } catch (err) {
    console.error("PATCH /team/members/:id/plan:", err.message);
    res.status(500).json({ error: "Failed to update plan" });
  }
});

// ─── POST /team/members/:id/reset-quota — reset generations_count ─────────────
router.post("/members/:id/reset-quota", auth, requireBusiness, async (req, res) => {
  try {
    const memberCheck = await db.query(
      "SELECT tm.member_id, tm.member_email, u.generations_count FROM team_members tm LEFT JOIN users u ON u.id = tm.member_id WHERE tm.id=$1 AND tm.owner_id=$2",
      [req.params.id, req.user.id]
    );
    if (!memberCheck.rows.length) return res.status(404).json({ error: "Member not found" });

    const { member_id, member_email, generations_count } = memberCheck.rows[0];
    if (!member_id) return res.status(400).json({ error: "Member has not joined yet" });

    await db.query("UPDATE users SET generations_count=0 WHERE id=$1", [member_id]);

    // Logs
    await db.query(
      "INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())",
      [req.user.id, "team_reset_quota", JSON.stringify({ member_id, member_email, previous_count: generations_count })]
    ).catch(() => {});
    await db.query(
      "INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())",
      [member_id, "quota_reset", JSON.stringify({ reset_by: "team_admin", previous_count: generations_count })]
    ).catch(() => {});
    await db.query(
      "INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,$2,$3,$4,NOW())",
      [req.user.id, "team_reset_quota", member_id, JSON.stringify({ member_email, previous_count: generations_count })]
    ).catch(() => {});

    res.json({ success: true, message: `Quota reset for ${member_email}` });
  } catch (err) {
    console.error("POST /team/members/:id/reset-quota:", err.message);
    res.status(500).json({ error: "Failed to reset quota" });
  }
});

// ─── GET /team/my-team-view — vue lecture seule pour les membres ──────────────
router.get("/my-team-view", auth, async (req, res) => {
  try {
    // Trouver l'équipe du membre
    const memberResult = await db.query(
      `SELECT tm.role, tm.joined_at, tm.permissions,
              u.email as owner_email, u.linkedin_name as owner_name, u.id as owner_id, u.team_name
       FROM team_members tm
       JOIN users u ON u.id = tm.owner_id
       WHERE tm.member_id=$1 AND tm.status='active'
       LIMIT 1`,
      [req.user.id]
    );
    if (!memberResult.rows.length) return res.status(404).json({ error: "Not a team member" });

    const myTeam = memberResult.rows[0];

    // Récupérer les collègues (lecture seule — email + rôle uniquement)
    const colleaguesResult = await db.query(
      `SELECT tm.member_email, tm.role, tm.status,
              u.linkedin_name as member_name
       FROM team_members tm
       LEFT JOIN users u ON u.id = tm.member_id
       WHERE tm.owner_id=$1 AND tm.member_id != $2
       ORDER BY tm.joined_at ASC`,
      [myTeam.owner_id, req.user.id]
    );

    res.json({
      myRole: myTeam.role,
      joinedAt: myTeam.joined_at,
      permissions: myTeam.permissions,
      teamName: myTeam.team_name || null,
      owner: { email: myTeam.owner_email, name: myTeam.owner_name || myTeam.owner_email },
      colleagues: colleaguesResult.rows,
    });
  } catch (err) {
    console.error("GET /team/my-team-view:", err.message);
    res.status(500).json({ error: "Failed to fetch team view" });
  }
});

// ─── PATCH /team/name — définir le nom de l'équipe ───────────────────────────
router.patch("/name", auth, requireBusiness, async (req, res) => {
  const { teamName } = req.body;
  if (typeof teamName !== "string") return res.status(400).json({ error: "teamName required" });
  const name = teamName.trim().slice(0, 50); // max 50 chars

  try {
    await db.query("UPDATE users SET team_name=$1 WHERE id=$2", [name || null, req.user.id]);

    await db.query(
      "INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())",
      [req.user.id, "team_name_updated", JSON.stringify({ team_name: name })]
    ).catch(() => {});
    await db.query(
      "INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,$2,$3,$4,NOW())",
      [req.user.id, "team_name_updated", req.user.id, JSON.stringify({ team_name: name })]
    ).catch(() => {});

    res.json({ success: true, teamName: name });
  } catch (err) {
    console.error("PATCH /team/name:", err.message);
    res.status(500).json({ error: "Failed to update team name" });
  }
});

export default router;
