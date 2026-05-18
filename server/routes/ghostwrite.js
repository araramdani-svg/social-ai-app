// server/routes/ghostwrite.js
// GrowthPILOT — GhostWrite generation proxy (Anthropic API via backend)

import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// POST /generate/ghostwrite
router.post("/", authenticateToken, async (req, res) => {
  const { source, systemPrompt, lang = "en" } = req.body;
  if (!source?.trim()) return res.status(400).json({ error: "Source text is required" });
  if (!systemPrompt?.trim()) return res.status(400).json({ error: "System prompt is required" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: `Rewrite this:\n\n${source}` }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic ghostwrite error:", data);
      return res.status(500).json({ error: "AI generation failed" });
    }

    const text = data.content?.find(b => b.type === "text")?.text?.trim() || "";
    if (!text) return res.status(500).json({ error: "Empty AI response" });

    res.json({ text });
  } catch (err) {
    console.error("GhostWrite generation error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
