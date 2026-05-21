import { PageHeader } from "./shared.js";
import { useState, useMemo } from "react";
import { t as tr } from "../../translations.js";

const PLATFORMS = [
  { id:"linkedin",  label:"LinkedIn",  emoji:"🔗", color:"#0077b5" },
  { id:"threads",   label:"Threads",   emoji:"🧵", color:"#a855f7" },
  { id:"twitter",   label:"X",         emoji:"𝕏",  color:"#1da1f2" },
  { id:"facebook",  label:"Facebook",  emoji:"f",  color:"#1877f2" },
  { id:"instagram", label:"Instagram", emoji:"📸", color:"#e1306c" },
  { id:"tiktok",    label:"TikTok",    emoji:"🎵", color:"#ff0050" },
  { id:"copy",      label:"Copy",      emoji:"📋", color:"#64748b" },
];

const SORT_OPTIONS = ["score","date","length"];

const DELAY_OPTIONS = (lang) => [
  { id:"now", label: tr(lang,"autorepost.delayNow") || "Now" },
  { id:"1h",  label: tr(lang,"autorepost.delay1h")  || "In 1h" },
  { id:"3h",  label: tr(lang,"autorepost.delay3h")  || "In 3h" },
  { id:"24h", label: tr(lang,"autorepost.delay24h") || "Tomorrow" },
  { id:"48h", label: tr(lang,"autorepost.delay48h") || "In 2d" },
  { id:"7d",  label: tr(lang,"autorepost.delay7d")  || "In 7d" },
];

function scorePost(post) {
  if (post.score) return post.score;
  if (post.analysis?.score) return post.analysis.score;
  const text = post.content || post.text || "";
  let score = 50;
  if (text.length > 300) score += 10;
  if (text.length > 600) score += 5;
  if (/\?/.test(text)) score += 5;
  if (/\n/.test(text)) score += 5;
  if (/[\d%]/.test(text)) score += 8;
  if (text.split(/\s+/).length > 100) score += 5;
  return Math.min(score, 99);
}

function timeAgo(dateStr, lang="en") {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  const l = {
    en:{ t:"Today",       y:"Yesterday", da:"d ago", wa:"w ago" },
    fr:{ t:"Aujourd'hui", y:"Hier",      da:"j",     wa:"sem" },
    es:{ t:"Hoy",         y:"Ayer",      da:"d",     wa:"sem" },
    de:{ t:"Heute",       y:"Gestern",   da:"T",     wa:"W" },
    it:{ t:"Oggi",        y:"Ieri",      da:"g",     wa:"sett" },
    pt:{ t:"Hoje",        y:"Ontem",     da:"d",     wa:"sem" },
  }[lang] || { t:"Today", y:"Yesterday", da:"d ago", wa:"w ago" };
  if (d === 0) return l.t;
  if (d === 1) return l.y;
  if (d < 7)  return `${d}${l.da}`;
  return `${Math.floor(d/7)}${l.wa}`;
}

const SCORE_COLOR = (s) => s >= 75 ? "#34d399" : s >= 50 ? "#fbbf24" : "#ef4444";
const SCORE_BG    = (s) => s >= 75 ? "rgba(52,211,153,0.12)" : s >= 50 ? "rgba(251,191,36,0.12)" : "rgba(239,68,68,0.1)";
const SCORE_BORDER= (s) => s >= 75 ? "rgba(52,211,153,0.3)"  : s >= 50 ? "rgba(251,191,36,0.3)"  : "rgba(239,68,68,0.2)";

export default function AutoRepost({
  trendsLang, isMobile, token, history = [], setPost, setTab,
  linkedinStatus, threadsStatus, twitterStatus, facebookStatus, instagramStatus, tiktokStatus,
  postToLinkedin, postToThreads, postToTwitter, postToFacebook, postToInstagram, postToTiktok,
  showToast
}) {
  const [selected,    setSelected]    = useState(new Set());
  const [platform,    setPlatform]    = useState("linkedin");
  const [delay,       setDelay]       = useState("now");
  const [sortBy,      setSortBy]      = useState("score");
  const [search,      setSearch]      = useState("");
  const [minScore,    setMinScore]    = useState(0);
  const [repostLog,   setRepostLog]   = useState([]);
  const [posting,     setPosting]     = useState(false);
  const [varyText,    setVaryText]    = useState(false);
  const [previewPost, setPreviewPost] = useState(null);

  const posts = useMemo(() => {
    let arr = (history || []).map(p => ({ ...p, _score: scorePost(p) }));
    if (search) arr = arr.filter(p =>
      (p.content || p.text || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.title || "").toLowerCase().includes(search.toLowerCase())
    );
    if (minScore > 0) arr = arr.filter(p => p._score >= minScore);
    arr.sort((a, b) => {
      if (sortBy === "score")  return b._score - a._score;
      if (sortBy === "date")   return new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0);
      if (sortBy === "length") return (b.content || b.text || "").length - (a.content || a.text || "").length;
      return 0;
    });
    return arr;
  }, [history, search, minScore, sortBy]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectTop = (n) => {
    const top = [...posts].sort((a, b) => b._score - a._score).slice(0, n);
    setSelected(new Set(top.map((p, i) => p.id || p._id || p.title || i)));
  };

  const getConnected = (id) => {
    if (id === "linkedin")  return linkedinStatus?.connected;
    if (id === "threads")   return threadsStatus?.connected;
    if (id === "twitter")   return twitterStatus?.connected;
    if (id === "facebook")  return facebookStatus?.connected;
    if (id === "instagram") return instagramStatus?.connected;
    if (id === "tiktok")    return tiktokStatus?.connected;
    return true;
  };

  const repost = async () => {
    if (selected.size === 0) return;
    setPosting(true);
    const selectedPosts = posts.filter((p, i) => selected.has(p.id || p._id || p.title || i));
    const log = [];
    for (const p of selectedPosts) {
      const text = p.content || p.text || "";
      const title = p.title || text.slice(0, 40);
      if (delay !== "now") {
        log.push({ platform, title, status: `⏰ Scheduled (${delay})` });
        continue;
      }
      try {
        let fn = null;
        if (platform === "linkedin")  fn = postToLinkedin;
        if (platform === "threads")   fn = postToThreads;
        if (platform === "twitter")   fn = postToTwitter;
        if (platform === "facebook")  fn = postToFacebook;
        if (platform === "instagram") fn = postToInstagram;
        if (platform === "copy")      { navigator.clipboard.writeText(text); log.push({ platform, title, status: "✓ Copied" }); continue; }
        if (fn) { await fn(text); log.push({ platform, title, status: "✓ Published" }); }
        else log.push({ platform, title, status: "⚠️ Not connected" });
      } catch {
        log.push({ platform, title, status: "✗ Failed" });
      }
    }
    setRepostLog(log);
    setPosting(false);
    setSelected(new Set());
  };

  const btnStyle    = { background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", borderRadius:8, color:"#fff", fontSize:11, fontWeight:700, letterSpacing:"1px", padding:"10px 18px", cursor:"pointer" };
  const btnGhost    = { background:"transparent", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"#94a3b8", fontSize:11, fontWeight:700, letterSpacing:"1px", padding:"9px 14px", cursor:"pointer" };
  const cardStyle   = { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 };
  const labelStyle  = { fontSize:11, fontWeight:700, letterSpacing:"1.5px", color:"#64748b", marginBottom:8, display:"block" };
  const inputStyle  = { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 14px", color:"#e2e8f0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
  const scoreBadge  = (score) => ({ background:SCORE_BG(score), border:`1px solid ${SCORE_BORDER(score)}`, color:SCORE_COLOR(score), borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700 });
  const postCard    = (active) => ({ background:active?"rgba(239,68,68,0.06)":"rgba(255,255,255,0.02)", border:active?"1px solid rgba(239,68,68,0.25)":"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"12px 14px", cursor:"pointer", transition:"all 0.2s" });
  const delayBtn    = (active) => ({ padding:"7px 12px", fontSize:11, fontWeight:600, background:active?"rgba(239,68,68,0.08)":"rgba(255,255,255,0.03)", border:active?"1px solid rgba(239,68,68,0.25)":"1px solid rgba(255,255,255,0.07)", borderRadius:6, cursor:"pointer", color:active?"#ef4444":"#64748b", transition:"all 0.15s" });
  const sortBtn     = (active) => ({ padding:"6px 12px", fontSize:10, fontWeight:700, letterSpacing:"1px", background:active?"rgba(239,68,68,0.08)":"transparent", border:active?"1px solid rgba(239,68,38,0.2)":"1px solid rgba(255,255,255,0.07)", borderRadius:6, cursor:"pointer", color:active?"#ef4444":"#475569" });
  const platformBtn = (active, color) => ({ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:active?`${color}15`:"rgba(255,255,255,0.02)", border:active?`1px solid ${color}50`:"1px solid rgba(255,255,255,0.06)", borderRadius:10, cursor:"pointer", transition:"all 0.2s", color:active?color:"#64748b", fontSize:12, fontWeight:700 });

  const cols = isMobile ? "1fr" : previewPost ? "1fr 340px 300px" : "1fr 300px";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, paddingBottom:40 }}>
      <PageHeader tabKey="autorepost" trendsLang={trendsLang} isMobile={isMobile} />

      <div style={{ display:"grid", gridTemplateColumns:cols, gap:16, transition:"grid-template-columns 0.3s ease" }}>

        {/* ── COLONNE GAUCHE — Liste des posts ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* Barre de recherche + tri */}
          <div style={{ ...cardStyle, padding:14, display:"flex", flexDirection:"column", gap:10 }}>
            <input style={inputStyle} placeholder={`🔍 ${tr(trendsLang,"autorepost.search") || "Search posts..."}`} value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ display:"flex", gap:8, justifyContent:"space-between", alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ display:"flex", gap:6 }}>
                {SORT_OPTIONS.map(opt => (
                  <button key={opt} style={sortBtn(sortBy===opt)} onClick={() => setSortBy(opt)}>
                    {opt.toUpperCase()}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <span style={{ color:"#475569", fontSize:11 }}>Min:</span>
                {[0,50,65,75].map(v => (
                  <button key={v} style={delayBtn(minScore===v)} onClick={() => setMinScore(v)}>
                    {v === 0 ? tr(trendsLang,"autorepost.all") || "All" : `>${v}`}
                  </button>
                ))}
                <span style={{ color:"#334155", fontSize:10, marginLeft:8 }}>{posts.length} posts</span>
              </div>
            </div>
          </div>

          {/* Quick select */}
          {posts.length > 0 && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
              <button style={btnGhost} onClick={() => selectTop(3)}>⚡ Top 3</button>
              <button style={btnGhost} onClick={() => selectTop(5)}>⚡ Top 5</button>
              <button style={btnGhost} onClick={() => setSelected(new Set())}>{tr(trendsLang,"autorepost.deselect") || "Deselect all"}</button>
              {selected.size > 0 && (
                <span style={{ color:"#ef4444", fontSize:11, fontWeight:700, marginLeft:"auto" }}>
                  {selected.size} selected
                </span>
              )}
            </div>
          )}

          {/* Posts list */}
          <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:560, overflowY:"auto" }}>
            {posts.length === 0 ? (
              <div style={{ ...cardStyle, textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontSize:44, marginBottom:12 }}>📭</div>
                <div style={{ color:"#64748b", fontSize:14, fontWeight:700, marginBottom:6 }}>
                  {tr(trendsLang,"autorepost.noHistory") || "No saved posts yet"}
                </div>
                <div style={{ color:"#334155", fontSize:12, marginBottom:16 }}>
                  Generate and save posts in Create to repost them here.
                </div>
                <button style={{ ...btnStyle, fontSize:11, padding:"9px 18px" }} onClick={() => setTab("create")}>
                  ✍️ Go to Create
                </button>
              </div>
            ) : posts.map((p, i) => {
              const id = p.id || p._id || p.title || i;
              const text = p.content || p.text || "";
              const isSelected = selected.has(id);
              const isPreview  = previewPost && (previewPost.id || previewPost.title) === (p.id || p.title);
              return (
                <div key={i}
                  style={{ ...postCard(isSelected), outline: isPreview ? "2px solid rgba(220,38,38,0.4)" : "none" }}
                  onClick={() => setPreviewPost(p)}
                >
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <div
                      style={{ width:18, height:18, borderRadius:4, border:`2px solid ${isSelected?"#ef4444":"rgba(255,255,255,0.15)"}`, background:isSelected?"#ef4444":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}
                      onClick={e => { e.stopPropagation(); toggleSelect(id); }}
                    >
                      {isSelected && <span style={{ color:"#fff", fontSize:11 }}>✓</span>}
                    </div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ color:"#e2e8f0", fontSize:13, fontWeight:600, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {p.title || text.slice(0,60)}
                      </div>
                      <div style={{ color:"#475569", fontSize:12, lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                        {text}
                      </div>
                      <div style={{ display:"flex", gap:8, marginTop:6 }}>
                        <span style={{ color:"#334155", fontSize:10 }}>{timeAgo(p.created_at || p.createdAt, trendsLang)}</span>
                        <span style={{ color:"#334155", fontSize:10 }}>·</span>
                        <span style={{ color:"#334155", fontSize:10 }}>{text.trim().split(/\s+/).length} words</span>
                        {p.project_name && <span style={{ color:"#7c3aed", fontSize:10 }}>· 📁 {p.project_name}</span>}
                      </div>
                    </div>
                    <span style={scoreBadge(p._score)}>{p._score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── COLONNE CENTRE — Preview panel ── */}
        {previewPost && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ ...cardStyle, padding:18, position:"sticky", top:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ color:"#475569", fontSize:9, fontWeight:700, letterSpacing:"2px" }}>APERÇU</div>
                <button onClick={() => setPreviewPost(null)}
                  style={{ background:"transparent", border:"none", color:"#475569", fontSize:18, cursor:"pointer" }}>✕</button>
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <span style={{ color:"#e2e8f0", fontSize:13, fontWeight:700, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {previewPost.title || "Untitled"}
                </span>
                <span style={scoreBadge(previewPost._score)}>{previewPost._score}</span>
              </div>

              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:14, maxHeight:260, overflowY:"auto", marginBottom:14 }}>
                <div style={{ color:"#e2e8f0", fontSize:13, lineHeight:1.8, whiteSpace:"pre-wrap" }}>
                  {previewPost.content || previewPost.text || ""}
                </div>
              </div>

              <div style={{ display:"flex", gap:10, color:"#334155", fontSize:10, marginBottom:16, flexWrap:"wrap" }}>
                <span>{timeAgo(previewPost.created_at || previewPost.createdAt, trendsLang)}</span>
                <span>·</span>
                <span>{(previewPost.content || previewPost.text || "").trim().split(/\s+/).length} words</span>
                {previewPost.project_name && <><span>·</span><span style={{ color:"#a78bfa" }}>📁 {previewPost.project_name}</span></>}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <button
                  onClick={() => { const id = previewPost.id || previewPost.title; toggleSelect(id); }}
                  style={{ ...btnStyle, width:"100%", padding:"12px", background: selected.has(previewPost.id || previewPost.title) ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#ef4444,#dc2626)" }}
                >
                  {selected.has(previewPost.id || previewPost.title) ? "✓ Sélectionné" : "✓ Sélectionner pour repost"}
                </button>
                <button
                  onClick={() => { setPost(previewPost.content || previewPost.text || ""); setTab("create"); }}
                  style={{ ...btnGhost, width:"100%", padding:"10px", textAlign:"center" }}
                >
                  ✍️ Modifier dans Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── COLONNE DROITE — Config repost ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Plateformes */}
          <div style={cardStyle}>
            <span style={labelStyle}>{tr(trendsLang,"autorepost.platformLabel") || "TARGET PLATFORM"}</span>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {PLATFORMS.map(pl => {
                const connected = getConnected(pl.id);
                return (
                  <button key={pl.id} style={{ ...platformBtn(platform===pl.id, pl.color), opacity: pl.id !== "copy" && connected === false ? 0.5 : 1 }} onClick={() => setPlatform(pl.id)}>
                    <span style={{ fontSize:14 }}>{pl.emoji}</span>
                    <span style={{ flex:1 }}>{pl.label}</span>
                    {pl.id !== "copy" && (
                      <span style={{ fontSize:10, color: connected ? "#22c55e" : "#334155" }}>
                        {connected ? "●" : "○"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Délai */}
          <div style={cardStyle}>
            <span style={labelStyle}>{tr(trendsLang,"autorepost.delayLabel") || "PUBLISH DELAY"}</span>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {DELAY_OPTIONS(trendsLang).map(d => (
                <button key={d.id} style={delayBtn(delay===d.id)} onClick={() => setDelay(d.id)}>{d.label}</button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div style={cardStyle}>
            <span style={labelStyle}>OPTIONS</span>
            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
              <input type="checkbox" checked={varyText} onChange={e => setVaryText(e.target.checked)} style={{ accentColor:"#ef4444", width:16, height:16 }} />
              <div>
                <div style={{ color:"#e2e8f0", fontSize:12, fontWeight:600 }}>{tr(trendsLang,"autorepost.varyText") || "Vary text slightly"}</div>
                <div style={{ color:"#475569", fontSize:11, marginTop:2 }}>{tr(trendsLang,"autorepost.varyTextDesc") || "Modifies the intro slightly"}</div>
              </div>
            </label>
          </div>

          {/* Bouton repost */}
          <button
            style={{ ...btnStyle, width:"100%", padding:"14px", fontSize:13, opacity: selected.size===0 ? 0.4 : 1 }}
            onClick={repost} disabled={posting || selected.size===0}
          >
            {posting ? "⏳ Republication..." : `🔄 ${tr(trendsLang,"autorepost.repostBtn") || "Repost"} (${selected.size})`}
          </button>

          {/* Log */}
          {repostLog.length > 0 && (
            <div style={cardStyle}>
              <span style={labelStyle}>{tr(trendsLang,"autorepost.logLabel") || "REPOST LOG"}</span>
              {repostLog.map((r, i) => (
                <div key={i} style={{ display:"flex", gap:10, alignItems:"center", padding:"8px 12px", background:"rgba(255,255,255,0.02)", borderRadius:8, marginBottom:6 }}>
                  <span style={{ fontSize:14 }}>{PLATFORMS.find(p => p.id===r.platform)?.emoji}</span>
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <div style={{ color:"#94a3b8", fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</div>
                  </div>
                  <span style={{ color: r.status.startsWith("✓") ? "#34d399" : r.status.startsWith("⏰") ? "#fbbf24" : "#ef4444", fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{r.status}</span>
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
