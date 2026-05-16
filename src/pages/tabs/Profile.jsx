import { useState } from "react";
import { t as tr } from "../../translations.js";
import { st, PageHeader, ConfirmModal } from "./shared.js";

export default function Profile({
  trendsLang, isMobile, token,
  onShowOnboarding,
  profileSection, setProfileSection,
  profileMsg, setProfileMsg, profileLoading,
  currentPassword, setCurrentPassword,
  newPassword, setNewPassword,
  confirmPassword, setConfirmPassword,
  newEmail, setNewEmail,
  userPlan, projects, stats, workspace,
  changePassword, changeEmailAddress, deleteAccount,
  setPage, showToast
}) {
  const [confirm, setConfirm] = useState(null);
  const getPlanColor = (plan) => plan === "Business" ? "#a855f7" : plan === "Pro" ? "#ef4444" : "#475569";
  const getPlanIcon  = (plan) => plan === "Business" ? "🏢" : plan === "Pro" ? "⚡" : "🆓";

  const SECTIONS = [
    { key:"account",      icon:"👤", label: tr(trendsLang, "profile.menuAccount") },
    { key:"subscription", icon:"💳", label: tr(trendsLang, "profile.menuSubscription") },
    { key:"password",     icon:"🔐", label: tr(trendsLang, "profile.menuPassword") },
    { key:"email",        icon:"✉️", label: tr(trendsLang, "profile.menuEmail") },
    { key:"danger",       icon:"⚠️", label: tr(trendsLang, "profile.menuDanger") },
  ];

  const cancelSubscription = async () => {
    setConfirm({
      message: tr(trendsLang, "profile.cancelConfirm"),
      confirmLabel: tr(trendsLang, "profile.cancelSubscription") || "Annuler l'abonnement",
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch("https://social-ai-app-production.up.railway.app/stripe/cancel", {
            method:"POST", headers:{ Authorization:`Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) showToast(tr(trendsLang, "messages.subscriptionCanceled"));
        } catch { showToast("Error"); }
      }
    });
  };

  const getEmail = () => {
    try { return JSON.parse(atob(token.split(".")[1])).email; }
    catch { return "—"; }
  };

  return (
    <>
      <PageHeader tabKey="profile" trendsLang={trendsLang} isMobile={isMobile} />
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", gap:20 }}>

        {/* Sidebar gauche */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ ...st.card, marginTop:0, padding:16, borderLeft:`3px solid ${getPlanColor(userPlan.plan)}`, marginBottom:8 }}>
            <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:6 }}>{tr(trendsLang, "profile.currentPlan")}</div>
            <div style={{ color: getPlanColor(userPlan.plan), fontSize:18, fontWeight:900, letterSpacing:"1px" }}>
              {getPlanIcon(userPlan.plan)} {userPlan.plan.toUpperCase()}{userPlan.interval ? ` · ${userPlan.interval}` : ""}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ color:"#ef4444", fontSize:20, fontWeight:800 }}>{projects.length}</div>
                <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1px" }}>{tr(trendsLang, "ui.statProjects")}</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ color:"#22c55e", fontSize:20, fontWeight:800 }}>{stats.posts}</div>
                <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1px" }}>POSTS</div>
              </div>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection: isMobile ? "row" : "column", gap: isMobile ? 6 : 8, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            {SECTIONS.map(s => (
              <button key={s.key}
                style={{
                  padding: isMobile ? "10px 12px" : "12px 16px", borderRadius:8,
                  background: profileSection === s.key ? "rgba(220,38,38,0.1)" : "transparent",
                  border:"none",
                  borderLeft: !isMobile && profileSection === s.key ? "3px solid #ef4444" : isMobile ? "none" : "3px solid transparent",
                  borderBottom: isMobile && profileSection === s.key ? "2px solid #ef4444" : isMobile ? "2px solid transparent" : "none",
                  color: profileSection === s.key ? "#ef4444" : "#64748b",
                  fontWeight:700, fontSize: isMobile ? 12 : 13, cursor:"pointer", textAlign:"left",
                  display:"flex", alignItems:"center", gap: isMobile ? 4 : 10,
                  flex: isMobile ? "1 1 auto" : "unset",
                }}
                onClick={() => { setProfileSection(s.key); setProfileMsg({ type:"", text:"" }); }}>
                <span>{s.icon}</span> {!isMobile && s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu droite */}
        <div style={{ ...st.card, marginTop:0, padding: isMobile ? 20 : 32, overflowY:"auto" }}>
          {profileMsg.text && (
            <div style={{ padding:"12px 16px", borderRadius:8, marginBottom:20, background: profileMsg.type==="success" ? "rgba(34,197,94,0.1)" : "rgba(220,38,38,0.1)", border:`1px solid ${profileMsg.type==="success" ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.3)"}`, color: profileMsg.type==="success" ? "#22c55e" : "#ef4444", fontSize:13, fontWeight:600 }}>
              {profileMsg.text}
            </div>
          )}

          {/* Account */}
          {profileSection === "account" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:0 }}>{tr(trendsLang, "profile.accountTitle")}</h2>
              <div style={{ display:"grid", gap:16 }}>
                {[
                  { label: tr(trendsLang, "profile.fieldEmail"),     value: token && token !== "guest" ? getEmail() : "—" },
                  { label: tr(trendsLang, "profile.fieldMember"),    value: "May 2026" },
                  { label: tr(trendsLang, "profile.fieldWorkspace"), value: workspace || "PERSONAL" },
                  { label: tr(trendsLang, "profile.fieldPlan"),      value: `${userPlan.plan}${userPlan.interval ? " · " + userPlan.interval : ""}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding:"16px 20px", background:"#0f172a", borderRadius:10, border:"1px solid rgba(220,38,38,0.15)", borderLeft:"3px solid rgba(220,38,38,0.4)" }}>
                    <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:6 }}>{label.toUpperCase()}</div>
                    <div style={{ color:"#fff", fontSize:14, fontWeight:600 }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:16 }}>
                <button
                  style={{ ...st.buttonSecondary, margin:0, fontSize:12, padding:"10px 18px", display:"flex", alignItems:"center", gap:8 }}
                  onClick={onShowOnboarding}
                >
                  {tr(trendsLang, 'onboarding.reviewOnboarding')}
                </button>
              </div>
            </div>
          )}

          {/* Password */}
          {profileSection === "password" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:480 }}>
              <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:0 }}>{tr(trendsLang, "profile.passwordTitle")}</h2>
              <p style={{ color:"#64748b", fontSize:13, margin:0 }}>{tr(trendsLang, "profile.passwordHint")}</p>
              {[
                { label: tr(trendsLang, "profile.labelCurrentPw"), value:currentPassword, setter:setCurrentPassword },
                { label: tr(trendsLang, "profile.labelNewPw"),     value:newPassword,     setter:setNewPassword },
                { label: tr(trendsLang, "profile.labelConfirmPw"), value:confirmPassword, setter:setConfirmPassword },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{label.toUpperCase()}</div>
                  <input type="password" value={value} onChange={e => setter(e.target.value)} placeholder={`Enter ${label.toLowerCase()}`} style={{ ...st.input, maxWidth:"100%", marginBottom:0 }} />
                </div>
              ))}
              <button style={{ ...st.button, margin:0, opacity: profileLoading ? 0.6 : 1 }} onClick={changePassword} disabled={profileLoading}>
                {profileLoading ? tr(trendsLang, "profile.updating") : tr(trendsLang, "profile.updatePassword")}
              </button>
            </div>
          )}

          {/* Email */}
          {profileSection === "email" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:480 }}>
              <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:0 }}>{tr(trendsLang, "profile.emailTitle")}</h2>
              <p style={{ color:"#64748b", fontSize:13, margin:0 }}>{tr(trendsLang, "profile.emailHint")}</p>
              <div>
                <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{tr(trendsLang, "profile.labelCurrentEmail").toUpperCase()}</div>
                <div style={{ padding:"14px 18px", background:"#0f172a", borderRadius:10, border:"1px solid rgba(220,38,38,0.15)", color:"#94a3b8", fontSize:14 }}>
                  {token && token !== "guest" ? getEmail() : "—"}
                </div>
              </div>
              <div>
                <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{tr(trendsLang, "profile.labelNewEmail").toUpperCase()}</div>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder={tr(trendsLang, "profile.labelNewEmail")} style={{ ...st.input, maxWidth:"100%", marginBottom:0 }} />
              </div>
              <button style={{ ...st.button, margin:0, opacity: profileLoading ? 0.6 : 1 }} onClick={changeEmailAddress} disabled={profileLoading}>
                {profileLoading ? tr(trendsLang, "profile.updating") : tr(trendsLang, "profile.updateEmail")}
              </button>
            </div>
          )}

          {/* Subscription */}
          {profileSection === "subscription" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:480 }}>
              <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:0 }}>💳 {tr(trendsLang, "profile.menuSubscription")}</h2>
              <div style={{ padding:20, border:`1px solid ${userPlan?.plan==="Free" ? "rgba(71,85,105,0.3)" : "rgba(220,38,38,0.3)"}`, borderRadius:12, background:"rgba(255,255,255,0.02)" }}>
                <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{tr(trendsLang, "profile.currentPlan")}</div>
                <div style={{ color: userPlan?.plan==="Free" ? "#64748b" : "#ef4444", fontSize:22, fontWeight:900 }}>
                  {userPlan?.plan==="Free" ? "🆓 FREE" : userPlan?.plan==="Business" ? "💎 BUSINESS" : "⚡ PRO"}
                  {userPlan?.interval && <span style={{ fontSize:13, color:"#64748b", fontWeight:400, marginLeft:8 }}>· {userPlan.interval==="year" ? tr(trendsLang, "profile.intervalYear") : tr(trendsLang, "profile.intervalMonth")}</span>}
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {userPlan?.plan !== "Pro"      && <button style={{ ...st.button, margin:0 }} onClick={() => setPage && setPage("pricing")}>⚡ {tr(trendsLang, "profile.upgradePro")}</button>}
                {userPlan?.plan !== "Business" && <button style={{ ...st.button, margin:0, background:"linear-gradient(135deg,#f97316,#c2410c)" }} onClick={() => setPage && setPage("pricing")}>💎 {tr(trendsLang, "profile.upgradeBusiness")}</button>}
                {userPlan?.plan !== "Free"     && <button style={{ ...st.buttonSecondary, margin:0 }} onClick={cancelSubscription}>🚫 {tr(trendsLang, "profile.cancelSubscription")}</button>}
              </div>
              <p style={{ color:"#334155", fontSize:12 }}>{tr(trendsLang, "profile.cancelNote")}</p>
            </div>
          )}

          {/* Danger */}
          {profileSection === "danger" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:480 }}>
              <h2 style={{ color:"#ef4444", fontSize:18, fontWeight:800, margin:0 }}>{`⚠️ ${tr(trendsLang, "profile.dangerTitle")}`}</h2>
              <p style={{ color:"#64748b", fontSize:13, margin:0 }}>{tr(trendsLang, "ui.dangerWarning")}</p>
              <div style={{ padding:24, border:"1px solid rgba(220,38,38,0.3)", borderRadius:12, background:"rgba(220,38,38,0.05)" }}>
                <div style={{ color:"#fff", fontWeight:700, marginBottom:8 }}>{tr(trendsLang, "ui.deleteAccountLabel")}</div>
                <div style={{ color:"#64748b", fontSize:13, marginBottom:16 }}>{tr(trendsLang, "ui.deleteAccountDesc")}</div>
                <button style={{ ...st.buttonDanger, margin:0 }} onClick={() => setConfirm({
                  message: "Are you sure? This action is irreversible. All your data will be permanently deleted.",
                  confirmLabel: "🗑️ DELETE MY ACCOUNT",
                  onConfirm: () => { setConfirm(null); deleteAccount(); }
                })}>
                  🗑️ DELETE MY ACCOUNT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
          danger={true}
        />
      )}
    </>
  );
}
