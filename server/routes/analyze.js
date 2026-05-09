import express from "express";
import OpenAI from "openai";
import jwt from "jsonwebtoken";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Middleware auth ───────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// ─── POST /analyze ─────────────────────────────────────────────────────────────
router.post("/", authenticateToken, async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 10) {
    return res.status(400).json({ error: "Text too short to analyze" });
  }

  const systemPrompt = `You are an expert LinkedIn content analyst. Analyze the given post and return ONLY a JSON object with these exact fields:

{
  "score": <overall quality score 0-100>,
  "hookScore": <hook strength 0-100 — how likely to stop the scroll>,
  "clarityScore": <message clarity 0-100>,
  "ctaScore": <CTA strength 0-100>,
  "viralScore": <viral potential 0-100 — shareability>,
  "readability": <readability score 0-100 — sentence length, structure>,
  "feedback": "<one sentence overall assessment>",
  "diagnosis": "<main weakness identified>",
  "suggestion": "<single most impactful improvement>",
  "hookStrength": "<STRONG|MEDIUM|WEAK>",
  "ctaStrength": "<STRONG|MEDIUM|WEAK>",
  "estimatedReach": "<LOW|MEDIUM|HIGH|VIRAL>",
  "bestPlatform": "<LinkedIn|Twitter|Both>"
}

SCORING GUIDE:
- hookScore: Does the first line make you want to read more? 90+ = exceptional pattern interrupt
- clarityScore: Is the message crystal clear? No jargon, logical flow?
- ctaScore: Does it drive a specific action? Is it compelling?
- viralScore: Would people share this? Does it trigger emotion or provide value worth sharing?
- readability: Short sentences? Good paragraph breaks? Easy to skim?

Return ONLY the JSON, no explanation, no markdown, no backticks.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this LinkedIn post:\n\n${text}` },
      ],
      max_tokens: 400,
      temperature: 0.3, // Bas pour des scores cohérents
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return res.status(500).json({ error: "Analysis failed" });

    // Parser le JSON proprement
    let analysis;
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      analysis = JSON.parse(clean);
    } catch {
      // Fallback si le JSON est malformé
      return res.status(500).json({ error: "Analysis parsing failed", raw });
    }

    // Valider et normaliser les scores (0-100)
    const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    const normalized = {
      score:        clamp(analysis.score),
      hookScore:    clamp(analysis.hookScore),
      clarityScore: clamp(analysis.clarityScore),
      ctaScore:     clamp(analysis.ctaScore),
      viralScore:   clamp(analysis.viralScore),
      readability:  clamp(analysis.readability),
      feedback:     analysis.feedback || "Solid content with room for improvement.",
      diagnosis:    analysis.diagnosis || "Hook could be stronger.",
      suggestion:   analysis.suggestion || "Add a more compelling opening line.",
      hookStrength: ["STRONG", "MEDIUM", "WEAK"].includes(analysis.hookStrength) ? analysis.hookStrength : "MEDIUM",
      ctaStrength:  ["STRONG", "MEDIUM", "WEAK"].includes(analysis.ctaStrength) ? analysis.ctaStrength : "MEDIUM",
      estimatedReach: ["LOW", "MEDIUM", "HIGH", "VIRAL"].includes(analysis.estimatedReach) ? analysis.estimatedReach : "MEDIUM",
      bestPlatform: analysis.bestPlatform || "LinkedIn",
    };

    res.json(normalized);

  } catch (err) {
    console.error("Analyze error:", err.message);

    // Fallback sur l'analyse heuristique si OpenAI échoue
    const wordCount = text.trim().split(/\s+/).length;
    const score = Math.min(100, 60 + Math.floor(wordCount / 5));
    const hook = text.split("\n")[0].length < 80 ? 85 : 60;
    const clarity = text.length < 1200 ? 90 : 65;
    const ctaScore = text.includes("?") ? 88 : 62;
    const viralScore = Math.round((hook + clarity + ctaScore) / 3);

    res.json({
      score,
      hookScore: hook,
      clarityScore: clarity,
      ctaScore,
      viralScore,
      readability: text.split("\n").length > 3 ? 85 : 65,
      feedback: score > 85 ? "Excellent structure." : score > 70 ? "Solid content." : "Needs improvement.",
      diagnosis: !text.includes("?") ? "Weak CTA detected." : "Solid structure overall.",
      suggestion: !text.includes("?") ? "Add a direct question at the end." : "Strengthen the opening hook.",
      hookStrength: hook > 80 ? "STRONG" : hook > 60 ? "MEDIUM" : "WEAK",
      ctaStrength: ctaScore > 80 ? "STRONG" : ctaScore > 60 ? "MEDIUM" : "WEAK",
      estimatedReach: score > 85 ? "HIGH" : score > 70 ? "MEDIUM" : "LOW",
      bestPlatform: "LinkedIn",
    });
  }
});

export default router;
