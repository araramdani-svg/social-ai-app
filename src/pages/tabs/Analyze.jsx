import { t as tr } from "../../translations.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { st, PageHeader, metricColor } from "./shared.js";

export default function Analyze({ trendsLang, isMobile, analysis, platformData }) {
  return (
    <>
      <PageHeader tabKey="content analytics" trendsLang={trendsLang} isMobile={isMobile} />

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
            <p style={{ color:"#94a3b8", lineHeight:1.7, fontSize:14 }}>{analysis?.feedback || "Strong structure. Improve emotional hook for higher engagement."}</p>
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
  );
}
