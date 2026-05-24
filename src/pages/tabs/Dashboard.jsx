import { motion } from "framer-motion";
import { t as tr } from "../../translations.js";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Area, AreaChart,
} from "recharts";
import { st, PageHeader } from "./shared.js";

// ─── Tooltip custom pour le chart ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"#0d1626", border:"1px solid rgba(220,38,38,0.2)",
      borderRadius:10, padding:"10px 14px", fontSize:12,
    }}>
      <div style={{ color:"#64748b", marginBottom:4 }}>{label}</div>
      <div style={{ color:"#ef4444", fontWeight:800, fontSize:16 }}>{payload[0].value}<span style={{ color:"#475569", fontSize:11, fontWeight:400, marginLeft:4 }}>/ 100</span></div>
    </div>
  );
};

// ─── Icônes live feed ─────────────────────────────────────────────────────────
const FEED_ICONS = {
  "AI optimized":       { icon:"⚡", color:"#f59e0b" },
  "Audience signals":   { icon:"📡", color:"#8b5cf6" },
  "Best publish slot":  { icon:"🎯", color:"#22c55e" },
  "Content generated":  { icon:"✍️", color:"#ef4444" },
  "Campaign strategy":  { icon:"🗺️", color:"#3b82f6" },
  "Content resonance":  { icon:"📈", color:"#22c55e" },
  "Hook structure":     { icon:"🪝", color:"#f59e0b" },
  "AI analysis":        { icon:"🔍", color:"#8b5cf6" },
  "Growth signals":     { icon:"🚀", color:"#ef4444" },
  "Brand memory":       { icon:"🧠", color:"#3b82f6" },
  "Viral score":        { icon:"🔥", color:"#f97316" },
};

const getFeedMeta = (text) => {
  const match = Object.entries(FEED_ICONS).find(([k]) => text.includes(k));
  return match ? match[1] : { icon:"💡", color:"#475569" };
};

// ─── Badge plateforme timeline ────────────────────────────────────────────────
const PLATFORM_COLORS = {
  LinkedIn:  "#0077b5",
  X:         "#1da1f2",
  Threads:   "#a855f7",
  Instagram: "#e1306c",
  Facebook:  "#1877f2",
  TikTok:    "#ff0050",
};

export default function Dashboard({
  trendsLang, isMobile,
  animatedStats, stats, projects, liveFeed, timelineData, growthData,
  firstName, displayName, setTab,
}) {

  // ── Accroche contextuelle ─────────────────────────────────────────────────
  const getInsight = () => {
    if ((stats?.posts || 0) === 0 && (stats?.projects || 0) === 0)
      return { msg: tr(trendsLang,"ui.insightNoPosts"), cta:"create", ctaLabel: tr(trendsLang,"ui.insightCtaStreak") };
    if ((stats?.published || 0) === 0 && (stats?.posts || 0) > 0)
      return { msg: `${stats.posts} post${stats.posts>1?"s":""} ${tr(trendsLang,"ui.insightNoPublished")}`, cta:"publish", ctaLabel: tr(trendsLang,"ui.insightCtaPublish") };
    if ((stats?.streak || 0) === 0)
      return { msg: tr(trendsLang,"ui.insightNoStreak"), cta:"create", ctaLabel: tr(trendsLang,"ui.insightCtaStreak") };
    return { msg: `${stats?.streak || 0} ${tr(trendsLang,"ui.insightStreak")}`, cta:null };
  };
  const insight = getInsight();
  const name = displayName ? ` ${displayName}` : firstName ? ` ${firstName}` : "";

  // ── KPI config ────────────────────────────────────────────────────────────
  const KPIS = [
    { label: tr(trendsLang, "ui.statPosts"),     value: animatedStats.posts,     icon:"✍️", color:"#ef4444", hint: tr(trendsLang, "ui.hintTotalGenerated") },
    { label: tr(trendsLang, "ui.statProjects"),  value: animatedStats.projects,  icon:"📁", color:"#8b5cf6", hint: tr(trendsLang, "ui.hintActiveProjects") },
    { label: tr(trendsLang, "ui.statPublished"), value: animatedStats.published, icon:"📤", color:"#22c55e", hint: tr(trendsLang, "ui.hintPublishedPosts") },
    { label: tr(trendsLang, "ui.statAvgScore"),  value: animatedStats.avgScore,  icon:"⭐", color:"#f59e0b", hint: tr(trendsLang, "ui.hintAvgViralScore") },
    { label: tr(trendsLang, "ui.statStreak"),    value: animatedStats.streak,    icon:"🔥", color:"#f97316", hint: tr(trendsLang, "ui.hintDayStreak") },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap: isMobile ? 12 : 16 }}>
      <PageHeader tabKey="dashboard" trendsLang={trendsLang} isMobile={isMobile} />

      {/* ── Hero contextuel ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
        style={{
          background:"linear-gradient(135deg,rgba(220,38,38,0.06),rgba(15,23,42,0))",
          border:"1px solid rgba(220,38,38,0.12)", borderRadius:16,
          padding: isMobile ? "18px 20px" : "22px 28px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexDirection: isMobile ? "column" : "row", gap:14,
        }}
      >
        <div>
          <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1px", marginBottom:5 }}>
            COMMAND CENTER{name ? ` · ${name.trim().toUpperCase()}` : ""}
          </div>
          <p style={{ margin:0, color:"#94a3b8", fontSize: isMobile ? 13 : 14, lineHeight:1.6 }}>
            {insight.msg}
          </p>
        </div>
        {insight.cta && (
          <button
            style={{ ...st.button, margin:0, whiteSpace:"nowrap", padding:"10px 22px", fontSize:12, flexShrink:0 }}
            onClick={() => setTab?.(insight.cta)}
          >
            {insight.ctaLabel}
          </button>
        )}
      </motion.div>

      {/* ── KPIs ─────────────────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(5,1fr)", gap:10 }}>
        {KPIS.map(({ label, value, icon, color, hint }, i) => (
          <motion.div
            key={i}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.3, delay: i * 0.07 }}
            whileHover={{ y:-4, borderColor: color }}
            style={{
              ...st.card, padding: isMobile ? 14 : 18, marginTop:0,
              borderLeft:`3px solid ${color}40`,
              transition:"border-color 0.2s ease",
            }}
          >
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ fontSize:10, color:"#475569", fontWeight:700, letterSpacing:"1.2px" }}>{label}</div>
              <div style={{
                width:28, height:28, borderRadius:8,
                background:`${color}15`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14,
              }}>{icon}</div>
            </div>
            <div style={{ color, fontSize: isMobile ? 28 : 34, fontWeight:900, lineHeight:1 }}>{value}</div>
            <div style={{ color:"#334155", fontSize:10, marginTop:6, letterSpacing:"0.5px" }}>{hint}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Live feed + Timeline ─────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap:12 }}>

        {/* Live feed */}
        <div style={{ ...st.card, marginTop:0, padding: isMobile ? 16 : 20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 6px #22c55e" }} />
            <h3 style={{ color:"#ef4444", fontSize:11, letterSpacing:"1.5px", margin:0 }}>
              {tr(trendsLang, "ui.liveActivity")}
            </h3>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            {liveFeed.slice(0, 5).map((item) => {
              const meta = getFeedMeta(item.text);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                  style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding:"9px 10px", borderRadius:8,
                    background:"rgba(255,255,255,0.01)",
                  }}
                >
                  <div style={{
                    width:30, height:30, borderRadius:8, flexShrink:0,
                    background:`${meta.color}15`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:14,
                  }}>{meta.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"#94a3b8", fontSize:12, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {item.text}
                    </div>
                  </div>
                  <div style={{ color:"#334155", fontSize:10, flexShrink:0 }}>{item.time}</div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ ...st.card, marginTop:0, padding: isMobile ? 16 : 20 }}>
          <h3 style={{ color:"#ef4444", fontSize:11, letterSpacing:"1.5px", margin:"0 0 14px" }}>
            {tr(trendsLang, "ui.publishTimeline")}
          </h3>
          {timelineData.length === 0 ? (
            <div style={{ color:"#334155", fontSize:13, textAlign:"center", padding:"24px 0" }}>
              {tr(trendsLang, "ui.noScheduledPosts")}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {timelineData.slice(0, 5).map((item, i) => {
                const pColor = PLATFORM_COLORS[item.platform] || "#475569";
                return (
                  <div key={i} style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding:"10px 12px", borderRadius:8,
                    background:"rgba(255,255,255,0.02)",
                    border:"1px solid rgba(255,255,255,0.04)",
                  }}>
                    <div style={{
                      width:3, height:32, borderRadius:2,
                      background:pColor, flexShrink:0,
                    }} />
                    <div style={{ flex:1 }}>
                      <div style={{ color:"#94a3b8", fontSize:12, fontWeight:600 }}>{item.time || "—"}</div>
                      <div style={{ color:"#475569", fontSize:10, marginTop:2 }}>{item.platform || "LinkedIn"}</div>
                    </div>
                    <div style={{
                      background:`${pColor}20`, color:pColor,
                      fontSize:10, fontWeight:700, letterSpacing:"0.5px",
                      padding:"3px 8px", borderRadius:20,
                    }}>
                      {tr(trendsLang, "ui.scheduled")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Chart avec gradient ───────────────────────────────────────────────── */}
      <div style={{ ...st.card, marginTop:0, padding: isMobile ? 16 : 20, paddingBottom:8 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <h3 style={{ color:"#ef4444", fontSize:11, letterSpacing:"1.5px", margin:0 }}>
            {tr(trendsLang, "ui.contentPerformance")}
          </h3>
          <div style={{ color:"#334155", fontSize:11 }}>
            {tr(trendsLang, "ui.lastDays")}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={growthData} margin={{ top:8, right:16, left:-20, bottom:0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="transparent"
              tick={{ fill:"#475569", fontSize:10 }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill:"#475569", fontSize:10 }}
              axisLine={false} tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke:"rgba(220,38,38,0.15)", strokeWidth:1 }} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#dc2626"
              strokeWidth={2.5}
              fill="url(#scoreGradient)"
              dot={false}
              activeDot={{ r:4, fill:"#ef4444", stroke:"#fff", strokeWidth:2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
