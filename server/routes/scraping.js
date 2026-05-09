import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

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

// ─── Niches config ────────────────────────────────────────────────────────────
const NICHE_KEYWORDS = {
  ai:        ["artificial intelligence", "AI", "machine learning", "LLM", "ChatGPT", "Claude"],
  saas:      ["SaaS", "startup", "product launch", "B2B software", "venture capital"],
  marketing: ["content marketing", "growth hacking", "SEO", "personal branding", "viral"],
  finance:   ["fintech", "crypto", "stock market", "investing", "DeFi"],
  leadership:["leadership", "founder", "entrepreneurship", "productivity", "management"],
  tech:      ["technology", "software", "developer", "open source", "programming"],
};


// ─── Languages config ─────────────────────────────────────────────────────────
const LANG_CONFIG = {
  en: { newsApi: "en", youtube: "en", wiki: "en.wikipedia.org", redditSuffix: "", label: "🇬🇧 English" },
  fr: { newsApi: "fr", youtube: "fr", wiki: "fr.wikipedia.org", redditSuffix: "france", label: "🇫🇷 Français" },
  es: { newsApi: "es", youtube: "es", wiki: "es.wikipedia.org", redditSuffix: "es", label: "🇪🇸 Español" },
  de: { newsApi: "de", youtube: "de", wiki: "de.wikipedia.org", redditSuffix: "de", label: "🇩🇪 Deutsch" },
  it: { newsApi: "it", youtube: "it", wiki: "it.wikipedia.org", redditSuffix: "italy", label: "🇮🇹 Italiano" },
  pt: { newsApi: "pt", youtube: "pt", wiki: "pt.wikipedia.org", redditSuffix: "portugal", label: "🇵🇹 Português" },
};

// ─── Source 1 : Hacker News ───────────────────────────────────────────────────
async function fetchHackerNews(niche, lang = "en") {
  try {
    const res = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    const ids = await res.json();
    const top = ids.slice(0, 20);

    const stories = await Promise.all(
      top.map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          .then(r => r.json())
          .catch(() => null)
      )
    );

    const keywords = NICHE_KEYWORDS[niche] || NICHE_KEYWORDS.tech;
    return stories
      .filter(s => s && s.title && s.score > 50)
      .filter(s => keywords.some(k => s.title.toLowerCase().includes(k.toLowerCase())))
      .slice(0, 5)
      .map(s => ({
        source: "Hacker News",
        title: s.title,
        url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
        score: s.score,
        engagement: s.descendants || 0,
        icon: "🟠",
      }));
  } catch {
    return [];
  }
}

// ─── Source 2 : Reddit ────────────────────────────────────────────────────────
const NICHE_SUBREDDITS = {
  en: {
    ai:         ["artificial", "MachineLearning", "ChatGPT", "LocalLLaMA"],
    saas:       ["SaaS", "startups", "Entrepreneur", "indiehackers"],
    marketing:  ["marketing", "content_marketing", "SEO", "socialmedia"],
    finance:    ["investing", "personalfinance", "CryptoCurrency", "stocks"],
    leadership: ["Entrepreneur", "leadership", "productivity", "business"],
    tech:       ["programming", "technology", "webdev", "javascript"],
  },
  fr: {
    ai:         ["france", "Intelligence_artificielle", "ChatGPT"],
    saas:       ["france", "entrepreneuriat", "startups"],
    marketing:  ["france", "webmarketing", "SEO"],
    finance:    ["france", "vosfinances", "BitcoinFR"],
    leadership: ["france", "entrepreneuriat", "developpement_personnel"],
    tech:       ["france", "programmation", "informatique"],
  },
  es: {
    ai:         ["es", "inteligenciaartificial", "ChatGPT"],
    saas:       ["es", "emprendedores", "startups"],
    marketing:  ["es", "marketing", "SEO"],
    finance:    ["es", "finanzas", "inversion"],
    leadership: ["es", "emprendedores", "productividad"],
    tech:       ["es", "programacion", "tecnologia"],
  },
  de: {
    ai:         ["de", "KuenstlicheIntelligenz", "ChatGPT"],
    saas:       ["de", "Existenzgruendung", "startups"],
    marketing:  ["de", "marketing", "SEO"],
    finance:    ["de", "Finanzen", "Aktien"],
    leadership: ["de", "Fuehrung", "produktivitaet"],
    tech:       ["de", "de_EDV", "Programmieren"],
  },
  it: {
    ai:         ["italy", "intelligenzaartificiale", "ChatGPT"],
    saas:       ["italy", "startups", "Imprenditoria"],
    marketing:  ["italy", "marketing", "SEO"],
    finance:    ["italy", "finanza", "investimenti"],
    leadership: ["italy", "Imprenditoria", "produttivita"],
    tech:       ["italy", "informatica", "programmazione"],
  },
  pt: {
    ai:         ["portugal", "brdev", "ChatGPT"],
    saas:       ["portugal", "empreendedorismo", "startups"],
    marketing:  ["portugal", "marketing", "SEO"],
    finance:    ["portugal", "financas", "investimentos"],
    leadership: ["portugal", "empreendedorismo", "produtividade"],
    tech:       ["portugal", "brdev", "programacao"],
  },
};

async function fetchReddit(niche, lang = "en") {
  try {
    const langSubs = NICHE_SUBREDDITS[lang] || NICHE_SUBREDDITS.en;
    const subreddits = langSubs[niche] || langSubs.tech;
    const results = [];

    for (const sub of subreddits.slice(0, 2)) {
      try {
        // Délai court pour éviter le rate limit Reddit
        await new Promise(r => setTimeout(r, 300));

        const res = await fetch(
          `https://www.reddit.com/r/${sub}/top.json?limit=10&t=day&raw_json=1`,
          {
            headers: {
              // User-Agent conforme aux règles Reddit API
              "User-Agent": "GrowthPILOT/1.0 (web app; contact: contact@aigrowthpilot.app)",
              "Accept": "application/json",
            },
            // Timeout 8s
            signal: AbortSignal.timeout(8000),
          }
        );

        // Reddit retourne 429 si rate limité, 403 si bloqué
        if (res.status === 429) {
          console.warn(`Reddit rate limit on r/${sub}`);
          continue;
        }
        if (!res.ok) continue;

        const data = await res.json();
        const posts = (data?.data?.children || [])
          .filter(p => p.data && !p.data.stickied && p.data.score > 10)
          .slice(0, 3)
          .map(p => ({
            source: `Reddit r/${sub}`,
            title: p.data.title,
            url: `https://reddit.com${p.data.permalink}`,
            score: p.data.score,
            engagement: p.data.num_comments || 0,
            icon: "🔴",
          }));
        results.push(...posts);
      } catch (e) {
        console.warn(`Reddit r/${sub} error:`, e.message);
        continue;
      }
    }
    return results.slice(0, 5);
  } catch {
    return [];
  }
}

// ─── Source 3 : NewsAPI ───────────────────────────────────────────────────────
async function fetchNews(niche, lang = "en") {
  try {
    const keywords = NICHE_KEYWORDS[niche] || NICHE_KEYWORDS.tech;
    const query = keywords.slice(0, 3).join(" OR ");
    const newsLang = LANG_CONFIG[lang]?.newsApi || "en";

    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=popularity&pageSize=5&language=${newsLang}`,
      { headers: { "X-Api-Key": process.env.NEWS_API_KEY } }
    );
    const data = await res.json();

    return (data?.articles || [])
      .filter(a => a.title && a.url)
      .slice(0, 5)
      .map(a => ({
        source: a.source?.name || "News",
        title: a.title,
        url: a.url,
        score: 0,
        engagement: 0,
        publishedAt: a.publishedAt,
        icon: "📰",
      }));
  } catch {
    return [];
  }
}

// ─── Source 4 : YouTube Trending ──────────────────────────────────────────────
const NICHE_YOUTUBE_CATEGORIES = {
  ai: "28",         // Science & Technology
  saas: "28",
  marketing: "27",  // Education
  finance: "27",
  leadership: "27",
  tech: "28",
};

async function fetchYouTube(niche, lang = "en") {
  try {
    const keywords = NICHE_KEYWORDS[niche] || NICHE_KEYWORDS.tech;
    const query = keywords[0];
    const ytLang = LANG_CONFIG[lang]?.youtube || "en";

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&maxResults=5&relevanceLanguage=${ytLang}&key=${process.env.YOUTUBE_API_KEY}`
    );
    const data = await res.json();

    return (data?.items || [])
      .filter(v => v.snippet)
      .map(v => ({
        source: "YouTube",
        title: v.snippet.title,
        url: `https://youtube.com/watch?v=${v.id.videoId}`,
        score: 0,
        engagement: 0,
        thumbnail: v.snippet.thumbnails?.default?.url,
        channel: v.snippet.channelTitle,
        icon: "▶️",
      }));
  } catch {
    return [];
  }
}

// ─── Source 5 : Product Hunt ──────────────────────────────────────────────────
async function fetchProductHunt() {
  // Méthode 1 : via rss2json (plus simple)
  const tryRss2json = async () => {
    const res = await fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.producthunt.com%2Ffeed&count=5",
      {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(8000),
      }
    );
    const data = await res.json();
    if (data.status !== "ok" || !data.items?.length) throw new Error("rss2json failed");
    return data.items;
  };

  // Méthode 2 : fetch direct du feed RSS Product Hunt + parsing XML minimal
  const tryDirectFeed = async () => {
    const res = await fetch("https://www.producthunt.com/feed", {
      headers: {
        "User-Agent": "GrowthPILOT/1.0 (contact@aigrowthpilot.app)",
        "Accept": "application/rss+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`PH feed HTTP ${res.status}`);
    const xml = await res.text();

    // Parsing XML minimal sans lib externe
    const items = [];
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const match of itemMatches) {
      const block = match[1];
      const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
                 || block.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const link  = block.match(/<link>(.*?)<\/link>/)?.[1]
                 || block.match(/<guid>(.*?)<\/guid>/)?.[1] || "";
      const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      if (title && link) items.push({ title, link, pubDate });
      if (items.length >= 5) break;
    }
    if (!items.length) throw new Error("No items parsed");
    return items;
  };

  try {
    let items;
    try {
      items = await tryRss2json();
      return items.slice(0, 5).map(item => ({
        source: "Product Hunt",
        title: item.title,
        url: item.link,
        score: 0,
        engagement: 0,
        publishedAt: item.pubDate,
        icon: "🚀",
      }));
    } catch {
      items = await tryDirectFeed();
      return items.map(item => ({
        source: "Product Hunt",
        title: item.title,
        url: item.link,
        score: 0,
        engagement: 0,
        publishedAt: item.pubDate,
        icon: "🚀",
      }));
    }
  } catch (e) {
    console.warn("Product Hunt fetch failed:", e.message);
    return [];
  }
}

// ─── Source 6 : Wikipedia Trending ───────────────────────────────────────────
async function fetchWikipedia(lang = "en") {
  try {
    const yesterday = new Date(Date.now() - 86400000);
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, "0");
    const d = String(yesterday.getDate()).padStart(2, "0");
    const wikiDomain = LANG_CONFIG[lang]?.wiki || "en.wikipedia.org";

    const res = await fetch(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${wikiDomain}/all-access/${y}/${m}/${d}`
    );
    const data = await res.json();

    return (data?.items?.[0]?.articles || [])
      .filter(a => !["Main_Page", "Special:", "Wikipedia:", "Spécial:", "Accueil"].some(skip => a.article.startsWith(skip)))
      .slice(0, 5)
      .map(a => ({
        source: "Wikipedia Trending",
        title: a.article.replace(/_/g, " "),
        url: `https://${wikiDomain}/wiki/${a.article}`,
        score: a.views,
        engagement: a.views,
        icon: "📖",
      }));
  } catch {
    return [];
  }
}

// ─── Source 7 : GitHub Trending ───────────────────────────────────────────────
async function fetchGitHub(niche, lang = "en") {
  try {
    const keywords = NICHE_KEYWORDS[niche] || NICHE_KEYWORDS.tech;
    const query = keywords[0];

    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`,
      { headers: { "Accept": "application/vnd.github.v3+json" } }
    );
    const data = await res.json();

    return (data?.items || []).map(repo => ({
      source: "GitHub Trending",
      title: `${repo.full_name} — ${repo.description || ""}`,
      url: repo.html_url,
      score: repo.stargazers_count,
      engagement: repo.forks_count,
      icon: "⭐",
    }));
  } catch {
    return [];
  }
}

// ─── Source 8 : RSS Feeds ─────────────────────────────────────────────────────
// Tous ces feeds sont vérifiés actifs en 2025
const RSS_FEEDS = {
  ai:         "https://techcrunch.com/category/artificial-intelligence/feed/",
  saas:       "https://techcrunch.com/category/startups/feed/",
  marketing:  "https://blog.hubspot.com/marketing/rss.xml",
  finance:    "https://www.wsj.com/xml/rss/3_7085.xml",
  leadership: "https://hbr.org/resources/rss/index.xml",
  tech:       "https://feeds.arstechnica.com/arstechnica/index",
};

// Feeds de secours si le principal échoue
const RSS_FALLBACKS = {
  ai:         "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml",
  saas:       "https://www.indiehackers.com/feed.rss",
  marketing:  "https://moz.com/blog/feed",
  finance:    "https://feeds.bloomberg.com/markets/news.rss",
  leadership: "https://feeds.feedburner.com/entrepreneur/latest",
  tech:       "https://www.wired.com/feed/rss",
};

async function fetchRSS(niche) {
  const tryFeed = async (feedUrl) => {
    const res = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=5`,
      {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(8000),
      }
    );
    const data = await res.json();
    if (data.status !== "ok" || !data.items?.length) throw new Error("Feed empty");
    return data;
  };

  try {
    const feedUrl = RSS_FEEDS[niche] || RSS_FEEDS.tech;
    let data;

    try {
      data = await tryFeed(feedUrl);
    } catch {
      // Tentative avec le feed de secours
      const fallback = RSS_FALLBACKS[niche] || RSS_FALLBACKS.tech;
      data = await tryFeed(fallback);
    }

    return (data?.items || []).slice(0, 5).map(item => ({
      source: data?.feed?.title || "RSS",
      title: item.title,
      url: item.link,
      score: 0,
      engagement: 0,
      publishedAt: item.pubDate,
      icon: "📡",
    }));
  } catch (e) {
    console.warn("RSS fetch failed:", e.message);
    return [];
  }
}

// ─── GET /scraping/trends ──────────────────────────────────────────────────────
// Agrège toutes les sources en parallèle
router.get("/trends", authenticateToken, async (req, res) => {
  const niche = req.query.niche || "tech";
  const lang = req.query.lang || "en";
  const validNiches = ["ai", "saas", "marketing", "finance", "leadership", "tech"];
  const validLangs = ["en", "fr", "es", "de", "it", "pt"];
  const selectedNiche = validNiches.includes(niche) ? niche : "tech";
  const selectedLang = validLangs.includes(lang) ? lang : "en";

  try {
    // Fetch toutes les sources en parallèle
    const [hn, reddit, news, youtube, ph, wiki, github, rss] = await Promise.allSettled([
      fetchHackerNews(selectedNiche, selectedLang),
      fetchReddit(selectedNiche, selectedLang),
      fetchNews(selectedNiche, selectedLang),
      fetchYouTube(selectedNiche, selectedLang),
      fetchProductHunt(),
      fetchWikipedia(selectedLang),
      fetchGitHub(selectedNiche, selectedLang),
      fetchRSS(selectedNiche),
    ]);

    const extract = (result) => result.status === "fulfilled" ? result.value : [];

    const allTrends = [
      ...extract(hn),
      ...extract(reddit),
      ...extract(news),
      ...extract(youtube),
      ...extract(ph),
      ...extract(wiki),
      ...extract(github),
      ...extract(rss),
    ];

    // Score global basé sur engagement
    const scored = allTrends
      .filter(t => t.title && t.url)
      .map(t => ({
        ...t,
        viralScore: Math.min(100, Math.round(Math.log10(Math.max(t.score + t.engagement, 1) + 1) * 20)),
      }))
      .sort((a, b) => b.viralScore - a.viralScore);

    const sources = {
      hackerNews:  extract(hn).length,
      reddit:      extract(reddit).length,
      news:        extract(news).length,
      youtube:     extract(youtube).length,
      productHunt: extract(ph).length,
      wikipedia:   extract(wiki).length,
      github:      extract(github).length,
      rss:         extract(rss).length,
    };

    // Log des sources vides pour debug Railway
    const empty = Object.entries(sources).filter(([,v]) => v === 0).map(([k]) => k);
    if (empty.length) console.warn(`[Trends] Sources vides: ${empty.join(", ")} (niche=${selectedNiche}, lang=${selectedLang})`);

    res.json({
      niche: selectedNiche,
      lang: selectedLang,
      total: scored.length,
      fetchedAt: new Date().toISOString(),
      sources,
      trends: scored,
    });
  } catch (err) {
    console.error("Scraping error:", err);
    res.status(500).json({ message: "Scraping failed" });
  }
});

// ─── GET /scraping/niches ──────────────────────────────────────────────────────
router.get("/niches", authenticateToken, (req, res) => {
  res.json({
    languages: [
      { key: "en", label: "🇬🇧 English" },
      { key: "fr", label: "🇫🇷 Français" },
      { key: "es", label: "🇪🇸 Español" },
      { key: "de", label: "🇩🇪 Deutsch" },
      { key: "it", label: "🇮🇹 Italiano" },
      { key: "pt", label: "🇵🇹 Português" },
    ],
    niches: [
      { key: "ai",         label: "🤖 Artificial Intelligence" },
      { key: "saas",       label: "💼 SaaS & Startups" },
      { key: "marketing",  label: "📣 Marketing & Growth" },
      { key: "finance",    label: "💰 Finance & Fintech" },
      { key: "leadership", label: "🎯 Leadership & Founders" },
      { key: "tech",       label: "⚡ Technology" },
    ]
  });
});

export default router;
