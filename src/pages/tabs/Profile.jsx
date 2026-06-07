import { useState, useEffect } from "react";
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
  firstName, setFirstName,
  lastName, setLastName,
  displayName, setDisplayName,
  userPlan, projects, stats, workspace,
  changePassword, changeEmailAddress, deleteAccount, saveProfile,
  setPage, showToast,
  planManagedBy, managedByTeamName, managedByOwnerEmail,
}) {
  const [confirm, setConfirm] = useState(null);
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");

  // ── MFA + Sécurité ───────────────────────────────────────────────────────
  const [mfaEnabled,  setMfaEnabled]  = useState(false);
  const [mfaLoading,  setMfaLoading]  = useState(false);
  const [mfaPassword, setMfaPassword] = useState("");
  const [mfaMsg,      setMfaMsg]      = useState(null);
  const [pwDaysLeft,  setPwDaysLeft]  = useState(null);
  const [pwChangedAt, setPwChangedAt] = useState(null);
  const [secLoading,  setSecLoading]  = useState(true);
  const [teamRole,    setTeamRole]    = useState(null);

  useEffect(() => {
    if (!token) return;
    // MFA status
    fetch(`${API}/auth/mfa/status`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setMfaEnabled(d.mfa_enabled || false);
        setPwDaysLeft(d.days_until_expiry ?? null);
        setPwChangedAt(d.password_changed_at || null);
        setSecLoading(false);
      })
      .catch(() => setSecLoading(false));
    // Rôle team
    if (planManagedBy === "team") {
      fetch(`${API}/team/my-team-view`, { headers:{ Authorization:`Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.myRole) setTeamRole(d.myRole); })
        .catch(() => {});
    }
  }, [token]);

  const toggleMFA = async () => {
    if (!mfaPassword) { setMfaMsg({ type:"error", text: tr(trendsLang,"profile.mfaPasswordLabel")||"Password required" }); return; }
    setMfaLoading(true); setMfaMsg(null);
    try {
      const r = await fetch(`${API}/auth/mfa/toggle`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ enable: !mfaEnabled, currentPassword: mfaPassword }),
      });
      const d = await r.json();
      if (!r.ok) { setMfaMsg({ type:"error", text: d.error || "Error" }); }
      else {
        setMfaEnabled(d.mfa_enabled);
        setMfaPassword("");
        setMfaMsg({ type:"success", text: d.mfa_enabled ? tr(trendsLang,"profile.mfaActive") : tr(trendsLang,"profile.mfaInactive") });
        logUserAction(d.mfa_enabled ? "mfa_enabled" : "mfa_disabled");
        setTimeout(() => setMfaMsg(null), 3000);
      }
    } catch { setMfaMsg({ type:"error", text:"Server error" }); }
    setMfaLoading(false);
  };

  // States locaux pour l'édition — ne pas modifier le parent avant Save
  const [localFirstName,   setLocalFirstName]   = useState(firstName   || "");
  const [localLastName,    setLocalLastName]     = useState(lastName    || "");
  const [localDisplayName, setLocalDisplayName] = useState(displayName || "");

  // Sync si les props changent (ex: chargement initial)
  useEffect(() => { setLocalFirstName(firstName   || ""); }, [firstName]);
  useEffect(() => { setLocalLastName(lastName     || ""); }, [lastName]);
  useEffect(() => { setLocalDisplayName(displayName || ""); }, [displayName]);

  // Sauvegarder directement depuis Profile sans dépendre du parent
  const handleSaveName = async () => {
    try {
      const r = await fetch(`${API}/auth/save-profile`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ first_name: localFirstName, last_name: localLastName, display_name: localDisplayName }),
      });
      const d = await r.json();
      if (r.ok) {
        setFirstName(localFirstName);
        setLastName(localLastName);
        setDisplayName(localDisplayName);
        setProfileMsg({ type:"success", text:"✅ Profile saved successfully" });
        setTimeout(() => setProfileMsg(null), 3000);
        logUserAction("update_profile", { fields: ["firstName", "lastName", "displayName"] });
      } else {
        setProfileMsg({ type:"error", text: d.message || "Failed to update profile" });
      }
    } catch {
      showToast("❌ Server error");
    }
  };

  const API = "https://social-ai-app-production.up.railway.app";

  const logUserAction = (action, details = {}) => {
    if (!token || token === "guest") return;
    fetch(`${API}/auth/user-log`, {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ action, details }),
    }).catch(() => {});
  };

  const getPlanColor = (plan) => plan === "Business" ? "#a855f7" : plan === "Pro" ? "#ef4444" : "#475569";
  const getPlanIcon  = (plan) => plan === "Business" ? "🏢" : plan === "Pro" ? "⚡" : "🆓";

  const SECTIONS = [
    { key:"account",      icon:"👤", label: tr(trendsLang, "profile.menuAccount") },
    { key:"subscription", icon:"💳", label: tr(trendsLang, "profile.menuSubscription") },
    { key:"password",     icon:"🔐", label: tr(trendsLang, "profile.menuPassword") },
    { key:"security",     icon:"🛡️", label: tr(trendsLang, "profile.menuSecurity") || "Sécurité" },
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
          const res = await fetch(`${API}/stripe/cancel`, {
            method:"POST", headers:{ Authorization:`Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            showToast(tr(trendsLang, "messages.subscriptionCanceled"));
            logUserAction("cancel_subscription", { plan: userPlan?.plan });
            // Forcer un reload de la page pour rafraîchir userPlan
            setTimeout(() => window.location.reload(), 1500);
          } else {
            showToast("❌ " + (data.message || "Erreur lors de l'annulation"));
          }
        } catch { showToast("❌ Erreur serveur"); }
      }
    });
  };

  const getEmail = () => {
    try { return JSON.parse(atob(token.split(".")[1])).email; }
    catch { return "—"; }
  };

  // Handler local qui injecte emailCurrentPassword avant d'appeler le parent
  const handleChangeEmail = () => {
    changeEmailAddress(emailCurrentPassword);
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
                onClick={() => {
                  setProfileSection(s.key);
                  setProfileMsg({ type:"", text:"" });
                  setEmailCurrentPassword("");
                }}>
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

              {/* Champs prénom / nom éditables */}
              <div>
                <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:10 }}>{tr(trendsLang,"profile.identity")}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                  <div>
                    <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1px", marginBottom:6 }}>{tr(trendsLang,"profile.firstName")}</div>
                    <input type="text" value={localFirstName} onChange={e => setLocalFirstName(e.target.value)} placeholder={tr(trendsLang,"profile.firstName")} style={{ ...st.input, maxWidth:"100%", marginBottom:0 }} />
                  </div>
                  <div>
                    <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1px", marginBottom:6 }}>{tr(trendsLang,"profile.lastName")}</div>
                    <input type="text" value={localLastName} onChange={e => setLocalLastName(e.target.value)} placeholder={tr(trendsLang,"profile.lastName")} style={{ ...st.input, maxWidth:"100%", marginBottom:0 }} />
                  </div>
                </div>

                {/* DisplayName */}
                <div style={{ marginBottom:10 }}>
                  <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1px", marginBottom:6 }}>{tr(trendsLang,"profile.displayName") === "profile.displayName" ? "DISPLAY NAME" : tr(trendsLang,"profile.displayName")}</div>
                  <input
                    type="text"
                    value={localDisplayName}
                    onChange={e => setLocalDisplayName(e.target.value)}
                    placeholder={tr(trendsLang,"profile.displayNamePlaceholder") === "profile.displayNamePlaceholder" ? "Name shown in GrowthPILOT" : tr(trendsLang,"profile.displayNamePlaceholder")}
                    autoComplete="off"
                    style={{ ...st.input, maxWidth:"100%", marginBottom:0 }}
                  />
                  <div style={{ color:"#334155", fontSize:10, marginTop:4 }}>
                    {tr(trendsLang,"profile.displayNameHint") === "profile.displayNameHint" ? "This name will appear on your Home and Dashboard" : tr(trendsLang,"profile.displayNameHint")}
                  </div>
                </div>

                <button style={{ ...st.button, margin:0, fontSize:12, padding:"10px 18px", opacity: profileLoading ? 0.6 : 1 }} onClick={handleSaveName} disabled={profileLoading}>
                  {profileLoading ? tr(trendsLang, "profile.updating") : tr(trendsLang,"profile.saveName")}
                </button>
              </div>

              {/* Infos lecture seule */}
              <div style={{ display:"grid", gap:12 }}>
                {planManagedBy === "team" && (
                  <div style={{ padding:"12px 18px", background:"rgba(139,92,246,0.08)", borderRadius:10, border:"1px solid rgba(139,92,246,0.2)", borderLeft:"3px solid #8b5cf6" }}>
                    <div style={{ color:"#8b5cf6", fontSize:10, letterSpacing:"1.5px", marginBottom:5 }}>{tr(trendsLang,"profile.managedAccountLabel")||"MANAGED ACCOUNT"}</div>
                    <div style={{ color:"#e2e8f0", fontSize:13, fontWeight:600 }}>
                      {managedByTeamName ? `Team: ${managedByTeamName}` : "Agency Team"}
                    </div>
                    <div style={{ color:"#64748b", fontSize:11, marginTop:2 }}>
                      {tr(trendsLang,"profile.managedBy")||"Managed by"} {managedByOwnerEmail || "your agency"}
                    </div>
                    {/* Rôle dans la team */}
                    {teamRole && (
                      <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ color:"#64748b", fontSize:10, letterSpacing:"1px" }}>{tr(trendsLang,"profile.teamRoleLabel")||"YOUR ROLE"}</span>
                        <span style={{ background:`rgba(245,158,11,0.12)`, border:`1px solid ${{ admin:"#f59e0b", editor:"#60a5fa", publisher:"#22c55e" }[teamRole.toLowerCase()]||"#f59e0b"}44`, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:800, color:{ admin:"#f59e0b", editor:"#60a5fa", publisher:"#22c55e" }[teamRole.toLowerCase()]||"#f59e0b" }}>
                          {teamRole.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {[
                  { label: tr(trendsLang, "profile.fieldEmail"),     value: token && token !== "guest" ? getEmail() : "—" },
                  { label: tr(trendsLang, "profile.fieldWorkspace"), value: workspace || tr(trendsLang,"profile.personalWorkspace") },
                  {
                    label: tr(trendsLang, "profile.fieldPlan"),
                    value: `${userPlan.plan}${userPlan.interval ? " · " + userPlan.interval : ""}`,
                    badge: planManagedBy === "team"
                      ? { text: tr(trendsLang,"profile.planAgencyManaged")||"Agency Managed", color:"#8b5cf6" }
                      : null
                  },
                ].map(({ label, value, badge }) => (
                  <div key={label} style={{ padding:"14px 18px", background:"#0f172a", borderRadius:10, border:"1px solid rgba(220,38,38,0.1)", borderLeft:"3px solid rgba(220,38,38,0.3)" }}>
                    <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:5 }}>{label.toUpperCase()}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                      <div style={{ color:"#fff", fontSize:14, fontWeight:600 }}>{value}</div>
                      {badge && (
                        <span style={{ background:`rgba(139,92,246,0.12)`, border:`1px solid rgba(139,92,246,0.3)`, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:badge.color }}>
                          🏢 {badge.text}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                style={{ ...st.buttonSecondary, margin:0, fontSize:12, padding:"10px 18px", display:"flex", alignItems:"center", gap:8 }}
                onClick={onShowOnboarding}
              >
                {tr(trendsLang, 'onboarding.reviewOnboarding')}
              </button>
            </div>
          )}

          {/* Sécurité */}
          {profileSection === "security" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:520 }}>
              <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:0 }}>🛡️ {tr(trendsLang,"profile.menuSecurityTitle")||"Security & Authentication"}</h2>

              {secLoading ? (
                <div style={{ textAlign:"center", padding:40, color:"#475569" }}>⏳</div>
              ) : (<>

                {/* MFA */}
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"20px 22px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, gap:12 }}>
                    <div>
                      <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:14, marginBottom:4 }}>{tr(trendsLang,"profile.mfaLabel")}</div>
                      <div style={{ color:"#475569", fontSize:12, lineHeight:1.6 }}>{tr(trendsLang,"profile.mfaDesc")}</div>
                    </div>
                    <div style={{ flexShrink:0, background: mfaEnabled ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)", border:`1px solid ${mfaEnabled ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.2)"}`, borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:800, color: mfaEnabled ? "#22c55e" : "#ef4444", whiteSpace:"nowrap" }}>
                      {mfaEnabled ? tr(trendsLang,"profile.mfaActive") : tr(trendsLang,"profile.mfaInactive")}
                    </div>
                  </div>

                  <div style={{ marginBottom:10 }}>
                    <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:6 }}>{tr(trendsLang,"profile.mfaPasswordLabel")?.toUpperCase()}</div>
                    <input
                      type="password"
                      value={mfaPassword}
                      onChange={e => setMfaPassword(e.target.value)}
                      placeholder={tr(trendsLang,"profile.mfaPasswordPlaceholder")}
                      style={{ ...st.input, maxWidth:"100%", marginBottom:0 }}
                    />
                  </div>

                  {mfaMsg && (
                    <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:10, background: mfaMsg.type==="success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border:`1px solid ${mfaMsg.type==="success" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`, color: mfaMsg.type==="success" ? "#22c55e" : "#ef4444", fontSize:12, fontWeight:600 }}>
                      {mfaMsg.text}
                    </div>
                  )}

                  <button
                    style={{ ...st.button, margin:0, background: mfaEnabled ? "linear-gradient(135deg,#475569,#334155)" : "linear-gradient(135deg,#22c55e,#16a34a)", opacity: mfaLoading ? 0.6 : 1 }}
                    onClick={toggleMFA}
                    disabled={mfaLoading || !mfaPassword}
                  >
                    {mfaLoading ? "⏳..." : mfaEnabled ? tr(trendsLang,"profile.mfaDisable") : tr(trendsLang,"profile.mfaEnable")}
                  </button>
                </div>

                {/* Politique mot de passe */}
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"20px 22px" }}>
                  <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:14, marginBottom:6 }}>{tr(trendsLang,"profile.pwPolicyLabel")}</div>
                  <div style={{ color:"#475569", fontSize:12, lineHeight:1.6, marginBottom:16 }}>{tr(trendsLang,"profile.pwPolicyDesc")}</div>

                  {pwDaysLeft !== null && (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {pwDaysLeft === 0 ? (
                        <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, padding:"10px 14px", color:"#ef4444", fontSize:12, fontWeight:700 }}>
                          {tr(trendsLang,"profile.pwExpired")}
                        </div>
                      ) : (
                        <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                          <div style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8, padding:"10px 16px", flex:1 }}>
                            <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1px", marginBottom:4 }}>{tr(trendsLang,"profile.pwExpiresIn")?.toUpperCase()}</div>
                            <div style={{ color: pwDaysLeft < 10 ? "#ef4444" : pwDaysLeft < 20 ? "#f59e0b" : "#22c55e", fontSize:22, fontWeight:900, lineHeight:1 }}>
                              {pwDaysLeft} <span style={{ fontSize:12, fontWeight:400 }}>{tr(trendsLang,"profile.pwExpiresDays")}</span>
                            </div>
                            <div style={{ height:4, background:"rgba(255,255,255,0.05)", borderRadius:4, marginTop:8, overflow:"hidden" }}>
                              <div style={{ width:`${Math.min(100,(pwDaysLeft/60)*100)}%`, height:"100%", borderRadius:4, background: pwDaysLeft < 10 ? "#ef4444" : pwDaysLeft < 20 ? "#f59e0b" : "#22c55e", transition:"width 0.6s ease" }} />
                            </div>
                          </div>
                          {pwChangedAt && (
                            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"10px 16px", flex:1 }}>
                              <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1px", marginBottom:4 }}>{tr(trendsLang,"profile.pwChangedOn")?.toUpperCase()}</div>
                              <div style={{ color:"#e2e8f0", fontSize:13, fontWeight:600 }}>{new Date(pwChangedAt).toLocaleDateString()}</div>
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        style={{ ...st.buttonSecondary, margin:0, fontSize:12 }}
                        onClick={() => setProfileSection("password")}
                      >
                        🔑 {tr(trendsLang,"profile.updatePassword")}
                      </button>
                    </div>
                  )}
                </div>
              </>)}
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
                  <input type="password" value={value} onChange={e => setter(e.target.value)} placeholder={`${tr(trendsLang,"profile.enterField")} ${label.toLowerCase()}`} style={{ ...st.input, maxWidth:"100%", marginBottom:0 }} />
                </div>
              ))}
              <button style={{ ...st.button, margin:0, opacity: profileLoading ? 0.6 : 1 }} onClick={() => { changePassword(); logUserAction("change_password"); }} disabled={profileLoading}>
                {profileLoading ? tr(trendsLang, "profile.updating") : tr(trendsLang, "profile.updatePassword")}
              </button>
            </div>
          )}

          {/* Email */}
          {profileSection === "email" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:480 }}>
              <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:0 }}>{tr(trendsLang, "profile.emailTitle")}</h2>
              <p style={{ color:"#64748b", fontSize:13, margin:0 }}>{tr(trendsLang, "profile.emailHint")}</p>

              {/* Email actuel (lecture seule) */}
              <div>
                <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{tr(trendsLang, "profile.labelCurrentEmail").toUpperCase()}</div>
                <div style={{ padding:"14px 18px", background:"#0f172a", borderRadius:10, border:"1px solid rgba(220,38,38,0.15)", color:"#94a3b8", fontSize:14 }}>
                  {token && token !== "guest" ? getEmail() : "—"}
                </div>
              </div>

              {/* Nouveau email */}
              <div>
                <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>{tr(trendsLang, "profile.labelNewEmail").toUpperCase()}</div>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder={tr(trendsLang, "profile.labelNewEmail")}
                  style={{ ...st.input, maxWidth:"100%", marginBottom:0 }}
                />
              </div>

              {/* Mot de passe actuel — confirmation de sécurité */}
              <div>
                <div style={{ color:"#64748b", fontSize:11, letterSpacing:"1.5px", marginBottom:8 }}>
                  {tr(trendsLang, "profile.labelCurrentPw").toUpperCase()}
                </div>
                <input
                  type="password"
                  value={emailCurrentPassword}
                  onChange={e => setEmailCurrentPassword(e.target.value)}
                  placeholder={tr(trendsLang, "profile.labelCurrentPw")}
                  style={{ ...st.input, maxWidth:"100%", marginBottom:0 }}
                />
              </div>

              {/* Bandeau info sécurité */}
              <div style={{
                display:"flex", alignItems:"flex-start", gap:10,
                padding:"12px 16px", borderRadius:8,
                background:"rgba(234,179,8,0.06)",
                border:"1px solid rgba(234,179,8,0.2)",
              }}>
                <span style={{ fontSize:16, marginTop:1 }}>🔒</span>
                <p style={{ color:"#a16207", fontSize:12, margin:0, lineHeight:1.6 }}>
                  {tr(trendsLang, "profile.emailSecurityNote") ||
                    "A confirmation link will be sent to your new address. Your current email will also receive a security alert. The change only takes effect after confirmation."}
                </p>
              </div>

              <button
                style={{ ...st.button, margin:0, opacity: profileLoading ? 0.6 : 1 }}
                onClick={() => { handleChangeEmail(); logUserAction("change_email"); }}
                disabled={profileLoading || !newEmail || !emailCurrentPassword}
              >
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
                  message: tr(trendsLang,"profile.deleteConfirm"),
                  confirmLabel: tr(trendsLang,"profile.deleteBtn"),
                  onConfirm: () => { setConfirm(null); deleteAccount(); }
                })}>
                  {tr(trendsLang,"profile.deleteBtn")}
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
