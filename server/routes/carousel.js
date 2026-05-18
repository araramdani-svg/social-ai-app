// server/routes/carousel.js
// GrowthPILOT — Carousel generation proxy (Anthropic API via backend)

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

// POST /generate/carousel
router.post("/", authenticateToken, async (req, res) => {
  const { topic, slideCount = 5, lang = "en", memory } = req.body;
  if (!topic?.trim()) return res.status(400).json({ error: "Topic is required" });

  const langMap = { fr:"French", es:"Spanish", de:"German", it:"Italian", pt:"Portuguese" };
  const langName = langMap[lang] || "English";
  const count = Math.min(Math.max(parseInt(slideCount) || 5, 3), 10);

  const systemPrompt = `You are an expert LinkedIn carousel creator. Generate exactly ${count} slides for a LinkedIn carousel post.
IMPORTANT: Write ALL content (titles, body text) in ${langName} language.
Return ONLY a valid JSON array, no markdown, no explanation.
Each slide: { "emoji": "single emoji", "title": "short punchy title (max 8 words)", "body": "2-4 sentences of value (max 60 words)" }
Slide 1: Hook — attention-grabbing opener with a bold promise or surprising stat.
Slides 2 to ${count - 1}: Value — actionable insight, tip, or framework point.
Slide ${count}: CTA — clear call to action (follow, save, comment).
Niche context: ${memory?.niche || "business"} | Audience: ${memory?.audience || "professionals"} | Tone: ${memory?.tone || "expert"}.
Topic: "${topic}"`;

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
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: `Create a ${count}-slide LinkedIn carousel about: ${topic}. Write in ${langName} language.` }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic carousel error:", data);
      return res.status(500).json({ error: "AI generation failed" });
    }

    const raw = data.content?.find(b => b.type === "text")?.text || "[]";
    const clean = raw.replace(/```json|```/g, "").trim();
    const slides = JSON.parse(clean);

    if (!Array.isArray(slides) || slides.length === 0) {
      return res.status(500).json({ error: "Invalid AI response" });
    }

    res.json({ slides });
  } catch (err) {
    console.error("Carousel generation error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
