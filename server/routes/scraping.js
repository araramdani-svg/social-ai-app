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

// ─── Source 1 : Hacker News ───────────────────────────────────────────────────
async function fetchHackerNews(niche) {
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
  ai:         ["artificial", "MachineLearning", "ChatGPT", "LocalLLaMA"],
  saas:       ["SaaS", "startups", "Entrepreneur", "indiehackers"],
  marketing:  ["marketing", "content_marketing", "SEO", "socialmedia"],
  finance:    ["investing", "personalfinance", "CryptoCurrency", "stocks"],
  leadership: ["Entrepreneur", "leadership", "productivity", "business"],
  tech:       ["programming", "technology", "webdev", "javascript"],
};

async function fetchReddit(niche) {
  try {
    const subreddits = NICHE_SUBREDDITS[niche] || NICHE_SUBREDDITS.tech;
    const sub = subreddits[0];

    const res = await fetch(
      `https://www.reddit.com/r/${sub}/hot.json?limit=10`,
      { headers: { "User-Agent": "GrowthPILOT/1.0" } }
    );
    const data = await res.json();

    return (data?.data?.children || [])
      .filter(p => p.data.score > 100 && !p.data.stickied)
      .slice(0, 5)
      .map(p => ({
        source: `Reddit r/${sub}`,
        title: p.data.title,
        url: `https://reddit.com${p.data.permalink}`,
        score: p.data.score,
        engagement: p.data.num_comments,
        icon: "🔴",
      }));
  } catch {
    return [];
  }
}

// ─── Source 3 : NewsAPI ───────────────────────────────────────────────────────
async function fetchNews(niche) {
  try {
    const keywords = NICHE_KEYWORDS[niche] || NICHE_KEYWORDS.tech;
    const query = keywords.slice(0, 3).join(" OR ");

    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=popularity&pageSize=5&language=en`,
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

async function fetchYouTube(niche) {
  try {
    const keywords = NICHE_KEYWORDS[niche] || NICHE_KEYWORDS.tech;
    const query = keywords[0];

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&maxResults=5&relevanceLanguage=en&key=${process.env.YOUTUBE_API_KEY}`
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
  try {
    const res = await fetch(
      "https://www.producthunt.com/frontend/graphql",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `{ posts(order: VOTES, first: 5) { edges { node { name tagline votesCount url } } } }`
        })
      }
    );
    const data = await res.json();

    return (data?.data?.posts?.edges || []).map(({ node }) => ({
      source: "Product Hunt",
      title: `${node.name} — ${node.tagline}`,
      url: node.url,
      score: node.votesCount,
      engagement: node.votesCount,
      icon: "🚀",
    }));
  } catch {
    return [];
  }
}

// ─── Source 6 : Wikipedia Trending ───────────────────────────────────────────
async function fetchWikipedia() {
  try {
    const yesterday = new Date(Date.now() - 86400000);
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, "0");
    const d = String(yesterday.getDate()).padStart(2, "0");

    const res = await fetch(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${y}/${m}/${d}`
    );
    const data = await res.json();

    return (data?.items?.[0]?.articles || [])
      .filter(a => !["Main_Page", "Special:", "Wikipedia:"].some(skip => a.article.startsWith(skip)))
      .slice(0, 5)
      .map(a => ({
        source: "Wikipedia Trending",
        title: a.article.replace(/_/g, " "),
        url: `https://en.wikipedia.org/wiki/${a.article}`,
        score: a.views,
        engagement: a.views,
        icon: "📖",
      }));
  } catch {
    return [];
  }
}

// ─── Source 7 : GitHub Trending ───────────────────────────────────────────────
async function fetchGitHub(niche) {
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
  ai:         "https://feeds.feedburner.com/oreilly/radar",
  saas:       "https://www.indiehackers.com/feed.rss",
  marketing:  "https://feeds.feedburner.com/copyblogger",
  finance:    "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
  leadership: "https://hbr.org/feed",
  tech:       "https://feeds.feedburner.com/TechCrunch",
};

async function fetchRSS(niche) {
  try {
    const feedUrl = RSS_FEEDS[niche] || RSS_FEEDS.tech;
    const res = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=5`
    );
    const data = await res.json();

    return (data?.items || []).slice(0, 5).map(item => ({
      source: data?.feed?.title || "RSS",
      title: item.title,
      url: item.link,
      score: 0,
      engagement: 0,
      publishedAt: item.pubDate,
      icon: "📡",
    }));
  } catch {
    return [];
  }
}

// ─── GET /scraping/trends ──────────────────────────────────────────────────────
// Agrège toutes les sources en parallèle
router.get("/trends", authenticateToken, async (req, res) => {
  const niche = req.query.niche || "tech";
  const validNiches = ["ai", "saas", "marketing", "finance", "leadership", "tech"];
  const selectedNiche = validNiches.includes(niche) ? niche : "tech";

  try {
    // Fetch toutes les sources en parallèle
    const [hn, reddit, news, youtube, ph, wiki, github, rss] = await Promise.allSettled([
      fetchHackerNews(selectedNiche),
      fetchReddit(selectedNiche),
      fetchNews(selectedNiche),
      fetchYouTube(selectedNiche),
      fetchProductHunt(),
      fetchWikipedia(),
      fetchGitHub(selectedNiche),
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

    res.json({
      niche: selectedNiche,
      total: scored.length,
      fetchedAt: new Date().toISOString(),
      sources: {
        hackerNews: extract(hn).length,
        reddit: extract(reddit).length,
        news: extract(news).length,
        youtube: extract(youtube).length,
        productHunt: extract(ph).length,
        wikipedia: extract(wiki).length,
        github: extract(github).length,
        rss: extract(rss).length,
      },
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
