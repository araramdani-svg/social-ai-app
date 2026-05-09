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
    const res = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", {
      signal: AbortSignal.timeout(8000),
    });
    const ids = await res.json();
    const top = ids.slice(0, 30); // Élargir à 30 pour avoir plus de chances

    const stories = await Promise.all(
      top.map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          signal: AbortSignal.timeout(5000),
        })
          .then(r => r.json())
          .catch(() => null)
      )
    );

    const keywords = NICHE_KEYWORDS[niche] || NICHE_KEYWORDS.tech;

    // Mots-clés élargis par niche pour mieux matcher les titres HN
    const NICHE_BROAD = {
      ai:         ["ai", "gpt", "llm", "model", "openai", "anthropic", "gemini", "neural", "ml", "deepmind"],
      saas:       ["saas", "startup", "launch", "product", "b2b", "api", "revenue", "mrr", "arr", "indie"],
      marketing:  ["marketing", "growth", "seo", "content", "viral", "brand", "audience", "traffic"],
      finance:    ["crypto", "bitcoin", "finance", "invest", "stock", "market", "bank", "funding", "vc"],
      leadership: ["founder", "ceo", "leadership", "team", "hire", "culture", "remote", "productivity"],
      tech:       ["software", "dev", "code", "open source", "github", "web", "app", "platform", "tool"],
    };
    const broadKeys = NICHE_BROAD[niche] || NICHE_BROAD.tech;

    const filtered = stories
      .filter(s => s && s.title && s.score >= 10) // Seuil abaissé à 10
      .filter(s => {
        const titleLow = s.title.toLowerCase();
        return (
          keywords.some(k => titleLow.includes(k.toLowerCase())) ||
          broadKeys.some(k => titleLow.includes(k))
        );
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => ({
        source: "Hacker News",
        title: s.title,
        url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
        score: s.score,
        engagement: s.descendants || 0,
        icon: "🟠",
      }));

    // Si toujours vide, retourner les top stories sans filtre niche
    if (!filtered.length) {
      return stories
        .filter(s => s && s.title && s.score >= 50)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(s => ({
          source: "Hacker News",
          title: s.title,
          url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
          score: s.score,
          engagement: s.descendants || 0,
          icon: "🟠",
        }));
    }

    return filtered;
  } catch (e) {
    console.warn("HackerNews error:", e.message);
    return [];
  }
}

// ─── Source 2 : Reddit ────────────────────────────────────────────────────────
// Reddit bloque les IPs datacenter → on utilise old.reddit.com + fallback DEV.to
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

// DEV.to API — tags par niche (fallback si Reddit bloqué)
const DEVTO_TAGS = {
  ai:         "ai,machinelearning,llm",
  saas:       "startup,saas,indiehackers",
  marketing:  "marketing,seo,growth",
  finance:    "fintech,blockchain,investing",
  leadership: "productivity,career,entrepreneurship",
  tech:       "webdev,javascript,programming",
};

async function fetchReddit(niche, lang = "en") {
  const langSubs = NICHE_SUBREDDITS[lang] || NICHE_SUBREDDITS.en;
  const subreddits = langSubs[niche] || langSubs.tech;
  const results = [];

  // Tentative Reddit
  for (const sub of subreddits.slice(0, 2)) {
    try {
      await new Promise(r => setTimeout(r, 300));
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/top.json?limit=10&t=day&raw_json=1`,
        {
          headers: {
            "User-Agent": "GrowthPILOT/1.0 (web app; contact@aigrowthpilot.app)",
            "Accept": "application/json",
          },
          signal: AbortSignal.timeout(8000),
        }
      );
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
    } catch { continue; }
  }

  // Si Reddit est bloqué → fallback DEV.to (API publique, pas de clé requise)
  if (!results.length) {
    try {
      const tags = DEVTO_TAGS[niche] || DEVTO_TAGS.tech;
      const firstTag = tags.split(",")[0];
      const res = await fetch(
        `https://dev.to/api/articles?tag=${firstTag}&per_page=5&top=1`,
        {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (res.ok) {
        const articles = await res.json();
        return (articles || []).slice(0, 5).map(a => ({
          source: "DEV.to",
          title: a.title,
          url: a.url,
          score: a.positive_reactions_count || 0,
          engagement: a.comments_count || 0,
          icon: "👩‍💻",
        }));
      }
    } catch (e) {
      console.warn("DEV.to fallback error:", e.message);
    }
  }

  return results.slice(0, 5);
}

// ─── Source 3 : NewsAPI + fallback GNews ─────────────────────────────────────
async function fetchNews(niche, lang = "en") {
  const keywords = NICHE_KEYWORDS[niche] || NICHE_KEYWORDS.tech;
  const query = keywords.slice(0, 2).join(" OR ");
  const newsLang = LANG_CONFIG[lang]?.newsApi || "en";

  // Tentative NewsAPI
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=popularity&pageSize=5&language=${newsLang}`,
      {
        headers: { "X-Api-Key": process.env.NEWS_API_KEY },
        signal: AbortSignal.timeout(8000),
      }
    );
    const data = await res.json();
    if (data.status === "ok" && data.articles?.length) {
      return data.articles
        .filter(a => a.title && a.url && !a.title.includes("[Removed]"))
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
    }
    console.warn("NewsAPI:", data.message || data.code || "empty");
  } catch (e) {
    console.warn("NewsAPI error:", e.message);
  }

  // Fallback : GNews API (gratuit, 100 req/jour, pas de clé nécessaire pour les bases)
  try {
    const gnewsLang = newsLang === "en" ? "en" : newsLang;
    const res = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(keywords[0])}&lang=${gnewsLang}&max=5&apikey=${process.env.GNEWS_API_KEY || ""}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();
    if (data.articles?.length) {
      return data.articles.slice(0, 5).map(a => ({
        source: a.source?.name || "GNews",
        title: a.title,
        url: a.url,
        score: 0,
        engagement: 0,
        publishedAt: a.publishedAt,
        icon: "📰",
      }));
    }
  } catch {}

  // Fallback final : Currents API (gratuit)
  try {
    const res = await fetch(
      `https://api.currentsapi.services/v1/search?keywords=${encodeURIComponent(keywords[0])}&language=${newsLang}&apiKey=${process.env.CURRENTS_API_KEY || ""}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();
    if (data.news?.length) {
      return data.news.slice(0, 5).map(a => ({
        source: "Currents",
        title: a.title,
        url: a.url,
        score: 0,
        engagement: 0,
        icon: "📰",
      }));
    }
  } catch {}

  return [];
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

// ─── Source 5 : Lobste.rs + IndieHackers ─────────────────────────────────────
// Remplacement de Product Hunt (bloqué par Cloudflare sur Railway)
// Lobste.rs = communauté tech/startup, API JSON publique native
// IndieHackers = parfait pour saas/startup, RSS public
async function fetchProductHunt() {
  const results = [];

  // Lobste.rs — API JSON native, jamais bloquée
  try {
    const res = await fetch("https://lobste.rs/hottest.json", {
      headers: {
        "User-Agent": "GrowthPILOT/1.0 (contact@aigrowthpilot.app)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const posts = (data || [])
        .filter(p => p.score > 3)
        .slice(0, 4)
        .map(p => ({
          source: "Lobste.rs",
          title: p.title,
          url: p.url || `https://lobste.rs${p.short_id_url}`,
          score: p.score,
          engagement: p.comment_count || 0,
          icon: "🦞",
        }));
      results.push(...posts);
    }
  } catch (e) {
    console.warn("Lobste.rs error:", e.message);
  }

  // IndieHackers RSS — si Lobste.rs insuffisant
  if (results.length < 3) {
    try {
      const { items } = await fetchRSSFeed("https://www.indiehackers.com/feed.rss");
      const ihPosts = items.slice(0, 3).map(item => ({
        source: "Indie Hackers",
        title: item.title,
        url: item.link,
        score: 0,
        engagement: 0,
        publishedAt: item.pubDate,
        icon: "🚀",
      }));
      results.push(...ihPosts);
    } catch (e) {
      console.warn("IndieHackers error:", e.message);
    }
  }

  return results.slice(0, 5);
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
const RSS_FEEDS = {
  ai:         "https://techcrunch.com/category/artificial-intelligence/feed/",
  saas:       "https://techcrunch.com/category/startups/feed/",
  marketing:  "https://blog.hubspot.com/marketing/rss.xml",
  finance:    "https://www.wsj.com/xml/rss/3_7085.xml",
  leadership: "https://hbr.org/resources/rss/index.xml",
  tech:       "https://feeds.arstechnica.com/arstechnica/index",
};

const RSS_FALLBACKS = {
  ai:         "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml",
  saas:       "https://news.ycombinator.com/rss",
  marketing:  "https://moz.com/blog/feed",
  finance:    "https://news.ycombinator.com/rss",
  leadership: "https://news.ycombinator.com/rss",
  tech:       "https://www.wired.com/feed/rss",
};

// Parse RSS/Atom XML sans dépendance externe
function parseRSSXML(xml, feedTitle) {
  const items = [];
  const itemRx = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
  let match;
  while ((match = itemRx.exec(xml)) !== null && items.length < 5) {
    const block = match[1];
    const title = (
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1] ||
      block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""
    ).trim().replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

    const link = (
      block.match(/<link rel="alternate"[^>]*href="([^"]+)"/i)?.[1] ||
      block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ||
      block.match(/<link[^>]*href="([^"]+)"/i)?.[1] || ""
    ).trim();

    const pubDate = (
      block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ||
      block.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1] || ""
    ).trim();

    if (title && link) items.push({ title, link, pubDate });
  }
  return items;
}

async function fetchRSSFeed(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "GrowthPILOT/1.0 (contact@aigrowthpilot.app)",
      "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const feedTitle = xml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1]
                 || xml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "RSS";
  const items = parseRSSXML(xml, feedTitle);
  if (!items.length) throw new Error("No items parsed");
  return { feedTitle: feedTitle.trim(), items };
}

async function fetchRSS(niche) {
  const primary = RSS_FEEDS[niche] || RSS_FEEDS.tech;
  const fallback = RSS_FALLBACKS[niche] || RSS_FALLBACKS.tech;

  for (const url of [primary, fallback]) {
    try {
      const { feedTitle, items } = await fetchRSSFeed(url);
      return items.map(item => ({
        source: feedTitle,
        title: item.title,
        url: item.link,
        score: 0,
        engagement: 0,
        publishedAt: item.pubDate,
        icon: "📡",
      }));
    } catch (e) {
      console.warn(`RSS ${url} failed:`, e.message);
    }
  }
  return [];
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
