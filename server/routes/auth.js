import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import db from "../db.js";

const router = express.Router();

// ✅ JWT_SECRET via variable d'environnement — jamais hardcodé
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

// ─── Domaines email jetables bloqués ──────────────────────────────────────────
const BLOCKED_DOMAINS = new Set([
  "mailinator.com","tempmail.com","guerrillamail.com","yopmail.com",
  "throwam.com","sharklasers.com","guerrillamailblock.com","grr.la",
  "guerrillamail.info","guerrillamail.biz","guerrillamail.de","guerrillamail.net",
  "guerrillamail.org","spam4.me","trashmail.com","trashmail.me","trashmail.net",
  "dispostable.com","mailnull.com","spamgourmet.com","spamgourmet.net",
  "maildrop.cc","spamfree24.org","tempr.email","discard.email","fakeinbox.com",
  "mailnesia.com","mailexpire.com","spamcorpse.com","deadaddress.com",
  "spamevader.net","spamhereplease.com","tempinbox.com","tempemail.net",
  "throwam.com","throwam.net","throwam.org","filzmail.com","owlpic.com",
]);

// ─── Envoi email de vérification via Resend ───────────────────────────────────
const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `https://www.aigrowthpilot.app?verify=${token}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "GrowthPILOT <team@aigrowthpilot.app>",
      to: email,
      subject: "Verify your GrowthPILOT account",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#050a14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#0d1626;border:1px solid rgba(220,38,38,0.2);border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;letter-spacing:-0.5px;">Growth<span style="opacity:0.8">PILOT</span></h1>
              <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">AI Content Command Center</p>
            </div>
            <div style="padding:40px 32px;">
              <h2 style="color:#e2e8f0;font-size:20px;font-weight:800;margin:0 0 12px;">Verify your email</h2>
              <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 32px;">
                Click the button below to verify your email address and activate your GrowthPILOT account. This link expires in 24 hours.
              </p>
              <a href="${verifyUrl}" style="display:block;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;text-decoration:none;text-align:center;padding:16px 32px;border-radius:10px;font-weight:800;font-size:15px;letter-spacing:0.5px;">
                Verify my email →
              </a>
              <p style="color:#334155;font-size:12px;margin:24px 0 0;text-align:center;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.05);padding:20px 32px;text-align:center;">
              <p style="color:#1e293b;font-size:11px;margin:0;">© 2026 GrowthPILOT · <a href="https://www.aigrowthpilot.app" style="color:#334155;">aigrowthpilot.app</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
};

// ─── Envoi email de confirmation de changement d'adresse (nouveau email) ──────
const sendEmailChangeConfirmation = async (newEmail, token, oldEmail) => {
  const confirmUrl = `https://www.aigrowthpilot.app?confirm_email_change=${token}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "GrowthPILOT <team@aigrowthpilot.app>",
      to: newEmail,
      subject: "Confirm your new email address — GrowthPILOT",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#050a14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#0d1626;border:1px solid rgba(220,38,38,0.2);border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;letter-spacing:-0.5px;">Growth<span style="opacity:0.8">PILOT</span></h1>
              <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">AI Content Command Center</p>
            </div>
            <div style="padding:40px 32px;">
              <h2 style="color:#e2e8f0;font-size:20px;font-weight:800;margin:0 0 12px;">Confirm your new email</h2>
              <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 8px;">
                A request was made to change the email address on your GrowthPILOT account.
              </p>
              <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 32px;">
                Current address: <strong style="color:#94a3b8;">${oldEmail}</strong><br/>
                New address: <strong style="color:#94a3b8;">${newEmail}</strong><br/><br/>
                Click below to confirm. This link expires in <strong style="color:#ef4444;">24 hours</strong>.
              </p>
              <a href="${confirmUrl}" style="display:block;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;text-decoration:none;text-align:center;padding:16px 32px;border-radius:10px;font-weight:800;font-size:15px;letter-spacing:0.5px;">
                Confirm new email →
              </a>
              <p style="color:#334155;font-size:12px;margin:24px 0 0;text-align:center;">
                If you didn't request this change, you can safely ignore this email. Your account remains secure.
              </p>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.05);padding:20px 32px;text-align:center;">
              <p style="color:#1e293b;font-size:11px;margin:0;">© 2026 GrowthPILOT · <a href="https://www.aigrowthpilot.app" style="color:#334155;">aigrowthpilot.app</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
};

// ─── Envoi email d'alerte sécurité (ancien email) ─────────────────────────────
const sendEmailChangeAlert = async (oldEmail, newEmail) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "GrowthPILOT <team@aigrowthpilot.app>",
      to: oldEmail,
      subject: "⚠️ Security alert — Email change requested",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#050a14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#0d1626;border:1px solid rgba(220,38,38,0.2);border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;letter-spacing:-0.5px;">Growth<span style="opacity:0.8">PILOT</span></h1>
              <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">AI Content Command Center</p>
            </div>
            <div style="padding:40px 32px;">
              <h2 style="color:#ef4444;font-size:20px;font-weight:800;margin:0 0 12px;">⚠️ Email change requested</h2>
              <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 16px;">
                A request was made to change the email address associated with your GrowthPILOT account.
              </p>
              <div style="background:rgba(220,38,38,0.05);border:1px solid rgba(220,38,38,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
                <div style="color:#94a3b8;font-size:13px;margin-bottom:6px;">Current email: <strong>${oldEmail}</strong></div>
                <div style="color:#94a3b8;font-size:13px;">Requested new email: <strong>${newEmail}</strong></div>
              </div>
              <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0;">
                A confirmation link was sent to <strong style="color:#94a3b8;">${newEmail}</strong>. The change will only take effect after confirmation.<br/><br/>
                <strong style="color:#ef4444;">If you did not make this request</strong>, please contact us immediately at <a href="mailto:team@aigrowthpilot.app" style="color:#ef4444;">team@aigrowthpilot.app</a> and change your password.
              </p>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.05);padding:20px 32px;text-align:center;">
              <p style="color:#1e293b;font-size:11px;margin:0;">© 2026 GrowthPILOT · <a href="https://www.aigrowthpilot.app" style="color:#334155;">aigrowthpilot.app</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
};

// ─── Middleware auth ───────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// ─── Validation basique ────────────────────────────────────────────────────────
const validateEmailPassword = (email, password) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) return "Invalid email format";
  if (!password || password.length < 8) return "Password must be at least 8 characters";
  return null;
};

// ─── Auth routes (publiques) ───────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const validationError = validateEmailPassword(email, password);
  if (validationError) return res.status(400).json({ message: validationError });

  // Bloquer les domaines email jetables
  const domain = email.split("@")[1]?.toLowerCase();
  if (BLOCKED_DOMAINS.has(domain)) {
    return res.status(400).json({ message: "Please use a valid email address. Disposable emails are not allowed." });
  }

  // Nettoyage : supprimer compte non vérifié depuis +24h avec ce même email
  await db.query(
    "DELETE FROM users WHERE email=$1 AND email_verified=false AND created_at < NOW() - INTERVAL '24 hours'",
    [email]
  );

  const hashed = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  try {
    const result = await db.query(
      "INSERT INTO users(email,password,plan,generations_count,email_verified,verification_token) VALUES($1,$2,'Free',0,false,$3) RETURNING id",
      [email, hashed, verificationToken]
    );

    // Envoyer email de vérification
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailErr) {
      console.error("Email send error:", emailErr.message);
      // On crée quand même le compte mais on avertit
    }

    res.json({ success: true, message: "Account created. Please check your email to verify your account." });
  } catch {
    res.status(400).json({ message: "User already exists" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const validationError = validateEmailPassword(email, password);
  if (validationError) return res.status(400).json({ message: validationError });

  const result = await db.query("SELECT * FROM users WHERE email=$1", [email]);
  const user = result.rows[0];
  if (!user) return res.status(400).json({ message: "User not found" });
  if (user.banned) return res.status(403).json({ message: "Account suspended. Contact support." });
  if (user.email_verified === false) return res.status(403).json({ message: "Please verify your email before logging in. Check your inbox.", code: "email_not_verified" });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "Invalid password" });
  const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

// ─── Routes protégées (token requis) ──────────────────────────────────────────
router.post("/save-post", authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO posts(user_id,title,content,created_at) VALUES($1,$2,$3,NOW()) RETURNING id",
      [req.user.id, title, content]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error("save-post error:", err.message);
    res.status(500).json({ success: false, message: "Save failed" });
  }
});

router.get("/posts", authenticateToken, async (req, res) => {
  const result = await db.query(
    "SELECT * FROM posts WHERE user_id=$1 ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json(result.rows);
});

router.get("/project/:name", authenticateToken, async (req, res) => {
  try {
    const [proj, memory, posts] = await Promise.all([
      db.query("SELECT * FROM projects WHERE name=$1", [req.params.name]),
      db.query("SELECT * FROM brand_memory WHERE project_name=$1", [req.params.name]),
      db.query(
        "SELECT * FROM posts WHERE user_id=$1 AND project_name=$2 ORDER BY created_at DESC LIMIT 20",
        [req.user.id, req.params.name]
      ),
    ]);
    res.json({
      project:  proj.rows[0]  || null,
      memory:   memory.rows[0]|| {},
      posts:    posts.rows    || [],
      drafts:   [],
      lastPost: posts.rows[0] || null,
    });
  } catch (err) {
    console.error("project fetch error:", err.message);
    res.status(500).json({ error: "Failed to load project" });
  }
});

router.post("/create-project", authenticateToken, async (req, res) => {
  const { name, workspace, campaign } = req.body;
  const result = await db.query(
    "INSERT INTO projects(name,workspace,campaign) VALUES($1,$2,$3) RETURNING id",
    [name, workspace, campaign]
  );
  res.json({ success: true, id: result.rows[0].id });
});

router.get("/projects", authenticateToken, async (req, res) => {
  const result = await db.query("SELECT * FROM projects ORDER BY created_at DESC");
  res.json(result.rows);
});

router.delete("/delete-project/:name", authenticateToken, async (req, res) => {
  await db.query("DELETE FROM projects WHERE name=$1", [req.params.name]);
  res.json({ success: true });
});

router.post("/rename-project", authenticateToken, async (req, res) => {
  const { oldName, newName } = req.body;
  await db.query("UPDATE projects SET name=$1 WHERE name=$2", [newName, oldName]);
  res.json({ success: true });
});

router.post("/save-brand-memory", authenticateToken, async (req, res) => {
  const { project_name, niche, audience, tone, cta, banned_words } = req.body;
  await db.query(
    `INSERT INTO brand_memory(project_name,niche,audience,tone,cta,banned_words)
     VALUES($1,$2,$3,$4,$5,$6)
     ON CONFLICT(project_name) DO UPDATE SET niche=$2,audience=$3,tone=$4,cta=$5,banned_words=$6`,
    [project_name, niche, audience, tone, cta, banned_words]
  );
  res.json({ success: true });
});

router.get("/brand-memory/:project", authenticateToken, async (req, res) => {
  const result = await db.query("SELECT * FROM brand_memory WHERE project_name=$1", [req.params.project]);
  res.json(result.rows[0] || {});
});

router.delete("/delete-account", authenticateToken, async (req, res) => {
  await db.query("DELETE FROM users WHERE id=$1", [req.user.id]);
  res.json({ success: true });
});

// ─── POST /auth/change-password ───────────────────────────────────────────────
router.post("/change-password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }
  try {
    const result = await db.query("SELECT * FROM users WHERE id=$1", [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password=$1 WHERE id=$2", [hashed, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── POST /auth/change-email/request ──────────────────────────────────────────
// Étape 1 : vérifie le mot de passe, génère un token, envoie les emails
router.post("/change-email/request", authenticateToken, async (req, res) => {
  const { newEmail, currentPassword } = req.body;

  // Validation format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!newEmail || !emailRegex.test(newEmail)) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  // Bloquer les domaines jetables
  const domain = newEmail.split("@")[1]?.toLowerCase();
  if (BLOCKED_DOMAINS.has(domain)) {
    return res.status(400).json({ message: "Disposable email addresses are not allowed." });
  }

  if (!currentPassword) {
    return res.status(400).json({ message: "Current password is required" });
  }

  try {
    const result = await db.query("SELECT * FROM users WHERE id=$1", [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    // Vérifier que le nouvel email est différent de l'actuel
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return res.status(400).json({ message: "New email must be different from your current email" });
    }

    // Vérifier que le nouvel email n'est pas déjà utilisé
    const existing = await db.query("SELECT id FROM users WHERE email=$1 AND id!=$2", [newEmail, req.user.id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "This email address is already in use" });
    }

    // Vérifier le mot de passe actuel
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ message: "Current password is incorrect" });

    // Générer le token de confirmation (expire dans 24h)
    const changeToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

    // Stocker le token et le nouvel email en attente
    await db.query(
      "UPDATE users SET pending_email=$1, email_change_token=$2, email_change_expires_at=$3 WHERE id=$4",
      [newEmail, changeToken, expiresAt, req.user.id]
    );

    // Envoyer email de confirmation au nouveau email
    await sendEmailChangeConfirmation(newEmail, changeToken, user.email);

    // Envoyer alerte sécurité à l'ancien email (non bloquant)
    try {
      await sendEmailChangeAlert(user.email, newEmail);
    } catch (alertErr) {
      console.error("Email change alert error:", alertErr.message);
    }

    res.json({ success: true, message: "A confirmation link has been sent to your new email address. It expires in 24 hours." });
  } catch (err) {
    console.error("Change email request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET /auth/change-email/confirm/:token ────────────────────────────────────
// Étape 2 : valide le token et applique le changement d'email en DB
router.get("/change-email/confirm/:token", async (req, res) => {
  const { token } = req.params;
  try {
    // Chercher un user avec ce token non expiré
    const result = await db.query(
      "SELECT * FROM users WHERE email_change_token=$1 AND email_change_expires_at > NOW()",
      [token]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired confirmation link." });
    }

    // Vérifier une dernière fois que le pending_email n'est pas déjà pris
    const conflict = await db.query(
      "SELECT id FROM users WHERE email=$1 AND id!=$2",
      [user.pending_email, user.id]
    );
    if (conflict.rows.length > 0) {
      // Nettoyer et rejeter
      await db.query(
        "UPDATE users SET pending_email=NULL, email_change_token=NULL, email_change_expires_at=NULL WHERE id=$1",
        [user.id]
      );
      return res.status(400).json({ message: "This email address is already in use by another account." });
    }

    // Appliquer le changement
    await db.query(
      `UPDATE users
       SET email=$1,
           pending_email=NULL,
           email_change_token=NULL,
           email_change_expires_at=NULL
       WHERE id=$2`,
      [user.pending_email, user.id]
    );

    res.json({ success: true, message: "Email address updated successfully. Please log in again with your new email." });
  } catch (err) {
    console.error("Change email confirm error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET /auth/verify-email/:token ───────────────────────────────────────────
router.get("/verify-email/:token", async (req, res) => {
  try {
    const result = await db.query(
      "UPDATE users SET email_verified=true, verification_token=NULL WHERE verification_token=$1 RETURNING id, email",
      [req.params.token]
    );
    if (!result.rows.length) {
      return res.status(400).json({ message: "Invalid or expired verification link." });
    }
    res.json({ success: true, email: result.rows[0].email });
  } catch (err) {
    console.error("Verify email error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── POST /auth/resend-verification ──────────────────────────────────────────
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });
  try {
    const result = await db.query("SELECT id, email_verified FROM users WHERE email=$1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.email_verified) return res.status(400).json({ message: "Email already verified" });

    const token = crypto.randomBytes(32).toString("hex");
    await db.query("UPDATE users SET verification_token=$1 WHERE email=$2", [token, email]);
    await sendVerificationEmail(email, token);
    res.json({ success: true });
  } catch (err) {
    console.error("Resend verification error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, email, plan, onboarding_done FROM users WHERE id=$1",
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Auth me error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── POST /auth/onboarding-done ───────────────────────────────────────────────
router.post("/onboarding-done", authenticateToken, async (req, res) => {
  try {
    await db.query("UPDATE users SET onboarding_done=true WHERE id=$1", [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Onboarding done error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
