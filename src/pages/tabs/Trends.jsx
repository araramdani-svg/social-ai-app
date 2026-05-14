import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

export default function Trends({
  trendsLang, isMobile,
  trends, trendsNiche, setTrendsNiche, trendsLoading, trendsSources,
  fetchTrends, useAsTopic
}) {
  const NICHES = [
    { key:"ai",         label: tr(trendsLang, "ui.nicheAI") },
    { key:"saas",       label: tr(trendsLang, "ui.nicheSaaS") },
    { key:"marketing",  label: tr(trendsLang, "ui.nicheMarketing") },
    { key:"finance",    label: tr(trendsLang, "ui.nicheFinance") },
    { key:"leadership", label: tr(trendsLang, "ui.nicheLeadership") },
    { key:"tech",       label: tr(trendsLang, "ui.nicheTech") },
    { key:"health",     label: tr(trendsLang, "ui.nicheHealth") },
    { key:"climate",    label: tr(trendsLang, "ui.nicheClimate") },
    { key:"gaming",     label: tr(trendsLang, "ui.nicheGaming") },
    { key:"realestate", label: tr(trendsLang, "ui.nicheRealEstate") },
    { key:"hrtech",     label: tr(trendsLang, "ui.nicheHRTech") },
    { key:"creator",    label: tr(trendsLang, "ui.nicheCreator") },
    { key:"food",       label: tr(trendsLang, "ui.nicheFood") },
    { key:"music",      label: tr(trendsLang, "ui.nicheMusic") },
    { key:"travel",     label: tr(trendsLang, "ui.nicheTravel") },
    { key:"education",  label: tr(trendsLang, "ui.nicheEducation") },
    { key:"cybersec",   label: tr(trendsLang, "ui.nicheCybersec") },
    { key:"mobility",   label: tr(trendsLang, "ui.nicheMobility") },
    { key:"fashion",    label: tr(trendsLang, "ui.nicheFashion") },
    { key:"sport",      label: tr(trendsLang, "ui.nicheSport") },
  ];

  return (
    <>
      <PageHeader tabKey="trends" trendsLang={trendsLang} isMobile={isMobile} />

      {/* Niche buttons */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {NICHES.map(n => (
          <button key={n.key}
            style={{ padding:"8px 14px", borderRadius:20, border: trendsNiche===n.key ? "none" : "1px solid rgba(220,38,38,0.3)", background: trendsNiche===n.key ? "linear-gradient(135deg,#dc2626,#991b1b)" : "transparent", color: trendsNiche===n.key ? "white" : "#64748b", fontWeight:700, fontSize: isMobile ? 11 : 12, cursor:"pointer" }}
            onClick={() => { setTrendsNiche(n.key); fetchTrends(n.key, trendsLang); }}>
            {n.label}
          </button>
        ))}
        <button
          style={{ padding:"8px 16px", borderRadius:20, background:"linear-gradient(135deg,#4f46e5,#7c3aed)", border:"none", color:"white", fontWeight:800, fontSize:12, cursor:"pointer", marginLeft:"auto" }}
          onClick={() => fetchTrends(trendsNiche, trendsLang)} disabled={trendsLoading}>
          {trendsLoading ? tr(trendsLang, "buttons.loading") : tr(trendsLang, "buttons.refresh")}
        </button>
      </div>

      {/* Sources badges */}
      {Object.keys(trendsSources).length > 0 && (
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          {Object.entries(trendsSources).map(([src, count]) => (
            <div key={src} style={{ padding:"4px 10px", borderRadius:6, background: count>0 ? "rgba(34,197,94,0.1)" : "rgba(71,85,105,0.1)", border:`1px solid ${count>0 ? "rgba(34,197,94,0.3)" : "rgba(71,85,105,0.2)"}`, fontSize:11, color: count>0 ? "#22c55e" : "#475569", fontWeight:600 }}>
              {count>0?"✓":"○"} {src} {count>0?`(${count})`:""}
            </div>
          ))}
        </div>
      )}

      {trends.length===0 && !trendsLoading && (
        <div style={{ ...st.card, textAlign:"center", padding:40 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🌍</div>
          <div style={{ color:"#64748b", fontSize:14 }}>{tr(trendsLang, "ui.trendsEmpty")}</div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {trends.map((t, i) => (
          <div key={i} style={{ ...st.card, marginTop:0, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <div style={{ fontSize:20, flexShrink:0 }}>{t.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:"#fff", fontSize:13, fontWeight:600, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace: isMobile ? "normal" : "nowrap" }}>{t.title}</div>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <span style={{ color:"#ef4444", fontSize:11, fontWeight:700 }}>{t.source}</span>
                {t.engagement>0 && <span style={{ color:"#475569", fontSize:11 }}>👥 {t.engagement.toLocaleString()}</span>}
              </div>
            </div>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              <div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:6, padding:"4px 8px", fontSize:11, fontWeight:800, color:"#ef4444" }}>{t.viralScore}</div>
              <button style={{ padding:"6px 10px", borderRadius:8, background:"linear-gradient(135deg,#dc2626,#991b1b)", border:"none", color:"white", fontSize:11, fontWeight:700, cursor:"pointer" }} onClick={() => useAsTopic(t.title)}>{tr(trendsLang,"ui.useAsTopic")}</button>
              <a href={t.url} target="_blank" rel="noopener noreferrer" style={{ padding:"6px 10px", borderRadius:8, background:"transparent", border:"1px solid rgba(220,38,38,0.3)", color:"#ef4444", fontSize:11, fontWeight:700, textDecoration:"none" }}>{tr(trendsLang,"ui.viewSource")}</a>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
