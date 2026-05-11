import express from "express";
import OpenAI from "openai";
import db from "../db.js";
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

// ─── Limites par plan ─────────────────────────────────────────────────────────
const PLAN_LIMITS = {
  Free:     { generations: 5,   analyses: 3,  projects: 1  },
  Pro:      { generations: 100, analyses: Infinity, projects: 10 },
  Business: { generations: Infinity, analyses: Infinity, projects: Infinity },
};

// ─── Middleware quota générations ─────────────────────────────────────────────
const checkGenerationQuota = async (req, res, next) => {
  if (!req.user?.id) return next();
  try {
    const result = await db.query(
      "SELECT plan, generations_count, quota_reset_date FROM users WHERE id=$1",
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return next();

    // Reset mensuel automatique
    const today = new Date().toISOString().split("T")[0];
    const resetDate = user.quota_reset_date?.toISOString?.()?.split("T")[0] || user.quota_reset_date;
    const resetMonth = resetDate ? resetDate.slice(0, 7) : null;
    const currentMonth = today.slice(0, 7);

    if (resetMonth !== currentMonth) {
      await db.query(
        "UPDATE users SET generations_count=0, quota_reset_date=$1 WHERE id=$2",
        [today, req.user.id]
      );
      user.generations_count = 0;
    }

    const plan = user.plan || "Free";
    const limit = PLAN_LIMITS[plan]?.generations ?? 5;

    // Comptes test — bypass
    const testResult = await db.query("SELECT email FROM users WHERE id=$1", [req.user.id]);
    const TEST_ACCOUNTS = ["test@aigrowthpilot.app"];
    if (TEST_ACCOUNTS.includes(testResult.rows[0]?.email)) return next();

    if (limit !== Infinity && user.generations_count >= limit) {
      return res.status(403).json({
        error: "quota_exceeded",
        message: `You've reached your ${limit} generations/month limit on the ${plan} plan.`,
        current: user.generations_count,
        limit,
        plan,
        upgrade: plan === "Free" ? "pro" : "business",
      });
    }

    req.userPlan = plan;
    next();
  } catch (err) {
    console.error("Quota check error:", err.message);
    next(); // En cas d'erreur, on laisse passer
  }
};

// ─── Templates prompts ────────────────────────────────────────────────────────
const TEMPLATE_INSTRUCTIONS = {
  viral: `Write a viral LinkedIn post optimized for maximum engagement and shares.
Use pattern interrupt, bold claim or counterintuitive insight in the first line.
Include a strong hook, numbered insights or a short story, and end with a question.
Format: short punchy paragraphs, use line breaks for readability. 150-250 words.`,

  authority: `Write an authority-positioning LinkedIn post that establishes thought leadership.
Open with a powerful statement or industry insight.
Share a framework, contrarian view, or data-backed observation.
End with a clear takeaway. Professional but not corporate. 200-300 words.`,

  story: `Write a personal story post for LinkedIn using the STAR framework (Situation, Task, Action, Result).
Make it relatable, emotionally engaging, with a clear business lesson at the end.
First line must be a strong hook. 200-300 words.`,

  hook: `Write only the hook section (first 2-3 lines) for a LinkedIn post.
This must stop the scroll immediately — use a bold claim, shocking stat, or provocative question.
Deliver 5 different hook variations for the given topic.`,

  short: `Write a short, punchy LinkedIn post. Maximum 80 words.
One idea, clearly expressed. High impact, no fluff.
Perfect for mobile reading. Strong first line, clear CTA at the end.`,

  cta: `Write a LinkedIn post focused on driving a specific action (comment, DM, click, share).
Clear value proposition, social proof if possible, and an irresistible CTA.
150-200 words.`,

  default: `Write a high-quality LinkedIn post about the given topic.
Strong hook, valuable insights, clear takeaway. 150-250 words.`,
};

// ─── POST /generate ────────────────────────────────────────────────────────────
router.post("/", authenticateToken, checkGenerationQuota, async (req, res) => {
  const { topic, template = "default", voice, campaign, project, lang = "en" } = req.body;

  if (!topic) return res.status(400).json({ error: "Topic is required" });

  // Récupérer la brand memory si un projet est sélectionné
  let brandMemory = null;
  if (project && req.user?.id) {
    try {
      const result = await db.query(
        "SELECT * FROM brand_memory WHERE project_name=$1",
        [project]
      );
      brandMemory = result.rows[0] || null;
    } catch {}
  }

  const templateInstruction = TEMPLATE_INSTRUCTIONS[template] || TEMPLATE_INSTRUCTIONS.default;

  // Construire le contexte brand
  const brandContext = brandMemory ? `
BRAND CONTEXT:
- Niche: ${brandMemory.niche || "not specified"}
- Target audience: ${brandMemory.audience || "not specified"}
- Tone of voice: ${brandMemory.tone || voice || "professional"}
- Default CTA: ${brandMemory.cta || "not specified"}
- Banned words: ${brandMemory.banned_words || "none"}
` : voice ? `Tone of voice: ${voice}` : "";

  const langInstruction = lang !== "en"
    ? `Write the post in ${lang === "fr" ? "French" : lang === "es" ? "Spanish" : lang === "de" ? "German" : lang === "it" ? "Italian" : lang === "pt" ? "Portuguese" : "English"}.`
    : "";

  const systemPrompt = `You are an elite LinkedIn content strategist and copywriter with 10+ years of experience creating viral B2B content. You write posts that get thousands of likes and generate qualified leads.

${templateInstruction}

${brandContext}
${langInstruction}

RULES:
- Never use corporate jargon or clichés
- Never start with "I" as the first word
- No hashtags unless specifically requested
- No emojis unless the tone calls for it
- Always end with engagement (question or CTA)
- Make every word count`;

  const userPrompt = `Topic: ${topic}${campaign ? `\nCampaign: ${campaign}` : ""}

Write the LinkedIn post now.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.8,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return res.status(500).json({ error: "Generation failed" });

    // Sauvegarder dans l'historique + incrémenter quota
    if (req.user?.id) {
      try {
        await db.query(
          `INSERT INTO posts (user_id, project_name, topic, template, content, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT DO NOTHING`,
          [req.user.id, project || null, topic, template, text]
        );
        await db.query(
          "UPDATE users SET generations_count = generations_count + 1 WHERE id=$1",
          [req.user.id]
        );
      } catch {}
    }

    res.json({
      text,
      template,
      topic,
      tokens: completion.usage?.total_tokens || 0,
    });

  } catch (err) {
    console.error("Generate error:", err.message);
    res.status(500).json({ error: "Generation failed", detail: err.message });
  }
});

// ─── POST /generate/rewrite ───────────────────────────────────────────────────
router.post("/rewrite", authenticateToken, async (req, res) => {
  const { text, mode = "viral", lang = "en" } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  const modeInstructions = {
    viral:     "Rewrite this post to maximize virality and shares. Strengthen the hook dramatically.",
    authority: "Rewrite this post to establish stronger thought leadership and authority.",
    story:     "Rewrite this post as a personal story with emotional depth and clear lesson.",
    hook:      "Extract the core idea and write 5 different hook variations.",
    short:     "Rewrite this post in under 80 words. Maximum punch, minimum words.",
    cta:       "Rewrite this post with a much stronger, irresistible call to action.",
  };

  const langInstruction = lang !== "en"
    ? `Keep the output in ${lang === "fr" ? "French" : lang === "es" ? "Spanish" : lang === "de" ? "German" : lang === "it" ? "Italian" : lang === "pt" ? "Portuguese" : "English"}.`
    : "";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an elite LinkedIn copywriter. ${modeInstructions[mode] || modeInstructions.viral} ${langInstruction}`,
        },
        { role: "user", content: `Original post:\n\n${text}\n\nRewrite it now.` },
      ],
      max_tokens: 600,
      temperature: 0.85,
    });

    const rewritten = completion.choices[0]?.message?.content?.trim();
    res.json({ text: rewritten });
  } catch (err) {
    console.error("Rewrite error:", err.message);
    res.status(500).json({ error: "Rewrite failed" });
  }
});

export default router;
