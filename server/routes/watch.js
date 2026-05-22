// server/routes/watch.js
// GrowthPILOT — Agent de veille mondiale (Tavily + NewsAPI)

import express from "express";
import jwt     from "jsonwebtoken";
import db      from "../db.js";

const router = express.Router();

// ─── Auth middleware ──────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// ─── Helper : recherche Tavily ────────────────────────────────────────────────
const searchTavily = async (query, maxResults = 8) => {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key:      process.env.TAVILY_API_KEY,
        query,
        search_depth: "basic",
        max_results:  maxResults,
        include_answer: true,
        include_images: false,
      }),
    });
    const d = await res.json();
    return d.results?.map(r => ({
      title:       r.title,
      url:         r.url,
      snippet:     r.content?.slice(0, 200),
      source:      "tavily",
      published:   r.published_date || null,
      score:       r.score || 0,
    })) || [];
  } catch (err) {
    console.error("Tavily error:", err.message);
    return [];
  }
};

// ─── Helper : recherche NewsAPI ───────────────────────────────────────────────
const searchNews = async (query, lang = "fr") => {
  try {
    const langMap = { fr:"fr", en:"en", es:"es", de:"de", it:"it", pt:"pt" };
    const newsLang = langMap[lang] || "en";
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=${newsLang}&sortBy=publishedAt&pageSize=8&apiKey=${process.env.NEWS_API_KEY}`;
    const res  = await fetch(url);
    const d    = await res.json();
    return d.articles?.map(a => ({
      title:     a.title,
      url:       a.url,
      snippet:   a.description?.slice(0, 200),
      source:    a.source?.name || "news",
      image:     a.urlToImage,
      published: a.publishedAt,
      score:     0,
    })) || [];
  } catch (err) {
    console.error("NewsAPI error:", err.message);
    return [];
  }
};

// ─── POST /watch/search — Recherche globale ───────────────────────────────────
router.post("/search", authenticateToken, async (req, res) => {
  const { query, lang = "fr", sources = ["tavily", "news"] } = req.body;
  if (!query || query.trim().length < 3) return res.status(400).json({ error: "Query required" });

  const [tavilyResults, newsResults] = await Promise.allSettled([
    sources.includes("tavily") ? searchTavily(query) : Promise.resolve([]),
    sources.includes("news")   ? searchNews(query, lang) : Promise.resolve([]),
  ]);

  const results = [
    ...(tavilyResults.status === "fulfilled" ? tavilyResults.value : []),
    ...(newsResults.status   === "fulfilled" ? newsResults.value   : []),
  ].sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0));

  res.json({ results, query, total: results.length });
});

// ─── POST /watch/context — Veille contextuelle pour un post ──────────────────
router.post("/context", authenticateToken, async (req, res) => {
  const { post, lang = "fr" } = req.body;
  if (!post || post.length < 20) return res.status(400).json({ error: "Post content required" });

  // Extraire les mots-clés du post via Tavily answer
  try {
    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key:        process.env.TAVILY_API_KEY,
        query:          post.slice(0, 300),
        search_depth:   "basic",
        max_results:    6,
        include_answer: true,
        include_images: false,
      }),
    });
    const tavilyData = await tavilyRes.json();

    const newsRes = await searchNews(post.slice(0, 100), lang);

    const results = [
      ...(tavilyData.results?.map(r => ({
        title:     r.title,
        url:       r.url,
        snippet:   r.content?.slice(0, 180),
        source:    "tavily",
        published: r.published_date || null,
      })) || []),
      ...newsRes.slice(0, 4),
    ];

    res.json({
      results,
      answer:  tavilyData.answer || null,
      total:   results.length,
    });
  } catch (err) {
    console.error("Watch context error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

// ─── GET /watch/trending — Tendances du moment ───────────────────────────────
router.get("/trending", authenticateToken, async (req, res) => {
  const { lang = "fr" } = req.query;

  const topics = {
    fr: ["intelligence artificielle 2026", "marketing digital tendances", "LinkedIn growth hacks", "création de contenu IA"],
    en: ["artificial intelligence 2026", "digital marketing trends", "LinkedIn growth hacks", "AI content creation"],
    es: ["inteligencia artificial 2026", "marketing digital tendencias", "LinkedIn crecimiento", "creación de contenido IA"],
    de: ["Künstliche Intelligenz 2026", "digitales Marketing Trends", "LinkedIn Wachstum", "KI Inhaltserstellung"],
    it: ["intelligenza artificiale 2026", "marketing digitale tendenze", "LinkedIn crescita", "creazione contenuti IA"],
    pt: ["inteligência artificial 2026", "marketing digital tendências", "LinkedIn crescimento", "criação de conteúdo IA"],
  };

  const queries = topics[lang] || topics.en;

  // Prendre 2 topics aléatoires pour varier
  const selected = queries.sort(() => Math.random() - 0.5).slice(0, 2);

  const results = await Promise.all(selected.map(q => searchTavily(q, 4)));
  const flat = results.flat().sort(() => Math.random() - 0.5).slice(0, 8);

  // Ajouter les news du moment
  const news = await searchNews(selected[0], lang);

  res.json({
    trending: [...flat, ...news.slice(0, 4)],
    topics:   selected,
    total:    flat.length + Math.min(news.length, 4),
  });
});

export default router;
