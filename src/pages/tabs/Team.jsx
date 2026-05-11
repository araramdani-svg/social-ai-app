import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

export default function Team({ trendsLang, isMobile, projects, autoPosts, scheduledPosts, workspace }) {
  return (
    <>
      <PageHeader tabKey="team" trendsLang={trendsLang} isMobile={isMobile} />
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            {[
              [tr(trendsLang, "ui.statProjects"), projects.length,       "#ef4444"],
              [tr(trendsLang, "ui.queued"),       autoPosts.length,      "#f59e0b"],
              [tr(trendsLang, "ui.scheduled"),    scheduledPosts.length, "#22c55e"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ ...st.card, marginTop:0, padding:14 }}>
                <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px" }}>{label}</div>
                <div style={{ color, fontSize:26, fontWeight:800, marginTop:6 }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ ...st.card, marginTop:0, padding:16 }}>
            <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{tr(trendsLang, "ui.workspace")}</div>
            <div style={{ color:"#ef4444", fontSize:18, fontWeight:800 }}>{workspace || "PERSONAL"}</div>
          </div>

          <div style={{ ...st.card, marginTop:0, flex:1, display:"flex", flexDirection:"column", gap:10 }}>
            <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px", marginBottom:4 }}>{tr(trendsLang, "ui.teamMembers")}</h3>
            {[
              { name:"You",             role:"ADMIN",     status:"online",  color:"#22c55e" },
              { name:"Content Writer",  role:"EDITOR",    status:"idle",    color:"#f59e0b" },
              { name:"Social Manager",  role:"PUBLISHER", status:"offline", color:"#475569" },
            ].map((m, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(220,38,38,0.08)", paddingBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:m.color }} />
                  <div>
                    <div style={{ color:"#fff", fontSize:13, fontWeight:600 }}>{m.name}</div>
                    <div style={{ color:"#64748b", fontSize:11 }}>{m.role}</div>
                  </div>
                </div>
                <span style={{ color:m.color, fontSize:11, fontWeight:700 }}>{m.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...st.card, marginTop:0, display:"flex", flexDirection:"column", gap:12, overflowY:"auto", maxHeight: isMobile ? 300 : "unset" }}>
          <h3 style={{ color:"#ef4444", fontSize:12, letterSpacing:"1.5px" }}>{tr(trendsLang, "ui.teamActivity")}</h3>
          {[
            { user:"You",             action:"Generated post",         time:"just now",  color:"#22c55e" },
            { user:"Content Writer",  action:"Saved draft",            time:"5 min ago", color:"#f59e0b" },
            { user:"You",             action:"Scheduled LinkedIn post", time:"12 min ago",color:"#22c55e" },
            { user:"Social Manager",  action:"Published to Threads",   time:"1 hr ago",  color:"#3b82f6" },
            { user:"Content Writer",  action:"Analyzed post",          time:"2 hr ago",  color:"#f59e0b" },
          ].map((a, i) => (
            <div key={i} style={{ borderBottom:"1px solid rgba(220,38,38,0.08)", paddingBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ color:a.color, fontSize:12, fontWeight:700 }}>{a.user}</span>
                <span style={{ color:"#475569", fontSize:11 }}>{a.time}</span>
              </div>
              <p style={{ color:"#94a3b8", fontSize:13 }}>{a.action}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
