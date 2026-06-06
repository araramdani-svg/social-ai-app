import { useState, useEffect, useCallback } from "react";
import { t as tr } from "../../translations.js";
import { st, PageHeader, metricColor } from "./shared.js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const API = "https://social-ai-app-production.up.railway.app";

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14, padding: "18px 20px",
  },
  cardAccent: (color = "#ef4444") => ({
    background: `rgba(${hexToRgb(color)},0.04)`,
    border: `1px solid rgba(${hexToRgb(color)},0.18)`,
    borderRadius: 14, padding: "18px 20px",
    borderLeft: `3px solid ${color}`,
  }),
  label: {
    fontSize: 10, fontWeight: 700, letterSpacing: "1.5px",
    color: "#64748b", textTransform: "uppercase", marginBottom: 6, display: "block",
  },
  kpiCard: (color) => ({
    background: `rgba(${hexToRgb(color)},0.06)`,
    border: `1px solid rgba(${hexToRgb(color)},0.18)`,
    borderRadius: 12, padding: "16px",
    position: "relative", overflow: "hidden",
  }),
  pill: (color) => ({
    background: `rgba(${hexToRgb(color)},0.12)`,
    border: `1px solid rgba(${hexToRgb(color)},0.25)`,
    borderRadius: 20, padding: "3px 10px",
    fontSize: 10, fontWeight: 700, color,
    display: "inline-flex", alignItems: "center", gap: 4,
  }),
};

function hexToRgb(hex) {
  const map = {
    "#ef4444": "239,68,68", "#22c55e": "34,197,94", "#f59e0b": "245,158,11",
    "#3b82f6": "59,130,246", "#a855f7": "168,85,247", "#f97316": "249,115,22",
    "#0077b5": "0,119,181",  "#1da1f2": "29,161,242", "#64748b": "100,116,139",
  };
  return map[hex] || "255,255,255";
}

function scoreColor(v) {
  const n = Number(v);
  if (!n) return "#475569";
  if (n >= 80) return "#22c55e";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
}

// ─── Recommandations IA dynamiques ───────────────────────────────────────────
function getRecommendations(stats, insights, linkedinStatus, threadsStatus, trendsLang) {
  const tips = [];
  const posts     = stats.posts     || 0;
  const published = stats.published || 0;
  const avgScore  = stats.avgScore  || 0;
  const streak    = stats.streak    || 0;

  if (posts === 0) {
    tips.push("🚀 Commencez par générer votre premier post dans l'onglet Créer");
    tips.push("🎯 Configurez votre Mémoire de Marque pour des posts dans votre voix");
    tips.push("📋 Explorez les 50+ templates disponibles pour vous inspirer");
  } else {
    if (insights.cadence === "Low")    tips.push("📅 Publiez 3x par semaine pour maximiser votre portée LinkedIn");
    if (insights.cadence === "Medium") tips.push("🔥 Vous publiez bien — maintenez ce rythme pour booster l'algo");
    if (insights.cadence === "High")   tips.push("🏆 Cadence excellente — pensez à varier les formats (carousel, thread)");

    if (avgScore < 60)  tips.push("✍️ Améliorez vos accroches — les 2 premières lignes font tout");
    if (avgScore >= 60 && avgScore < 80) tips.push("⚡ Ajoutez un CTA fort à chaque post pour multiplier les conversions");
    if (avgScore >= 80) tips.push("🌟 Excellent score viral — republiez vos meilleurs posts avec Auto-Repost");

    if (!linkedinStatus?.connected) tips.push("🔗 Connectez LinkedIn pour publier directement depuis GrowthPILOT");
    if (!threadsStatus?.connected)  tips.push("🧵 Ajoutez Threads pour toucher une audience complémentaire");
    if (published === 0)            tips.push("📤 Publiez votre premier post — votre contenu attend dans l'historique");
    if (streak > 7)                 tips.push(`🔥 ${streak} jours de streak — vous êtes en mode créateur !`);
    if (posts > 0 && published === 0) tips.push("📊 Repurposez vos posts sur plusieurs plateformes pour 3x la portée");
  }

  return tips.slice(0, 4);
}

// ─── Composant KPI Card ────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div style={s.kpiCard(color)}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "14px 14px 0 0" }} />
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ ...s.label, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Gauge circulaire ─────────────────────────────────────────────────────────
function CircleGauge({ value, max = 100, color = "#ef4444", size = 80, label }) {
  const pct    = Math.min(100, Math.max(0, (value / max) * 100));
  const r      = (size - 10) / 2;
  const circ   = 2 * Math.PI * r;
  const dash   = (pct / 100) * circ;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x={size/2} y={size/2 + 5} textAnchor="middle" fill={color} fontSize={14} fontWeight={900}>{value}</text>
      </svg>
      {label && <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, letterSpacing: "1px", textAlign: "center" }}>{label}</div>}
    </div>
  );
}

// ─── Barre de progression animée ─────────────────────────────────────────────
function ProgressBar({ label, value, max = 100, color, icon }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
          <span style={{ color: "#94a3b8", fontSize: 13 }}>{label}</span>
        </div>
        <span style={{ color, fontSize: 13, fontWeight: 700 }}>{value}/{max}</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, height: 8, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 6,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
        }} />
      </div>
    </div>
  );
}

// ─── Top posts ────────────────────────────────────────────────────────────────
function TopPosts({ history }) {
  if (!history?.length) return (
    <div style={{ textAlign: "center", padding: "24px 16px", color: "#334155" }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
      <div style={{ fontSize: 12 }}>Générez vos premiers posts pour voir vos tops performances</div>
    </div>
  );

  const top = [...history]
    .filter(p => p?.score > 0 || p?.analysis?.score > 0)
    .sort((a, b) => (b?.score || b?.analysis?.score || 0) - (a?.score || a?.analysis?.score || 0))
    .slice(0, 3);

  if (!top.length) return (
    <div style={{ textAlign: "center", padding: "24px 16px", color: "#334155" }}>
      <div style={{ fontSize: 12 }}>Analysez vos posts pour voir vos meilleurs scores</div>
    </div>
  );

  const medals = ["🥇","🥈","🥉"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {top.map((post, i) => {
        const score = post?.score || post?.analysis?.score || 0;
        const color = scoreColor(score);
        return (
          <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{medals[i]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#e2e8f0", fontSize: 12, lineHeight: 1.5, marginBottom: 6,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {post?.content || post?.post || "—"}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ ...s.pill(color), fontSize: 9 }}>⚡ {score}/100</span>
                {post?.project_name && <span style={{ ...s.pill("#64748b"), fontSize: 9 }}>📁 {post.project_name}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function Insights({ trendsLang, isMobile, insights, stats, linkedinStatus, threadsStatus, history, token }) {

  const posts     = stats?.posts     || 0;
  const published = stats?.published || 0;
  const avgScore  = stats?.avgScore  || 0;
  const streak    = stats?.streak    || 0;

  const tips = getRecommendations(stats, insights, linkedinStatus, threadsStatus, trendsLang);

  // Cadence color
  const cadenceColor =
    insights?.cadence === "High"   ? "#22c55e" :
    insights?.cadence === "Medium" ? "#f59e0b" : "#ef4444";

  // Score couleur globale
  const globalColor = scoreColor(avgScore);

  // Données radar
  const radarData = [
    { axis: "Fréquence", val: Math.min(100, posts * 5) },
    { axis: "Score",     val: avgScore },
    { axis: "Publish",   val: Math.min(100, published * 10) },
    { axis: "Streak",    val: Math.min(100, streak * 10) },
    { axis: "Projets",   val: Math.min(100, (insights?.bestProject !== "No project" && insights?.bestProject !== "N/A" ? 80 : 20)) },
    { axis: "Connect",   val: (linkedinStatus?.connected ? 50 : 0) + (threadsStatus?.connected ? 50 : 0) },
  ];

  // Timeline scores si history dispo
  const timeline = (history || [])
    .filter(p => p?.score > 0 || p?.analysis?.score > 0)
    .slice(-8)
    .map((p, i) => ({
      name: `P${i+1}`,
      score: p?.score || p?.analysis?.score || 0,
    }));

  // Plateformes
  const platforms = [
    { name: "LinkedIn", score: linkedinStatus?.connected ? Math.max(20, avgScore) : 0, color: "#0077b5", icon: "in", connected: linkedinStatus?.connected },
    { name: "Threads",  score: threadsStatus?.connected  ? Math.max(10, avgScore - 15) : 0, color: "#a855f7", icon: "🧵", connected: threadsStatus?.connected },
    { name: "X",        score: 0, color: "#1da1f2", icon: "𝕏", connected: false },
    { name: "Instagram",score: 0, color: "#e1306c", icon: "📸", connected: false },
  ];

  return (
    <>
      <PageHeader tabKey="insights" trendsLang={trendsLang} isMobile={isMobile} />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Ligne 1 : KPIs ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10 }}>
          <KpiCard icon="📝" label={tr(trendsLang,"ui.statPosts")}     value={posts}     color="#ef4444" sub="posts générés" />
          <KpiCard icon="📤" label={tr(trendsLang,"ui.statPublished")} value={published}  color="#22c55e" sub="publiés" />
          <KpiCard icon="⚡" label={tr(trendsLang,"ui.statAvgScore")}  value={avgScore || "—"} color={globalColor} sub="/100 score viral" />
          <KpiCard icon="🔥" label={tr(trendsLang,"ui.statStreak")}    value={streak}     color="#f59e0b" sub="jours consécutifs" />
        </div>

        {/* ── Ligne 2 : Radar + Recommandation IA ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>

          {/* Radar créateur */}
          <div style={s.card}>
            <div style={{ ...s.label, marginBottom: 12 }}>🕸️ PROFIL CRÉATEUR</div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.07)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: "#64748b", fontSize: 9, fontWeight: 700 }} />
                  <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                  <Radar dataKey="val" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} dot={{ r: 3, fill: "#ef4444" }} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} formatter={(v) => [`${v}/100`]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>
              {[
                { label: "CADENCE", value: insights?.cadence || "Low", color: cadenceColor },
                { label: "TOP",     value: insights?.topPlatform || "LinkedIn", color: "#3b82f6" },
                { label: "PROJET",  value: insights?.bestProject?.slice(0,10) || "—", color: "#a855f7" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#475569", fontWeight: 700, letterSpacing: "1px" }}>{label}</div>
                  <div style={{ color, fontWeight: 800, fontSize: 12, marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommandation IA */}
          <div style={{ ...s.cardAccent("#3b82f6") }}>
            <div style={{ ...s.label, color: "#3b82f6", marginBottom: 14 }}>
              {tr(trendsLang, "ui.aiRecommendation")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#3b82f6", flexShrink: 0, marginTop: 1 }}>
                    {i+1}
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Ligne 3 : Performance plateformes + Score timeline ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>

          {/* Plateformes */}
          <div style={s.card}>
            <div style={{ ...s.label, marginBottom: 16 }}>{tr(trendsLang, "ui.platformPerformance")}</div>
            {platforms.map((p, i) => (
              <ProgressBar key={i} label={p.name} value={p.score} max={100} color={p.color}
                icon={p.connected ? "✅" : "🔌"} />
            ))}
            <div style={{ marginTop: 4, fontSize: 10, color: "#334155", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10 }}>
              Connectez vos réseaux dans <span style={{ color: "#38bdf8", fontWeight: 700 }}>Intégrations</span> pour voir vos vrais scores
            </div>
          </div>

          {/* Timeline score viral */}
          <div style={s.card}>
            <div style={{ ...s.label, marginBottom: 12 }}>📈 ÉVOLUTION DU SCORE VIRAL</div>
            {timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0,100]} stroke="#475569" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} formatter={(v) => [`${v}/100`, "Score"]} />
                  <Line type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ef4444" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, gap: 8 }}>
                <div style={{ fontSize: 32 }}>📊</div>
                <div style={{ color: "#475569", fontSize: 12, textAlign: "center" }}>
                  Analysez vos posts pour voir l'évolution de vos scores
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Ligne 4 : Top posts + Signaux croissance ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>

          {/* Top posts */}
          <div style={s.card}>
            <div style={{ ...s.label, marginBottom: 14 }}>🏆 TOP POSTS PAR SCORE VIRAL</div>
            <TopPosts history={history} />
          </div>

          {/* Signaux croissance */}
          <div style={s.card}>
            <div style={{ ...s.label, marginBottom: 16 }}>{tr(trendsLang, "ui.growthSignals")}</div>

            {/* Gauges circulaires */}
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 20 }}>
              <CircleGauge value={avgScore} color={globalColor} label="SCORE MOY." />
              <CircleGauge value={Math.min(100, streak * 10)} color="#f59e0b" label="STREAK" />
              <CircleGauge value={Math.min(100, published * 10)} color="#22c55e" label="PUBLIÉS" />
            </div>

            {/* Signaux texte */}
            {[
              { signal: tr(trendsLang,"ui.signalEngagement"), value: avgScore > 0 ? `${avgScore >= 70 ? "↑" : "→"} ${avgScore}%` : "N/A", color: avgScore >= 70 ? "#22c55e" : "#f59e0b" },
              { signal: tr(trendsLang,"ui.signalReach"),      value: published > 0 ? `${published} posts` : "N/A", color: published > 0 ? "#22c55e" : "#64748b" },
              { signal: "Cadence",                            value: insights?.cadence || "Low", color: cadenceColor },
              { signal: "Streak",                             value: streak > 0 ? `🔥 ${streak} jours` : "—", color: streak > 7 ? "#22c55e" : "#64748b" },
            ].map((g, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color: "#64748b", fontSize: 13 }}>{g.signal}</span>
                <span style={{ color: g.color, fontSize: 13, fontWeight: 700 }}>{g.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
