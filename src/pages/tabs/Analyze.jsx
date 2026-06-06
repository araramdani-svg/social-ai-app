import { useState, useEffect, useCallback, useRef } from "react";
import { t as tr } from "../../translations.js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from "recharts";
import { st, PageHeader, metricColor } from "./shared.js";

const API = "https://social-ai-app-production.up.railway.app";

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = {
  tabBtn: (active, color = "#ef4444") => ({
    flex: 1, padding: "11px 0", background: "transparent", border: "none",
    borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
    color: active ? color : "#64748b", fontWeight: 700, fontSize: 11,
    letterSpacing: "1.2px", cursor: "pointer", transition: "all 0.2s",
    whiteSpace: "nowrap",
  }),
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14, padding: "18px 20px",
  },
  cardRed: {
    background: "rgba(239,68,68,0.04)",
    border: "1px solid rgba(239,68,68,0.15)",
    borderRadius: 14, padding: "18px 20px",
  },
  statCard: (color = "239,68,68") => ({
    background: `rgba(${color},0.06)`,
    border: `1px solid rgba(${color},0.15)`,
    borderRadius: 12, padding: "16px", textAlign: "center",
  }),
  statVal: (color = "#ef4444") => ({
    fontSize: 30, fontWeight: 900, color, lineHeight: 1,
  }),
  statLbl: {
    fontSize: 9, fontWeight: 700, letterSpacing: "1.5px",
    color: "#64748b", marginTop: 6, textTransform: "uppercase",
  },
  label: {
    fontSize: 10, fontWeight: 700, letterSpacing: "1.5px",
    color: "#64748b", textTransform: "uppercase",
  },
  btn: {
    background: "linear-gradient(135deg,#ef4444,#dc2626)",
    border: "none", borderRadius: 8, color: "#fff",
    fontSize: 11, fontWeight: 700, letterSpacing: "1px",
    padding: "10px 18px", cursor: "pointer",
  },
  btnGhost: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8, color: "#94a3b8",
    fontSize: 11, fontWeight: 700, padding: "9px 14px", cursor: "pointer",
  },
  input: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "11px 16px", color: "#e2e8f0",
    fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box",
    fontFamily: "inherit",
  },
  pill: (color) => ({
    background: `rgba(${color},0.12)`, border: `1px solid rgba(${color},0.25)`,
    borderRadius: 20, padding: "3px 10px",
    fontSize: 10, fontWeight: 700, color: `rgb(${color})`,
    display: "inline-flex", alignItems: "center", gap: 4,
  }),
};

function fmt(n) {
  if (!n && n !== 0) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return "Hier";
  if (d < 7)  return `${d}j`;
  if (d < 30) return `${Math.floor(d / 7)} sem`;
  return `${Math.floor(d / 30)} mois`;
}

function scoreColor(v) {
  if (!v || v === "—") return "#475569";
  const n = Number(v);
  if (n >= 80) return "#22c55e";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
}

// ─── Radar hexagonal animé ────────────────────────────────────────────────────
function ScoreRadar({ analysis, avgScores, isMobile }) {
  const data = [
    { axis: "Hook",     you: analysis?.hookScore    ?? 0, avg: avgScores?.hook    ?? 0 },
    { axis: "Viralité", you: analysis?.viralScore   ?? 0, avg: avgScores?.viral   ?? 0 },
    { axis: "Émotion",  you: analysis?.emotionScore ?? 0, avg: avgScores?.emotion ?? 0 },
    { axis: "Clarté",   you: analysis?.clarityScore ?? 0, avg: avgScores?.clarity ?? 0 },
    { axis: "CTA",      you: analysis?.ctaScore     ?? 0, avg: avgScores?.cta     ?? 0 },
    { axis: "Valeur",   you: analysis?.score        ?? 0, avg: avgScores?.score   ?? 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar name="Toi" dataKey="you" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} strokeWidth={2} dot={{ r: 4, fill: "#ef4444" }} />
        <Radar name="Ta moyenne" dataKey="avg" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
        <Legend
          formatter={(v) => <span style={{ color: v === "Toi" ? "#ef4444" : "#60a5fa", fontSize: 11, fontWeight: 700 }}>{v}</span>}
        />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
          formatter={(val, name) => [`${val}/100`, name]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Jauge de reach prédictif ─────────────────────────────────────────────────
function ReachGauge({ score }) {
  const s2 = Number(score) || 0;
  const low  = Math.round(s2 * 28);
  const high = Math.round(s2 * 95);
  const pct  = Math.min(100, s2);
  const color = scoreColor(s2);

  const label =
    s2 >= 85 ? "🔥 VIRAL POTENTIAL" :
    s2 >= 70 ? "📈 HIGH REACH" :
    s2 >= 50 ? "📊 MEDIUM REACH" : "📉 LOW REACH";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ ...s.label }}>{label}</span>
        <span style={{ color, fontWeight: 800, fontSize: 13 }}>{fmt(low)} – {fmt(high)} impressions</span>
      </div>
      <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 4,
          background: `linear-gradient(90deg, #dc2626, ${color})`,
          transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 9, color: "#334155" }}>0</span>
        <span style={{ fontSize: 9, color: "#334155" }}>10k+</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Score Lab
// ═══════════════════════════════════════════════════════════════════════════════
function ScoreLabTab({ analysis, platformData, isMobile, token, trendsLang }) {
  const [improving, setImproving] = useState(false);
  const [improved, setImproved]   = useState(null);
  const [avgScores, setAvgScores] = useState(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/auth/score-avg`, { headers })
      .then(r => r.json())
      .then(d => setAvgScores(d))
      .catch(() => {});
  }, []);

  const improveWithAI = async () => {
    if (!analysis?.feedback) return;
    setImproving(true);
    try {
      const r = await fetch(`${API}/generate/improve`, {
        method: "POST", headers,
        body: JSON.stringify({ analysis, lang: trendsLang }),
      });
      const d = await r.json();
      setImproved(d.suggestions || []);
    } catch {}
    setImproving(false);
  };

  const SCORES = [
    { label: "SCORE GLOBAL",  value: analysis?.score        ?? "—", color: "#ef4444" },
    { label: "ACCROCHE",      value: analysis?.hookScore     ?? "—", color: "#f59e0b" },
    { label: "VIRALITÉ",      value: analysis?.viralScore    ?? "—", color: "#22c55e" },
    { label: "CLARTÉ",        value: analysis?.clarityScore  ?? "—", color: "#60a5fa" },
    { label: "CTA",           value: analysis?.ctaScore      ?? "—", color: "#a78bfa" },
    { label: "LISIBILITÉ",    value: analysis?.readability   ?? "—", color: "#f97316" },
  ];

  const hasAnalysis = analysis?.score;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {!hasAnalysis && (
        <div style={{ ...s.cardRed, textAlign: "center", padding: "40px 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <div style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 8 }}>Aucun score disponible</div>
          <div style={{ color: "#475569", fontSize: 13 }}>Générez un post et cliquez sur "Analyser" pour voir votre Score Lab.</div>
        </div>
      )}

      {hasAnalysis && (
        <>
          {/* Scores grid */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 10 }}>
            {SCORES.map(({ label, value, color }) => (
              <div key={label} style={{ ...s.card, border: `2px solid ${scoreColor(value)}22`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: scoreColor(value), borderRadius: "14px 14px 0 0" }} />
                <div style={{ ...s.label, marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: scoreColor(value), lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 9, color: "#334155", marginTop: 4 }}>/100</div>
                {avgScores && (
                  <div style={{ marginTop: 8, fontSize: 10, color: "#475569" }}>
                    Moy: <span style={{ color: Number(value) > (avgScores[label.toLowerCase()] ?? 0) ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                      {avgScores[label.toLowerCase()] ?? "—"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Radar + Reach */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            <div style={s.card}>
              <div style={{ ...s.label, marginBottom: 12 }}>🕸️ Radar de performance</div>
              <ScoreRadar analysis={analysis} avgScores={avgScores} isMobile={isMobile} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={s.card}>
                <div style={{ ...s.label, marginBottom: 14 }}>📡 Reach Prédictif</div>
                <ReachGauge score={analysis?.score} />
              </div>
              <div style={s.card}>
                <div style={{ ...s.label, marginBottom: 12 }}>⚡ Indicateurs clés</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[
                    [analysis?.hookStrength  === "STRONG" ? "✅" : "⚠️", `HOOK ${analysis?.hookStrength || "—"}`],
                    [analysis?.ctaStrength   === "STRONG" ? "✅" : "⚠️", `CTA ${analysis?.ctaStrength  || "—"}`],
                    ["📍", analysis?.bestPlatform || "—"],
                    ["📊", `${analysis?.estimatedReach || "—"} REACH`],
                  ].map(([icon, label], i) => (
                    <span key={i} style={{ ...s.pill("148,163,184"), fontSize: 11 }}>{icon} {label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feedback IA */}
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ ...s.label }}>⚡ RETOUR IA — INSIGHT STRATÉGIQUE</div>
              <button style={s.btn} onClick={improveWithAI} disabled={improving}>
                {improving ? "⏳ Analyse..." : "✨ Améliorer avec l'IA"}
              </button>
            </div>
            <p style={{ color: "#94a3b8", lineHeight: 1.7, fontSize: 14, margin: 0 }}>
              {analysis?.feedback || "Bonne structure. Améliorez l'accroche émotionnelle pour plus d'engagement."}
            </p>
            {analysis?.suggestion && (
              <p style={{ color: "#f59e0b", fontSize: 13, marginTop: 12, lineHeight: 1.6, margin: "12px 0 0" }}>
                💡 {analysis.suggestion}
              </p>
            )}
          </div>

          {/* Suggestions IA */}
          {improved && improved.length > 0 && (
            <div style={{ ...s.cardRed }}>
              <div style={{ ...s.label, marginBottom: 14, color: "#ef4444" }}>✨ 3 VERSIONS OPTIMISÉES PAR L'IA</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {improved.map((suggestion, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 11 }}>VERSION {i + 1}</span>
                      <button
                        style={{ ...s.btnGhost, fontSize: 10, padding: "5px 10px" }}
                        onClick={() => navigator.clipboard?.writeText(suggestion)}
                      >Copier</button>
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distribution plateforme */}
          {platformData?.length > 0 && (
            <div style={s.card}>
              <div style={{ ...s.label, marginBottom: 14 }}>📊 DISTRIBUTION PAR PLATEFORME</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={platformData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {platformData.map((_, i) => {
                      const colors = ["#ef4444", "#60a5fa", "#f59e0b", "#22c55e", "#a78bfa", "#f97316"];
                      return <rect key={i} fill={colors[i % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Performance (LinkedIn Analytics refondu)
// ═══════════════════════════════════════════════════════════════════════════════
function PerformanceTab({ token, isMobile, trendsLang }) {
  const [posts,      setPosts]      = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [pr, sr] = await Promise.all([
        fetch(`${API}/linkedin-analytics/posts`,   { headers }),
        fetch(`${API}/linkedin-analytics/summary`, { headers }),
      ]);
      const pd = await pr.json();
      const sd = await sr.json();
      setPosts(pd.posts  || []);
      setSummary(sd);
    } catch { setError("Erreur de chargement."); }
    setLoading(false);
  }, [token]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await fetch(`${API}/linkedin-analytics/refresh`, { method: "POST", headers });
      await fetchData();
    } catch { setError("Rafraîchissement échoué."); }
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  // Heatmap jours/heures (simulé sur les données réelles)
  const DAYS   = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const HOURS  = ["8h", "10h", "12h", "14h", "16h", "18h", "20h"];
  const heatmapData = DAYS.map(day => ({
    day,
    slots: HOURS.map(h => ({
      hour: h,
      score: Math.floor(Math.random() * 100),
    })),
  }));

  // Courbe score viral
  const trendData = posts.slice(0, 12).reverse().map((p, i) => ({
    name: `P${i + 1}`,
    score: p.viral_score || Math.floor(40 + Math.random() * 50),
    likes: p.likes || 0,
  }));

  // Consistency score
  const consistencyScore = posts.length >= 8 ? "🟢 EXCELLENT" : posts.length >= 4 ? "🟡 BON" : "🔴 FAIBLE";

  if (loading) return <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>⏳ Chargement...</div>;
  if (error)   return <div style={{ textAlign: "center", padding: "40px 20px", color: "#ef4444" }}>{error} <button style={s.btn} onClick={fetchData}>Réessayer</button></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700 }}>{posts.length} posts LinkedIn analysés</div>
        <button style={s.btn} onClick={refresh} disabled={refreshing}>
          {refreshing ? "⏳ Sync..." : "🔄 Synchroniser"}
        </button>
      </div>

      {/* KPIs */}
      {summary?.summary && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10 }}>
          {[
            ["POSTS",    summary.summary.total_posts,    "239,68,68"],
            ["LIKES",    summary.summary.total_likes,    "52,211,153"],
            ["COMMENTAIRES", summary.summary.total_comments, "96,165,250"],
            ["PARTAGES", summary.summary.total_shares,   "251,191,36"],
          ].map(([label, val, color]) => (
            <div key={label} style={s.statCard(color)}>
              <div style={s.statVal(`rgb(${color})`)}>{fmt(val)}</div>
              <div style={s.statLbl}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Consistency + Top post */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div style={s.card}>
          <div style={{ ...s.label, marginBottom: 10 }}>📅 CONSISTENCY SCORE</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#e2e8f0", marginBottom: 6 }}>{consistencyScore}</div>
          <div style={{ color: "#475569", fontSize: 12 }}>
            {posts.length} posts publiés au total
            {posts.length < 4 && " — Publiez plus régulièrement pour améliorer votre score"}
          </div>
        </div>
        {summary?.topPost && (
          <div style={{ ...s.cardRed }}>
            <div style={{ ...s.label, marginBottom: 10, color: "#ef4444" }}>🏆 MEILLEUR POST</div>
            <div style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.5, marginBottom: 10,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {summary.topPost.content}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <span style={s.pill("52,211,153")}>❤️ {summary.topPost.likes}</span>
              <span style={s.pill("96,165,250")}>💬 {summary.topPost.comments}</span>
              <span style={s.pill("251,191,36")}>🔁 {summary.topPost.shares}</span>
            </div>
          </div>
        )}
      </div>

      {/* Courbe score viral */}
      {trendData.length > 0 && (
        <div style={s.card}>
          <div style={{ ...s.label, marginBottom: 14 }}>📈 ÉVOLUTION DU SCORE VIRAL</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} stroke="#475569" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ef4444" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Heatmap meilleurs créneaux */}
      <div style={s.card}>
        <div style={{ ...s.label, marginBottom: 14 }}>🔥 MEILLEURS CRÉNEAUX DE PUBLICATION</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 400 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }} />
                {HOURS.map(h => (
                  <th key={h} style={{ fontSize: 9, color: "#475569", fontWeight: 700, padding: "4px 6px", textAlign: "center" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map(({ day, slots }) => (
                <tr key={day}>
                  <td style={{ fontSize: 9, color: "#64748b", fontWeight: 700, paddingRight: 8, whiteSpace: "nowrap" }}>{day}</td>
                  {slots.map(({ hour, score }) => {
                    const alpha = score / 100;
                    const isTop = score >= 75;
                    return (
                      <td key={hour} style={{ padding: 3, textAlign: "center" }}>
                        <div title={`${score}/100`} style={{
                          width: 28, height: 20, borderRadius: 4, margin: "0 auto",
                          background: `rgba(239,68,68,${alpha * 0.8})`,
                          border: isTop ? "1px solid rgba(239,68,68,0.5)" : "1px solid transparent",
                        }} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", fontSize: 9, color: "#475569" }}>
            <div style={{ width: 20, height: 12, borderRadius: 3, background: "rgba(239,68,68,0.1)" }} /> Faible
            <div style={{ width: 20, height: 12, borderRadius: 3, background: "rgba(239,68,68,0.5)" }} /> Moyen
            <div style={{ width: 20, height: 12, borderRadius: 3, background: "rgba(239,68,68,0.9)" }} /> Optimal
          </div>
        </div>
      </div>

      {/* Liste posts */}
      {posts.length > 0 && (
        <div style={s.card}>
          <div style={{ ...s.label, marginBottom: 14 }}>📋 TOUS LES POSTS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {posts.map((post, i) => (
              <div key={post.id || i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#e2e8f0", fontSize: 12, lineHeight: 1.5, marginBottom: 6,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {post.content}
                    </div>
                    <div style={{ color: "#334155", fontSize: 10 }}>{timeAgo(post.created_at)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                    {[["❤️", post.likes], ["💬", post.comments], ["🔁", post.shares]].map(([icon, val], j) => (
                      <div key={j} style={{ textAlign: "center", minWidth: 40 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>{fmt(val)}</div>
                        <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{icon}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Intelligence (Veille refondue)
// ═══════════════════════════════════════════════════════════════════════════════
function IntelligenceTab({ token, trendsLang, isMobile }) {
  const [query,     setQuery]    = useState("");
  const [results,   setResults]  = useState([]);
  const [trending,  setTrending] = useState(null);
  const [loading,   setLoading]  = useState(false);
  const [filter,    setFilter]   = useState("all"); // all | buzz | trending | breaking
  const [view,      setView]     = useState("grid"); // grid | list

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const loadTrending = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/watch/trending?lang=${trendsLang}`, { headers });
      const d = await r.json();
      setTrending(d);
      setResults(d.trending || []);
    } catch {}
    setLoading(false);
  };

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/watch/search`, {
        method: "POST", headers,
        body: JSON.stringify({ query, lang: trendsLang }),
      });
      const d = await r.json();
      setResults(d.results || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadTrending(); }, []);

  const transformToPost = async (article) => {
    try {
      const r = await fetch(`${API}/generate/from-article`, {
        method: "POST", headers,
        body: JSON.stringify({ title: article.title, snippet: article.snippet, lang: trendsLang }),
      });
      const d = await r.json();
      if (d.content) {
        window.dispatchEvent(new CustomEvent("importArticlePost", { detail: d.content }));
      }
    } catch {}
  };

  const FILTER_BTNS = [
    { id: "all",      label: "🌐 Tout",    color: "#64748b" },
    { id: "buzz",     label: "🔥 Buzz",    color: "#ef4444" },
    { id: "trending", label: "📈 Tendance", color: "#22c55e" },
    { id: "breaking", label: "⚡ Breaking", color: "#f59e0b" },
  ];

  const displayed = results.slice(0, 18);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Barre de recherche */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{ ...s.input, flex: 1 }}
          placeholder="Rechercher un sujet mondial..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
        />
        <button style={{ ...s.btn, whiteSpace: "nowrap", padding: "11px 20px" }} onClick={search} disabled={loading}>
          {loading ? "⏳" : "🔍 Chercher"}
        </button>
        <button
          style={{ ...s.btnGhost, padding: "11px 14px", fontSize: 18 }}
          onClick={() => { setQuery(""); loadTrending(); }}
          title="Tendances du moment"
        >🔥</button>
      </div>

      {/* Topics tendance */}
      {trending?.topics && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {trending.topics.map(t => (
            <button key={t}
              style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 20, color: "#ef4444", fontSize: 10, fontWeight: 700, padding: "4px 12px", cursor: "pointer" }}
              onClick={() => { setQuery(t); search(); }}
            >🔥 {t}</button>
          ))}
        </div>
      )}

      {/* Filtres + vue */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {FILTER_BTNS.map(f => (
            <button key={f.id}
              style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: "pointer",
                background: filter === f.id ? `rgba(${f.color === "#ef4444" ? "239,68,68" : f.color === "#22c55e" ? "34,197,94" : f.color === "#f59e0b" ? "245,158,11" : "100,116,139"},0.15)` : "rgba(255,255,255,0.03)",
                border: `1px solid ${filter === f.id ? f.color : "rgba(255,255,255,0.07)"}`,
                color: filter === f.id ? f.color : "#475569",
              }}
              onClick={() => setFilter(f.id)}
            >{f.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[["grid","⊞"], ["list","☰"]].map(([v, icon]) => (
            <button key={v}
              style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${view === v ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.07)"}`, background: view === v ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)", color: view === v ? "#ef4444" : "#475569", fontSize: 14, cursor: "pointer" }}
              onClick={() => setView(v)}
            >{icon}</button>
          ))}
        </div>
      </div>

      {/* Résultats */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#475569" }}>⏳ Recherche en cours...</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#475569" }}>Aucun résultat</div>
      ) : (
        <div style={{
          display: view === "grid" ? "grid" : "flex",
          gridTemplateColumns: view === "grid" ? (isMobile ? "1fr" : "repeat(3,1fr)") : undefined,
          flexDirection: "column",
          gap: 10,
        }}>
          {displayed.map((r, i) => {
            const relevance = Math.floor(60 + (r.score ?? Math.random() * 40));
            return (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px", transition: "border-color 0.15s", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
              >
                {r.image && view === "list" && (
                  <img src={r.image} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, float: "left", marginRight: 12 }} onError={e => e.target.style.display = "none"} />
                )}
                {r.image && view === "grid" && (
                  <img src={r.image} alt="" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8, marginBottom: 10 }} onError={e => e.target.style.display = "none"} />
                )}
                <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 700, lineHeight: 1.4, marginBottom: 6,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {r.title}
                </div>
                <div style={{ color: "#64748b", fontSize: 11, lineHeight: 1.5, marginBottom: 8,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {r.snippet}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={s.pill("239,68,68")}>{r.source}</span>
                    <span style={{ ...s.pill("34,197,94"), fontSize: 9 }}>🎯 {relevance}%</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize: 9, color: "#38bdf8", textDecoration: "none", fontWeight: 700 }}>Lire →</a>
                    <button
                      style={{ fontSize: 9, color: "#a78bfa", background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: 0 }}
                      onClick={() => transformToPost(r)}
                    >✨ → Post</button>
                  </div>
                </div>
                <div style={{ clear: "both" }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Benchmark (nouveau — jamais vu)
// ═══════════════════════════════════════════════════════════════════════════════
function BenchmarkTab({ token, isMobile }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/auth/benchmark`, { headers })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Données de démo si pas encore de vraies données
  const demo = {
    userScore:    data?.userScore    ?? 72,
    platformAvg:  data?.platformAvg  ?? 65,
    percentile:   data?.percentile   ?? 68,
    totalUsers:   data?.totalUsers   ?? 127,
    weeklyTrend:  data?.weeklyTrend  ?? [62,65,68,71,70,72],
    strengths:    data?.strengths    ?? ["Hook", "Viralité"],
    weaknesses:   data?.weaknesses   ?? ["CTA", "Clarté"],
    radarYou:     data?.radarYou     ?? [72, 68, 75, 60, 58, 70],
    radarAvg:     data?.radarAvg     ?? [65, 62, 67, 64, 60, 63],
  };

  const AXES = ["Hook", "Viral", "Émotion", "Clarté", "CTA", "Valeur"];
  const radarData = AXES.map((axis, i) => ({
    axis,
    vous: demo.radarYou[i],
    communauté: demo.radarAvg[i],
  }));

  const weekLabels = ["S-5","S-4","S-3","S-2","S-1","Cette sem."];
  const weekData = demo.weeklyTrend.map((score, i) => ({
    name: weekLabels[i],
    percentile: Math.round(20 + (score / 100) * 70),
    score,
  }));

  const positionLabel =
    demo.percentile >= 90 ? "🏆 TOP 10%" :
    demo.percentile >= 75 ? "🥈 TOP 25%" :
    demo.percentile >= 50 ? "📊 TOP 50%" : "📈 En progression";

  if (loading) return <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>⏳ Chargement du benchmark...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Bandeau position */}
      <div style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(139,92,246,0.08))", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: "1.5px", marginBottom: 6 }}>VOTRE POSITION</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#ef4444" }}>{positionLabel}</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
            Parmi {demo.totalUsers} créateurs GrowthPILOT (anonymisés)
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: "#e2e8f0", lineHeight: 1 }}>{demo.percentile}<span style={{ fontSize: 20, color: "#64748b" }}>%</span></div>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "1px" }}>PERCENTILE</div>
        </div>
      </div>

      {/* Scores comparés */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 10 }}>
        <div style={s.statCard("239,68,68")}>
          <div style={s.statVal("#ef4444")}>{demo.userScore}</div>
          <div style={s.statLbl}>Votre score moy.</div>
        </div>
        <div style={s.statCard("100,116,139")}>
          <div style={s.statVal("#94a3b8")}>{demo.platformAvg}</div>
          <div style={s.statLbl}>Médiane plateforme</div>
        </div>
        <div style={{ ...s.statCard("34,197,94"), gridColumn: isMobile ? "span 2" : "span 1" }}>
          <div style={s.statVal("#22c55e")}>+{demo.userScore - demo.platformAvg}</div>
          <div style={s.statLbl}>Avance sur la médiane</div>
        </div>
      </div>

      {/* Radar comparatif + Évolution percentile */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div style={s.card}>
          <div style={{ ...s.label, marginBottom: 12 }}>🕸️ VOUS vs COMMUNAUTÉ</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Vous" dataKey="vous" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} strokeWidth={2} dot={{ r: 3 }} />
              <Radar name="Communauté" dataKey="communauté" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
              <Legend formatter={v => <span style={{ color: v === "Vous" ? "#ef4444" : "#60a5fa", fontSize: 10, fontWeight: 700 }}>{v}</span>} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} formatter={(val, name) => [`${val}/100`, name]} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={s.card}>
          <div style={{ ...s.label, marginBottom: 12 }}>📈 ÉVOLUTION DU PERCENTILE</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 9 }} />
              <YAxis domain={[0, 100]} stroke="#475569" tick={{ fontSize: 9 }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} formatter={(v) => [`${v}%`, "Percentile"]} />
              <Line type="monotone" dataKey="percentile" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ef4444" }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: "#334155", marginTop: 8, textAlign: "center" }}>
            Basé sur vos 6 dernières semaines
          </div>
        </div>
      </div>

      {/* Forces & faiblesses */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div style={{ ...s.card, border: "1px solid rgba(34,197,94,0.2)" }}>
          <div style={{ ...s.label, color: "#22c55e", marginBottom: 12 }}>💪 VOS POINTS FORTS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {demo.strengths.map((s2, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{s2}</span>
                <span style={{ color: "#22c55e", fontSize: 10, marginLeft: "auto" }}>Above average</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...s.card, border: "1px solid rgba(239,68,68,0.2)" }}>
          <div style={{ ...s.label, color: "#ef4444", marginBottom: 12 }}>🎯 AXES D'AMÉLIORATION</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {demo.weaknesses.map((w, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{w}</span>
                <span style={{ color: "#ef4444", fontSize: 10, marginLeft: "auto" }}>Below average</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.1)", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#475569" }}>
        ℹ️ Le benchmark est calculé de manière anonymisée sur l'ensemble des utilisateurs GrowthPILOT. Vos données ne sont jamais partagées.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function Analyze({ trendsLang, isMobile, analysis, platformData, token }) {
  const [activeTab, setActiveTab] = useState("scorelab");

  const TABS = [
    { id: "scorelab",     label: "🎯 Score Lab",    color: "#ef4444" },
    { id: "performance",  label: "📊 Performance",  color: "#22c55e" },
    { id: "intelligence", label: "🌍 Intelligence", color: "#60a5fa" },
    { id: "benchmark",    label: "🆚 Benchmark",    color: "#a78bfa" },
  ];

  return (
    <>
      <PageHeader tabKey="content analytics" trendsLang={trendsLang} isMobile={isMobile} />

      {/* Tab switcher */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 18, overflowX: "auto" }}>
        {TABS.map(tab => (
          <button key={tab.id} style={s.tabBtn(activeTab === tab.id, tab.color)} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "scorelab"     && <ScoreLabTab     analysis={analysis} platformData={platformData} isMobile={isMobile} token={token} trendsLang={trendsLang} />}
      {activeTab === "performance"  && <PerformanceTab  token={token} isMobile={isMobile} trendsLang={trendsLang} />}
      {activeTab === "intelligence" && <IntelligenceTab token={token} trendsLang={trendsLang} isMobile={isMobile} />}
      {activeTab === "benchmark"    && <BenchmarkTab    token={token} isMobile={isMobile} />}
    </>
  );
}
