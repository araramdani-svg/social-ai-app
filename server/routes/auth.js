import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Access denied"
    });
  }

  jwt.verify(token, "growthpilot-secret", (err, user) => {
    if (err) {
      return res.status(403).json({
        message: "Invalid token"
      });
    }

    req.user = user;
    next();
  });
};
const router = express.Router();
router.delete("/delete-project/:name", (req, res) => {
  const { name } = req.params;

  db.run(
    "DELETE FROM projects WHERE name = ?",
    [name],
    function(err){
      if(err){
        return res.status(500).json({
          success:false,
          error:err.message
        });
      }

      res.json({
        success:true
      });
    }
  );
});
router.post("/rename-project", (req,res)=>{
  const { oldName, newName } = req.body;

  db.run(
    "UPDATE projects SET name = ? WHERE name = ?",
    [newName, oldName],
    function(err){
      if(err){
        return res.status(500).json({ success:false });
      }

      res.json({ success:true });
    }
  );
});
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users(email,password) VALUES(?,?)",
    [email, hashed],
    function(err) {
      if (err) {
        return res.status(400).json({
          message: "User already exists"
        });
      }

      const token = jwt.sign(
      {
        id: this.lastID,
        email
      },
        "growthpilot-secret",
        { expiresIn: "7d" }
      );

      res.json({ token });
    }
  );
});
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, user) => {
      if (!user) {
        return res.status(400).json({
          message: "User not found"
        });
      }

      const valid = await bcrypt.compare(
        password,
        user.password
      );

      if (!valid) {
        return res.status(400).json({
          message: "Invalid password"
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email
        },
        "growthpilot-secret",
        { expiresIn: "7d" }
      );

      res.json({ token });
    }
  );
});

router.post("/save-post", (req, res) => {
  const { title, content } = req.body;

  db.run(
    "INSERT INTO posts(title,content) VALUES(?,?)",
    [title, content],
    () => {
      res.json({ success: true });
    }
  );
});

router.get("/posts", (req, res) => {
  db.all("SELECT * FROM posts", [], (err, rows) => {
    res.json(rows);
  });
});

router.post("/create-project", (req, res) => {
  const { name, workspace, campaign } = req.body;

  db.run(
    "INSERT INTO projects(name,workspace,campaign) VALUES(?,?,?)",
    [name, workspace, campaign],
    function () {
      res.json({
        success: true,
        id: this.lastID
      });
    }
  );
});

router.get("/projects", (req, res) => {
  db.all(
    "SELECT * FROM projects ORDER BY created_at DESC",
    [],
    (err, rows) => {
      res.json(rows);
    }
  );
});
router.post("/save-brand-memory", (req, res) => {
  const {
    project_name,
    niche,
    audience,
    tone,
    cta,
    banned_words
  } = req.body;

  db.run(
    `
    INSERT OR REPLACE INTO brand_memory
    (project_name,niche,audience,tone,cta,banned_words)
    VALUES(?,?,?,?,?,?)
    `,
    [
      project_name,
      niche,
      audience,
      tone,
      cta,
      banned_words
    ],
    () => res.json({ success: true })
  );
});

router.get("/brand-memory/:project", (req, res) => {
  db.get(
    "SELECT * FROM brand_memory WHERE project_name=?",
    [req.params.project],
    (err, row) => {
      res.json(row || {});
    }
  );
});
router.delete("/delete-account", authenticateToken, (req, res) => {
  db.run(
    "DELETE FROM users WHERE id = ?",
    [req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({
          success: false
        });
      }

      res.json({
        success: true
      });
    }
  );
});

export default router;