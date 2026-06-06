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
       WHERE tm.owner_id=$1 AND (tm.member_id != $2 OR tm.member_id IS NULL)
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

// ─── GET /team/approvals — posts en attente d'approbation ────────────────────
router.get("/approvals", auth, requireBusiness, async (req, res) => {
  try {
    // Récupérer tous les posts pending des membres de l'équipe
    const result = await db.query(
      `SELECT p.id, p.title, p.content, p.media_url, p.media_type, p.created_at,
              p.approval_status, p.assigned_to, p.approved_by, p.approved_at,
              u.email as author_email, u.display_name as author_name,
              u.first_name, u.last_name
       FROM posts p
       JOIN users u ON u.id = p.user_id
       JOIN team_members tm ON tm.member_id = p.user_id AND tm.owner_id = $1
       WHERE p.approval_status = 'pending_approval'
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ posts: result.rows });
  } catch (err) {
    console.error("GET /team/approvals:", err.message);
    res.status(500).json({ error: "Failed to fetch approvals" });
  }
});

// ─── POST /team/approvals/:id/approve ─────────────────────────────────────────
router.post("/approvals/:id/approve", auth, requireBusiness, async (req, res) => {
  try {
    // Vérifier que le post appartient à un membre de l'équipe
    const postCheck = await db.query(
      `SELECT p.*, u.email as author_email, u.display_name as author_name
       FROM posts p
       JOIN users u ON u.id = p.user_id
       JOIN team_members tm ON tm.member_id = p.user_id AND tm.owner_id = $1
       WHERE p.id = $2`,
      [req.user.id, req.params.id]
    );
    if (!postCheck.rows.length) return res.status(404).json({ error: "Post not found" });

    const post = postCheck.rows[0];

    // Mettre à jour le statut
    await db.query(
      `UPDATE posts SET approval_status='approved', approved_by=$1, approved_at=NOW() WHERE id=$2`,
      [req.user.id, req.params.id]
    );

    // Copier dans calendar_posts (Scheduler) avec col=scheduled
    const calResult = await db.query(
      `INSERT INTO calendar_posts (user_id, title, content, col, platform, media_url, scheduled_date, created_at)
       VALUES ($1, $2, $3, 'scheduled', 'LinkedIn', $4, NOW() + INTERVAL '1 day', NOW())
       RETURNING id`,
      [post.user_id, post.title || post.content?.slice(0, 60), post.content, post.media_url || null]
    );

    // Log owner
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [req.user.id, "post_approved", JSON.stringify({ post_id: req.params.id, author_email: post.author_email, calendar_id: calResult.rows[0].id })]
    ).catch(() => {});

    // Log auteur du post
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [post.user_id, "post_approved", JSON.stringify({ post_id: req.params.id, approved_by: req.user.id, scheduled: true })]
    ).catch(() => {});

    // Log admin
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,$2,$3,$4,NOW())`,
      [req.user.id, "post_approved", post.user_id, JSON.stringify({ post_id: req.params.id, calendar_id: calResult.rows[0].id })]
    ).catch(() => {});

    res.json({ success: true, calendar_id: calResult.rows[0].id });
  } catch (err) {
    console.error("POST /team/approvals/:id/approve:", err.message);
    res.status(500).json({ error: "Failed to approve post" });
  }
});

// ─── POST /team/approvals/:id/reject ──────────────────────────────────────────
router.post("/approvals/:id/reject", auth, requireBusiness, async (req, res) => {
  const { reason } = req.body;
  try {
    const postCheck = await db.query(
      `SELECT p.*, u.email as author_email
       FROM posts p
       JOIN users u ON u.id = p.user_id
       JOIN team_members tm ON tm.member_id = p.user_id AND tm.owner_id = $1
       WHERE p.id = $2`,
      [req.user.id, req.params.id]
    );
    if (!postCheck.rows.length) return res.status(404).json({ error: "Post not found" });

    const post = postCheck.rows[0];

    await db.query(
      `UPDATE posts SET approval_status='rejected', approved_by=$1, approved_at=NOW() WHERE id=$2`,
      [req.user.id, req.params.id]
    );

    // Log owner
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [req.user.id, "post_rejected", JSON.stringify({ post_id: req.params.id, author_email: post.author_email, reason: reason || null })]
    ).catch(() => {});

    // Log auteur
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [post.user_id, "post_rejected", JSON.stringify({ post_id: req.params.id, rejected_by: req.user.id, reason: reason || null })]
    ).catch(() => {});

    // Log admin
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,$2,$3,$4,NOW())`,
      [req.user.id, "post_rejected", post.user_id, JSON.stringify({ post_id: req.params.id, reason: reason || null })]
    ).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    console.error("POST /team/approvals/:id/reject:", err.message);
    res.status(500).json({ error: "Failed to reject post" });
  }
});

// ─── PATCH /team/approvals/:id/assign — assigner un post à un membre ──────────
// Accessible : owner (Business/Agency) + membres admin de l'équipe
router.patch("/approvals/:id/assign", auth, async (req, res) => {
  const { assigned_to } = req.body; // member_id (user_id) ou null pour désassigner

  try {
    // Vérifier que le requêtant est soit owner soit admin de l'équipe
    const callerCheck = await db.query(
      `SELECT u.plan,
              tm.role as member_role, tm.owner_id
       FROM users u
       LEFT JOIN team_members tm ON tm.member_id = u.id AND tm.status = 'active'
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!callerCheck.rows.length) return res.status(404).json({ error: "User not found" });

    const caller = callerCheck.rows[0];
    const isOwner = caller.plan === "Business" || caller.plan === "Agency";
    const isAdmin = caller.member_role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Only Owner or Admin can assign posts" });
    }

    // Déterminer l'owner_id pour la vérification du post
    const ownerIdForCheck = isOwner ? req.user.id : caller.owner_id;

    // Vérifier que le post appartient à un membre de cette équipe
    const postCheck = await db.query(
      `SELECT p.id, p.user_id, p.approval_status,
              u.email as author_email, u.display_name as author_name
       FROM posts p
       JOIN users u ON u.id = p.user_id
       JOIN team_members tm ON tm.member_id = p.user_id AND tm.owner_id = $1
       WHERE p.id = $2`,
      [ownerIdForCheck, req.params.id]
    );
    if (!postCheck.rows.length) return res.status(404).json({ error: "Post not found or not in your team" });

    const post = postCheck.rows[0];

    // Si assigned_to est fourni, vérifier que c'est bien un membre actif de l'équipe
    let assigneeName = null;
    if (assigned_to) {
      const assigneeCheck = await db.query(
        `SELECT tm.member_id, tm.member_email, tm.role,
                u.display_name, u.email
         FROM team_members tm
         LEFT JOIN users u ON u.id = tm.member_id
         WHERE tm.owner_id = $1 AND tm.member_id = $2 AND tm.status = 'active'`,
        [ownerIdForCheck, assigned_to]
      );
      if (!assigneeCheck.rows.length) {
        return res.status(400).json({ error: "Assignee is not an active team member" });
      }
      const assignee = assigneeCheck.rows[0];
      assigneeName = assignee.display_name || assignee.email;
    }

    // Mettre à jour l'assignation
    await db.query(
      `UPDATE posts SET assigned_to = $1, updated_at = NOW() WHERE id = $2`,
      [assigned_to || null, req.params.id]
    );

    // Log user_logs du caller
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [req.user.id, "post_assigned", JSON.stringify({
        post_id: req.params.id,
        assigned_to: assigned_to || null,
        assignee_name: assigneeName,
        author_email: post.author_email,
      })]
    ).catch(() => {});

    // Log sur le post de l'auteur si assigné
    if (assigned_to) {
      await db.query(
        `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
        [assigned_to, "post_assigned_to_me", JSON.stringify({
          post_id: req.params.id,
          assigned_by: req.user.id,
          author_email: post.author_email,
        })]
      ).catch(() => {});
    }

    // Admin log
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,$2,$3,$4,NOW())`,
      [req.user.id, "post_assigned", post.user_id, JSON.stringify({
        post_id: req.params.id,
        assigned_to: assigned_to || null,
        assignee_name: assigneeName,
      })]
    ).catch(() => {});

    console.log(`[team] PATCH /approvals/${req.params.id}/assign → assigned_to=${assigned_to || "null"} by user=${req.user.id}`);
    res.json({ success: true, assigned_to: assigned_to || null, assignee_name: assigneeName });
  } catch (err) {
    console.error("PATCH /team/approvals/:id/assign:", err.message);
    res.status(500).json({ error: "Failed to assign post" });
  }
});

// ─── GET /team/my-assigned-posts — posts assignés au membre connecté ──────────
router.get("/my-assigned-posts", auth, async (req, res) => {
  try {
    // Récupérer les posts assignés à ce membre (tous statuts sauf deleted)
    const result = await db.query(
      `SELECT p.id, p.title, p.content, p.media_url, p.media_type,
              p.created_at, p.updated_at, p.approval_status, p.assigned_to,
              p.viral_score,
              u.email as author_email,
              u.display_name as author_name,
              u.first_name, u.last_name,
              proj.name as project_name
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN projects proj ON proj.id = p.project_id
       WHERE p.assigned_to = $1
       ORDER BY p.updated_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    // Log l'accès
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [req.user.id, "team_view_assigned_posts", JSON.stringify({ count: result.rows.length })]
    ).catch(() => {});

    console.log(`[team] GET /my-assigned-posts → ${result.rows.length} posts for user=${req.user.id}`);
    res.json({ posts: result.rows });
  } catch (err) {
    console.error("GET /team/my-assigned-posts:", err.message);
    res.status(500).json({ error: "Failed to fetch assigned posts" });
  }
});

// ─── GET /team/posts/:id/comments — lire les commentaires d'un post ──────────
// Accessible : owner, admin, et l'auteur du post
router.get("/posts/:id/comments", auth, async (req, res) => {
  try {
    const postId = req.params.id;

    // Vérifier accès : owner, membre de l'équipe liée au post, ou auteur
    const accessCheck = await db.query(
      `SELECT p.user_id, p.id
       FROM posts p
       WHERE p.id = $1
         AND (
           p.user_id = $2
           OR EXISTS (SELECT 1 FROM team_members tm WHERE tm.owner_id = $2 AND tm.member_id = p.user_id)
           OR EXISTS (SELECT 1 FROM team_members tm WHERE tm.member_id = $2 AND tm.status = 'active'
                      AND tm.owner_id IN (SELECT tm2.owner_id FROM team_members tm2 WHERE tm2.member_id = p.user_id))
         )`,
      [postId, req.user.id]
    );
    if (!accessCheck.rows.length) return res.status(403).json({ error: "Access denied" });

    const result = await db.query(
      `SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
              u.display_name, u.email, u.first_name, u.last_name
       FROM post_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );

    console.log(`[team] GET /posts/${postId}/comments → ${result.rows.length} comments`);
    res.json({ comments: result.rows });
  } catch (err) {
    console.error("GET /team/posts/:id/comments:", err.message);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// ─── POST /team/posts/:id/comments — ajouter un commentaire ──────────────────
router.post("/posts/:id/comments", auth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "Content required" });
  const postId = req.params.id;

  try {
    // Vérifier accès (même logique)
    const accessCheck = await db.query(
      `SELECT p.user_id FROM posts p
       WHERE p.id = $1
         AND (
           p.user_id = $2
           OR EXISTS (SELECT 1 FROM team_members tm WHERE tm.owner_id = $2 AND tm.member_id = p.user_id)
           OR EXISTS (SELECT 1 FROM team_members tm WHERE tm.member_id = $2 AND tm.status = 'active'
                      AND tm.owner_id IN (SELECT tm2.owner_id FROM team_members tm2 WHERE tm2.member_id = p.user_id))
         )`,
      [postId, req.user.id]
    );
    if (!accessCheck.rows.length) return res.status(403).json({ error: "Access denied" });

    const result = await db.query(
      `INSERT INTO post_comments (post_id, user_id, content, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, post_id, user_id, content, created_at`,
      [postId, req.user.id, content.trim()]
    );
    const comment = result.rows[0];

    // Récupérer infos auteur pour la réponse
    const userResult = await db.query(
      "SELECT display_name, email, first_name, last_name FROM users WHERE id=$1",
      [req.user.id]
    );
    const user = userResult.rows[0];

    // Logs
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [req.user.id, "post_comment_added", JSON.stringify({ post_id: postId, comment_id: comment.id })]
    ).catch(() => {});
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,$2,$3,$4,NOW())`,
      [req.user.id, "post_comment_added", accessCheck.rows[0].user_id, JSON.stringify({ post_id: postId, comment_id: comment.id })]
    ).catch(() => {});

    console.log(`[team] POST /posts/${postId}/comments → comment ${comment.id} by user=${req.user.id}`);
    res.json({ success: true, comment: { ...comment, ...user } });
  } catch (err) {
    console.error("POST /team/posts/:id/comments:", err.message);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// ─── DELETE /team/comments/:id — supprimer un commentaire ────────────────────
// Seul l'auteur du commentaire ou l'owner de l'équipe peut supprimer
router.delete("/comments/:id", auth, async (req, res) => {
  try {
    const commentCheck = await db.query(
      `SELECT c.id, c.user_id, c.post_id, p.user_id as post_author_id
       FROM post_comments c
       JOIN posts p ON p.id = c.post_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!commentCheck.rows.length) return res.status(404).json({ error: "Comment not found" });

    const comment = commentCheck.rows[0];
    const isAuthor = comment.user_id === req.user.id;

    // Vérifier si owner de l'équipe
    const ownerCheck = await db.query(
      "SELECT plan FROM users WHERE id=$1",
      [req.user.id]
    );
    const isOwner = ["Business","Agency"].includes(ownerCheck.rows[0]?.plan);

    if (!isAuthor && !isOwner) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    await db.query("DELETE FROM post_comments WHERE id=$1", [req.params.id]);

    // Logs
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [req.user.id, "post_comment_deleted", JSON.stringify({ comment_id: req.params.id, post_id: comment.post_id })]
    ).catch(() => {});

    console.log(`[team] DELETE /comments/${req.params.id} by user=${req.user.id}`);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /team/comments/:id:", err.message);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// ─── GET /team/calendar — calendrier partagé de l'équipe ─────────────────────
// Accessible : owner + tous les membres actifs de l'équipe
router.get("/calendar", auth, async (req, res) => {
  try {
    // Trouver l'owner_id de l'équipe du user (soit lui-même si owner, soit son owner)
    const ownerRes = await db.query(
      `SELECT
         CASE WHEN (u.plan='Business' OR u.plan='Agency') THEN u.id
              ELSE tm.owner_id
         END as owner_id
       FROM users u
       LEFT JOIN team_members tm ON tm.member_id = u.id AND tm.status='active'
       WHERE u.id = $1
       LIMIT 1`,
      [req.user.id]
    );
    if (!ownerRes.rows.length || !ownerRes.rows[0].owner_id) {
      return res.json({ cards: [] });
    }
    const ownerId = ownerRes.rows[0].owner_id;

    // Récupérer toutes les cards du calendrier partagé de cette équipe
    const result = await db.query(
      `SELECT tc.*, u.display_name, u.email, u.first_name
       FROM team_calendar tc
       JOIN users u ON u.id = tc.user_id
       WHERE tc.owner_id = $1
       ORDER BY tc.date ASC, tc.created_at ASC`,
      [ownerId]
    );

    console.log(`[team] GET /calendar → ${result.rows.length} cards for team owner=${ownerId}`);
    res.json({ cards: result.rows });
  } catch (err) {
    console.error("GET /team/calendar:", err.message);
    res.status(500).json({ error: "Failed to fetch team calendar" });
  }
});

// ─── POST /team/calendar — ajouter une card au calendrier partagé ─────────────
router.post("/calendar", auth, async (req, res) => {
  const { title, content, col, date, platform, media_url } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "Title required" });

  try {
    const ownerRes = await db.query(
      `SELECT
         CASE WHEN (u.plan='Business' OR u.plan='Agency') THEN u.id
              ELSE tm.owner_id
         END as owner_id
       FROM users u
       LEFT JOIN team_members tm ON tm.member_id = u.id AND tm.status='active'
       WHERE u.id = $1 LIMIT 1`,
      [req.user.id]
    );
    const ownerId = ownerRes.rows[0]?.owner_id;
    if (!ownerId) return res.status(403).json({ error: "Not part of a team" });

    const result = await db.query(
      `INSERT INTO team_calendar (owner_id, user_id, title, content, col, date, platform, media_url, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       RETURNING *`,
      [ownerId, req.user.id, title.trim(), content||null, col||"ideas", date||null, platform||"LinkedIn", media_url||null]
    );
    const card = result.rows[0];

    // Récupérer infos auteur
    const userRes = await db.query("SELECT display_name, email, first_name FROM users WHERE id=$1", [req.user.id]);
    const user = userRes.rows[0];

    // Logs
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [req.user.id, "team_calendar_add", JSON.stringify({ card_id: card.id, title: title.trim(), col })]
    ).catch(()=>{});
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,$2,$3,$4,NOW())`,
      [req.user.id, "team_calendar_add", ownerId, JSON.stringify({ card_id: card.id, col })]
    ).catch(()=>{});

    console.log(`[team] POST /calendar → card ${card.id} by user=${req.user.id} team=${ownerId}`);
    res.json({ success: true, card: { ...card, ...user } });
  } catch (err) {
    console.error("POST /team/calendar:", err.message);
    res.status(500).json({ error: "Failed to add card" });
  }
});

// ─── PATCH /team/calendar/:id — déplacer / modifier une card ─────────────────
router.patch("/calendar/:id", auth, async (req, res) => {
  const { col, date, platform, title } = req.body;
  try {
    // Vérifier que la card appartient à l'équipe du user
    const check = await db.query(
      `SELECT tc.id, tc.user_id, tc.owner_id FROM team_calendar tc
       WHERE tc.id = $1
         AND (tc.user_id = $2 OR tc.owner_id = $2 OR
              EXISTS (SELECT 1 FROM team_members tm WHERE tm.member_id = $2 AND tm.owner_id = tc.owner_id))`,
      [req.params.id, req.user.id]
    );
    if (!check.rows.length) return res.status(404).json({ error: "Card not found" });

    const updates = [];
    const vals = [];
    let i = 1;
    if (col !== undefined)      { updates.push(`col=$${i++}`);      vals.push(col); }
    if (date !== undefined)     { updates.push(`date=$${i++}`);     vals.push(date); }
    if (platform !== undefined) { updates.push(`platform=$${i++}`); vals.push(platform); }
    if (title !== undefined)    { updates.push(`title=$${i++}`);    vals.push(title); }
    if (!updates.length) return res.status(400).json({ error: "Nothing to update" });

    vals.push(req.params.id);
    await db.query(`UPDATE team_calendar SET ${updates.join(",")} WHERE id=$${i}`, vals);

    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [req.user.id, "team_calendar_move", JSON.stringify({ card_id: req.params.id, col })]
    ).catch(()=>{});

    console.log(`[team] PATCH /calendar/${req.params.id} → col=${col} by user=${req.user.id}`);
    res.json({ success: true });
  } catch (err) {
    console.error("PATCH /team/calendar/:id:", err.message);
    res.status(500).json({ error: "Failed to update card" });
  }
});

// ─── DELETE /team/calendar/:id — supprimer une card ──────────────────────────
router.delete("/calendar/:id", auth, async (req, res) => {
  try {
    const check = await db.query(
      `SELECT tc.id, tc.user_id, tc.owner_id FROM team_calendar tc
       WHERE tc.id = $1
         AND (tc.user_id = $2 OR tc.owner_id = $2 OR
              EXISTS (SELECT 1 FROM team_members tm WHERE tm.member_id = $2 AND tm.owner_id = tc.owner_id AND tm.role='admin'))`,
      [req.params.id, req.user.id]
    );
    if (!check.rows.length) return res.status(403).json({ error: "Not authorized" });

    await db.query("DELETE FROM team_calendar WHERE id=$1", [req.params.id]);

    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [req.user.id, "team_calendar_delete", JSON.stringify({ card_id: req.params.id })]
    ).catch(()=>{});

    console.log(`[team] DELETE /calendar/${req.params.id} by user=${req.user.id}`);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /team/calendar/:id:", err.message);
    res.status(500).json({ error: "Failed to delete card" });
  }
});

// ─── GET /agency/clients/:id/posts — posts liés à un client ─────────────────
router.get("/agency/clients/:id/posts", auth, requireBusiness, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.id, p.title, p.content, p.media_url, p.media_type,
              p.created_at, p.approval_status, p.viral_score, p.client_id,
              u.email as author_email, u.display_name as author_name
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.client_id = $1 AND p.user_id = $2
       ORDER BY p.created_at DESC
       LIMIT 50`,
      [req.params.id, req.user.id]
    );
    console.log(`[team] GET /agency/clients/${req.params.id}/posts → ${result.rows.length} posts`);
    res.json({ posts: result.rows });
  } catch (err) {
    console.error("GET /agency/clients/:id/posts:", err.message);
    res.status(500).json({ error: "Failed to fetch client posts" });
  }
});

// ─── PATCH /team/posts/:id/link-client — lier/délier un post à un client ─────
// Accessible : owner + membres avec accès au post
router.patch("/posts/:id/link-client", auth, async (req, res) => {
  const { client_id } = req.body; // null pour délier

  try {
    // Vérifier que le post appartient au user ou à son équipe
    const postCheck = await db.query(
      `SELECT p.id, p.user_id FROM posts p
       WHERE p.id = $1
         AND (p.user_id = $2
              OR EXISTS (SELECT 1 FROM team_members tm WHERE tm.owner_id = $2 AND tm.member_id = p.user_id))`,
      [req.params.id, req.user.id]
    );
    if (!postCheck.rows.length) return res.status(404).json({ error: "Post not found" });

    // Si client_id fourni, vérifier qu'il appartient à l'owner
    let clientName = null;
    if (client_id) {
      const ownerRes = await db.query(
        `SELECT u.id FROM users u
         LEFT JOIN team_members tm ON tm.member_id = u.id AND tm.status = 'active'
         WHERE u.id = $1`,
        [req.user.id]
      );
      const ownerId = req.user.id;
      const clientCheck = await db.query(
        `SELECT id, name FROM agency_clients WHERE id = $1 AND user_id = $2`,
        [client_id, ownerId]
      );
      if (!clientCheck.rows.length) return res.status(400).json({ error: "Client not found" });
      clientName = clientCheck.rows[0].name;
    }

    await db.query(
      `UPDATE posts SET client_id = $1 WHERE id = $2`,
      [client_id || null, req.params.id]
    );

    // Logs
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())`,
      [req.user.id, client_id ? "post_linked_to_client" : "post_unlinked_from_client",
       JSON.stringify({ post_id: req.params.id, client_id: client_id || null, client_name: clientName })]
    ).catch(() => {});
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at) VALUES ($1,$2,$3,$4,NOW())`,
      [req.user.id, "post_link_client", postCheck.rows[0].user_id,
       JSON.stringify({ post_id: req.params.id, client_id: client_id || null })]
    ).catch(() => {});

    console.log(`[team] PATCH /posts/${req.params.id}/link-client → client_id=${client_id || "null"}`);
    res.json({ success: true, client_id: client_id || null, client_name: clientName });
  } catch (err) {
    console.error("PATCH /team/posts/:id/link-client:", err.message);
    res.status(500).json({ error: "Failed to link client" });
  }
});

// ─── GET /notifications — aggrège toutes les notifs in-app ──────────────────
// Retourne les événements récents pertinents pour l'user connecté
router.get("/notifications", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifs = [];

    // 1. Approvals en attente (pour owner/admin)
    const approvalRes = await db.query(
      `SELECT p.id as post_id, p.title, p.content, p.created_at,
              u.display_name, u.email
       FROM posts p
       JOIN users u ON u.id = p.user_id
       JOIN team_members tm ON tm.member_id = p.user_id AND tm.owner_id = $1
       WHERE p.approval_status = 'pending_approval'
       ORDER BY p.created_at DESC LIMIT 10`,
      [userId]
    ).catch(() => ({ rows: [] }));
    approvalRes.rows.forEach(r => notifs.push({
      id: `approval_${r.post_id}`,
      type: "approval",
      icon: "⏳",
      color: "#f59e0b",
      title: r.display_name || r.email,
      body: (r.title || r.content || "").slice(0, 60),
      created_at: r.created_at,
      link_tab: "team",
      read: false,
    }));

    // 2. Commentaires récents sur mes posts (dernières 48h)
    const commentRes = await db.query(
      `SELECT c.id, c.post_id, c.content, c.created_at,
              u.display_name, u.email
       FROM post_comments c
       JOIN users u ON u.id = c.user_id
       JOIN posts p ON p.id = c.post_id
       WHERE p.user_id = $1 AND c.user_id != $1
         AND c.created_at > NOW() - INTERVAL '48 hours'
       ORDER BY c.created_at DESC LIMIT 10`,
      [userId]
    ).catch(() => ({ rows: [] }));
    commentRes.rows.forEach(r => notifs.push({
      id: `comment_${r.id}`,
      type: "comment",
      icon: "💬",
      color: "#60a5fa",
      title: r.display_name || r.email,
      body: r.content.slice(0, 60),
      created_at: r.created_at,
      link_tab: "history",
      read: false,
    }));

    // 3. Posts assignés à moi (dernières 48h)
    const assignRes = await db.query(
      `SELECT p.id, p.title, p.content, p.created_at,
              u.display_name, u.email
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.assigned_to = $1
         AND p.created_at > NOW() - INTERVAL '48 hours'
       ORDER BY p.created_at DESC LIMIT 5`,
      [userId]
    ).catch(() => ({ rows: [] }));
    assignRes.rows.forEach(r => notifs.push({
      id: `assigned_${r.id}`,
      type: "assigned",
      icon: "🎯",
      color: "#a78bfa",
      title: r.display_name || r.email,
      body: (r.title || r.content || "").slice(0, 60),
      created_at: r.created_at,
      link_tab: "history",
      read: false,
    }));

    // 4. Posts approuvés récemment (pour l'auteur, dernières 48h)
    const approvedRes = await db.query(
      `SELECT p.id, p.title, p.content, p.approved_at
       FROM posts p
       WHERE p.user_id = $1
         AND p.approval_status = 'approved'
         AND p.approved_at > NOW() - INTERVAL '48 hours'
       ORDER BY p.approved_at DESC LIMIT 5`,
      [userId]
    ).catch(() => ({ rows: [] }));
    approvedRes.rows.forEach(r => notifs.push({
      id: `approved_${r.id}`,
      type: "approved",
      icon: "✅",
      color: "#22c55e",
      title: "Post approved",
      body: (r.title || r.content || "").slice(0, 60),
      created_at: r.approved_at,
      link_tab: "history",
      read: false,
    }));

    // 5. Posts rejetés récemment (pour l'auteur, dernières 48h)
    const rejectedRes = await db.query(
      `SELECT p.id, p.title, p.content, p.approved_at
       FROM posts p
       WHERE p.user_id = $1
         AND p.approval_status = 'rejected'
         AND p.approved_at > NOW() - INTERVAL '48 hours'
       ORDER BY p.approved_at DESC LIMIT 5`,
      [userId]
    ).catch(() => ({ rows: [] }));
    rejectedRes.rows.forEach(r => notifs.push({
      id: `rejected_${r.id}`,
      type: "rejected",
      icon: "❌",
      color: "#ef4444",
      title: "Post rejected",
      body: (r.title || r.content || "").slice(0, 60),
      created_at: r.approved_at,
      link_tab: "history",
      read: false,
    }));

    // Marquer comme lues les notifs déjà vues (via user_logs)
    const readRes = await db.query(
      `SELECT details->>'notif_id' as notif_id FROM user_logs
       WHERE user_id = $1 AND action = 'notif_read'
         AND created_at > NOW() - INTERVAL '48 hours'`,
      [userId]
    ).catch(() => ({ rows: [] }));
    const readIds = new Set(readRes.rows.map(r => r.notif_id));
    notifs.forEach(n => { if (readIds.has(n.id)) n.read = true; });

    // Trier par date desc
    notifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    console.log(`[team] GET /notifications → ${notifs.length} notifs for user=${userId}`);
    res.json({ notifications: notifs, unread: notifs.filter(n => !n.read).length });
  } catch (err) {
    console.error("GET /notifications:", err.message);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ─── POST /notifications/read-all — marquer toutes comme lues ────────────────
router.post("/notifications/read-all", auth, async (req, res) => {
  const { notif_ids } = req.body; // tableau d'ids
  try {
    if (Array.isArray(notif_ids) && notif_ids.length > 0) {
      for (const notif_id of notif_ids) {
        await db.query(
          `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'notif_read',$2,NOW())
           ON CONFLICT DO NOTHING`,
          [req.user.id, JSON.stringify({ notif_id })]
        ).catch(() => {});
      }
    }
    console.log(`[team] POST /notifications/read-all → ${notif_ids?.length || 0} marked read`);
    res.json({ success: true });
  } catch (err) {
    console.error("POST /notifications/read-all:", err.message);
    res.status(500).json({ error: "Failed to mark read" });
  }
});

// ─── GET /agency/analytics — tableau de bord analytics par client ────────────
router.get("/agency/analytics", auth, requireBusiness, async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Stats globales agence
    const globalStats = await db.query(
      `SELECT
         COUNT(DISTINCT ac.id)::int                                    AS total_clients,
         COUNT(DISTINCT p.id)::int                                     AS total_posts,
         ROUND(AVG(p.viral_score) FILTER (WHERE p.viral_score > 0))::int AS avg_viral_score,
         COUNT(DISTINCT p.id) FILTER (WHERE p.approval_status='approved')::int AS approved_posts,
         COUNT(DISTINCT p.id) FILTER (WHERE p.approval_status='pending_approval')::int AS pending_posts,
         COUNT(DISTINCT p.id) FILTER (WHERE p.created_at > NOW() - INTERVAL '30 days')::int AS posts_30d
       FROM agency_clients ac
       LEFT JOIN posts p ON p.client_id = ac.id AND p.user_id = $1
       WHERE ac.user_id = $1`,
      [ownerId]
    );

    // Stats par client
    const clientStats = await db.query(
      `SELECT
         ac.id, ac.name, ac.color, ac.niche, ac.email,
         COUNT(DISTINCT p.id)::int                                                AS total_posts,
         COUNT(DISTINCT p.id) FILTER (WHERE p.created_at > NOW() - INTERVAL '30 days')::int AS posts_30d,
         COUNT(DISTINCT p.id) FILTER (WHERE p.created_at > NOW() - INTERVAL '7 days')::int  AS posts_7d,
         ROUND(AVG(p.viral_score) FILTER (WHERE p.viral_score > 0))::int          AS avg_viral_score,
         MAX(p.viral_score)::int                                                   AS max_viral_score,
         COUNT(DISTINCT p.id) FILTER (WHERE p.approval_status='approved')::int    AS approved_posts,
         COUNT(DISTINCT p.id) FILTER (WHERE p.approval_status='pending_approval')::int AS pending_posts,
         COUNT(DISTINCT p.id) FILTER (WHERE p.approval_status='rejected')::int    AS rejected_posts,
         MAX(p.created_at)                                                         AS last_post_at,
         COUNT(DISTINCT pc.id)::int                                                AS total_comments
       FROM agency_clients ac
       LEFT JOIN posts p ON p.client_id = ac.id AND p.user_id = $1
       LEFT JOIN post_comments pc ON pc.post_id = p.id
       WHERE ac.user_id = $1
       GROUP BY ac.id, ac.name, ac.color, ac.niche, ac.email
       ORDER BY posts_30d DESC, total_posts DESC`,
      [ownerId]
    );

    // Activité 30j par jour (pour sparkline)
    const activity30d = await db.query(
      `SELECT
         DATE(p.created_at) AS day,
         COUNT(*)::int       AS posts_count,
         ROUND(AVG(p.viral_score) FILTER (WHERE p.viral_score > 0))::int AS avg_score
       FROM posts p
       JOIN agency_clients ac ON ac.id = p.client_id AND ac.user_id = $1
       WHERE p.user_id = $1 AND p.created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(p.created_at)
       ORDER BY day ASC`,
      [ownerId]
    );

    // Top posts (meilleur viral score)
    const topPosts = await db.query(
      `SELECT p.id, p.title, p.content, p.viral_score, p.created_at,
              p.approval_status, ac.name AS client_name, ac.color AS client_color
       FROM posts p
       JOIN agency_clients ac ON ac.id = p.client_id AND ac.user_id = $1
       WHERE p.user_id = $1 AND p.viral_score > 0
       ORDER BY p.viral_score DESC
       LIMIT 5`,
      [ownerId]
    );

    // Logs
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'agency_analytics_view',$2,NOW())`,
      [ownerId, JSON.stringify({ clients: clientStats.rows.length })]
    ).catch(() => {});

    console.log(`[team] GET /agency/analytics → ${clientStats.rows.length} clients for user=${ownerId}`);
    res.json({
      global:     globalStats.rows[0],
      clients:    clientStats.rows,
      activity30d:activity30d.rows,
      topPosts:   topPosts.rows,
    });
  } catch (err) {
    console.error("GET /agency/analytics:", err.message);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ─── GET /team/notifications/counts — compteurs unifiés pour badges sidebar ──
// Route légère appelée toutes les 30s — remplace les 4 fetches séparés
router.get("/notifications/counts", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [approvals, comments, assigned, history, publish] = await Promise.all([
      // Approvals en attente (owner)
      db.query(
        `SELECT COUNT(*)::int AS count FROM posts p
         JOIN team_members tm ON tm.member_id = p.user_id AND tm.owner_id = $1
         WHERE p.approval_status = 'pending_approval'`,
        [userId]
      ).catch(() => ({ rows: [{ count: 0 }] })),

      // Commentaires non lus sur mes posts (48h)
      db.query(
        `SELECT COUNT(*)::int AS count FROM post_comments c
         JOIN posts p ON p.id = c.post_id
         WHERE p.user_id = $1 AND c.user_id != $1
           AND c.created_at > NOW() - INTERVAL '48 hours'
           AND NOT EXISTS (
             SELECT 1 FROM user_logs ul
             WHERE ul.user_id = $1 AND ul.action = 'notif_read'
               AND ul.details->>'notif_id' = 'comment_' || c.id::text
           )`,
        [userId]
      ).catch(() => ({ rows: [{ count: 0 }] })),

      // Posts assignés à moi non vus (48h)
      db.query(
        `SELECT COUNT(*)::int AS count FROM posts p
         WHERE p.assigned_to = $1
           AND p.created_at > NOW() - INTERVAL '48 hours'
           AND NOT EXISTS (
             SELECT 1 FROM user_logs ul
             WHERE ul.user_id = $1 AND ul.action = 'notif_read'
               AND ul.details->>'notif_id' = 'assigned_' || p.id::text
           )`,
        [userId]
      ).catch(() => ({ rows: [{ count: 0 }] })),

      // Nouveaux posts dans history depuis dernière visite
      db.query(
        `SELECT COUNT(*)::int AS count FROM posts p
         WHERE p.user_id = $1
           AND p.created_at > COALESCE(
             (SELECT TO_TIMESTAMP((details->>'timestamp')::bigint/1000)
              FROM user_logs WHERE user_id = $1 AND action = 'tab_visit_history'
              ORDER BY created_at DESC LIMIT 1),
             NOW() - INTERVAL '24 hours'
           )`,
        [userId]
      ).catch(() => ({ rows: [{ count: 0 }] })),

      // Publications récentes non vues
      db.query(
        `SELECT COUNT(*)::int AS count FROM publish_log p
         WHERE p.user_id = $1
           AND p.created_at > COALESCE(
             (SELECT TO_TIMESTAMP((details->>'timestamp')::bigint/1000)
              FROM user_logs WHERE user_id = $1 AND action = 'tab_visit_publish'
              ORDER BY created_at DESC LIMIT 1),
             NOW() - INTERVAL '24 hours'
           )`,
        [userId]
      ).catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    res.json({
      team:      approvals.rows[0].count,
      comments:  comments.rows[0].count,
      assigned:  assigned.rows[0].count,
      history:   history.rows[0].count,
      publish:   publish.rows[0].count,
      total:     approvals.rows[0].count + comments.rows[0].count + assigned.rows[0].count,
    });
  } catch (err) {
    console.error("GET /team/notifications/counts:", err.message);
    res.status(500).json({ error: "Failed to fetch counts" });
  }
});

// ─── Helper : vérifier une permission granulaire d'un membre ─────────────────
async function checkPermission(userId, permKey) {
  try {
    const r = await db.query(
      `SELECT tm.permissions, tm.role
       FROM team_members tm
       WHERE tm.member_id = $1 AND tm.status = 'active'
       LIMIT 1`,
      [userId]
    );
    if (!r.rows.length) return true; // pas membre → owner, accès libre
    const perms = r.rows[0].permissions || {};
    // Admin team a toujours accès
    if (r.rows[0].role === "admin") return true;
    return perms[permKey] !== false; // défaut true si non défini
  } catch {
    return true; // fail open
  }
}

// ─── GET /team/my-permissions — permissions du membre connecté ────────────────
router.get("/my-permissions", auth, async (req, res) => {
  try {
    // Vérifier si owner (Business/Agency)
    const ownerCheck = await db.query(
      "SELECT plan FROM users WHERE id=$1", [req.user.id]
    );
    const plan = ownerCheck.rows[0]?.plan || "Free";
    if (plan === "Business" || plan === "Agency") {
      return res.json({
        isOwner: true, role: "owner",
        permissions: {
          canGenerate: true, canPublish: true, canApprove: true,
          canDelete: true, canInvite: true, canManageCalendar: true,
        },
      });
    }

    // Membre
    const r = await db.query(
      `SELECT tm.role, tm.permissions, tm.status,
              u.email as owner_email, u.display_name as owner_name
       FROM team_members tm
       JOIN users u ON u.id = tm.owner_id
       WHERE tm.member_id = $1 AND tm.status = 'active'
       LIMIT 1`,
      [req.user.id]
    );
    if (!r.rows.length) return res.json({ isOwner: false, role: null, permissions: {} });

    const member = r.rows[0];
    res.json({
      isOwner:    false,
      role:       member.role,
      ownerEmail: member.owner_email,
      ownerName:  member.owner_name,
      permissions: member.permissions || {},
    });
  } catch (err) {
    console.error("GET /team/my-permissions:", err.message);
    res.status(500).json({ error: "Failed to fetch permissions" });
  }
});

// ─── PATCH /team/members/:id/permissions — modifier permissions d'un membre ───
router.patch("/members/:id/permissions", auth, requireBusiness, async (req, res) => {
  const { permissions, role } = req.body;
  try {
    const fields = []; const vals = []; let i = 1;
    if (permissions !== undefined) {
      fields.push(`permissions=$${i++}`);
      vals.push(JSON.stringify(permissions));
    }
    if (role !== undefined) {
      fields.push(`role=$${i++}`);
      vals.push(role);
    }
    if (!fields.length) return res.status(400).json({ error: "Nothing to update" });

    vals.push(req.params.id, req.user.id);
    const result = await db.query(
      `UPDATE team_members SET ${fields.join(",")}
       WHERE id=$${i} AND owner_id=$${i+1} RETURNING id, role, permissions`,
      vals
    );
    if (!result.rows.length) return res.status(404).json({ error: "Member not found" });

    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'team_permissions_updated',$2,NOW())`,
      [req.user.id, JSON.stringify({ member_id: req.params.id, role, permissions })]
    ).catch(() => {});

    console.log(`[team] PATCH /members/${req.params.id}/permissions by owner=${req.user.id}`);
    res.json({ success: true, member: result.rows[0] });
  } catch (err) {
    console.error("PATCH /team/members/:id/permissions:", err.message);
    res.status(500).json({ error: "Failed to update permissions" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CHAT ÉQUIPE ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Helper : résoudre le team_id (owner de l'équipe) depuis un user quelconque
const resolveTeamId = async (userId) => {
  // Si owner → son propre id
  const ownerCheck = await db.query(
    "SELECT id FROM users WHERE id=$1 AND plan IN ('Business','Agency')",
    [userId]
  );
  if (ownerCheck.rows.length) return userId;

  // Si membre → trouver l'owner via team_members
  const memberCheck = await db.query(
    "SELECT owner_id FROM team_members WHERE member_id=$1 AND status='active'",
    [userId]
  );
  return memberCheck.rows[0]?.owner_id || null;
};

// Helper : vérifier qu'un user a accès au chat d'une équipe
const canAccessChat = async (userId, teamId) => {
  // Owner de l'équipe
  if (parseInt(teamId) === userId) return true;
  // Membre actif
  const r = await db.query(
    "SELECT id FROM team_members WHERE owner_id=$1 AND member_id=$2 AND status='active'",
    [teamId, userId]
  );
  return r.rows.length > 0;
};

// ─── GET /team/chat — Récupérer les messages ─────────────────────────────────
router.get("/chat", auth, async (req, res) => {
  try {
    const teamId = req.query.team_id
      ? parseInt(req.query.team_id)
      : await resolveTeamId(req.user.id);

    if (!teamId) return res.status(400).json({ error: "Team not found" });

    const ok = await canAccessChat(req.user.id, teamId);
    if (!ok) return res.status(403).json({ error: "Access denied" });

    const limit = Math.min(parseInt(req.query.limit) || 100, 200);
    const r = await db.query(
      `SELECT tm.id, tm.sender_id, tm.sender_email, tm.sender_name, tm.content, tm.created_at,
              CASE WHEN tmr.id IS NOT NULL THEN true ELSE false END AS read_by_me
       FROM team_messages tm
       LEFT JOIN team_message_reads tmr ON tmr.message_id=tm.id AND tmr.user_id=$1
       WHERE tm.team_id=$2
       ORDER BY tm.created_at ASC
       LIMIT $3`,
      [req.user.id, teamId, limit]
    );

    // Marquer tous les messages non lus comme lus
    await db.query(
      `INSERT INTO team_message_reads (message_id, user_id, read_at)
       SELECT tm.id, $1, NOW()
       FROM team_messages tm
       WHERE tm.team_id=$2
         AND NOT EXISTS (
           SELECT 1 FROM team_message_reads tmr
           WHERE tmr.message_id=tm.id AND tmr.user_id=$1
         )
       ON CONFLICT DO NOTHING`,
      [req.user.id, teamId]
    );

    res.json({ messages: r.rows, team_id: teamId });
  } catch (err) {
    console.error("GET /team/chat error:", err.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ─── POST /team/chat — Envoyer un message ────────────────────────────────────
router.post("/chat", auth, async (req, res) => {
  const { content, team_id } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "content required" });

  try {
    const teamId = team_id
      ? parseInt(team_id)
      : await resolveTeamId(req.user.id);

    if (!teamId) return res.status(400).json({ error: "Team not found" });

    const ok = await canAccessChat(req.user.id, teamId);
    if (!ok) return res.status(403).json({ error: "Access denied" });

    // Récupérer infos sender
    const userRes = await db.query(
      "SELECT email, first_name, last_name, display_name FROM users WHERE id=$1",
      [req.user.id]
    );
    const u = userRes.rows[0];
    const senderName = u.display_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email;

    const r = await db.query(
      `INSERT INTO team_messages (team_id, sender_id, sender_email, sender_name, content)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [teamId, req.user.id, u.email, senderName, content.trim()]
    );

    // Log admin
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at)
       VALUES ($1,'team_chat_message',$1,$2,NOW())`,
      [req.user.id, JSON.stringify({ team_id: teamId, length: content.trim().length })]
    ).catch(() => {});

    // Log user
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'team_chat_message',$2,NOW())`,
      [req.user.id, JSON.stringify({ team_id: teamId })]
    ).catch(() => {});

    res.json({ success: true, message: r.rows[0] });
  } catch (err) {
    console.error("POST /team/chat error:", err.message);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ─── GET /team/chat/unread — Nombre de messages non lus ─────────────────────
router.get("/chat/unread", auth, async (req, res) => {
  try {
    const teamId = await resolveTeamId(req.user.id);
    if (!teamId) return res.json({ unread: 0 });

    const r = await db.query(
      `SELECT COUNT(*)::int AS unread
       FROM team_messages tm
       WHERE tm.team_id=$1
         AND tm.sender_id != $2
         AND NOT EXISTS (
           SELECT 1 FROM team_message_reads tmr
           WHERE tmr.message_id=tm.id AND tmr.user_id=$2
         )`,
      [teamId, req.user.id]
    );
    res.json({ unread: r.rows[0]?.unread || 0 });
  } catch (err) {
    console.error("GET /team/chat/unread error:", err.message);
    res.json({ unread: 0 });
  }
});

// ─── DELETE /team/chat/:id — Supprimer un message (owner ou auteur) ──────────
router.delete("/chat/:id", auth, async (req, res) => {
  try {
    const msgRes = await db.query(
      "SELECT sender_id, team_id FROM team_messages WHERE id=$1",
      [req.params.id]
    );
    if (!msgRes.rows.length) return res.status(404).json({ error: "Message not found" });
    const msg = msgRes.rows[0];

    // Autoriser si auteur ou owner de l'équipe
    const isAuthor = msg.sender_id === req.user.id;
    const isOwner  = msg.team_id   === req.user.id;
    if (!isAuthor && !isOwner) return res.status(403).json({ error: "Not authorized" });

    await db.query("DELETE FROM team_messages WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /team/chat/:id error:", err.message);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// ─── Middleware : enforcer canGenerate pour les membres team ──────────────────
export const requireCanGenerate = async (req, res, next) => {
  // Si user normal (pas membre d'une équipe) → passer
  const teamCheck = await db.query(
    "SELECT plan_managed_by FROM users WHERE id=$1", [req.user.id]
  ).catch(() => ({ rows: [] }));
  if (teamCheck.rows[0]?.plan_managed_by !== "team") return next();

  const can = await checkPermission(req.user.id, "canGenerate");
  if (!can) return res.status(403).json({ error: "You don't have permission to generate posts", code: "NO_GENERATE_PERMISSION" });
  next();
};

// ─── Middleware : enforcer canPublish pour les membres team ───────────────────
export const requireCanPublish = async (req, res, next) => {
  const teamCheck = await db.query(
    "SELECT plan_managed_by FROM users WHERE id=$1", [req.user.id]
  ).catch(() => ({ rows: [] }));
  if (teamCheck.rows[0]?.plan_managed_by !== "team") return next();

  const can = await checkPermission(req.user.id, "canPublish");
  if (!can) return res.status(403).json({ error: "You don't have permission to publish posts", code: "NO_PUBLISH_PERMISSION" });
  next();
};

export default router;

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CHAT ÉQUIPE ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const resolveTeamId = async (userId) => {
  const r = await db.query(
    "SELECT id, plan, team_owner_id, plan_managed_by FROM users WHERE id=$1",
    [userId]
  );
  if (!r.rows.length) return null;
  const u = r.rows[0];
  if (["Business","Agency"].includes(u.plan)) return userId;
  if (u.plan_managed_by === "team" && u.team_owner_id) return u.team_owner_id;
  return null;
};

const canAccessChat = async (userId, teamId) => {
  if (userId === teamId) return true;
  const r = await db.query(
    "SELECT id FROM team_members WHERE owner_id=$1 AND member_id=$2 AND status='active'",
    [teamId, userId]
  );
  return r.rows.length > 0;
};

router.get("/chat", auth, async (req, res) => {
  try {
    const teamId = req.query.team_id
      ? parseInt(req.query.team_id)
      : await resolveTeamId(req.user.id);
    if (!teamId) return res.status(400).json({ error: "Team not found — upgrade to Business or join a team" });
    const ok = await canAccessChat(req.user.id, teamId);
    if (!ok) return res.status(403).json({ error: "Access denied" });
    const limit = Math.min(parseInt(req.query.limit) || 100, 200);
    const r = await db.query(
      `SELECT tm.id, tm.sender_id, tm.sender_email, tm.sender_name, tm.content, tm.created_at,
              CASE WHEN tmr.id IS NOT NULL THEN true ELSE false END AS read_by_me
       FROM team_messages tm
       LEFT JOIN team_message_reads tmr ON tmr.message_id=tm.id AND tmr.user_id=$1
       WHERE tm.team_id=$2
       ORDER BY tm.created_at ASC LIMIT $3`,
      [req.user.id, teamId, limit]
    );
    await db.query(
      `INSERT INTO team_message_reads (message_id, user_id, read_at)
       SELECT tm.id, $1, NOW() FROM team_messages tm
       WHERE tm.team_id=$2
         AND NOT EXISTS (SELECT 1 FROM team_message_reads tmr2 WHERE tmr2.message_id=tm.id AND tmr2.user_id=$1)
       ON CONFLICT DO NOTHING`,
      [req.user.id, teamId]
    ).catch(() => {});
    res.json({ messages: r.rows, team_id: teamId });
  } catch (err) {
    console.error("GET /team/chat error:", err.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/chat", auth, async (req, res) => {
  const { content, team_id } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "content required" });
  try {
    const teamId = team_id ? parseInt(team_id) : await resolveTeamId(req.user.id);
    if (!teamId) return res.status(400).json({ error: "Team not found" });
    const ok = await canAccessChat(req.user.id, teamId);
    if (!ok) return res.status(403).json({ error: "Access denied" });
    const uRes = await db.query(
      "SELECT email, first_name, last_name, display_name FROM users WHERE id=$1",
      [req.user.id]
    );
    const u = uRes.rows[0];
    const senderName = u.display_name || `${u.first_name||""} ${u.last_name||""}`.trim() || u.email;
    const r = await db.query(
      `INSERT INTO team_messages (team_id, sender_id, sender_email, sender_name, content)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [teamId, req.user.id, u.email, senderName, content.trim()]
    );
    await db.query(
      `INSERT INTO user_logs (user_id, action, details, created_at) VALUES ($1,'team_chat_message',$2,NOW())`,
      [req.user.id, JSON.stringify({ team_id: teamId })]
    ).catch(() => {});
    res.json({ success: true, message: r.rows[0] });
  } catch (err) {
    console.error("POST /team/chat error:", err.message);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.get("/chat/unread", auth, async (req, res) => {
  try {
    const teamId = await resolveTeamId(req.user.id);
    if (!teamId) return res.json({ unread: 0 });
    const r = await db.query(
      `SELECT COUNT(*)::int AS unread FROM team_messages tm
       WHERE tm.team_id=$1 AND tm.sender_id != $2
         AND NOT EXISTS (SELECT 1 FROM team_message_reads tmr WHERE tmr.message_id=tm.id AND tmr.user_id=$2)`,
      [teamId, req.user.id]
    );
    res.json({ unread: r.rows[0]?.unread || 0 });
  } catch (err) {
    console.error("GET /team/chat/unread error:", err.message);
    res.json({ unread: 0 });
  }
});

router.delete("/chat/:id", auth, async (req, res) => {
  try {
    const msgRes = await db.query(
      "SELECT sender_id, team_id FROM team_messages WHERE id=$1", [req.params.id]
    );
    if (!msgRes.rows.length) return res.status(404).json({ error: "Message not found" });
    const msg = msgRes.rows[0];
    if (msg.sender_id !== req.user.id && msg.team_id !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });
    await db.query("DELETE FROM team_messages WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /team/chat/:id error:", err.message);
    res.status(500).json({ error: "Failed to delete message" });
  }
});
