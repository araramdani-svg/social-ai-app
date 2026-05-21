/**
 * GrowthPILOT — Auto-Repost Tab
 * File: src/pages/tabs/AutoRepost.jsx
 *
 * Props reçus depuis Generator.jsx :
 *   trendsLang, isMobile, token, history, setPost, setTab,
 *   linkedinStatus, threadsStatus, postToLinkedin, postToThreads,
 *   showToast
 *
 * Fonctionnement :
 *  1. Charge l'historique des posts sauvegardés
 *  2. Score chaque post (score existant ou score AI si absent)
 *  3. L'utilisateur filtre/trie et sélectionne des posts à republier
 *  4. Choisit plateforme + délai + optionnel : variation légère du texte
 *  5. Lance la republication (immédiate ou programmée)
 */

import { PageHeader } from "./shared.js";
import { useState, useMemo } from "react";
import { t as tr } from "../../translations.js";

const PLATFORMS = [
  { id: "linkedin",  label: "LinkedIn",  emoji: "🔗" },
  { id: "threads",   label: "Threads",   emoji: "🧵" },
  { id: "twitter",   label: "X",         emoji: "𝕏"  },
  { id: "facebook",  label: "Facebook",  emoji: "f"  },
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "tiktok",    label: "TikTok",    emoji: "🎵" },
  { id: "copy",      label: "Copy",      emoji: "📋" },
];

const SORT_OPTIONS = ["score", "date", "length"];

const DELAY_OPTIONS = (lang) => [
  { id: "now",    label: tr(lang, "autorepost.delayNow")    || "Now" },
  { id: "1h",     label: tr(lang, "autorepost.delay1h")     || "In 1h" },
  { id: "3h",     label: tr(lang, "autorepost.delay3h")     || "In 3h" },
  { id: "24h",    label: tr(lang, "autorepost.delay24h")    || "Tomorrow" },
  { id: "48h",    label: tr(lang, "autorepost.delay48h")    || "In 2d" },
  { id: "7d",     label: tr(lang, "autorepost.delay7d")     || "In 7d" },
];

/* Scoring local si pas de score IA */
function scorePost(post) {
  if (post.score) return post.score;
  if (post.analysis?.score) return post.analysis.score;
  const text = post.content || post.text || "";
  let score = 50;
  if (text.length > 300) score += 10;
  if (text.length > 600) score += 5;
  if (/\?/.test(text)) score += 5;      // question → engagement
  if (/\n/.test(text)) score += 5;      // sauts de ligne → lisibilité
  if (/[\d%]/.test(text)) score += 8;   // chiffres → crédibilité
  if (text.split(/\s+/).length > 100) score += 5;
  return Math.min(score, 99);
}

function timeAgo(dateStr, lang="en") {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  const l = { en:{t:"Today",y:"Yesterday",da:"d ago",wa:"w ago"}, fr:{t:"Aujourd'hui",y:"Hier",da:"j",wa:"sem"}, es:{t:"Hoy",y:"Ayer",da:"d",wa:"sem"}, de:{t:"Heute",y:"Gestern",da:"T",wa:"W"}, it:{t:"Oggi",y:"Ieri",da:"g",wa:"sett"}, pt:{t:"Hoje",y:"Ontem",da:"d",wa:"sem"} }[lang] || { t:"Today",y:"Yesterday",da:"d ago",wa:"w ago" };
  if (d === 0) return l.t;
  if (d === 1) return l.y;
  if (d < 7) return `${d}${l.da}`;
  return `${Math.floor(d/7)}${l.wa}`;
}

const s = {
  wrap:     { display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 },
  card:     { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 },
  label:    { fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: "#64748b", marginBottom: 8, display: "block" },
  input:    { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 14px", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  btn:      { background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "1px", padding: "10px 18px", cursor: "pointer" },
  btnGhost: { background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "1px", padding: "9px 14px", cursor: "pointer" },
  btnSmall: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#64748b", fontSize: 10, fontWeight: 600, padding: "5px 10px", cursor: "pointer" },
  postCard: (selected) => ({
    background: selected ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)",
    border: selected ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10, padding: "14px 16px", cursor: "pointer",
    transition: "all 0.2s",
  }),
  scoreBadge: (score) => ({
    background: score >= 75 ? "rgba(52,211,153,0.12)" : score >= 50 ? "rgba(251,191,36,0.12)" : "rgba(239,68,68,0.1)",
    border: `1px solid ${score >= 75 ? "rgba(52,211,153,0.3)" : score >= 50 ? "rgba(251,191,36,0.3)" : "rgba(239,68,68,0.2)"}`,
    color: score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#ef4444",
    borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
  }),
  PLATFORM_COLORS: { linkedin:"#0077b5", threads:"#a855f7", twitter:"#1da1f2", facebook:"#1877f2", instagram:"#e1306c", tiktok:"#ff0050", copy:"#64748b" },
  platformBtn: (active, connected, color) => ({
    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
    background: active ? `${color}15` : "rgba(255,255,255,0.02)",
    border: active ? `1px solid ${color}50` : "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
    color: active ? color : "#64748b", fontSize: 12, fontWeight: 700,
    opacity: connected === false ? 0.5 : 1,
  }),
  delayBtn: (active) => ({
    padding: "7px 12px", fontSize: 11, fontWeight: 600,
    background: active ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)",
    border: active ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.07)",
    borderRadius: 6, cursor: "pointer", color: active ? "#ef4444" : "#64748b",
    transition: "all 0.15s",
  }),
  logRow: { display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, marginBottom: 6 },
  sortBtn: (active) => ({
    padding: "6px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "1px",
    background: active ? "rgba(239,68,68,0.08)" : "transparent",
    border: active ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.07)",
    borderRadius: 6, cursor: "pointer", color: active ? "#ef4444" : "#475569",
  }),
  divider: { height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" },
  progressBar: { height: 3, background: "linear-gradient(90deg,#ef4444,#f97316,#ef4444)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", borderRadius: 2, marginTop: 8 },
};

export default function AutoRepost({
  trendsLang, isMobile, token, history = [], setPost, setTab,
  linkedinStatus, threadsStatus, twitterStatus, facebookStatus, instagramStatus, tiktokStatus,
  postToLinkedin, postToThreads, postToTwitter, postToFacebook, postToInstagram, postToTiktok,
  showToast
}) {

  const [selected, setSelected]       = useState(new Set());
  const [platform, setPlatform]       = useState("linkedin");
  const [delay, setDelay]             = useState("now");
  const [sortBy, setSortBy]           = useState("score");
  const [search, setSearch]           = useState("");
  const [minScore, setMinScore]       = useState(0);
  const [repostLog, setRepostLog]     = useState([]);
  const [posting, setPosting]         = useState(false);
  const [varyText, setVaryText]       = useState(false);
  const [previewPost,    setPreviewPost]    = useState(null);

  /* Scored + filtered + sorted posts */
  const posts = useMemo(() => {
    let arr = (history || []).map(p => ({ ...p, _score: scorePost(p) }));
    if (search) arr = arr.filter(p => (p.content || p.text || "").toLowerCase().includes(search.toLowerCase()) || (p.title || "").toLowerCase().includes(search.toLowerCase()));
    if (minScore > 0) arr = arr.filter(p => p._score >= minScore);
    arr.sort((a, b) => {
      if (sortBy === "score") return b._score - a._score;
      if (sortBy === "date") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === "length") return (b.content || b.text || "").length - (a.content || a.text || "").length;
      return 0;
    });
    return arr;
  }, [history, search, minScore, sortBy]);

  const top3 = useMemo(() => [...posts].sort((a, b) => b._score - a._score).slice(0, 3), [posts]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectTop = (n) => {
    const ids = [...posts].sort((a, b) => b._score - a._score).slice(0, n).map(p => p.id || p._id || p.title);
    setSelected(new Set(ids));
  };

  const repost = async () => {
    if (selected.size === 0) { showToast("⚠️ " + tr(trendsLang, "autorepost.selectFirst")); return; }
    const targetPosts = posts.filter(p => selected.has(p.id || p._id || p.title));
    setPosting(true);

    for (const p of targetPosts) {
      const text = p.content || p.text || "";
      const variedText = varyText ? text : text; // hook IA variation à implémenter si besoin
      const postId = p.id || p._id || p.title;

      if (delay === "now") {
        try {
          if (platform === "linkedin" && linkedinStatus?.connected) {
            setPost(variedText); await new Promise(r => setTimeout(r, 200)); await postToLinkedin?.();
          } else if (platform === "threads" && threadsStatus?.connected) {
            setPost(variedText); await new Promise(r => setTimeout(r, 200)); await postToThreads?.();
          } else if (platform === "twitter" && twitterStatus?.connected) {
            setPost(variedText); await new Promise(r => setTimeout(r, 200)); await postToTwitter?.();
          } else if (platform === "facebook" && facebookStatus?.connected) {
            setPost(variedText); await new Promise(r => setTimeout(r, 200)); await postToFacebook?.();
          } else if (platform === "instagram" && instagramStatus?.connected) {
            setPost(variedText); await new Promise(r => setTimeout(r, 200)); await postToInstagram?.();
          } else if (platform === "tiktok" && tiktokStatus?.connected) {
            setPost(variedText); await new Promise(r => setTimeout(r, 200)); await postToTiktok?.();
          } else if (platform === "copy") {
            await navigator.clipboard.writeText(variedText);
          }
          setRepostLog(prev => [{
            postId, title: p.title || text.slice(0, 40), platform,
            delay, status: "✓ Envoyé", ts: new Date().toLocaleTimeString(),
            score: p._score,
          }, ...prev]);
        } catch {
          setRepostLog(prev => [{
            postId, title: p.title || text.slice(0, 40), platform,
            delay, status: "❌ Échec", ts: new Date().toLocaleTimeString(),
            score: p._score,
          }, ...prev]);
        }
      } else {
        // Programmé → stocké localement (backend scheduling à implémenter)
        setRepostLog(prev => [{
          postId, title: p.title || text.slice(0, 40), platform,
          delay, status: `⏰ Programmé (${delay})`, ts: new Date().toLocaleTimeString(),
          score: p._score,
        }, ...prev]);
      }
      showToast(tr(trendsLang, "autorepost.queued"));
    }

    setSelected(new Set());
    setPosting(false);
  };

  return (
    <div style={s.wrap}>
      <PageHeader tabKey="autorepost" trendsLang={trendsLang} isMobile={isMobile} />

      {/* ── Top performers ── */}
      {top3.length > 0 && (
        <div style={s.card}>
          <span style={s.label}>🏆 {tr(trendsLang, "autorepost.topPerformers")}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {top3.map((p, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(239,68,68,0.04)", borderRadius: 8, padding: "10px 14px", border: "1px solid rgba(239,68,68,0.1)" }}
              >
                <span style={{ color: "#ef4444", fontWeight: 900, fontSize: 16, minWidth: 20 }}>#{i + 1}</span>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.title || (p.content || p.text || "").slice(0, 60)}
                  </div>
                  <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{timeAgo(p.createdAt, trendsLang)}</div>
                </div>
                <span style={s.scoreBadge(p._score)}>{p._score}</span>
                <button style={s.btnSmall} onClick={() => { setPost(p.content || p.text || ""); setTab("create"); showToast(tr(trendsLang, "ghostwrite.sentToCreate")); }}>
                  UTILISER
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : previewPost ? "1fr 360px 320px" : "1fr 320px", gap: 20, transition: "grid-template-columns 0.3s ease" }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 20 }}>

        {/* ── LEFT : Liste posts ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Filters */}
          <div style={s.card}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
              <input
                style={{ ...s.input, flex: 1, minWidth: 160 }}
                placeholder={tr(trendsLang, "autorepost.searchPlaceholder")}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div style={{ display: "flex", gap: 6 }}>
                {SORT_OPTIONS.map(opt => (
                  <button key={opt} style={s.sortBtn(sortBy === opt)} onClick={() => setSortBy(opt)}>
                    {tr(trendsLang, `autorepost.sort${opt.charAt(0).toUpperCase()+opt.slice(1)}`) || opt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#475569", fontSize: 11 }}>Score min :</span>
              {[0, 50, 65, 75].map(v => (
                <button key={v} style={s.delayBtn(minScore === v)} onClick={() => setMinScore(v)}>
                  {v === 0 ? "Tous" : `>${v}`}
                </button>
              ))}
              <span style={{ color: "#475569", fontSize: 11, marginLeft: "auto" }}>
                {posts.length} post{posts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Quick select */}
          {posts.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={s.btnGhost} onClick={() => selectTop(3)}>⚡ Top 3</button>
              <button style={s.btnGhost} onClick={() => selectTop(5)}>⚡ Top 5</button>
              <button style={s.btnGhost} onClick={() => setSelected(new Set())}>{tr(trendsLang,"autorepost.deselect")}</button>
              {selected.size > 0 && (
                <span style={{ color: "#ef4444", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", marginLeft: "auto" }}>
                  {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}

          {/* Posts list */}
              <div style={{ ...s.card, textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
                <div style={{ color: "#64748b", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                  {tr(trendsLang, "autorepost.noHistory") || "No saved posts yet"}
                </div>
                <div style={{ color: "#334155", fontSize: 12, marginBottom: 16 }}>
                  Generate and save posts in Create to repost them here.
                </div>
                <button style={{ ...s.btn, fontSize: 11, padding: "9px 18px", display: "inline-block" }}
                  onClick={() => setTab("create")}>
                  ✍️ Go to Create
                </button>
              </div>
            )}
            {posts.map((p, i) => {
              const id = p.id || p._id || p.title || i;
              const text = p.content || p.text || "";
              const isSelected = selected.has(id);
              return (
                <div key={i} style={s.postCard(isSelected)} onClick={() => setPreviewPost(p)}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isSelected ? "#ef4444" : "rgba(255,255,255,0.15)"}`, background: isSelected ? "#ef4444" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      {isSelected && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.title || text.slice(0, 60)}
                      </div>
                      <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {text}
                      </div>
                      <div style={{ display: "flex", gap: 10, marginTop: 6, alignItems: "center" }}>
                        <span style={{ color: "#334155", fontSize: 10 }}>{timeAgo(p.createdAt, trendsLang)}</span>
                        <span style={{ color: "#334155", fontSize: 10 }}>·</span>
                        <span style={{ color: "#334155", fontSize: 10 }}>{text.trim().split(/\s+/).length} mots</span>
                      </div>
                    </div>
                    <span style={s.scoreBadge(p._score)}>{p._score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MIDDLE : Preview panel ── */}
        {previewPost && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ ...s.card, padding:20, position:"sticky", top:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ color:"#475569", fontSize:9, fontWeight:700, letterSpacing:"2px" }}>APERÇU DU POST</div>
                <button onClick={() => setPreviewPost(null)}
                  style={{ background:"transparent", border:"none", color:"#475569", fontSize:18, cursor:"pointer", padding:"2px 6px", borderRadius:6 }}>✕</button>
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <span style={{ color:"#e2e8f0", fontSize:13, fontWeight:700, flex:1,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {previewPost.title || "Untitled"}
                </span>
                <span style={{ ...s.scoreBadge(previewPost._score), flexShrink:0 }}>{previewPost._score}</span>
              </div>

              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
                borderRadius:10, padding:14, maxHeight:280, overflowY:"auto", marginBottom:14 }}>
                <div style={{ color:"#e2e8f0", fontSize:13, lineHeight:1.8, whiteSpace:"pre-wrap" }}>
                  {previewPost.content || previewPost.text || ""}
                </div>
              </div>

              <div style={{ display:"flex", gap:8, color:"#334155", fontSize:10, marginBottom:16 }}>
                <span>{timeAgo(previewPost.createdAt, trendsLang)}</span>
                <span>·</span>
                <span>{(previewPost.content || previewPost.text || "").trim().split(/\s+/).length} mots</span>
                {previewPost.project_name && <><span>·</span><span style={{ color:"#a78bfa" }}>📁 {previewPost.project_name}</span></>}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <button
                  onClick={() => { const id = previewPost.id || previewPost.title; toggleSelect(id); }}
                  style={{ ...s.btn, width:"100%", padding:"12px",
                    background: selected.has(previewPost.id || previewPost.title) ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                  {selected.has(previewPost.id || previewPost.title) ? "✓ Sélectionné" : "✓ Sélectionner pour repost"}
                </button>
                <button
                  onClick={() => { setPost(previewPost.content || previewPost.text || ""); setTab("create"); }}
                  style={{ ...s.btnGhost, width:"100%", padding:"10px", textAlign:"center" }}>
                  ✍️ Modifier dans Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── RIGHT : Config repost ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Platform */}
          <div style={s.card}>
            <span style={s.label}>{tr(trendsLang, "autorepost.platformLabel")}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PLATFORMS.map(pl => {
                const connected = 
                  pl.id === "linkedin"  ? linkedinStatus?.connected  :
                  pl.id === "threads"   ? threadsStatus?.connected   :
                  pl.id === "twitter"   ? twitterStatus?.connected   :
                  pl.id === "facebook"  ? facebookStatus?.connected  :
                  pl.id === "instagram" ? instagramStatus?.connected :
                  pl.id === "tiktok"    ? tiktokStatus?.connected    : true;
                  <button key={pl.id} style={s.platformBtn(platform === pl.id, connected, s.PLATFORM_COLORS[pl.id] || "#64748b")} onClick={() => setPlatform(pl.id)}>
                    <span>{pl.emoji}</span>
                    <span style={{ flex: 1 }}>{pl.id === "copy" ? (tr(trendsLang,"autorepost.copyLabel") || "Copy") : pl.label}</span>
                    {pl.id !== "copy" && (
                      <span style={{ fontSize: 10, color: connected ? "#22c55e" : "#334155" }}>
                        {connected ? "●" : "○"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delay */}
          <div style={s.card}>
            <span style={s.label}>{tr(trendsLang, "autorepost.delayLabel")}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DELAY_OPTIONS(trendsLang).map(d => (
                <button key={d.id} style={s.delayBtn(delay === d.id)} onClick={() => setDelay(d.id)}>
                  {d.label}
                </button>
              ))}
            </div>
            {delay !== "now" && (
              <div style={{ color: "#475569", fontSize: 11, marginTop: 8 }}>
                ⚠️ La programmation sera sauvegardée localement.
              </div>
            )}
          </div>

          {/* Options */}
          <div style={s.card}>
            <span style={s.label}>OPTIONS</span>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={varyText}
                onChange={e => setVaryText(e.target.checked)}
                style={{ accentColor: "#ef4444", width: 16, height: 16 }}
              />
              <div>
                <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600 }}>
                  {tr(trendsLang, "autorepost.varyText")}
                </div>
                <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>
                  {tr(trendsLang, "autorepost.varyTextDesc")}
                </div>
              </div>
            </label>
          </div>

          {/* Launch */}
          <button
            style={{ ...s.btn, width: "100%", padding: "14px", fontSize: 13, opacity: selected.size === 0 ? 0.4 : 1 }}
            onClick={repost}
            disabled={posting || selected.size === 0}
          >
            {posting ? "⏳ Republication..." : `🔄 ${tr(trendsLang, "autorepost.repostBtn")} (${selected.size})`}
          </button>
          {posting && <div style={s.progressBar} />}

          {/* Log */}
          {repostLog.length > 0 && (
            <div style={s.card}>
              <span style={s.label}>{tr(trendsLang, "autorepost.logLabel")}</span>
              {repostLog.map((r, i) => (
                <div key={i} style={s.logRow}>
                  <span style={{ fontSize: 14 }}>{PLATFORMS.find(p => p.id === r.platform)?.emoji}</span>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ color: "#94a3b8", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.title}
                    </div>
                  </div>
                  <span style={{ color: r.status.startsWith("✓") ? "#34d399" : r.status.startsWith("⏰") ? "#fbbf24" : "#ef4444", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}
