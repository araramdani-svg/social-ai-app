import { t as tr } from "../../translations.js";
import { st, PageHeader } from "./shared.js";

const API = "https://social-ai-app-production.up.railway.app";

export default function Integrations({
  trendsLang, isMobile, token, post,
  linkedinStatus,   threadsStatus,   twitterStatus,   instagramStatus,   facebookStatus,
  linkedinPosting,  threadsPosting,  twitterPosting,  instagramPosting,  facebookPosting,
  connectLinkedin,  disconnectLinkedin,  postToLinkedin,
  connectThreads,   disconnectThreads,   postToThreads,
  connectTwitter,   disconnectTwitter,   postToTwitter,
  connectInstagram, disconnectInstagram, postToInstagram,
  connectFacebook,  disconnectFacebook,  postToFacebook,
  showToast
}) {

  // ── Helper carte intégration ──────────────────────────────────────────────
  const IntegrationCard = ({
    icon, iconBg, name, desc, status, posting,
    connectHref, connectLabel,
    onPost, onDisconnect, connectedAs,
    badge,
  }) => (
    <div style={{ ...st.card, marginTop:0 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <div style={{ width:40, height:40, borderRadius:8, background:iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:"white", flexShrink:0 }}>
          {icon}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>{name}</div>
            {badge && <span style={{ background:"rgba(139,92,246,0.15)", border:"1px solid rgba(139,92,246,0.3)", borderRadius:10, padding:"1px 7px", fontSize:9, fontWeight:700, color:"#8b5cf6", letterSpacing:"1px" }}>{badge}</span>}
          </div>
          <div style={{ color:"#64748b", fontSize:12 }}>{desc}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background: status?.connected ? "#22c55e" : "#475569" }} />
          <span style={{ color: status?.connected ? "#22c55e" : "#475569", fontSize:11, fontWeight:700 }}>
            {status?.connected ? tr(trendsLang,"labels.connected") : tr(trendsLang,"labels.disconnected")}
          </span>
        </div>
      </div>

      {status?.connected ? (
        <>
          <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#22c55e" }}>
            ✓ {tr(trendsLang,"labels.connectedAs")} <strong>{connectedAs}</strong>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button style={{ ...st.button, margin:0, flex:1, opacity: posting ? 0.6:1 }} onClick={onPost} disabled={posting}>
              {posting ? tr(trendsLang,"buttons.publishing") : tr(trendsLang,"buttons.postNow")}
            </button>
            <button style={{ ...st.buttonSecondary, margin:0 }} onClick={onDisconnect}>{tr(trendsLang,"buttons.disconnect")}</button>
          </div>
        </>
      ) : (
        <>
          <a
            href={connectHref}
            style={{ ...st.button, margin:0, width:"100%", display:"block", textAlign:"center", textDecoration:"none", boxSizing:"border-box" }}
          >
            {connectLabel}
          </a>
          <p style={{ color:"#475569", fontSize:11, marginTop:8, textAlign:"center" }}>✓ Works on Safari, Chrome & Firefox</p>
        </>
      )}
    </div>
  );

  // ── Coming Soon card ──────────────────────────────────────────────────────
  const ComingSoonCard = ({ icon, iconBg, name, desc }) => (
    <div style={{ ...st.card, marginTop:0, opacity:0.5 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <div style={{ width:40, height:40, borderRadius:8, background:iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:"white" }}>{icon}</div>
        <div>
          <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>{name}</div>
          <div style={{ color:"#64748b", fontSize:12 }}>{desc}</div>
        </div>
        <div style={{ marginLeft:"auto" }}>
          <span style={{ color:"#475569", fontSize:11, fontWeight:700, background:"rgba(71,85,105,0.2)", padding:"4px 8px", borderRadius:4 }}>{tr(trendsLang,"labels.comingSoon")}</span>
        </div>
      </div>
      <button style={{ ...st.buttonSecondary, margin:0, width:"100%", cursor:"not-allowed" }} disabled>{tr(trendsLang,"ui.comingSoonLabel")}</button>
    </div>
  );

  return (
    <>
      <PageHeader tabKey="integrations" trendsLang={trendsLang} isMobile={isMobile} />
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:20, alignContent:"start" }}>

        {/* LinkedIn */}
        <IntegrationCard
          icon="in" iconBg="#0077b5"
          name="LinkedIn" desc={tr(trendsLang,"ui.linkedinDesc")}
          status={linkedinStatus} posting={linkedinPosting}
          connectHref={`${API}/linkedin/connect?token=${encodeURIComponent(token)}`}
          connectLabel={tr(trendsLang,"buttons.connectLinkedin")}
          connectedAs={linkedinStatus?.name}
          onPost={postToLinkedin} onDisconnect={disconnectLinkedin}
        />

        {/* Threads */}
        <IntegrationCard
          icon="🧵" iconBg="linear-gradient(135deg,#000,#333)"
          name="Threads" desc={tr(trendsLang,"ui.linkedinDesc")}
          status={threadsStatus} posting={threadsPosting}
          connectHref={`${API}/threads/connect?token=${encodeURIComponent(token)}`}
          connectLabel={tr(trendsLang,"buttons.connectThreads")}
          connectedAs={`@${threadsStatus?.username}`}
          onPost={postToThreads} onDisconnect={disconnectThreads}
        />

        {/* X (Twitter) */}
        <IntegrationCard
          icon="𝕏" iconBg="#000"
          name="X (Twitter)" desc={tr(trendsLang,"integrations.xDesc")}
          status={twitterStatus} posting={twitterPosting}
          connectHref={`${API}/twitter/connect?token=${encodeURIComponent(token)}`}
          connectLabel={tr(trendsLang,"integrations.connectX")}
          connectedAs={`@${twitterStatus?.username}`}
          onPost={postToTwitter} onDisconnect={disconnectTwitter}
        />

        {/* Instagram */}
        <IntegrationCard
          icon="📸" iconBg="linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)"
          name="Instagram" desc={tr(trendsLang,"integrations.igDesc")}
          status={instagramStatus} posting={instagramPosting}
          connectHref={`${API}/instagram/connect?token=${encodeURIComponent(token)}`}
          connectLabel={tr(trendsLang,"integrations.connectIg")}
          connectedAs={`@${instagramStatus?.username}`}
          onPost={postToInstagram} onDisconnect={disconnectInstagram}
          badge="NEW"
        />

        {/* Facebook */}
        <IntegrationCard
          icon="f" iconBg="#1877f2"
          name="Facebook" desc={tr(trendsLang,"ui.subFacebook")}
          status={facebookStatus} posting={facebookPosting}
          connectHref={`${API}/facebook/connect?token=${encodeURIComponent(token)}`}
          connectLabel="Connect Facebook"
          connectedAs={facebookStatus?.pageName || facebookStatus?.userName}
          onPost={postToFacebook} onDisconnect={disconnectFacebook}
          badge="NEW"
        />

        {/* TikTok — Coming soon */}
        <ComingSoonCard icon="🎵" iconBg="#ff0050" name="TikTok" desc={tr(trendsLang,"ui.subTikTok")} />
      </div>
    </>
  );
}
