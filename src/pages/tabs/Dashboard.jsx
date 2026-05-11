import { motion } from "framer-motion";
import { t as tr } from "../../translations.js";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { st, PageHeader } from "./shared.js";

export default function Dashboard({
  trendsLang, isMobile,
  animatedStats, stats, projects, liveFeed, timelineData, growthData
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <PageHeader tabKey="dashboard" trendsLang={trendsLang} isMobile={isMobile} />

      {/* KPI */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(5,1fr)", gap:10 }}>
        {[
          [tr(trendsLang, "ui.statPosts"),     animatedStats.posts],
          [tr(trendsLang, "ui.statProjects"),  animatedStats.projects],
          [tr(trendsLang, "ui.statPublished"), animatedStats.published],
          [tr(trendsLang, "ui.statAvgScore"),  animatedStats.avgScore],
          [tr(trendsLang, "ui.statStreak"),    animatedStats.streak],
        ].map(([label, value], i) => (
          <motion.div key={i} whileHover={{ y:-4 }} style={{ ...st.card, padding:14, marginTop:0 }}>
            <h3 style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:8 }}>{label}</h3>
            <h1 style={{ color:"#ef4444", fontSize: isMobile ? 26 : 32, fontWeight:800 }}>{value}</h1>
          </motion.div>
        ))}
      </div>

      {/* Middle */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1.35fr 1fr", gap:14 }}>
        <div style={{ ...st.card, marginTop:0, overflow:"hidden", minHeight:140 }}>
          <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:10 }}>{tr(trendsLang, "ui.liveActivity")}</h3>
          {liveFeed.slice(0, 3).map((item) => (
            <div key={item.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", fontSize:13 }}>
              <span>{item.text}</span>
              <span style={{ color:"#475569", flexShrink:0, marginLeft:8 }}>{item.time}</span>
            </div>
          ))}
        </div>
        <div style={{ ...st.card, marginTop:0, overflow:"hidden", minHeight:140 }}>
          <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:10 }}>{tr(trendsLang, "ui.publishTimeline")}</h3>
          {timelineData.slice(0, 3).map((item, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", fontSize:13 }}>
              <span style={{ color:"#94a3b8" }}>{item.time}</span>
              <span style={{ color:"#22c55e", fontSize:11, fontWeight:700 }}>Scheduled</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ ...st.chartCard, marginTop:0, height:220, paddingBottom:24 }}>
        <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:10 }}>{tr(trendsLang, "ui.contentPerformance")}</h3>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={growthData} margin={{ top:10, right:25, left:10, bottom:10 }}>
            <CartesianGrid stroke="rgba(220,38,38,0.025)" vertical={false} />
            <XAxis dataKey="day" stroke="#475569" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#475569" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:"#050505", border:"none", borderRadius:"12px", color:"#fff", boxShadow:"0 8px 30px rgba(0,0,0,.45)" }} />
            <Line type="monotone" dataKey="score" stroke="#dc2626" strokeWidth={4} dot={false} activeDot={{ r:5, fill:"#dc2626" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
