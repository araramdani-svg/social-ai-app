import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

// ✅ JWT_SECRET via variable d'environnement — jamais hardcodé
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

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

  const hashed = await bcrypt.hash(password, 10);
  try {
    const result = await db.query(
      "INSERT INTO users(email,password) VALUES($1,$2) RETURNING id",
      [email, hashed]
    );
    const token = jwt.sign({ id: result.rows[0].id, email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
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

// ─── POST /auth/change-email ───────────────────────────────────────────────────
router.post("/change-email", authenticateToken, async (req, res) => {
  const { newEmail } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!newEmail || !emailRegex.test(newEmail)) {
    return res.status(400).json({ message: "Invalid email address" });
  }
  try {
    await db.query("UPDATE users SET email=$1 WHERE id=$2", [newEmail, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ message: "Email already in use" });
    res.status(500).json({ message: "Server error" });
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
