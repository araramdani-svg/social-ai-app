import express    from "express";
import OpenAI     from "openai";
import db         from "../db.js";
import jwt        from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

// ─── Helper : upload une URL distante vers Cloudinary ────────────────────────
const uploadToCloudinary = async (url, options = {}) => {
  // Si c'est un data URL (SVG base64), on upload directement
  if (url.startsWith("data:")) {
    const result = await cloudinary.uploader.upload(url, {
      folder:    "growthpilot",
      ...options,
    });
    return result.secure_url;
  }
  // Sinon on fetch l'image et on l'upload en stream
  const result = await cloudinary.uploader.upload(url, {
    folder:    "growthpilot",
    ...options,
  });
  return result.secure_url;
};

const router = express.Router();

const langName = (lang) => ({ fr:"French", es:"Spanish", de:"German", it:"Italian", pt:"Portuguese" }[lang] || "English");
const openai = new OpenAI({ 
  apiKey:       process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

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



// ─── POST /generate/carousel ─────────────────────────────────────────────────
router.post("/carousel", authenticateToken, async (req, res) => {
  const { topic, slideCount = 5, lang = "en", memory } = req.body;
  if (!topic?.trim()) return res.status(400).json({ error: "Topic is required" });
  const lName = langName(lang);
  const count = Math.min(Math.max(parseInt(slideCount) || 5, 3), 10);
  const sysPrompt = `You are an expert LinkedIn carousel creator. Generate exactly ${count} slides for a LinkedIn carousel post. IMPORTANT: Write ALL content in ${lName} language. Return ONLY a valid JSON array, no markdown. Each slide: { "emoji": "single emoji", "title": "max 8 words", "body": "2-4 sentences max 60 words" }. Slide 1: Hook. Slides 2-${count-1}: Value. Slide ${count}: CTA. Niche: ${memory?.niche||"business"} | Audience: ${memory?.audience||"professionals"} | Tone: ${memory?.tone||"expert"}. Topic: "${topic}"`;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: sysPrompt }, { role: "user", content: `Create a ${count}-slide carousel about: ${topic}` }],
      max_tokens: 2000, temperature: 0.8,
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "[]";
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
  if (!source?.trim()) return res.status(400).json({ error: "Source text is required" });
  if (!sysPrompt?.trim()) return res.status(400).json({ error: "System prompt is required" });
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: sysPrompt }, { role: "user", content: `Rewrite this:

${source}` }],
      max_tokens: 1500, temperature: 0.85,
    });
    const text = completion.choices[0]?.message?.content?.trim() || "";
    if (!text) return res.status(500).json({ error: "Empty AI response" });
    res.json({ text });
  } catch (err) {
    console.error("GhostWrite error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});
// ─── Middleware Pro+ uniquement ───────────────────────────────────────────────
const requirePro = async (req, res, next) => {
  try {
    const result = await db.query("SELECT plan FROM users WHERE id=$1", [req.user.id]);
    const plan = result.rows[0]?.plan || "Free";
    if (plan === "Free") return res.status(403).json({ error: "pro_required", message: "Image generation requires a Pro plan or above." });
    next();
  } catch { next(); }
};

// ─── POST /generate/image — DALL-E 3 ─────────────────────────────────────────
router.post("/image", authenticateToken, requirePro, async (req, res) => {
  const { post, format = "square", style = "illustrative" } = req.body;
  if (!post || post.trim().length < 20) return res.status(400).json({ error: "Post content required" });

  // Extraire l'idée principale du post pour le prompt visuel
  const ideaRes = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Extract the single core idea of this LinkedIn post in 1 concise sentence (max 20 words). Return ONLY the sentence, no quotes, no punctuation at the end." },
      { role: "user", content: post.slice(0, 800) },
    ],
    max_tokens: 60,
    temperature: 0.3,
  });
  const coreIdea = ideaRes.choices[0]?.message?.content?.trim() || post.slice(0, 100);

  const styleGuide = {
    illustrative: "modern digital illustration, clean minimalist style, dark navy blue background, red accent colors (#ef4444), professional business aesthetic, no text, no words",
    abstract:     "abstract geometric shapes, professional gradient background, dark theme, red and blue accents, modern corporate art, no text",
    photo:        "cinematic professional photography style, dark moody lighting, business context, high contrast, editorial quality",
  };

  const sizeMap = {
    square:   "1024x1024",
    linkedin: "1792x1024",
  };

  const prompt = `${coreIdea}. Visual style: ${styleGuide[style] || styleGuide.illustrative}. High quality, professional social media content.`;

  console.log("Generating image with OpenAI, model: gpt-image-1-mini, size:", sizeMap[format]);

  try {
    const response = await openai.images.generate({
      model:  "gpt-image-1-mini",
      prompt: prompt.slice(0, 4000),
      n:      1,
      size:   sizeMap[format] || "1024x1024",
    });

    // gpt-image-1-mini retourne en base64
    const imgData = response.data[0];
    const imageUrl = imgData?.url || (imgData?.b64_json ? `data:image/png;base64,${imgData.b64_json}` : null);
    if (!imageUrl) return res.status(500).json({ error: "Image generation failed" });

    // Upload sur Cloudinary
    let cloudUrl = imageUrl;
    try {
      cloudUrl = await uploadToCloudinary(imageUrl, {
        public_id: `dalle_${req.user.id}_${Date.now()}`,
        format:    "jpg",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      });
    } catch (err) {
      console.error("Cloudinary upload error:", err.message);
    }

    // Sauvegarder dans la table posts si post_id fourni
    const { post_id } = req.body;
    if (post_id) {
      await db.query(
        "UPDATE posts SET media_url=$1, media_type='image', media_source='dalle' WHERE id=$2 AND user_id=$3",
        [cloudUrl, post_id, req.user.id]
      ).catch(e => console.error("DB media save error:", e.message));
    }

    res.json({ imageUrl: cloudUrl, originalUrl: imageUrl, prompt, coreIdea, format, style, saved: !!post_id });
  } catch (err) {
    console.error("Image generation error:", err.message);
    res.status(500).json({ error: "Image generation failed", detail: err.message });
  }
});

// ─── POST /generate/visual — Citation brandée (SVG base64) ───────────────────
router.post("/visual", authenticateToken, requirePro, async (req, res) => {
  const { post, format = "square" } = req.body;
  if (!post || post.trim().length < 20) return res.status(400).json({ error: "Post content required" });

  // Extraire la meilleure citation du post
  const quoteRes = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Extract the single most powerful, quotable sentence from this LinkedIn post. Max 15 words. Return ONLY the sentence, no quotes." },
      { role: "user", content: post.slice(0, 800) },
    ],
    max_tokens: 50,
    temperature: 0.2,
  });
  const quote = quoteRes.choices[0]?.message?.content?.trim() || post.slice(0, 100);

  // Dimensions
  const dims = format === "linkedin" ? { w: 1200, h: 627 } : { w: 1080, h: 1080 };
  const { w, h } = dims;

  // Wrapper texte SVG (max ~30 chars par ligne)
  const words = quote.split(" ");
  const lines = [];
  let current = "";
  const maxChars = format === "linkedin" ? 35 : 28;
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current);

  const lineH   = format === "linkedin" ? 64 : 72;
  const fontSize = format === "linkedin" ? 48 : 56;
  const totalH  = lines.length * lineH;
  const startY  = (h / 2) - (totalH / 2) + lineH * 0.8;

  const textLines = lines.map((line, i) =>
    `<text x="${w/2}" y="${startY + i * lineH}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="800" fill="white" text-anchor="middle" letter-spacing="-1">${line}</text>`
  ).join("\n    ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#020617"/>
      <stop offset="50%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1a0a0a"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <!-- Accent line gauche -->
  <rect x="0" y="0" width="6" height="${h}" fill="#ef4444"/>
  <!-- Accent coins -->
  <rect x="${w-80}" y="${h-6}" width="80" height="6" fill="#ef4444" opacity="0.5"/>
  <!-- Guillemets décoratifs -->
  <text x="${w/2}" y="${startY - lineH * 1.4}" font-family="Georgia, serif" font-size="${fontSize * 2.5}" fill="#ef4444" text-anchor="middle" opacity="0.15">"</text>
  <!-- Citation -->
  ${textLines}
  <!-- Ligne séparatrice -->
  <rect x="${w/2 - 40}" y="${startY + totalH + 20}" width="80" height="3" fill="#ef4444" rx="2"/>
  <!-- Branding -->
  <text x="${w/2}" y="${h - 40}" font-family="Arial, sans-serif" font-size="22" fill="#475569" text-anchor="middle" font-weight="700" letter-spacing="3">GROWTHPILOT</text>
</svg>`;

  const base64  = Buffer.from(svg).toString("base64");
  const dataUrl  = `data:image/svg+xml;base64,${base64}`;

  // Upload sur Cloudinary
  let cloudUrl = dataUrl;
  try {
    cloudUrl = await uploadToCloudinary(dataUrl, {
      public_id:  `visual_${req.user.id}_${Date.now()}`,
      format:     "png",
      transformation: [{ quality: "auto" }],
    });
  } catch (err) {
    console.error("Cloudinary visual upload error:", err.message);
  }

  // Sauvegarder dans la table posts si post_id fourni
  const { post_id } = req.body;
  if (post_id) {
    await db.query(
      "UPDATE posts SET media_url=$1, media_type='image', media_source='visual' WHERE id=$2 AND user_id=$3",
      [cloudUrl, post_id, req.user.id]
    ).catch(e => console.error("DB media save error:", e.message));
  }

  res.json({ imageUrl: cloudUrl, quote, format, type: "visual", saved: !!post_id });
});

// ─── POST /generate/media/upload — Upload Cloudinary sans post_id ─────────────
router.post("/media/upload", authenticateToken, async (req, res) => {
  const { url, type = "photo", source } = req.body;
  if (!url) return res.status(400).json({ error: "url required" });

  let cloudUrl = url;
  try {
    cloudUrl = await uploadToCloudinary(url, {
      public_id:      `media_${req.user.id}_${Date.now()}`,
      resource_type:  type === "video" ? "video" : "image",
      format:         type === "video" ? "mp4" : "jpg",
      transformation: type === "video" ? [] : [{ quality: "auto", fetch_format: "auto" }],
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err.message);
  }

  res.json({ mediaUrl: cloudUrl, type, source });
});

// ─── POST /generate/media/attach — Sauvegarder un média externe sur Cloudinary ─
router.post("/media/attach", authenticateToken, async (req, res) => {
  const { url, post_id, source, type = "photo" } = req.body;
  if (!url || !post_id) return res.status(400).json({ error: "url and post_id required" });

  let cloudUrl = url;
  try {
    cloudUrl = await uploadToCloudinary(url, {
      public_id:      `media_${req.user.id}_${Date.now()}`,
      resource_type:  type === "video" ? "video" : "image",
      format:         type === "video" ? "mp4" : "jpg",
      transformation: type === "video" ? [] : [{ quality: "auto", fetch_format: "auto" }],
    });
  } catch (err) {
    console.error("Cloudinary media attach error:", err.message);
  }

  // Sauvegarder en base seulement si post_id valide
  if (post_id && post_id !== 0) {
    await db.query(
      "UPDATE posts SET media_url=$1, media_type=$2, media_source=$3 WHERE id=$4 AND user_id=$5",
      [cloudUrl, type, source || "external", post_id, req.user.id]
    ).catch(e => console.error("DB media attach error:", e.message));
  }

  res.json({ mediaUrl: cloudUrl, post_id, type, source });
});

// ─── GET /generate/media/:post_id — Récupérer le média d'un post ──────────────
router.get("/media/:post_id", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT media_url, media_type, media_source FROM posts WHERE id=$1 AND user_id=$2",
      [req.params.post_id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Post not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch media" });
  }
});

// ─── POST /generate/media — Recherche Pexels + Unsplash ──────────────────────
router.post("/media", authenticateToken, async (req, res) => {
  const { post, type = "both" } = req.body; // type: "photo" | "video" | "both"
  if (!post || post.trim().length < 20) return res.status(400).json({ error: "Post content required" });

  // Extraire 3 mots-clés visuels du post via GPT
  const kwRes = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Extract 3 short visual search keywords from this LinkedIn post. Return ONLY a JSON array of 3 strings in English, max 2 words each. Example: [\"team meeting\", \"growth chart\", \"entrepreneur\"]" },
      { role: "user", content: post.slice(0, 600) },
    ],
    max_tokens: 60,
    temperature: 0.2,
  });

  let keywords = ["business", "success", "professional"];
  try {
    const raw = kwRes.choices[0]?.message?.content?.trim().replace(/```json|```/g, "").trim();
    keywords = JSON.parse(raw);
  } catch {}

  const query = keywords.slice(0, 2).join(" ");

  // Fetch Pexels + Unsplash en parallèle
  const [pexelsPhotos, pexelsVideos, unsplashPhotos] = await Promise.allSettled([
    // Pexels photos
    fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`, {
      headers: { Authorization: process.env.PEXELS_API_KEY },
    }).then(r => r.json()),

    // Pexels vidéos
    type !== "photo" ? fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=8`, {
      headers: { Authorization: process.env.PEXELS_API_KEY },
    }).then(r => r.json()) : Promise.resolve({ videos: [] }),

    // Unsplash photos
    fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`, {
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
    }).then(r => r.json()),
  ]);

  const photos = [];
  const videos = [];

  // Parser Pexels photos
  if (pexelsPhotos.status === "fulfilled" && pexelsPhotos.value?.photos) {
    pexelsPhotos.value.photos.forEach(p => photos.push({
      id:       `pexels-${p.id}`,
      source:   "pexels",
      type:     "photo",
      url:      p.src.large,
      thumb:    p.src.medium,
      alt:      p.alt || query,
      author:   p.photographer,
      link:     p.url,
    }));
  }

  // Parser Unsplash photos
  if (unsplashPhotos.status === "fulfilled" && unsplashPhotos.value?.results) {
    unsplashPhotos.value.results.forEach(p => photos.push({
      id:       `unsplash-${p.id}`,
      source:   "unsplash",
      type:     "photo",
      url:      p.urls.regular,
      thumb:    p.urls.small,
      alt:      p.alt_description || query,
      author:   p.user.name,
      link:     p.links.html,
    }));
  }

  // Parser Pexels vidéos
  if (pexelsVideos.status === "fulfilled" && pexelsVideos.value?.videos) {
    pexelsVideos.value.videos.forEach(v => {
      const file = v.video_files?.find(f => f.quality === "sd") || v.video_files?.[0];
      if (file) videos.push({
        id:       `pexels-video-${v.id}`,
        source:   "pexels",
        type:     "video",
        url:      file.link,
        thumb:    v.image,
        duration: v.duration,
        author:   v.user?.name || "Pexels",
        link:     v.url,
      });
    });
  }

  res.json({ photos, videos, keywords, query });
});

export default router;
