import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });
  jwt.verify(token, "growthpilot-secret", (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const result = await db.query(
      "INSERT INTO users(email,password) VALUES($1,$2) RETURNING id",
      [email, hashed]
    );
    const token = jwt.sign({ id: result.rows[0].id, email }, "growthpilot-secret", { expiresIn: "7d" });
    res.json({ token });
  } catch {
    res.status(400).json({ message: "User already exists" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await db.query("SELECT * FROM users WHERE email=$1", [email]);
  const user = result.rows[0];
  if (!user) return res.status(400).json({ message: "User not found" });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "Invalid password" });
  const token = jwt.sign({ id: user.id, email }, "growthpilot-secret", { expiresIn: "7d" });
  res.json({ token });
});

router.post("/save-post", async (req, res) => {
  const { title, content } = req.body;
  await db.query("INSERT INTO posts(title,content) VALUES($1,$2)", [title, content]);
  res.json({ success: true });
});

router.get("/posts", async (req, res) => {
  const result = await db.query("SELECT * FROM posts ORDER BY created_at DESC");
  res.json(result.rows);
});

router.post("/create-project", async (req, res) => {
  const { name, workspace, campaign } = req.body;
  const result = await db.query(
    "INSERT INTO projects(name,workspace,campaign) VALUES($1,$2,$3) RETURNING id",
    [name, workspace, campaign]
  );
  res.json({ success: true, id: result.rows[0].id });
});

router.get("/projects", async (req, res) => {
  const result = await db.query("SELECT * FROM projects ORDER BY created_at DESC");
  res.json(result.rows);
});

router.delete("/delete-project/:name", async (req, res) => {
  await db.query("DELETE FROM projects WHERE name=$1", [req.params.name]);
  res.json({ success: true });
});

router.post("/rename-project", async (req, res) => {
  const { oldName, newName } = req.body;
  await db.query("UPDATE projects SET name=$1 WHERE name=$2", [newName, oldName]);
  res.json({ success: true });
});

router.post("/save-brand-memory", async (req, res) => {
  const { project_name, niche, audience, tone, cta, banned_words } = req.body;
  await db.query(
    `INSERT INTO brand_memory(project_name,niche,audience,tone,cta,banned_words)
     VALUES($1,$2,$3,$4,$5,$6)
     ON CONFLICT(project_name) DO UPDATE SET niche=$2,audience=$3,tone=$4,cta=$5,banned_words=$6`,
    [project_name, niche, audience, tone, cta, banned_words]
  );
  res.json({ success: true });
});

router.get("/brand-memory/:project", async (req, res) => {
  const result = await db.query("SELECT * FROM brand_memory WHERE project_name=$1", [req.params.project]);
  res.json(result.rows[0] || {});
});

router.delete("/delete-account", authenticateToken, async (req, res) => {
  await db.query("DELETE FROM users WHERE id=$1", [req.user.id]);
  res.json({ success: true });
});

export default router;