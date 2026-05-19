import express from "express";
import OpenAI from "openai";
import db from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const langName = (lang) => ({ fr:"French", es:"Spanish", de:"German", it:"Italian", pt:"Portuguese" }[lang] || "English");
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
  const { topic, template = "default", voice, campaign, project, lang = "en", voiceStyle } = req.body;

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

  // Voice learning — auto-fetch si pas fourni
  let voiceProfile = voiceStyle || null;
  if (!voiceProfile && req.user?.id) {
    try {
      const postsResult = await db.query(
        "SELECT content FROM posts WHERE user_id=$1 ORDER BY created_at DESC LIMIT 8",
        [req.user.id]
      );
      if (postsResult.rows.length >= 3) {
        const contents = postsResult.rows.map(r => r.content).filter(Boolean);
        const styleRes = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Analyze these LinkedIn posts and return ONLY a JSON with field "styleInstructions": a 2-sentence writing style guide to replicate this author's exact voice, rhythm and structure. Write the styleInstructions in ${langName(lang)} language. No other fields.`
            },
            {
              role: "user",
              content: contents.map((p, i) => `POST ${i+1}:\n${p}`).join("\n---\n")
            }
          ],
          max_tokens: 150,
          temperature: 0.2,
        });
        const raw = styleRes.choices[0]?.message?.content?.trim().replace(/```json|```/g, "").trim();
        voiceProfile = JSON.parse(raw);
      }
    } catch {} // Voice learning silencieux — ne bloque jamais la génération
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

  const voiceInstruction = voiceProfile?.styleInstructions
    ? `\nVOICE LEARNING — ADOPT THIS AUTHOR'S EXACT STYLE:\n${voiceProfile.styleInstructions}`
    : "";

  const systemPrompt = `You are an elite LinkedIn content strategist and copywriter with 10+ years of experience creating viral B2B content. You write posts that get thousands of likes and generate qualified leads.

${templateInstruction}

${brandContext}
${voiceInstruction}
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
      } catch (err) { console.error("Insert post error:", err.message); }
      try {
        await db.query(
          "UPDATE users SET generations_count = generations_count + 1 WHERE id=$1",
          [req.user.id]
        );
      } catch (err) { console.error("Increment quota error:", err.message); }
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

// ─── POST /generate/voice-style ───────────────────────────────────────────────
// Analyse les derniers posts de l'user et retourne son profil de style
router.post("/voice-style", authenticateToken, async (req, res) => {
  const { lang = "en" } = req.body;
  try {
    const result = await db.query(
      "SELECT content FROM posts WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10",
      [req.user.id]
    );
    const posts = result.rows.map(r => r.content).filter(Boolean);
    if (posts.length < 2) {
      return res.json({ style: null, message: "Not enough posts to learn your style yet." });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert writing style analyst. Analyze the LinkedIn posts provided and extract the author's unique writing style profile. Return ONLY a JSON object with these fields. Write all text values in ${langName(lang)} language.
{
  "avgSentenceLength": "<short|medium|long>",
  "tone": "<describe in 5 words max>",
  "structure": "<describe typical post structure in 1 sentence>",
  "hooks": "<describe how they start posts>",
  "vocabulary": "<simple|technical|mixed>",
  "usesNumbers": <true|false>,
  "usesQuestions": <true|false>,
  "usesEmoji": <true|false>,
  "styleInstructions": "<3-4 sentences of precise writing instructions to replicate this style exactly>"
}
Return ONLY the JSON, no explanation.`
        },
        {
          role: "user",
          content: `Analyze these ${posts.length} LinkedIn posts and extract the writing style:\n\n${posts.map((p, i) => `POST ${i+1}:\n${p}`).join("\n\n---\n\n")}`
        }
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const style = JSON.parse(clean);
    res.json({ style, postsAnalyzed: posts.length });
  } catch (err) {
    console.error("Voice style error:", err.message);
    res.status(500).json({ error: "Voice analysis failed" });
  }
});

// ─── POST /generate/repurpose ─────────────────────────────────────────────────
// Transforme une URL (article, YouTube, PDF text) en post LinkedIn
router.post("/repurpose", authenticateToken, checkGenerationQuota, async (req, res) => {
  const { url, text: pastedText, lang = "en", voiceStyle } = req.body;
  if (!url && !pastedText) return res.status(400).json({ error: "URL or text required" });

  let sourceContent = pastedText || "";

  // Si URL fournie, on fetch le contenu
  if (url && !pastedText) {
    try {
      const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
      if (isYoutube) {
        sourceContent = `YouTube video URL: ${url}\nPlease extract the main insights from this video based on its URL and common knowledge about this topic.`;
      } else {
        const fetchRes = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; GrowthPILOT/1.0)" },
          signal: AbortSignal.timeout(8000),
        });
        const html = await fetchRes.text();
        // Extraction basique du texte
        sourceContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 3000);
      }
    } catch (err) {
      console.error("URL fetch error:", err.message);
      sourceContent = `Content from URL: ${url}`;
    }
  }

  const langInstruction = lang !== "en"
    ? `Write the post in ${lang === "fr" ? "French" : lang === "es" ? "Spanish" : lang === "de" ? "German" : lang === "it" ? "Italian" : lang === "pt" ? "Portuguese" : "English"}.`
    : "";

  const styleInstruction = voiceStyle?.styleInstructions
    ? `\nWRITING STYLE TO ADOPT:\n${voiceStyle.styleInstructions}`
    : "";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an elite LinkedIn content strategist. Transform the provided content into a high-performing LinkedIn post.
Extract the 3-5 most valuable insights. Write a strong hook. Make it actionable and shareable.
${styleInstruction}
${langInstruction}
RULES: No hashtags. No corporate jargon. Strong first line. End with a question or CTA. 150-250 words.`
        },
        {
          role: "user",
          content: `Transform this content into a LinkedIn post:\n\nSOURCE: ${url || "Pasted content"}\n\nCONTENT:\n${sourceContent}`
        }
      ],
      max_tokens: 600,
      temperature: 0.75,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return res.status(500).json({ error: "Repurposing failed" });

    // Save + quota
    if (req.user?.id) {
      try {
        await db.query(
          "INSERT INTO posts (user_id, topic, template, content, created_at) VALUES ($1,$2,$3,$4,NOW())",
          [req.user.id, url || "repurposed", "repurpose", text]
        );
        await db.query("UPDATE users SET generations_count=generations_count+1 WHERE id=$1", [req.user.id]);
      } catch {}
    }

    res.json({ text, source: url || "pasted" });
  } catch (err) {
    console.error("Repurpose error:", err.message);
    res.status(500).json({ error: "Repurposing failed" });
  }
});

// ─── POST /generate/hooks ─────────────────────────────────────────────────────
// Génère 5 hooks pour un topic donné
router.post("/hooks", authenticateToken, async (req, res) => {
  const { topic, lang = "en", voiceStyle } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic required" });

  const langInstruction = lang !== "en"
    ? `Write all hooks in ${lang === "fr" ? "French" : lang === "es" ? "Spanish" : lang === "de" ? "German" : lang === "it" ? "Italian" : lang === "pt" ? "Portuguese" : "English"}.`
    : "";

  const styleHint = voiceStyle?.tone ? `Match this tone: ${voiceStyle.tone}.` : "";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a LinkedIn hook specialist. Generate 5 different hooks for the given topic.
Each hook = 1-2 lines max. Must stop the scroll immediately.
Use different angles: bold claim, shocking stat, contrarian, personal story opener, provocative question.
Return ONLY a JSON array of 5 strings. No markdown, no numbering inside strings.
${styleHint} ${langInstruction}`
        },
        { role: "user", content: `Topic: ${topic}\n\nGenerate 5 scroll-stopping hooks.` }
      ],
      max_tokens: 300,
      temperature: 0.9,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const hooks = JSON.parse(clean);
    res.json({ hooks: Array.isArray(hooks) ? hooks : [] });
  } catch (err) {
    console.error("Hooks error:", err.message);
    res.status(500).json({ error: "Hook generation failed" });
  }
});

// ─── POST /generate/viral-score ───────────────────────────────────────────────
// Score de viralité prédit avant publication
router.post("/viral-score", authenticateToken, async (req, res) => {
  const { text, lang = "en" } = req.body;
  if (!text || text.length < 20) return res.status(400).json({ error: "Text too short" });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a LinkedIn algorithm expert. Predict the viral potential of this post before publication.
Return ONLY a JSON object:
{
  "score": <0-100 overall viral potential>,
  "hook": <0-100 hook strength>,
  "emotion": <0-100 emotional impact>,
  "value": <0-100 actionable value>,
  "readability": <0-100 ease of reading>,
  "prediction": "<LOW|MEDIUM|HIGH|VIRAL>",
  "tip": "<single most impactful improvement in 1 sentence, in ${langName(lang)} language>",
  "bestTime": "<best day and time to post for maximum reach, in ${langName(lang)} language>"
}
Return ONLY the JSON.`
        },
        { role: "user", content: `Score this LinkedIn post:\n\n${text}` }
      ],
      max_tokens: 250,
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const score = JSON.parse(clean);
    res.json(score);
  } catch (err) {
    console.error("Viral score error:", err.message);
    res.status(500).json({ error: "Scoring failed" });
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

router.post("/repurpose-multi", authenticateToken, checkGenerationQuota, async (req, res) => {
  const { post, lang = "en", voiceStyle } = req.body;
  if (!post || post.trim().length < 30)
    return res.status(400).json({ error: "Post content required (min 30 chars)" });

  const langName = { fr:"French", es:"Spanish", de:"German", it:"Italian", pt:"Portuguese" }[lang] || "English";
  const styleInstruction = voiceStyle?.styleInstructions
    ? `\nWRITING STYLE: ${voiceStyle.styleInstructions}`
    : "";

  try {
    // ── Prompt unique → 3 formats en parallèle ────────────────────────────
    const [threadRes, newsletterRes, carouselRes] = await Promise.all([

      // 1. Thread X (Twitter)
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a top X (Twitter) content creator. Transform the LinkedIn post into a viral thread.
Format: Return ONLY a JSON array of tweet strings.
Rules: Tweet 1 = strong hook (≤280 chars). Tweets 2-6 = key insights, one per tweet. Last tweet = CTA + "🧵".
Each tweet ≤ 280 chars. No numbering inside tweets.
Language: ${langName}.${styleInstruction}`,
          },
          { role: "user", content: `LinkedIn post to transform into X thread:\n\n${post}` },
        ],
        max_tokens: 600,
        temperature: 0.8,
      }),

      // 2. Newsletter / email
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert newsletter writer. Transform the LinkedIn post into a newsletter section.
Return ONLY a JSON object with:
{
  "subject": "<catchy email subject line>",
  "preheader": "<preview text, 50-90 chars>",
  "intro": "<1 paragraph warm intro>",
  "body": "<2-3 paragraphs — expanded insights with examples>",
  "cta": "<clear call to action>",
  "ps": "<optional PS line>"
}
Language: ${langName}.${styleInstruction}`,
          },
          { role: "user", content: `LinkedIn post to transform into newsletter:\n\n${post}` },
        ],
        max_tokens: 700,
        temperature: 0.75,
      }),

      // 3. Carousel LinkedIn (slides)
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a LinkedIn carousel specialist. Transform the LinkedIn post into carousel slides.
Return ONLY a JSON array of slide objects:
[
  { "slide": 1, "type": "cover",   "headline": "...", "subheadline": "..." },
  { "slide": 2, "type": "content", "headline": "...", "body": "..." },
  ...
  { "slide": N, "type": "cta",     "headline": "...", "action": "..." }
]
Rules: 5-8 slides. Cover + 3-6 content slides + 1 CTA slide.
Headlines ≤ 8 words. Body ≤ 25 words. Make it scannable.
Language: ${langName}.${styleInstruction}`,
          },
          { role: "user", content: `LinkedIn post to transform into carousel:\n\n${post}` },
        ],
        max_tokens: 600,
        temperature: 0.75,
      }),
    ]);

    // ── Parse les 3 résultats ─────────────────────────────────────────────
    const parseJSON = (completion, fallback) => {
      try {
        const raw   = completion.choices[0]?.message?.content?.trim() || "";
        const clean = raw.replace(/```json|```/g, "").trim();
        return JSON.parse(clean);
      } catch { return fallback; }
    };

    const thread         = parseJSON(threadRes,     []);
    const newsletter     = parseJSON(newsletterRes, {});
    const carouselSlides = parseJSON(carouselRes,   []);

    // ── Save + quota (compte comme 1 génération) ──────────────────────────
    if (req.user?.id) {
      try {
        await db.query(
          "INSERT INTO posts (user_id, topic, template, content, created_at) VALUES ($1,$2,$3,$4,NOW())",
          [req.user.id, "repurpose-multi", "multi-format", post.slice(0, 300)]
        );
        await db.query(
          "UPDATE users SET generations_count=generations_count+1 WHERE id=$1",
          [req.user.id]
        );
      } catch {}
    }

    res.json({ thread, newsletter, carouselSlides });

  } catch (err) {
    console.error("repurpose-multi error:", err.message);
    res.status(500).json({ error: "Multi-format repurposing failed" });
  }
});


// ─── POST /generate/carousel ──────────────────────────────────────────────────
router.post("/carousel", authenticateToken, async (req, res) => {
  const { topic, slideCount = 5, lang = "en", memory } = req.body;
  if (!topic?.trim()) return res.status(400).json({ error: "Topic is required" });

  const lName = langName(lang);
  const count = Math.min(Math.max(parseInt(slideCount) || 5, 3), 10);

  const sysPrompt = `You are an expert LinkedIn carousel creator. Generate exactly ${count} slides for a LinkedIn carousel post.
IMPORTANT: Write ALL content (titles, body text) in ${lName} language.
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
        model: "claude-sonnet-4-5-20251001",
        max_tokens: 2000,
        system: sysPrompt,
        messages: [{ role: "user", content: `Create a ${count}-slide LinkedIn carousel about: ${topic}. Write in ${lName} language.` }],
      }),
    });
    const data = await response.json();
    if (!response.ok) { console.error("Anthropic carousel error:", JSON.stringify(data)); return res.status(500).json({ error: "AI generation failed", detail: data }); }
    const raw = data.content?.find(b => b.type === "text")?.text || "[]";
    const slides = JSON.parse(raw.replace(/```json|```/g, "").trim());
    if (!Array.isArray(slides) || slides.length === 0) return res.status(500).json({ error: "Invalid AI response" });
    res.json({ slides });
  } catch (err) {
    console.error("Carousel error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── POST /generate/ghostwrite ────────────────────────────────────────────────
router.post("/ghostwrite", authenticateToken, async (req, res) => {
  const { source, systemPrompt: sysPrompt, lang = "en" } = req.body;
  if (!source?.trim())    return res.status(400).json({ error: "Source text is required" });
  if (!sysPrompt?.trim()) return res.status(400).json({ error: "System prompt is required" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20251001",
        max_tokens: 1500,
        system: sysPrompt,
        messages: [{ role: "user", content: `Rewrite this:\n\n${source}` }],
      }),
    });
    const data = await response.json();
    if (!response.ok) { console.error("Anthropic ghostwrite error:", JSON.stringify(data)); return res.status(500).json({ error: "AI generation failed", detail: data }); }
    const text = data.content?.find(b => b.type === "text")?.text?.trim() || "";
    if (!text) return res.status(500).json({ error: "Empty AI response" });
    res.json({ text });
  } catch (err) {
    console.error("GhostWrite error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
