import { useState, useEffect, useCallback } from "react";
import { t as tr } from "../../translations.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { st, PageHeader, metricColor } from "./shared.js";

const API = "https://social-ai-app-production.up.railway.app";

// ─── Styles locaux ────────────────────────────────────────────────────────────
const s = {
  tabBtn: (active) => ({
    flex: 1, padding: "10px 0", background: "transparent", border: "none",
    borderBottom: active ? "2px solid #ef4444" : "2px solid transparent",
    color: active ? "#ef4444" : "#64748b", fontWeight: 700, fontSize: 12,
    letterSpacing: "1.5px", cursor: "pointer", transition: "all 0.2s",
  }),
  statCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px", textAlign: "center" },
  statVal:  { fontSize: 28, fontWeight: 900, color: "#ef4444", lineHeight: 1 },
  statLbl:  { fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "#64748b", marginTop: 6 },
  postRow:  { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 16px", marginBottom: 8 },
  metric:   { textAlign: "center", minWidth: 56 },
  metricVal:{ fontSize: 16, fontWeight: 800, color: "#e2e8f0" },
  metricLbl:{ fontSize: 9, fontWeight: 700, letterSpacing: "1px", color: "#475569", marginTop: 2 },
  badge:    (c) => ({ background: `rgba(${c},0.12)`, border: `1px solid rgba(${c},0.25)`, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, color: `rgb(${c})` }),
  btn:      { background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "1px", padding: "10px 18px", cursor: "pointer" },
  btnGhost: { background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "1px", padding: "9px 14px", cursor: "pointer" },
  empty:    { textAlign: "center", padding: "60px 20px", color: "#475569" },
};

function fmt(n) {
  if (n >= 1000) return `${(n/1000).toFixed(1)}k`;
  return String(n ?? 0);
}

function timeAgo(dateStr, lang = "en") {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  const labels = {
    en: { today:"Today", yesterday:"Yesterday", dAgo:"d ago", wAgo:"w ago", moAgo:"mo ago" },
    fr: { today:"Aujourd'hui", yesterday:"Hier", dAgo:"j", wAgo:"sem", moAgo:"mois" },
    es: { today:"Hoy", yesterday:"Ayer", dAgo:"d", wAgo:"sem", moAgo:"mes" },
    de: { today:"Heute", yesterday:"Gestern", dAgo:"T", wAgo:"W", moAgo:"Mo" },
    it: { today:"Oggi", yesterday:"Ieri", dAgo:"g", wAgo:"sett", moAgo:"mese" },
    pt: { today:"Hoje", yesterday:"Ontem", dAgo:"d", wAgo:"sem", moAgo:"mês" },
  };
  const l = labels[lang] || labels.en;
  if (d === 0) return l.today;
  if (d === 1) return l.yesterday;
  if (d < 7)  return `${d}${l.dAgo}`;
  if (d < 30) return `${Math.floor(d/7)}${l.wAgo}`;
  return `${Math.floor(d/30)}${l.moAgo}`;
}

// ─── Section LinkedIn Analytics ───────────────────────────────────────────────
function LinkedInAnalytics({ token, isMobile, trendsLang }) {
  const [posts,     setPosts]     = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [refreshing,setRefreshing]= useState(false);
  const [error,     setError]     = useState(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [postsRes, summaryRes] = await Promise.all([
        fetch(`${API}/linkedin-analytics/posts`,   { headers }),
        fetch(`${API}/linkedin-analytics/summary`,  { headers }),
      ]);
      const postsData   = await postsRes.json();
      const summaryData = await summaryRes.json();
      setPosts(postsData.posts   || []);
      setSummary(summaryData);
    } catch (err) {
      setError(tr(trendsLang,"analyze.loadError") || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await fetch(`${API}/linkedin-analytics/refresh`, { method: "POST", headers });
      await fetchData();
    } catch {
      setError(tr(trendsLang,"analyze.refreshFailed") || "Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  // Données pour le graphique timeline
  const chartData = posts.slice(0, 10).reverse().map((p, i) => ({
    name: `Post ${i + 1}`,
    Likes:    p.likes    || 0,
    Comments: p.comments || 0,
    Shares:   p.shares   || 0,
  }));

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
      {tr(trendsLang,"analyze.loading") || "Loading..."}
    </div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
      <div style={{ color: "#ef4444", marginBottom: 16 }}>{error}</div>
      <button style={s.btn} onClick={fetchData}>{tr(trendsLang,"analyze.retry")}</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700 }}>
          {posts.length} {tr(trendsLang,"analyze.postsPublished")}
        </div>
        <button style={s.btn} onClick={refresh} disabled={refreshing}>
          {refreshing ? `⏳ ${tr(trendsLang,"analyze.refreshing")}` : `🔄 ${tr(trendsLang,"analyze.refreshStats")}`}
        </button>
      </div>

      {/* Summary cards */}
      {summary?.summary && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10 }}>
          {[
            ["POSTS",    summary.summary.total_posts,    "239,68,68"],
            ["LIKES",    summary.summary.total_likes,    "52,211,153"],
            ["COMMENTS", summary.summary.total_comments, "96,165,250"],
            ["SHARES",   summary.summary.total_shares,   "251,191,36"],
          ].map(([label, val, color]) => (
            <div key={label} style={s.statCard}>
              <div style={{ ...s.statVal, color: `rgb(${color})` }}>{fmt(val)}</div>
              <div style={s.statLbl}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Top post */}
      {summary?.topPost && (
        <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", letterSpacing: "1.5px", marginBottom: 8 }}>
            {`🏆 ${tr(trendsLang,"analyze.topPost")}`}
          </div>
          <div style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.6, marginBottom: 12,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {summary.topPost.content}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={s.badge("52,211,153")}>❤️ {summary.topPost.likes} {tr(trendsLang,"analyze.likes")}</span>
            <span style={s.badge("96,165,250")}>💬 {summary.topPost.comments} {tr(trendsLang,"analyze.comments")}</span>
            <span style={s.badge("251,191,36")}>🔁 {summary.topPost.shares} {tr(trendsLang,"analyze.shares")}</span>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "1.5px", marginBottom: 16 }}>
            {tr(trendsLang,"analyze.engagementByPost")}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 10 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="Likes"    fill="#ef4444" radius={[4,4,0,0]} />
              <Bar dataKey="Comments" fill="#60a5fa" radius={[4,4,0,0]} />
              <Bar dataKey="Shares"   fill="#fbbf24" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
            {[[tr(trendsLang,"analyze.likes"),"#ef4444"],[tr(trendsLang,"analyze.comments"),"#60a5fa"],[tr(trendsLang,"analyze.shares"),"#fbbf24"]].map(([l,c]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#64748b" }}>
                <div style={{ width:8, height:8, borderRadius:2, background:c }} />{l}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts list */}
      {posts.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>{tr(trendsLang,"analyze.noPostsYet")}</div>
          <div style={{ fontSize: 13 }}>{tr(trendsLang,"analyze.noPostsDesc")}</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "1.5px", marginBottom: 10 }}>
            {tr(trendsLang,"analyze.allPosts")}
          </div>
          {posts.map((post) => (
            <div key={post.id} style={s.postRow}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.5, marginBottom: 6,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {post.content}
                  </div>
                  <div style={{ color: "#334155", fontSize: 10 }}>{timeAgo(post.created_at, trendsLang)}</div>
                </div>
                <div style={{ display: "flex", gap: isMobile ? 10 : 20, flexShrink: 0 }}>
                  {[
                    ["❤️", post.likes,    "LIKES"],
                    ["💬", post.comments, "CMTS"],
                    ["🔁", post.shares,   "SHARES"],
                  ].map(([icon, val, lbl]) => (
                    <div key={lbl} style={s.metric}>
                      <div style={s.metricVal}>{fmt(val)}</div>
                      <div style={s.metricLbl}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note */}
      <div style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.1)", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#475569" }}>
        {`ℹ️ ${tr(trendsLang,"analyze.statsNote")}`}
      </div>
    </div>
  );
}

// ─── Composant principal Analyze ──────────────────────────────────────────────
export default function Analyze({ trendsLang, isMobile, analysis, platformData, token }) {
  const [activeTab, setActiveTab] = useState("content");
  const [watchQuery,   setWatchQuery]   = useState("");
  const [watchResults, setWatchResults] = useState(null);
  const [watchLoading, setWatchLoading] = useState(false);
  const [watchTrending, setWatchTrending] = useState(null);

  const API = "https://social-ai-app-production.up.railway.app";
  const headers = { "Content-Type":"application/json", Authorization:`Bearer ${token}` };

  const searchWatch = async () => {
    if (!watchQuery.trim()) return;
    setWatchLoading(true);
    try {
      const r = await fetch(`${API}/watch/search`, { method:"POST", headers, body: JSON.stringify({ query: watchQuery, lang: trendsLang }) });
      const d = await r.json();
      setWatchResults(d);
    } catch {}
    setWatchLoading(false);
  };

  const loadTrending = async () => {
    setWatchLoading(true);
    try {
      const r = await fetch(`${API}/watch/trending?lang=${trendsLang}`, { headers });
      const d = await r.json();
      setWatchTrending(d);
    } catch {}
    setWatchLoading(false);
  };

  useEffect(() => {
    if (activeTab === "watch" && !watchTrending) loadTrending();
  }, [activeTab]);

  const results = watchResults?.results || watchTrending?.trending || [];

  return (
    <>
      <PageHeader tabKey="content analytics" trendsLang={trendsLang} isMobile={isMobile} />

      {/* Tab switcher */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 16 }}>
        <button style={s.tabBtn(activeTab === "content")}   onClick={() => setActiveTab("content")}>
          {tr(trendsLang,"analyze.tabContent")}
        </button>
        <button style={s.tabBtn(activeTab === "linkedin")}  onClick={() => setActiveTab("linkedin")}>
          {tr(trendsLang,"analyze.tabLinkedin")}
        </button>
        <button style={s.tabBtn(activeTab === "watch")}     onClick={() => setActiveTab("watch")}>
          {tr(trendsLang,"analyze.tabWatch") || "🌍 Veille"}
        </button>
      </div>

      {/* ── Onglet Veille mondiale ────────────────────────────────────────── */}
      {activeTab === "watch" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* Barre de recherche */}
          <div style={{ display:"flex", gap:8, alignItems:"stretch" }}>
            <input
              style={{ ...s.input, flex:1, fontSize:14, padding:"12px 16px", minWidth:0, height:48, boxSizing:"border-box" }}
              placeholder={tr(trendsLang,"analyze.watchSearch") || "Rechercher un sujet mondial..."}
              value={watchQuery}
              onChange={e => setWatchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchWatch()}
            />
            <button
              style={{ height:48, padding:"0 24px", background:"linear-gradient(135deg,#dc2626,#991b1b)", border:"none", borderRadius:10, color:"white", fontWeight:700, fontSize:14, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}
              onClick={searchWatch} disabled={watchLoading}
            >
              {watchLoading ? "⏳" : "🔍 Rechercher"}
            </button>
            <button
              style={{ height:48, width:48, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"white", fontSize:18, cursor:"pointer", flexShrink:0 }}
              onClick={() => { setWatchResults(null); loadTrending(); }}
              title="Tendances du moment"
            >
              🔥
            </button>
          </div>

          {/* Topics détectés */}
          {watchTrending?.topics && !watchResults && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {watchTrending.topics.map(t => (
                <button key={t} onClick={() => { setWatchQuery(t); }} style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:20, color:"#ef4444", fontSize:10, fontWeight:700, padding:"3px 10px", cursor:"pointer" }}>
                  🔥 {t}
                </button>
              ))}
            </div>
          )}

          {/* Header résultats */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ color:"#475569", fontSize:9, fontWeight:700, letterSpacing:"2px" }}>
              {watchResults ? `🔍 ${watchResults.total} ${tr(trendsLang,"analyze.watchResults") || "RESULTS"}` : tr(trendsLang,"analyze.watchTrending") || "🔥 TRENDING NOW"}
            </div>
            {watchResults && (
              <button style={{ background:"none", border:"none", color:"#475569", fontSize:10, cursor:"pointer" }} onClick={() => setWatchResults(null)}>
                ← Tendances
              </button>
            )}
          </div>

          {/* Résultats */}
          {watchLoading ? (
            <div style={{ textAlign:"center", padding:"32px", color:"#475569", fontSize:13 }}>⏳ Recherche en cours...</div>
          ) : results.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px", color:"#475569", fontSize:13 }}>Aucun résultat</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {results.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
                  <div style={{ padding:"14px 16px", borderRadius:12, border:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.01)", transition:"background 0.15s", cursor:"pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.01)"}
                  >
                    <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                      {r.image && (
                        <img src={r.image} alt="" style={{ width:56, height:56, objectFit:"cover", borderRadius:8, flexShrink:0 }} onError={e => e.target.style.display="none"} />
                      )}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ color:"#e2e8f0", fontSize:13, fontWeight:700, marginBottom:4, lineHeight:1.4 }}>{r.title}</div>
                        <div style={{ color:"#64748b", fontSize:11, lineHeight:1.5, marginBottom:6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{r.snippet}</div>
                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                          <span style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:10, color:"#ef4444", fontSize:9, fontWeight:700, padding:"2px 8px" }}>{r.source}</span>
                          {r.published && <span style={{ color:"#334155", fontSize:9 }}>{new Date(r.published).toLocaleDateString()}</span>}
                          <span style={{ color:"#38bdf8", fontSize:9, marginLeft:"auto" }}>{ tr(trendsLang,"analyze.watchRead") || "Lire" }</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content Analysis (existant) */}
      {activeTab === "content" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap:10, marginBottom:10 }}>
            {[
              [tr(trendsLang,"ui.scoreLabel"),      analysis?.score ?? "—"],
              [tr(trendsLang,"ui.hookLabel"),       analysis?.hookScore ?? "—"],
              [tr(trendsLang,"ui.viralityLabel"),   analysis?.viralScore ?? "—"],
              [tr(trendsLang,"ui.clarityLabel"),    analysis?.clarityScore ?? "—"],
              [tr(trendsLang,"ui.ctaLabel"),        analysis?.ctaScore ?? "—"],
              [tr(trendsLang,"ui.readabilityLabel"),analysis?.readability ?? "—"],
            ].map(([label, value], i) => (
              <div key={i} style={{ ...st.card, border:`2px solid ${metricColor(value)}`, padding:"10px 16px", minHeight:68 }}>
                <h3 style={{ fontSize:10, letterSpacing:"1.8px", color:"#64748b", marginBottom:10 }}>{label}</h3>
                <h2 style={{ color:metricColor(value), fontSize:20, fontWeight:900 }}>{value}</h2>
              </div>
            ))}
          </div>

          <div style={{ ...st.card, padding:"10px 16px" }}>
            <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:18 }}>{tr(trendsLang, "ui.aiFeedback")}</h3>
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 0.95fr", gap:12, alignItems:"stretch" }}>
              <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:14, padding:18, border:"1px solid rgba(220,38,38,0.08)" }}>
                <h4 style={{ color:"#fff", marginBottom:14 }}>{tr(trendsLang, "ui.strategicInsight")}</h4>
                <p style={{ color:"#94a3b8", lineHeight:1.7, fontSize:14 }}>{analysis?.feedback || tr(trendsLang,"analyze.defaultFeedback") || "Strong structure. Improve emotional hook for higher engagement."}</p>
                {analysis?.suggestion && <p style={{ color:"#f59e0b", fontSize:13, marginTop:10, lineHeight:1.6 }}>💡 {analysis.suggestion}</p>}
                <div style={{ display:"flex", gap:8, marginTop:18, flexWrap:"wrap" }}>
                  {[
                    [analysis?.hookStrength, "HOOK"],
                    [analysis?.ctaStrength,  "CTA"],
                  ].map(([val, label]) => (
                    <span key={label} style={val==="STRONG" ? st.feedbackGood : val==="WEAK" ? st.feedbackBad : st.feedbackWarn}>
                      {label} {val || "—"}
                    </span>
                  ))}
                  <span style={analysis?.estimatedReach==="VIRAL"||analysis?.estimatedReach==="HIGH" ? st.feedbackGood : st.feedbackWarn}>
                    {analysis?.estimatedReach || "—"} REACH
                  </span>
                  {analysis?.bestPlatform && <span style={st.feedbackGood}>📍 {analysis.bestPlatform}</span>}
                </div>
              </div>
              <div style={{ ...st.chartCard, marginTop:0, minHeight:150, padding:14 }}>
                <h3 style={{ color:"#ef4444", fontSize:11, letterSpacing:"1.5px", marginBottom:10 }}>{tr(trendsLang, "ui.platformDistribution")}</h3>
                <ResponsiveContainer width="100%" height={135}>
                  <BarChart data={platformData}>
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* LinkedIn Analytics */}
      {activeTab === "linkedin" && (
        <LinkedInAnalytics token={token} isMobile={isMobile} trendsLang={trendsLang} />
      )}
    </>
  );
}
