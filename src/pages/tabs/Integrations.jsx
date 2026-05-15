import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

export default function Integrations({
  trendsLang, isMobile, token, post,
  linkedinStatus, threadsStatus, twitterStatus,
  linkedinPosting, threadsPosting, twitterPosting,
  connectLinkedin, disconnectLinkedin, postToLinkedin,
  connectThreads,  disconnectThreads,  postToThreads,
  connectTwitter,  disconnectTwitter,  postToTwitter,
  showToast
}) {
  return (
    <>
      <PageHeader tabKey="integrations" trendsLang={trendsLang} isMobile={isMobile} />
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:20, alignContent:"start" }}>

        {/* ── LinkedIn ── */}
        <div style={{ ...st.card, marginTop:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <div style={{ width:40, height:40, borderRadius:8, background:"#0077b5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:900, color:"white" }}>in</div>
            <div>
              <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>LinkedIn</div>
              <div style={{ color:"#64748b", fontSize:12 }}>{tr(trendsLang,"ui.linkedinDesc")}</div>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background: linkedinStatus.connected ? "#22c55e" : "#475569" }} />
              <span style={{ color: linkedinStatus.connected ? "#22c55e" : "#475569", fontSize:11, fontWeight:700 }}>
                {linkedinStatus.connected ? tr(trendsLang,"labels.connected") : tr(trendsLang,"labels.disconnected")}
              </span>
            </div>
          </div>
          {linkedinStatus.connected ? (
            <>
              <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#22c55e" }}>
                ✓ Connected as <strong>{linkedinStatus.name}</strong>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button style={{ ...st.button, margin:0, flex:1, opacity: linkedinPosting ? 0.6:1 }} onClick={postToLinkedin} disabled={linkedinPosting}>
                  {linkedinPosting ? tr(trendsLang,"buttons.publishing") : tr(trendsLang,"buttons.postNow")}
                </button>
                <button style={{ ...st.buttonSecondary, margin:0 }} onClick={disconnectLinkedin}>{tr(trendsLang,"buttons.disconnect")}</button>
              </div>
            </>
          ) : (
            <>
              <a
                href={`https://social-ai-app-production.up.railway.app/linkedin/connect?token=${encodeURIComponent(token)}`}
                style={{ ...st.button, margin:0, width:"100%", display:"block", textAlign:"center", textDecoration:"none", boxSizing:"border-box" }}
              >
                {tr(trendsLang,"buttons.connectLinkedin")}
              </a>
              <p style={{ color:"#475569", fontSize:11, marginTop:8, textAlign:"center" }}>✓ Works on Safari, Chrome & Firefox</p>
            </>
          )}
        </div>

        {/* ── Threads ── */}
        <div style={{ ...st.card, marginTop:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <div style={{ width:40, height:40, borderRadius:8, background:"linear-gradient(135deg,#000,#333)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:900, color:"white" }}>🧵</div>
            <div>
              <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>Threads</div>
              <div style={{ color:"#64748b", fontSize:12 }}>{tr(trendsLang,"ui.linkedinDesc")}</div>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background: threadsStatus.connected ? "#22c55e" : "#475569" }} />
              <span style={{ color: threadsStatus.connected ? "#22c55e" : "#475569", fontSize:11, fontWeight:700 }}>
                {threadsStatus.connected ? tr(trendsLang,"labels.connected") : tr(trendsLang,"labels.disconnected")}
              </span>
            </div>
          </div>
          {threadsStatus.connected ? (
            <>
              <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#22c55e" }}>
                ✓ Connected as <strong>@{threadsStatus.username}</strong>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button style={{ ...st.button, margin:0, flex:1, opacity: threadsPosting ? 0.6:1 }} onClick={postToThreads} disabled={threadsPosting}>
                  {threadsPosting ? tr(trendsLang,"buttons.publishing") : tr(trendsLang,"buttons.postNow")}
                </button>
                <button style={{ ...st.buttonSecondary, margin:0 }} onClick={disconnectThreads}>{tr(trendsLang,"buttons.disconnect")}</button>
              </div>
            </>
          ) : (
            <>
              <a
                href={`https://social-ai-app-production.up.railway.app/threads/connect?token=${encodeURIComponent(token)}`}
                style={{ ...st.button, margin:0, width:"100%", display:"block", textAlign:"center", textDecoration:"none", boxSizing:"border-box" }}
              >
                {tr(trendsLang,"buttons.connectThreads")}
              </a>
              <p style={{ color:"#475569", fontSize:11, marginTop:8, textAlign:"center" }}>✓ Works on Safari, Chrome & Firefox</p>
            </>
          )}
        </div>

        {/* ── X (Twitter) ── */}
        <div style={{ ...st.card, marginTop:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <div style={{ width:40, height:40, borderRadius:8, background:"#000", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:900, color:"white" }}>𝕏</div>
            <div>
              <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>X (Twitter)</div>
              <div style={{ color:"#64748b", fontSize:12 }}>{tr(trendsLang,"integrations.xDesc")}</div>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background: twitterStatus?.connected ? "#22c55e" : "#475569" }} />
              <span style={{ color: twitterStatus?.connected ? "#22c55e" : "#475569", fontSize:11, fontWeight:700 }}>
                {twitterStatus?.connected ? tr(trendsLang,"labels.connected") : tr(trendsLang,"labels.disconnected")}
              </span>
            </div>
          </div>
          {twitterStatus?.connected ? (
            <>
              <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#22c55e" }}>
                ✓ Connected as <strong>@{twitterStatus.username}</strong>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button style={{ ...st.button, margin:0, flex:1, opacity: twitterPosting ? 0.6:1 }} onClick={postToTwitter} disabled={twitterPosting}>
                  {twitterPosting ? tr(trendsLang,"buttons.publishing") : tr(trendsLang,"buttons.postNow")}
                </button>
                <button style={{ ...st.buttonSecondary, margin:0 }} onClick={disconnectTwitter}>{tr(trendsLang,"buttons.disconnect")}</button>
              </div>
            </>
          ) : (
            <>
              <a
                href={`https://social-ai-app-production.up.railway.app/twitter/connect?token=${encodeURIComponent(token)}`}
                style={{ ...st.button, margin:0, width:"100%", display:"block", textAlign:"center", textDecoration:"none", boxSizing:"border-box", background:"linear-gradient(135deg,#1a1a1a,#000)" }}
              >
                {tr(trendsLang,"integrations.connectX")}
              </a>
              <p style={{ color:"#475569", fontSize:11, marginTop:8, textAlign:"center" }}>✓ Works on Safari, Chrome & Firefox</p>
            </>
          )}
        </div>

        {/* ── Coming soon ── */}
        {[
          { name:"Facebook",  icon:"f",  color:"#1877f2", sub: tr(trendsLang,"ui.subFacebook") },
          { name:"Instagram",  icon:"📸", color:"#e1306c", sub: tr(trendsLang,"ui.subInstagram") },
          { name:"TikTok",     icon:"🎵", color:"#ff0050", sub: tr(trendsLang,"ui.subTikTok") },
        ].map((p) => (
          <div key={p.name} style={{ ...st.card, marginTop:0, opacity:0.5 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <div style={{ width:40, height:40, borderRadius:8, background:p.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:"white" }}>{p.icon}</div>
              <div>
                <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>{p.name}</div>
                <div style={{ color:"#64748b", fontSize:12 }}>{p.sub}</div>
              </div>
              <div style={{ marginLeft:"auto" }}>
                <span style={{ color:"#475569", fontSize:11, fontWeight:700, background:"rgba(71,85,105,0.2)", padding:"4px 8px", borderRadius:4 }}>{tr(trendsLang,"labels.comingSoon")}</span>
              </div>
            </div>
            <button style={{ ...st.buttonSecondary, margin:0, width:"100%", cursor:"not-allowed" }} disabled>{tr(trendsLang,"ui.comingSoonLabel")}</button>
          </div>
        ))}
      </div>
    </>
  );
}
