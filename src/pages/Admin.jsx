// src/pages/Admin.jsx
// GrowthPILOT — Sprint 4 : Admin Dashboard
// Accessible uniquement avec admin@growthpilot.admin

import { useState, useEffect, useCallback } from "react";
import { ConfirmModal } from "./tabs/shared.js";

const API = "https://social-ai-app-production.up.railway.app";

const PLANS = ["Free", "Pro", "Business", "Agency"];
const PLAN_COLORS = { Free:"#64748b", Pro:"#3b82f6", Business:"#f59e0b", Agency:"#8b5cf6" };
const PLAN_LIMITS = { Free: 5, Pro: 100, Business: Infinity, Agency: Infinity };
const planLimit = (plan) => { const l = PLAN_LIMITS[plan] ?? 5; return l === Infinity ? "∞" : l; };

const ACTION_LABELS = {
  // Admin actions
  edit_user:             { label:"✏️ Édition user",       color:"#3b82f6" },
  ban_user:              { label:"🚫 Banni",               color:"#ef4444" },
  unban_user:            { label:"✅ Débanni",             color:"#22c55e" },
  reset_quota:           { label:"↺ Reset quota",          color:"#f59e0b" },
  delete_user:           { label:"🗑️ Suppression user",   color:"#ef4444" },
  verify_email:          { label:"✓ Email vérifié",        color:"#22c55e" },
  resend_verification:   { label:"📧 Email renvoyé",       color:"#f97316" },
  force_password_reset:  { label:"🔐 Reset forcé",         color:"#f97316" },
  send_password_reset:   { label:"📧 Lien reset envoyé",   color:"#f97316" },
  create_admin:          { label:"🛡️ Admin créé",          color:"#8b5cf6" },
  delete_admin:          { label:"🗑️ Admin supprimé",      color:"#ef4444" },
  reset_admin_password:  { label:"🔑 Reset mdp admin",     color:"#f59e0b" },
  // Billing actions (depuis admin_logs)
  plan_upgrade:                    { label:"⬆️ Plan upgradé",          color:"#22c55e" },
  cancel_subscription:             { label:"❌ Abonnement annulé",      color:"#ef4444" },
  subscription_renewed:            { label:"🔄 Renouvellement",         color:"#22c55e" },
  payment_failed:                  { label:"⚠️ Paiement échoué",        color:"#ef4444" },
  renewal_reminder_3d:             { label:"📧 Rappel J-3",             color:"#f59e0b" },
  renewal_reminder_30d:            { label:"📧 Rappel J-30",            color:"#f97316" },
  grace_period_warning_24h:        { label:"⏰ Grace warning",          color:"#ef4444" },
  grace_period_expired_downgrade:  { label:"⬇️ Grace → Free",          color:"#ef4444" },
  winback_7d:                      { label:"📨 Win-back +7j",           color:"#8b5cf6" },
  winback_30d:                     { label:"📨 Win-back +30j",          color:"#8b5cf6" },
  winback_90d:                     { label:"📨 Win-back +90j",          color:"#8b5cf6" },
  // Team actions
  post_assigned:                   { label:"🎯 Post assigné",           color:"#60a5fa" },
  post_approved:                   { label:"✅ Post approuvé",           color:"#22c55e" },
  post_rejected:                   { label:"❌ Post rejeté",             color:"#ef4444" },
  post_comment_added:              { label:"💬 Commentaire",            color:"#60a5fa" },
  post_comment_deleted:            { label:"🗑️ Commentaire supprimé",   color:"#ef4444" },
  post_linked_to_client:           { label:"🏢 Lié à client",           color:"#a78bfa" },
  post_unlinked_from_client:       { label:"🏢 Délié client",           color:"#64748b" },
  team_calendar_add:               { label:"📅 Cal. équipe ajout",      color:"#22c55e" },
  team_calendar_published:         { label:"📤 Cal. équipe publié",     color:"#3b82f6" },
  team_permissions_updated:        { label:"🔐 Permissions mises à jour",color:"#8b5cf6" },
  agency_analytics_view:           { label:"📊 Analytics consultés",    color:"#ec4899" },
  // Override admin
  override_expired:                { label:"⏰ Override expiré",        color:"#f59e0b" },
  edit_user_plan:                  { label:"✏️ Plan modifié",           color:"#3b82f6" },
  // Webhooks
  webhook_subscribed:              { label:"🔗 Webhook connecté",       color:"#38bdf8" },
  webhook_deleted:                 { label:"🗑️ Webhook supprimé",      color:"#ef4444" },
  // Promo & Referral
  promo_code_created:              { label:"🎁 Code créé",              color:"#22c55e" },
  promo_code_deleted:              { label:"🗑️ Code supprimé",         color:"#ef4444" },
  promo_code_toggled:              { label:"🔄 Code toggle",            color:"#f59e0b" },
  promo_code_used:                 { label:"🎟️ Code utilisé",          color:"#a78bfa" },
  promo_expired:                   { label:"⏰ Code/accès expiré",      color:"#f97316" },
  referral_reward:                 { label:"🏆 Récompense parrainage",  color:"#f59e0b" },
};

const s = {
  page:    { minHeight:"100vh", background:"#0a0f1e", color:"#e2e8f0", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header:  { background:"#0f172a", borderBottom:"1px solid rgba(220,38,38,0.3)", padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between" },
  content: { padding:"32px", maxWidth:1400, margin:"0 auto" },
  card:    { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 },
  input:   { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 14px", color:"#e2e8f0", fontSize:13, outline:"none", fontFamily:"inherit" },
  select:  { background:"#0f172a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 14px", color:"#e2e8f0", fontSize:13, outline:"none", fontFamily:"inherit", cursor:"pointer" },
  btn:     { background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", borderRadius:8, color:"#fff", fontSize:11, fontWeight:700, letterSpacing:"1px", padding:"9px 16px", cursor:"pointer" },
  btnSm:   { border:"none", borderRadius:6, fontSize:10, fontWeight:700, padding:"5px 10px", cursor:"pointer" },
  label:   { fontSize:10, fontWeight:700, letterSpacing:"1.5px", color:"#64748b", marginBottom:4, display:"block" },
  badge:   (plan) => ({ background:`${PLAN_COLORS[plan] || "#64748b"}20`, border:`1px solid ${PLAN_COLORS[plan] || "#64748b"}40`, borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, color:PLAN_COLORS[plan] || "#64748b" }),
  tabBtn:  (active) => ({ padding:"10px 20px", background:"transparent", border:"none", borderBottom: active ? "2px solid #ef4444" : "2px solid transparent", color: active ? "#ef4444" : "#475569", fontWeight:700, fontSize:11, letterSpacing:"1px", cursor:"pointer" }),
};

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ ...s.card, textAlign:"center" }}>
      <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:8 }}>{label}</div>
      <div style={{ color: color || "#e2e8f0", fontSize:28, fontWeight:900 }}>{value}</div>
      {sub && <div style={{ color:"#475569", fontSize:11, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function ResetPasswordModal({ user, token, onClose }) {
  const API = "https://social-ai-app-production.up.railway.app";
  const [newPassword, setNewPassword] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [message,     setMessage]     = useState(null);

  const forceReset = async () => {
    if (newPassword.length < 8) { setMessage({ type:"error", text:"Minimum 8 caractères" }); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/auth/admin/force-password`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ userId: user.id, newPassword }),
      });
      const d = await r.json();
      if (d.success) setMessage({ type:"success", text:`✅ Mot de passe modifié pour ${d.email}` });
      else setMessage({ type:"error", text: d.message || "Erreur" });
    } catch { setMessage({ type:"error", text:"Erreur serveur" }); }
    setLoading(false);
  };

  const sendReset = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/auth/admin/send-reset`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ userId: user.id }),
      });
      const d = await r.json();
      if (d.success) setMessage({ type:"success", text:`✅ Email de reset envoyé à ${d.email}` });
      else setMessage({ type:"error", text: d.message || "Erreur" });
    } catch { setMessage({ type:"error", text:"Erreur serveur" }); }
    setLoading(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"linear-gradient(145deg,#1a2235,#111827)", border:"1px solid rgba(220,38,38,0.2)", borderRadius:16, padding:28, width:"100%", maxWidth:420, color:"white" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ color:"#ef4444", fontSize:13, fontWeight:800 }}>🔑 Reset mot de passe</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#475569", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:10, padding:"10px 14px", marginBottom:20, fontSize:12, color:"#94a3b8" }}>
          👤 <strong style={{ color:"#e2e8f0" }}>{user.email}</strong>
        </div>

        {message && (
          <div style={{ padding:"10px 14px", borderRadius:10, marginBottom:16, fontSize:12, fontWeight:700,
            background: message.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            color: message.type === "success" ? "#22c55e" : "#ef4444",
            border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
          }}>
            {message.text}
          </div>
        )}

        {/* Option 1 — Reset forcé */}
        <div style={{ marginBottom:16 }}>
          <div style={{ color:"#64748b", fontSize:10, fontWeight:700, letterSpacing:"1px", marginBottom:8 }}>OPTION 1 — RESET FORCÉ</div>
          <input
            style={{ display:"block", width:"100%", padding:"11px 14px", background:"#0f172a", border:"1px solid rgba(220,38,38,0.2)", borderRadius:10, color:"white", fontSize:13, boxSizing:"border-box", marginBottom:8 }}
            type="password"
            placeholder="Nouveau mot de passe (min. 8 caractères)"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          <button
            onClick={forceReset}
            disabled={loading}
            style={{ width:"100%", padding:"11px", background:"linear-gradient(135deg,#dc2626,#991b1b)", border:"none", borderRadius:10, color:"white", fontWeight:700, fontSize:13, cursor:"pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "⏳..." : "🔐 Forcer le nouveau mot de passe"}
          </button>
        </div>

        <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"16px 0" }} />

        {/* Option 2 — Email reset */}
        <div>
          <div style={{ color:"#64748b", fontSize:10, fontWeight:700, letterSpacing:"1px", marginBottom:8 }}>OPTION 2 — EMAIL DE RESET</div>
          <div style={{ color:"#475569", fontSize:11, marginBottom:10, lineHeight:1.5 }}>
            Envoie un lien de réinitialisation à l'utilisateur. Le lien expire dans 1 heure.
          </div>
          <button
            onClick={sendReset}
            disabled={loading}
            style={{ width:"100%", padding:"11px", background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.3)", borderRadius:10, color:"#60a5fa", fontWeight:700, fontSize:13, cursor:"pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "⏳..." : "📧 Envoyer le lien de reset"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditUserModal({ user, token, onClose, onSave }) {
  const [plan,             setPlan]             = useState(user.plan || "Free");
  const [quota,            setQuota]            = useState(user.generations_count || 0);
  const [overrideDuration, setOverrideDuration] = useState("30d");
  const [overrideReason,   setOverrideReason]   = useState("");
  const [saving,           setSaving]           = useState(false);
  const [msg,              setMsg]              = useState(null);

  const isOverride    = user.admin_override;
  const overrideExpires = user.override_expires_at;
  const planChanged   = plan !== user.plan;

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const body = { generations_count: quota };
      if (planChanged) {
        body.plan = plan;
        if (plan !== "Free") {
          body.override_duration = overrideDuration;
          body.override_reason   = overrideReason || null;
        }
      }
      const r = await fetch(`${API}/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.success) { setMsg({ type:"success", text:"✅ Sauvegardé" }); setTimeout(() => { onSave(); onClose(); }, 800); }
      else setMsg({ type:"error", text: d.error || "Erreur" });
    } catch { setMsg({ type:"error", text:"Erreur serveur" }); }
    setSaving(false);
  };

  const resetQuota = async () => {
    await fetch(`${API}/admin/users/${user.id}/reset-quota`, {
      method: "POST", headers: { Authorization:`Bearer ${token}` },
    });
    setQuota(0);
  };

  const toggleBan = async () => {
    await fetch(`${API}/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ banned: !user.banned }),
    });
    onSave(); onClose();
  };

  const revokeOverride = async () => {
    await fetch(`${API}/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ plan: "Free" }),
    });
    onSave(); onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ ...s.card, width:"100%", maxWidth:480, background:"#111827", border:"1px solid rgba(220,38,38,0.25)", boxShadow:"0 30px 80px rgba(0,0,0,0.6)", maxHeight:"90vh", overflowY:"auto" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ color:"#e2e8f0", fontWeight:800, fontSize:15 }}>✏️ Edit User</div>
          <button style={{ background:"transparent", border:"none", color:"#475569", fontSize:20, cursor:"pointer" }} onClick={onClose}>✕</button>
        </div>

        <div style={{ color:"#64748b", fontSize:12, marginBottom:16, background:"rgba(255,255,255,0.03)", padding:"10px 14px", borderRadius:8 }}>
          <div style={{ color:"#e2e8f0", fontWeight:700 }}>{user.email}</div>
          <div style={{ marginTop:3 }}>ID #{user.id} · {user.had_paid_plan ? `Highest: ${user.highest_plan_ever}` : "Jamais payant"}</div>
          {user.banned && <div style={{ color:"#ef4444", fontWeight:700, marginTop:6 }}>🚫 Compte suspendu</div>}
        </div>

        {/* Override actif */}
        {isOverride && (
          <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
            <div style={{ color:"#f59e0b", fontWeight:700, fontSize:12, marginBottom:4 }}>⚠️ OVERRIDE ADMIN ACTIF</div>
            <div style={{ color:"#94a3b8", fontSize:11, lineHeight:1.6 }}>
              Plan: <strong style={{ color:"#e2e8f0" }}>{user.admin_override_plan}</strong><br/>
              {overrideExpires
                ? <>Expire le : <strong style={{ color:"#e2e8f0" }}>{new Date(overrideExpires).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</strong></>
                : <span style={{ color:"#22c55e" }}>Permanent (pas d'expiration)</span>}
              <br/>{user.override_reason && <>Raison : <em>{user.override_reason}</em></>}
            </div>
            <button onClick={revokeOverride} style={{ marginTop:8, padding:"5px 12px", borderRadius:6, border:"1px solid rgba(239,68,68,0.4)", background:"rgba(239,68,68,0.1)", color:"#ef4444", fontSize:11, fontWeight:700, cursor:"pointer" }}>
              ✕ Révoquer l'override
            </button>
          </div>
        )}

        <span style={s.label}>PLAN {planChanged && <span style={{ color:"#f59e0b", marginLeft:8 }}>⚠️ Modifié</span>}</span>
        <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
          {PLANS.map(p => (
            <button key={p} style={{ ...s.btnSm, background:plan===p?`${PLAN_COLORS[p]}20`:"rgba(255,255,255,0.04)", border:`1px solid ${plan===p?PLAN_COLORS[p]:"rgba(255,255,255,0.1)"}`, color:plan===p?PLAN_COLORS[p]:"#94a3b8", padding:"7px 14px", fontSize:11 }} onClick={()=>setPlan(p)}>{p}</button>
          ))}
        </div>

        {/* Options override */}
        {planChanged && plan !== "Free" && (
          <div style={{ background:"rgba(96,165,250,0.06)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:10, padding:"14px", marginBottom:16 }}>
            <div style={{ color:"#60a5fa", fontSize:11, fontWeight:700, marginBottom:10 }}>🎁 OVERRIDE ADMIN — Aucun paiement Stripe</div>
            <span style={s.label}>DURÉE</span>
            <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
              {[{value:"7d",label:"7 jours"},{value:"30d",label:"30 jours"},{value:"90d",label:"90 jours"},{value:"permanent",label:"♾️ Permanent"}].map(opt => (
                <button key={opt.value}
                  style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${overrideDuration===opt.value?"rgba(96,165,250,0.5)":"rgba(255,255,255,0.08)"}`, background:overrideDuration===opt.value?"rgba(96,165,250,0.15)":"rgba(255,255,255,0.02)", color:overrideDuration===opt.value?"#60a5fa":"#475569", fontSize:11, fontWeight:700, cursor:"pointer" }}
                  onClick={()=>setOverrideDuration(opt.value)}>{opt.label}</button>
              ))}
            </div>
            <span style={s.label}>RAISON (optionnelle)</span>
            <input style={{ ...s.input, width:"100%", fontSize:12, boxSizing:"border-box" }} placeholder="ex: compensation bug, partenaire, test..." value={overrideReason} onChange={e=>setOverrideReason(e.target.value)} />
            <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(0,0,0,0.2)", borderRadius:8, color:"#64748b", fontSize:11 }}>
              ℹ️ Accès <strong style={{ color:PLAN_COLORS[plan] }}>{plan}</strong> sans paiement.
              {overrideDuration==="permanent" ? " Permanent jusqu'à révocation." : ` Expire dans ${overrideDuration==="7d"?"7 jours":overrideDuration==="30d"?"30 jours":"90 jours"}.`}
            </div>
          </div>
        )}

        <span style={s.label}>GÉNÉRATIONS UTILISÉES <span style={{ color:"#475569", fontWeight:400 }}>/ {planLimit(plan)}</span></span>
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          <input style={{ ...s.input, flex:1 }} type="number" value={quota} onChange={e=>setQuota(parseInt(e.target.value)||0)} />
          <button style={{ ...s.btnSm, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", color:"#22c55e", padding:"9px 14px" }} onClick={resetQuota}>Reset à 0</button>
        </div>

        {msg && <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:12, background:msg.type==="success"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)", color:msg.type==="success"?"#22c55e":"#ef4444", fontSize:12 }}>{msg.text}</div>}

        <div style={{ display:"flex", gap:10 }}>
          <button style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"#94a3b8", fontSize:11, fontWeight:700, padding:"10px", cursor:"pointer" }} onClick={onClose}>Annuler</button>
          <button style={{ ...s.btnSm, padding:"10px 14px", background:user.banned?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)", border:user.banned?"1px solid rgba(34,197,94,0.4)":"1px solid rgba(239,68,68,0.4)", color:user.banned?"#22c55e":"#ef4444", fontSize:11, borderRadius:8 }} onClick={toggleBan}>{user.banned?"✅ Débannir":"🚫 Bannir"}</button>
          <button style={{ ...s.btn, flex:2, opacity:saving?0.7:1 }} onClick={save} disabled={saving}>{saving?"💾 Enregistrement...":"💾 Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Onglet Team Logs ─────────────────────────────────────────────────────────
function TeamLogsTab({ token }) {
  const [logs,    setLogs]    = useState([]);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);

  const TEAM_QUICK_FILTERS = [
    { label:"Tout",        value:"" },
    { label:"✅ Approbations", value:"post_approved" },
    { label:"❌ Rejets",       value:"post_rejected" },
    { label:"🎯 Assignations", value:"post_assigned" },
    { label:"💬 Commentaires", value:"post_comment" },
    { label:"🔗 Webhooks",     value:"webhook" },
    { label:"📅 Calendrier",   value:"team_calendar" },
    { label:"🏢 Clients",      value:"post_linked" },
    { label:"🔐 Permissions",  value:"team_permissions" },
  ];

  const [filterAction, setFilterAction] = useState("");

  const fetchLogs = useCallback(async (p = 1, action = filterAction) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, type: "team" });
    if (action) params.append("action_filter", action);
    const r = await fetch(`${API}/admin/logs?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
    const d = await r.json();
    setLogs(d.logs || []); setPages(d.pages || 1); setPage(p);
    setLoading(false);
  }, [token, filterAction]);

  useEffect(() => { fetchLogs(1); }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {TEAM_QUICK_FILTERS.map(f => (
          <button key={f.value} onClick={() => { setFilterAction(f.value); fetchLogs(1, f.value); }}
            style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${filterAction===f.value?"rgba(96,165,250,0.5)":"rgba(255,255,255,0.08)"}`, background:filterAction===f.value?"rgba(96,165,250,0.1)":"rgba(255,255,255,0.02)", color:filterAction===f.value?"#60a5fa":"#475569", fontSize:11, fontWeight:700, cursor:"pointer" }}>
            {f.label}
          </button>
        ))}
        <button onClick={() => fetchLogs(1)} style={{ padding:"5px 12px", borderRadius:20, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"#64748b", fontSize:11, cursor:"pointer" }}>🔄</button>
      </div>
      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"rgba(255,255,255,0.03)" }}>
              {["DATE","USER","ACTION","DÉTAILS"].map(h => (
                <th key={h} style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} style={{ textAlign:"center", padding:40, color:"#475569" }}>Chargement...</td></tr>}
            {!loading && logs.length === 0 && <tr><td colSpan={4} style={{ textAlign:"center", padding:40, color:"#475569" }}>Aucun événement team</td></tr>}
            {logs.map(log => {
              const cfg = ACTION_LABELS[log.action] || { label:log.action, color:"#94a3b8" };
              let details = "—";
              try {
                const d = typeof log.details==="string" ? JSON.parse(log.details) : log.details;
                if (d?.post_id) details = `Post #${d.post_id}`;
                if (d?.member_id) details = `Member #${d.member_id}`;
                if (d?.client_name) details = `Client: ${d.client_name}`;
                if (d?.type) details = `Type: ${d.type}`;
                if (d?.role) details += ` · Role: ${d.role}`;
              } catch {}
              return (
                <tr key={log.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding:"12px 16px", color:"#475569", fontSize:11, whiteSpace:"nowrap" }}>{new Date(log.created_at).toLocaleString("fr-FR")}</td>
                  <td style={{ padding:"12px 16px", color:"#94a3b8", fontSize:11 }}>{log.target_email || `#${log.target_user_id}`}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ background:`${cfg.color}15`, border:`1px solid ${cfg.color}40`, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:cfg.color }}>{cfg.label}</span>
                  </td>
                  <td style={{ padding:"12px 16px", color:"#64748b", fontSize:11 }}>{details}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pages > 1 && <div style={{ display:"flex", justifyContent:"center", gap:6, padding:14 }}>{Array.from({length:pages},(_,i)=>i+1).map(p=><button key={p} style={{ ...s.btnSm, background:page===p?"rgba(96,165,250,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${page===p?"rgba(96,165,250,0.4)":"rgba(255,255,255,0.1)"}`, color:page===p?"#60a5fa":"#64748b", width:32, height:32 }} onClick={()=>fetchLogs(p)}>{p}</button>)}</div>}
      </div>
    </div>
  );
}

// ─── Onglet Overrides Admin ───────────────────────────────────────────────────
function OverridesTab({ token }) {
  const [overrides, setOverrides] = useState([]);
  const [loading,   setLoading]   = useState(false);

  const fetchOverrides = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/overrides`, { headers:{ Authorization:`Bearer ${token}` } });
      const d = await r.json();
      setOverrides(d.overrides || []);
    } catch {}
    setLoading(false);
  };

  const revoke = async (userId) => {
    await fetch(`${API}/admin/users/${userId}`, {
      method:"PATCH",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ plan:"Free" }),
    });
    fetchOverrides();
  };

  useEffect(() => { fetchOverrides(); }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:14 }}>🎁 Overrides admin actifs</div>
          <div style={{ color:"#475569", fontSize:12, marginTop:2 }}>Plans accordés manuellement sans paiement Stripe</div>
        </div>
        <button onClick={fetchOverrides} style={{ padding:"7px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"#64748b", fontSize:11, cursor:"pointer" }}>🔄</button>
      </div>
      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:"#475569" }}>Chargement...</div>
      ) : overrides.length === 0 ? (
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"40px 24px", textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>✅</div>
          <div style={{ color:"#475569", fontSize:14, fontWeight:700 }}>Aucun override actif</div>
          <div style={{ color:"#334155", fontSize:12, marginTop:4 }}>Tous les plans sont liés à des abonnements Stripe réels.</div>
        </div>
      ) : (
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr style={{ background:"rgba(255,255,255,0.03)" }}>
              {["USER","PLAN","EXPIRATION","RAISON","ACCORDÉ PAR","ACTION"].map(h=>(
                <th key={h} style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {overrides.map(o => {
                const isExpiringSoon = o.override_expires_at && new Date(o.override_expires_at) < new Date(Date.now()+3*86400000);
                const isExpired      = o.override_expires_at && new Date(o.override_expires_at) < new Date();
                return (
                  <tr key={o.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", background:isExpired?"rgba(239,68,68,0.04)":isExpiringSoon?"rgba(245,158,11,0.04)":"transparent" }}>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ color:"#e2e8f0", fontSize:12 }}>{o.email}</div>
                      <div style={{ color:"#475569", fontSize:10 }}>#{o.id} · {o.had_paid_plan?`Highest: ${o.highest_plan_ever}`:"Jamais payant"}</div>
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ background:`${PLAN_COLORS[o.plan]||"#64748b"}20`, border:`1px solid ${PLAN_COLORS[o.plan]||"#64748b"}40`, borderRadius:10, padding:"2px 8px", fontSize:10, fontWeight:700, color:PLAN_COLORS[o.plan]||"#64748b" }}>{o.plan}</span>
                    </td>
                    <td style={{ padding:"12px 16px", color:isExpired?"#ef4444":isExpiringSoon?"#f59e0b":"#94a3b8", fontSize:11, fontWeight:isExpiringSoon?700:400 }}>
                      {o.override_expires_at ? <>{isExpired?"⚠️ Expiré — ":"⏰ "}{new Date(o.override_expires_at).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</> : <span style={{ color:"#22c55e", fontWeight:700 }}>♾️ Permanent</span>}
                    </td>
                    <td style={{ padding:"12px 16px", color:"#64748b", fontSize:11 }}>{o.override_reason||"—"}</td>
                    <td style={{ padding:"12px 16px", color:"#475569", fontSize:11 }}>{o.granted_by_email||"—"}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <button onClick={()=>revoke(o.id)} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid rgba(239,68,68,0.4)", background:"rgba(239,68,68,0.1)", color:"#ef4444", fontSize:10, fontWeight:700, cursor:"pointer" }}>Révoquer</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Onglet Admin Events ─────────────────────────────────────────────────────
function AdminLogsTab({ token }) {
  const [logs, setLogs] = useState([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    const r = await fetch(`${API}/admin/logs?page=${p}&type=admin`, { headers:{ Authorization:`Bearer ${token}` } });
    const d = await r.json();
    setLogs(d.logs || []); setPages(d.pages || 1); setPage(p);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchLogs(); }, []);

  const filtered = filter ? logs.filter(l => l.action?.includes(filter) || l.target_email?.includes(filter)) : logs;

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <input style={{ ...s.input, flex:1, fontSize:12 }} placeholder="🔍 Filtrer par action ou email..." value={filter} onChange={e => setFilter(e.target.value)} />
        <button style={{ ...s.btnSm, padding:"8px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#64748b" }} onClick={() => fetchLogs(1)}>🔄</button>
      </div>
      <div style={{ ...s.card, padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ background:"rgba(255,255,255,0.03)" }}>
            {["DATE","ACTION","CIBLE","DÉTAILS"].map(h => <th key={h} style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={4} style={{ textAlign:"center", padding:40, color:"#475569" }}>Chargement...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={4} style={{ textAlign:"center", padding:40, color:"#475569" }}>Aucune action enregistrée</td></tr>}
            {filtered.map(log => {
              const cfg = ACTION_LABELS[log.action] || { label: log.action, color:"#94a3b8" };
              return (
                <tr key={log.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding:"12px 16px", color:"#475569", whiteSpace:"nowrap", fontSize:11 }}>{new Date(log.created_at).toLocaleString("fr-FR")}</td>
                  <td style={{ padding:"12px 16px" }}><span style={{ background:`${cfg.color}15`, border:`1px solid ${cfg.color}40`, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:cfg.color }}>{cfg.label}</span></td>
                  <td style={{ padding:"12px 16px", color:"#94a3b8" }}>{log.target_email || `#${log.target_user_id}` || "—"}</td>
                  <td style={{ padding:"12px 16px", color:"#64748b", fontSize:11, maxWidth:300, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", cursor:"help" }} title={log.details ? (() => { try { return JSON.stringify(typeof log.details === "string" ? JSON.parse(log.details) : log.details, null, 0); } catch { return String(log.details); } })() : ""}>{log.details ? (() => { try { const d = typeof log.details === "string" ? JSON.parse(log.details) : log.details; return JSON.stringify(d, null, 0).slice(0, 150); } catch { return String(log.details).slice(0, 150); } })() : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pages > 1 && <div style={{ display:"flex", justifyContent:"center", gap:8, padding:16 }}>{Array.from({ length: pages }, (_, i) => i + 1).map(p => <button key={p} style={{ ...s.btnSm, background:page===p?"rgba(220,38,38,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${page===p?"rgba(220,38,38,0.4)":"rgba(255,255,255,0.1)"}`, color:page===p?"#ef4444":"#64748b", width:32, height:32 }} onClick={()=>fetchLogs(p)}>{p}</button>)}</div>}
      </div>
    </div>
  );
}

// ─── Onglet Actions Users (depuis admin_logs) ─────────────────────────────────
function UsersActionsTab({ token }) {
  const [logs,    setLogs]    = useState([]);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState("");

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    const r = await fetch(`${API}/admin/logs?page=${p}&type=users`, { headers:{ Authorization:`Bearer ${token}` } });
    const d = await r.json();
    setLogs(d.logs || []); setPages(d.pages || 1); setPage(p);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchLogs(); }, []);

  const filtered = filter ? logs.filter(l => l.action?.includes(filter) || l.target_email?.includes(filter)) : logs;

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <input style={{ ...s.input, flex:1, fontSize:12 }} placeholder="🔍 Filtrer par action ou email..." value={filter} onChange={e => setFilter(e.target.value)} />
        <button style={{ ...s.btnSm, padding:"8px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#64748b" }} onClick={() => fetchLogs(1)}>🔄</button>
      </div>
      <div style={{ ...s.card, padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ background:"rgba(255,255,255,0.03)" }}>
            {["DATE","ACTION","USER CIBLE","DÉTAILS"].map(h => <th key={h} style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={4} style={{ textAlign:"center", padding:40, color:"#475569" }}>Chargement...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={4} style={{ textAlign:"center", padding:40, color:"#475569" }}>Aucune action enregistrée</td></tr>}
            {filtered.map(log => {
              const cfg = ACTION_LABELS[log.action] || { label: log.action, color:"#94a3b8" };
              return (
                <tr key={log.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding:"12px 16px", color:"#475569", whiteSpace:"nowrap", fontSize:11 }}>{new Date(log.created_at).toLocaleString("fr-FR")}</td>
                  <td style={{ padding:"12px 16px" }}><span style={{ background:`${cfg.color}15`, border:`1px solid ${cfg.color}40`, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:cfg.color }}>{cfg.label}</span></td>
                  <td style={{ padding:"12px 16px", color:"#94a3b8" }}>{log.target_email || `#${log.target_user_id}` || "—"}</td>
                  <td style={{ padding:"12px 16px", color:"#64748b", fontSize:11, maxWidth:300, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", cursor:"help" }} title={log.details ? (() => { try { return JSON.stringify(typeof log.details === "string" ? JSON.parse(log.details) : log.details, null, 0); } catch { return String(log.details); } })() : ""}>{log.details ? (() => { try { const d = typeof log.details === "string" ? JSON.parse(log.details) : log.details; return JSON.stringify(d, null, 0).slice(0, 150); } catch { return String(log.details).slice(0, 150); } })() : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pages > 1 && <div style={{ display:"flex", justifyContent:"center", gap:8, padding:16 }}>{Array.from({ length: pages }, (_, i) => i + 1).map(p => <button key={p} style={{ ...s.btnSm, background:page===p?"rgba(220,38,38,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${page===p?"rgba(220,38,38,0.4)":"rgba(255,255,255,0.1)"}`, color:page===p?"#ef4444":"#64748b", width:32, height:32 }} onClick={()=>fetchLogs(p)}>{p}</button>)}</div>}
      </div>
    </div>
  );
}

// ─── Onglet Users Events ──────────────────────────────────────────────────────
const USER_ACTION_LABELS = {
  // Content
  generate_post:        { label:"✍️ Génération",          color:"#ef4444" },
  save_post:            { label:"💾 Sauvegarde",           color:"#22c55e" },
  copy_post:            { label:"📋 Copie",                color:"#64748b" },
  rewrite_post:         { label:"🔄 Réécriture",           color:"#f59e0b" },
  analyze_post:         { label:"🔍 Analyse",              color:"#8b5cf6" },
  generate_image:       { label:"🖼️ Image générée",        color:"#8b5cf6" },
  attach_media:         { label:"📎 Média attaché",        color:"#38bdf8" },
  // Projects
  create_project:       { label:"📁 Projet créé",          color:"#3b82f6" },
  delete_project:       { label:"🗑️ Projet supprimé",     color:"#ef4444" },
  rename_project:       { label:"✏️ Projet renommé",       color:"#f59e0b" },
  // Calendar
  calendar_add_card:    { label:"📅 Cal. Ajout",           color:"#22c55e" },
  calendar_delete_card: { label:"📅 Cal. Supprim.",        color:"#ef4444" },
  calendar_move_card:   { label:"📅 Cal. Déplace",         color:"#f59e0b" },
  calendar_edit_card:   { label:"📅 Cal. Édition",         color:"#64748b" },
  calendar_import_post: { label:"📅 Cal. Import",          color:"#8b5cf6" },
  // Profile
  update_profile:       { label:"👤 Profil modifié",       color:"#3b82f6" },
  change_password:      { label:"🔑 Mdp changé",           color:"#f97316" },
  change_email:         { label:"📧 Email changé",         color:"#f97316" },
  // Trends
  watch_search:         { label:"🌍 Veille",               color:"#22c55e" },
  // Billing
  plan_upgrade:                    { label:"⬆️ Plan upgradé",          color:"#22c55e" },
  cancel_subscription:             { label:"❌ Abonnement annulé",      color:"#ef4444" },
  subscription_renewed:            { label:"🔄 Renouvellement",         color:"#22c55e" },
  payment_failed:                  { label:"⚠️ Paiement échoué",        color:"#ef4444" },
  renewal_reminder_3d:             { label:"📧 Rappel J-3",             color:"#f59e0b" },
  renewal_reminder_30d:            { label:"📧 Rappel J-30",            color:"#f97316" },
  grace_period_warning_24h:        { label:"⏰ Grace warning",          color:"#ef4444" },
  grace_period_expired_downgrade:  { label:"⬇️ Grace → Free",          color:"#ef4444" },
  winback_7d:                      { label:"📨 Win-back +7j",           color:"#8b5cf6" },
  winback_30d:                     { label:"📨 Win-back +30j",          color:"#8b5cf6" },
  winback_90d:                     { label:"📨 Win-back +90j",          color:"#8b5cf6" },
  // Team
  post_assigned:                   { label:"🎯 Post assigné",           color:"#60a5fa" },
  post_assigned_to_me:             { label:"📥 Assigné à moi",          color:"#60a5fa" },
  post_approved:                   { label:"✅ Post approuvé",           color:"#22c55e" },
  post_rejected:                   { label:"❌ Post rejeté",             color:"#ef4444" },
  post_comment_added:              { label:"💬 Commentaire ajouté",      color:"#60a5fa" },
  post_comment_deleted:            { label:"🗑️ Commentaire supprimé",   color:"#ef4444" },
  post_linked_to_client:           { label:"🏢 Lié à client",           color:"#a78bfa" },
  post_unlinked_from_client:       { label:"🏢 Délié client",           color:"#64748b" },
  team_calendar_add:               { label:"📅 Cal. équipe ajout",      color:"#22c55e" },
  team_calendar_move:              { label:"📅 Cal. équipe déplace",     color:"#f59e0b" },
  team_calendar_delete:            { label:"📅 Cal. équipe supprim.",    color:"#ef4444" },
  team_view_assigned_posts:        { label:"🎯 Posts assignés vus",      color:"#64748b" },
  notif_read:                      { label:"🔔 Notifs lues",             color:"#64748b" },
  // Webhooks
  webhook_subscribed:              { label:"🔗 Webhook connecté",        color:"#38bdf8" },
  webhook_deleted:                 { label:"🗑️ Webhook supprimé",       color:"#ef4444" },
  // Team nouvelles
  team_permissions_updated:        { label:"🔐 Permissions mises à jour",color:"#8b5cf6" },
  team_calendar_published:         { label:"📤 Cal. équipe publié",      color:"#3b82f6" },
  agency_analytics_view:           { label:"📊 Analytics consultés",    color:"#ec4899" },
  // Billing override
  override_expired:                { label:"⏰ Override expiré",         color:"#f59e0b" },
};

function UserLogsTab({ token }) {
  const [logs, setLogs] = useState([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterAction, setFilterAction] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [usersList, setUsersList] = useState([]);

  // Charger la liste des users pour le filtre
  useEffect(() => {
    fetch(`${API}/admin/users?page=1`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setUsersList(d.users || []))
      .catch(() => {});
  }, [token]);

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p });
    if (filterAction) params.append("action", filterAction);
    if (filterUser)   params.append("user_id", filterUser);
    const r = await fetch(`${API}/admin/user-logs?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
    const d = await r.json();
    setLogs(d.logs || []); setPages(d.pages || 1); setPage(p);
    setLoading(false);
  }, [token, filterAction, filterUser]);

  useEffect(() => { fetchLogs(1); }, []);

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <input style={{ ...s.input, flex:1, minWidth:160, fontSize:12 }} placeholder="🔍 Filtrer par action..." value={filterAction} onChange={e => setFilterAction(e.target.value)} />
        <select
          style={{ background:"#0f172a", border:"1px solid rgba(220,38,38,0.2)", borderRadius:8, color:"white", fontSize:11, padding:"7px 10px", cursor:"pointer", maxWidth:200 }}
          value={filterUser}
          onChange={e => setFilterUser(e.target.value)}
        >
          <option value="">👤 Tous les users</option>
          {usersList.map(u => (
            <option key={u.id} value={u.id}>
              {u.display_name || [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email}
            </option>
          ))}
        </select>
        <button style={{ ...s.btnSm, padding:"0 14px", background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.3)", color:"#ef4444" }} onClick={() => fetchLogs(1)}>🔍</button>
        <button style={{ ...s.btnSm, padding:"0 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", color:"#64748b" }} onClick={() => { setFilterAction(""); setFilterUser(""); }}>✕</button>
      </div>
      <div style={{ ...s.card, padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ background:"rgba(255,255,255,0.03)" }}>
            {["DATE","USER","PLAN","ACTION","DÉTAILS"].map(h => <th key={h} style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} style={{ textAlign:"center", padding:40, color:"#475569" }}>Chargement...</td></tr>}
            {!loading && logs.length === 0 && <tr><td colSpan={5} style={{ textAlign:"center", padding:40, color:"#475569" }}>Aucune action utilisateur enregistrée</td></tr>}
            {logs.map(log => {
              const cfg = USER_ACTION_LABELS[log.action] || { label: log.action, color:"#94a3b8" };
              return (
                <tr key={log.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding:"12px 16px", color:"#475569", whiteSpace:"nowrap", fontSize:11 }}>{new Date(log.created_at).toLocaleString("fr-FR")}</td>
                  <td style={{ padding:"12px 16px", color:"#94a3b8", fontSize:11 }}>{log.user_email || `#${log.user_id}`}</td>
                  <td style={{ padding:"12px 16px" }}>{log.user_plan && <span style={{ background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.3)", borderRadius:10, padding:"2px 8px", fontSize:9, fontWeight:700, color:"#a78bfa" }}>{log.user_plan}</span>}</td>
                  <td style={{ padding:"12px 16px" }}><span style={{ background:`${cfg.color}15`, border:`1px solid ${cfg.color}40`, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:cfg.color }}>{cfg.label}</span></td>
                  <td style={{ padding:"12px 16px", fontSize:11, maxWidth:320 }}>
                    {(() => {
                      if (log.chat_content) return (
                        <div>
                          <span style={{ color:"#60a5fa", fontWeight:700, fontSize:9 }}>💬 CHAT</span>
                          <div style={{ color:"#94a3b8", marginTop:3, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{log.chat_content}</div>
                          {log.user_team_name && <div style={{ color:"#475569", fontSize:9, marginTop:2 }}>Team: {log.user_team_name}</div>}
                        </div>
                      );
                      try {
                        const d = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
                        if (!d || Object.keys(d).length === 0) return <span style={{ color:"#334155" }}>—</span>;
                        const items = [];
                        if (d.template)  items.push({ label:"Template",   val:d.template,           color:"#a78bfa" });
                        if (d.topic)     items.push({ label:"Topic",       val:d.topic,              color:"#60a5fa" });
                        if (d.lang)      items.push({ label:"Langue",      val:d.lang.toUpperCase(), color:"#22c55e" });
                        if (d.platform)  items.push({ label:"Plateforme",  val:d.platform,           color:"#f59e0b" });
                        if (d.email)     items.push({ label:"Email",       val:d.email,              color:"#94a3b8" });
                        if (d.plan)      items.push({ label:"Plan",        val:d.plan,               color:"#ef4444" });
                        if (d.team_id)   items.push({ label:"Team ID",     val:`#${d.team_id}`,      color:"#8b5cf6" });
                        if (d.members !== undefined) items.push({ label:"Membres", val:d.members,    color:"#60a5fa" });
                        if (d.promo_code) items.push({ label:"Promo",      val:d.promo_code,         color:"#f59e0b" });
                        if (d.score !== undefined)   items.push({ label:"Score",   val:d.score,      color:"#22c55e" });
                        if (d.length)    items.push({ label:"Longueur",    val:`${d.length} car.`,   color:"#475569" });
                        if (d.secure)    items.push({ label:"MFA",         val:"✓ sécurisé",         color:"#22c55e" });
                        if (items.length > 0) return (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                            {items.map(({ label, val, color }) => (
                              <span key={label} style={{ background:`${color}15`, border:`1px solid ${color}30`, borderRadius:6, padding:"1px 6px", fontSize:9, fontWeight:700, color, whiteSpace:"nowrap" }}>
                                {label}: {val}
                              </span>
                            ))}
                          </div>
                        );
                        return <span style={{ color:"#475569", fontSize:10, fontFamily:"monospace" }}>{JSON.stringify(d).slice(0,100)}</span>;
                      } catch { return <span style={{ color:"#475569", fontSize:10 }}>{String(log.details||"").slice(0,100)}</span>; }
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pages > 1 && <div style={{ display:"flex", justifyContent:"center", gap:8, padding:16 }}>{Array.from({ length: pages }, (_, i) => i + 1).map(p => <button key={p} style={{ ...s.btnSm, background:page===p?"rgba(220,38,38,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${page===p?"rgba(220,38,38,0.4)":"rgba(255,255,255,0.1)"}`, color:page===p?"#ef4444":"#64748b", width:32, height:32 }} onClick={()=>fetchLogs(p)}>{p}</button>)}</div>}
      </div>
    </div>
  );
}


// ─── Onglet Billing (depuis admin_logs) ──────────────────────────────────────
const BILLING_ACTIONS = ["plan_upgrade","cancel_subscription","subscription_renewed","payment_failed","renewal_reminder_3d","renewal_reminder_30d","grace_period_warning_24h","grace_period_expired_downgrade","winback_7d","winback_30d","winback_90d"];

function BillingLogsTab({ token }) {
  const [logs,         setLogs]         = useState([]);
  const [pages,        setPages]        = useState(1);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(false);
  const [filterAction, setFilterAction] = useState("");
  const [stats,        setStats]        = useState(null);

  const fetchLogs = useCallback(async (p = 1, action = filterAction) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, type: "billing" });
    if (action) params.append("action_filter", action);
    const r = await fetch(`${API}/admin/logs?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
    const d = await r.json();
    setLogs(d.logs || []); setPages(d.pages || 1); setPage(p);
    setLoading(false);
  }, [token, filterAction]);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/billing-stats`, { headers:{ Authorization:`Bearer ${token}` } });
      const d = await r.json();
      setStats(d);
    } catch {}
  }, [token]);

  useEffect(() => { fetchLogs(1); fetchStats(); }, []);

  const QUICK_FILTERS = [
    { label:"Tout",       value:"" },
    { label:"⬆️ Upgrades",  value:"plan_upgrade" },
    { label:"❌ Annulations",value:"cancel_subscription" },
    { label:"🔄 Renouvellements",value:"subscription_renewed" },
    { label:"⚠️ Paiements échoués",value:"payment_failed" },
    { label:"📨 Win-back", value:"winback" },
    { label:"📧 Rappels",  value:"renewal_reminder" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Stats MRR rapides */}
      {stats && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          {[
            { label:"UPGRADES (30j)",    value:stats.upgrades_30d    || 0, color:"#22c55e" },
            { label:"ANNULATIONS (30j)", value:stats.cancels_30d     || 0, color:"#ef4444" },
            { label:"PAIEMENTS ÉCHOUÉS", value:stats.failed_30d      || 0, color:"#f59e0b" },
            { label:"WIN-BACKS ENVOYÉS", value:stats.winbacks_total  || 0, color:"#8b5cf6" },
          ].map(s => (
            <div key={s.label} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderTop:`3px solid ${s.color}`, borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
              <div style={{ color:s.color, fontSize:24, fontWeight:900 }}>{s.value}</div>
              <div style={{ color:"#475569", fontSize:9, fontWeight:700, letterSpacing:"1px", marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtres rapides */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {QUICK_FILTERS.map(f => (
          <button key={f.value} onClick={() => { setFilterAction(f.value); fetchLogs(1, f.value); }}
            style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${filterAction===f.value ? "rgba(220,38,38,0.5)" : "rgba(255,255,255,0.08)"}`, background: filterAction===f.value ? "rgba(220,38,38,0.1)" : "rgba(255,255,255,0.02)", color: filterAction===f.value ? "#ef4444" : "#475569", fontSize:11, fontWeight:700, cursor:"pointer" }}>
            {f.label}
          </button>
        ))}
        <button onClick={() => fetchLogs(1)} style={{ padding:"5px 12px", borderRadius:20, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"#64748b", fontSize:11, cursor:"pointer" }}>🔄</button>
      </div>

      {/* Table */}
      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"rgba(255,255,255,0.03)" }}>
              {["DATE","USER","PLAN","ACTION","DÉTAILS"].map(h => (
                <th key={h} style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} style={{ textAlign:"center", padding:40, color:"#475569" }}>Chargement...</td></tr>}
            {!loading && logs.length === 0 && <tr><td colSpan={5} style={{ textAlign:"center", padding:40, color:"#475569" }}>Aucun événement billing</td></tr>}
            {logs.map(log => {
              const cfg = ACTION_LABELS[log.action] || { label:log.action, color:"#94a3b8" };
              let details = "—";
              try {
                const d = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
                if (d?.plan) details = `Plan: ${d.plan}`;
                if (d?.amount_paid) details += ` · ${d.amount_paid}${d.currency ? " "+d.currency.toUpperCase() : ""}`;
                if (d?.previous_plan) details = `${d.previous_plan} → Free`;
                if (d?.highest_plan) details = `Was: ${d.highest_plan}`;
                if (d?.interval) details += ` (${d.interval})`;
              } catch {}
              return (
                <tr key={log.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding:"12px 16px", color:"#475569", fontSize:11, whiteSpace:"nowrap" }}>{new Date(log.created_at).toLocaleString("fr-FR")}</td>
                  <td style={{ padding:"12px 16px", color:"#94a3b8", fontSize:11 }}>{log.target_email || `#${log.target_user_id}`}</td>
                  <td style={{ padding:"12px 16px" }}>
                    {log.details && (() => { try { const d = typeof log.details==="string"?JSON.parse(log.details):log.details; return d?.plan ? <span style={{ background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.3)", borderRadius:10, padding:"2px 8px", fontSize:9, fontWeight:700, color:"#a78bfa" }}>{d.plan}</span> : null; } catch { return null; } })()}
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ background:`${cfg.color}15`, border:`1px solid ${cfg.color}40`, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:cfg.color }}>{cfg.label}</span>
                  </td>
                  <td style={{ padding:"12px 16px", color:"#64748b", fontSize:11, maxWidth:260, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                    title={typeof log.details==="string"?log.details:JSON.stringify(log.details)}>
                    {details}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pages > 1 && <div style={{ display:"flex", justifyContent:"center", gap:6, padding:14 }}>{Array.from({ length:pages },(_, i)=>i+1).map(p=><button key={p} style={{ ...s.btnSm, background:page===p?"rgba(220,38,38,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${page===p?"rgba(220,38,38,0.4)":"rgba(255,255,255,0.1)"}`, color:page===p?"#ef4444":"#64748b", width:32, height:32 }} onClick={()=>fetchLogs(p)}>{p}</button>)}</div>}
      </div>
    </div>
  );
}

// ─── Onglet Visites ───────────────────────────────────────────────────────────
const PAGE_LABELS = { landing:"🏠 Landing", generator:"⚡ App", pricing:"💳 Pricing", auth:"🔑 Auth", other:"📄 Autre" };

function BarChart({ data, color = "#60a5fa", labelKey = "day", valueKey = "views", height = 120, formatLabel }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display:"flex", gap:6, alignItems:"flex-end", height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ fontSize:10, color, fontWeight:700 }}>{d[valueKey] || 0}</div>
          <div style={{ width:"100%", background:`rgba(96,165,250,0.1)`, border:`1px solid rgba(96,165,250,0.2)`, borderRadius:4, height:`${Math.max(Math.round((d[valueKey] / max) * (height - 30)), 4)}px`, background:color + "25", borderColor: color + "40", transition:"height 0.3s" }} />
          <div style={{ fontSize:9, color:"#334155", whiteSpace:"nowrap", textAlign:"center" }}>
            {formatLabel ? formatLabel(d[labelKey]) : d[labelKey]}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsTab({ token }) {
  const [data,    setData]    = useState(null);
  const [yearly,  setYearly]  = useState(null);
  const [period,  setPeriod]  = useState("week"); // today | week | month | all

  useEffect(() => {
    Promise.all([
      fetch(`${API}/admin/analytics`, { headers:{ Authorization:`Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/admin/analytics/yearly`, { headers:{ Authorization:`Bearer ${token}` } }).then(r => r.json()),
    ]).then(([a, y]) => { setData(a); setYearly(y); }).catch(console.error);
  }, [token]);

  if (!data) return <div style={{ textAlign:"center", padding:60, color:"#475569" }}>Chargement...</div>;

  // Filtrer selon la période sélectionnée
  const getFilteredViews = () => {
    if (!data.last7) return [];
    if (period === "today")  return data.last7.filter(d => d.day === new Date().toISOString().split("T")[0]);
    if (period === "week")   return data.last7;
    if (period === "month")  return data.last30 || data.last7;
    return data.last7;
  };

  const PERIOD_LABELS = { today:"Aujourd'hui", week:"7 jours", month:"30 jours", all:"Total" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Stats cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12 }}>
        <StatCard label="VUES TOTALES"  value={data.total}  color="#60a5fa" />
        {data.byPage.map(p => (
          <StatCard key={p.page} label={PAGE_LABELS[p.page] || p.page} value={p.views} color="#94a3b8" />
        ))}
      </div>

      {/* Sélecteur période */}
      <div style={{ display:"flex", gap:8 }}>
        {["today","week","month","all"].map(p => (
          <button key={p} style={{ ...s.btnSm, background:period===p?"rgba(96,165,250,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${period===p?"rgba(96,165,250,0.4)":"rgba(255,255,255,0.1)"}`, color:period===p?"#60a5fa":"#64748b", padding:"7px 14px" }} onClick={()=>setPeriod(p)}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Courbe semaine par jour */}
      <div style={{ ...s.card }}>
        <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:16 }}>
          VUES — {PERIOD_LABELS[period].toUpperCase()}
        </div>
        {getFilteredViews().length === 0
          ? <div style={{ color:"#334155", textAlign:"center", padding:"20px 0" }}>Pas encore de données</div>
          : <BarChart
              data={getFilteredViews()}
              color="#60a5fa"
              labelKey="day"
              valueKey="views"
              height={120}
              formatLabel={d => new Date(d).toLocaleDateString("fr-FR", { weekday:"short", day:"numeric" })}
            />
        }
      </div>

      {/* Courbe annuelle par mois */}
      <div style={{ ...s.card }}>
        <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:16 }}>VUES — ANNÉE EN COURS (PAR MOIS)</div>
        {!yearly || yearly.length === 0
          ? <div style={{ color:"#334155", textAlign:"center", padding:"20px 0" }}>Pas encore de données annuelles</div>
          : <BarChart
              data={yearly}
              color="#f59e0b"
              labelKey="month"
              valueKey="views"
              height={140}
              formatLabel={d => new Date(d + "-01").toLocaleDateString("fr-FR", { month:"short" })}
            />
        }
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
// ─── Onglet Administrateurs ───────────────────────────────────────────────────
function AdminsTab({ token }) {
  const API = "https://social-ai-app-production.up.railway.app";
  const headers = { "Content-Type":"application/json", Authorization:`Bearer ${token}` };

  const [admins,      setAdmins]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [newEmail,    setNewEmail]    = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating,    setCreating]    = useState(false);
  const [resetAdmin,  setResetAdmin]  = useState(null);
  const [resetPwd,    setResetPwd]    = useState("");
  const [resetting,   setResetting]   = useState(false);
  const [msg,         setMsg]         = useState(null);
  const [confirm,     setConfirm]     = useState(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/admins`, { headers: { Authorization:`Bearer ${token}` } });
      const d = await r.json();
      setAdmins(d.admins || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const createAdmin = async () => {
    if (!newEmail || !newPassword || newPassword.length < 8) {
      setMsg({ type:"error", text:"Email et mot de passe requis (min. 8 caractères)" }); return;
    }
    setCreating(true);
    try {
      const r = await fetch(`${API}/admin/admins`, {
        method: "POST", headers,
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      });
      const d = await r.json();
      if (d.success) {
        setMsg({ type:"success", text:`✅ Administrateur ${newEmail} créé` });
        setNewEmail(""); setNewPassword("");
        fetchAdmins();
      } else setMsg({ type:"error", text: d.message || "Erreur" });
    } catch { setMsg({ type:"error", text:"Erreur serveur" }); }
    setCreating(false);
  };

  const deleteAdmin = (admin) => {
    setConfirm({
      message: `Supprimer l'administrateur ${admin.email} ?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const r = await fetch(`${API}/admin/admins/${admin.id}`, { method:"DELETE", headers: { Authorization:`Bearer ${token}` } });
          const d = await r.json();
          if (d.success) { setMsg({ type:"success", text:`✅ Admin supprimé` }); fetchAdmins(); }
          else setMsg({ type:"error", text: d.message || "Erreur" });
        } catch { setMsg({ type:"error", text:"Erreur serveur" }); }
      }
    });
  };

  const resetPassword = async () => {
    if (!resetPwd || resetPwd.length < 8) { setMsg({ type:"error", text:"Min. 8 caractères" }); return; }
    setResetting(true);
    try {
      const r = await fetch(`${API}/admin/admins/${resetAdmin.id}/password`, {
        method: "PATCH", headers,
        body: JSON.stringify({ newPassword: resetPwd }),
      });
      const d = await r.json();
      if (d.success) { setMsg({ type:"success", text:`✅ Mot de passe mis à jour` }); setResetAdmin(null); setResetPwd(""); }
      else setMsg({ type:"error", text: d.message || "Erreur" });
    } catch { setMsg({ type:"error", text:"Erreur serveur" }); }
    setResetting(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {msg && (
        <div style={{ padding:"10px 14px", borderRadius:10, fontSize:12, fontWeight:700,
          background: msg.type==="success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          color: msg.type==="success" ? "#22c55e" : "#ef4444",
          border:`1px solid ${msg.type==="success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
        }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ float:"right", background:"none", border:"none", color:"inherit", cursor:"pointer" }}>✕</button>
        </div>
      )}

      {/* Créer un admin */}
      <div style={{ ...s.card, padding:20 }}>
        <div style={{ color:"#64748b", fontSize:10, fontWeight:700, letterSpacing:"1.5px", marginBottom:14 }}>➕ CRÉER UN ADMINISTRATEUR</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:10, alignItems:"end" }}>
          <div>
            <div style={{ color:"#64748b", fontSize:10, marginBottom:6 }}>EMAIL</div>
            <input style={{ ...s.input, marginBottom:0 }} placeholder="admin@exemple.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
          </div>
          <div>
            <div style={{ color:"#64748b", fontSize:10, marginBottom:6 }}>MOT DE PASSE</div>
            <input style={{ ...s.input, marginBottom:0 }} type="password" placeholder="Min. 8 caractères" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <button
            onClick={createAdmin} disabled={creating}
            style={{ padding:"10px 20px", background:"linear-gradient(135deg,#dc2626,#991b1b)", border:"none", borderRadius:10, color:"white", fontWeight:700, fontSize:13, cursor:"pointer", opacity: creating ? 0.7 : 1, whiteSpace:"nowrap" }}
          >{creating ? "⏳..." : "✅ Créer"}</button>
        </div>
      </div>

      {/* Liste des admins */}
      <div style={{ ...s.card, padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"rgba(255,255,255,0.03)" }}>
              {["ID","EMAIL","PLAN","ACTIONS"].map(h => (
                <th key={h} style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} style={{ textAlign:"center", padding:40, color:"#475569" }}>Chargement...</td></tr>}
            {!loading && admins.length === 0 && <tr><td colSpan={5} style={{ textAlign:"center", padding:40, color:"#475569" }}>Aucun administrateur</td></tr>}
            {admins.map(admin => (
              <tr key={admin.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding:"12px 16px", color:"#475569" }}>#{admin.id}</td>
                <td style={{ padding:"12px 16px", color:"#e2e8f0", fontWeight:600 }}>{admin.email}</td>
                <td style={{ padding:"12px 16px" }}>
                  <span style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, color:"#ef4444", fontSize:10, fontWeight:700, padding:"2px 8px" }}>ADMIN</span>
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex", gap:6 }}>
                    <button
                      title="Reset mot de passe"
                      style={{ ...s.btnSm, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", color:"#f59e0b" }}
                      onClick={() => { setResetAdmin(admin); setResetPwd(""); setMsg(null); }}
                    >🔑</button>
                    <button
                      title="Supprimer l'administrateur"
                      style={{ ...s.btnSm, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444" }}
                      onClick={() => deleteAdmin(admin)}
                    >🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modale reset password admin */}
      {resetAdmin && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"linear-gradient(145deg,#1a2235,#111827)", border:"1px solid rgba(220,38,38,0.2)", borderRadius:16, padding:28, width:"100%", maxWidth:400, color:"white" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ color:"#ef4444", fontWeight:800 }}>🔑 Reset mot de passe admin</div>
              <button onClick={() => setResetAdmin(null)} style={{ background:"none", border:"none", color:"#475569", fontSize:18, cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ color:"#64748b", fontSize:12, marginBottom:14 }}>👤 {resetAdmin.email}</div>
            <input
              type="password"
              placeholder="Nouveau mot de passe (min. 8 caractères)"
              value={resetPwd}
              onChange={e => setResetPwd(e.target.value)}
              style={{ display:"block", width:"100%", padding:"11px 14px", background:"#0f172a", border:"1px solid rgba(220,38,38,0.2)", borderRadius:10, color:"white", fontSize:13, boxSizing:"border-box", marginBottom:14 }}
            />
            <button
              onClick={resetPassword} disabled={resetting}
              style={{ width:"100%", padding:"11px", background:"linear-gradient(135deg,#dc2626,#991b1b)", border:"none", borderRadius:10, color:"white", fontWeight:700, fontSize:13, cursor:"pointer", opacity: resetting ? 0.7 : 1 }}
            >{resetting ? "⏳..." : "🔐 Enregistrer"}</button>
          </div>
        </div>
      )}

      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PromoTab — Gestion des codes promo ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function PromoTab({ token }) {
  const [codes, setCodes]         = useState([]);
  const [stats, setStats]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);
  const [usesModal, setUsesModal] = useState(null); // { code, uses }
  const [form, setForm]           = useState({
    code: "", type: "access", plan: "Pro", duration_days: 30,
    discount_percent: "", discount_months: "", max_uses: 1,
    expires_at: "", note: "",
  });
  const [formErr, setFormErr]     = useState("");
  const [saving, setSaving]       = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const load = async () => {
    setLoading(true);
    try {
      const [codesRes, statsRes] = await Promise.all([
        fetch(`${API}/admin/promo-codes`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/promo-stats`, { headers }).then(r => r.json()),
      ]);
      setCodes(codesRes.codes || []);
      setStats(statsRes);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createCode = async () => {
    setFormErr("");
    if (!form.code) return setFormErr("Le code est requis");
    if (form.type === "access" && !form.plan) return setFormErr("Plan requis");
    if (form.type === "discount" && (!form.discount_percent || !form.discount_months))
      return setFormErr("Réduction % et durée requis");
    setSaving(true);
    try {
      const r = await fetch(`${API}/admin/promo-codes`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          code: form.code.toUpperCase().trim(),
          duration_days: form.duration_days || null,
          max_uses: parseInt(form.max_uses) || 1,
          expires_at: form.expires_at || null,
        }),
      });
      const d = await r.json();
      if (!d.success) { setFormErr(d.message || "Erreur"); setSaving(false); return; }
      setCreating(false);
      setForm({ code:"", type:"access", plan:"Pro", duration_days:30, discount_percent:"", discount_months:"", max_uses:1, expires_at:"", note:"" });
      load();
    } catch { setFormErr("Erreur serveur"); }
    setSaving(false);
  };

  const toggleCode = async (id) => {
    await fetch(`${API}/admin/promo-codes/${id}/toggle`, { method:"PATCH", headers });
    load();
  };

  const deleteCode = async (id, code) => {
    if (!confirm(`Supprimer le code ${code} ?`)) return;
    await fetch(`${API}/admin/promo-codes/${id}`, { method:"DELETE", headers });
    load();
  };

  const loadUses = async (id, code) => {
    const r = await fetch(`${API}/admin/promo-codes/${id}/uses`, { headers });
    const d = await r.json();
    setUsesModal({ code, uses: d.uses || [] });
  };

  const TYPE_COLORS = { access:"#22c55e", discount:"#f59e0b" };
  const DURATIONS = [
    { label:"7 jours",    value:7 },
    { label:"30 jours",   value:30 },
    { label:"60 jours",   value:60 },
    { label:"90 jours",   value:90 },
    { label:"Permanent",  value:null },
  ];

  return (
    <div>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"CODES TOTAL",    value:stats.totalCodes  || 0, color:"#e2e8f0" },
          { label:"CODES ACTIFS",   value:stats.activeCodes || 0, color:"#22c55e" },
          { label:"TOTAL USAGES",   value:stats.totalUses   || 0, color:"#a78bfa" },
          { label:"FILLEULS TOTAL", value:stats.totalReferrals || 0, color:"#f59e0b" },
        ].map(s => <StatCard key={s.label} label={s.label} value={s.value} color={s.color} />)}
      </div>

      {/* Header + bouton créer */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ color:"#e2e8f0", fontWeight:800, fontSize:16 }}>🎁 Codes Promo</div>
        <button style={s.btn} onClick={() => setCreating(c => !c)}>
          {creating ? "✕ Annuler" : "+ Créer un code"}
        </button>
      </div>

      {/* Formulaire création */}
      {creating && (
        <div style={{ ...s.card, marginBottom:20, border:"1px solid rgba(34,197,94,0.2)" }}>
          <div style={{ color:"#22c55e", fontWeight:800, fontSize:13, marginBottom:16 }}>🆕 Nouveau code promo</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
            {/* Code */}
            <div>
              <label style={s.label}>CODE *</label>
              <input style={{ ...s.input, width:"100%", boxSizing:"border-box", textTransform:"uppercase" }}
                placeholder="ex: LAUNCH2026"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              />
            </div>
            {/* Type */}
            <div>
              <label style={s.label}>TYPE *</label>
              <select style={{ ...s.select, width:"100%", boxSizing:"border-box" }}
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="access">Accès gratuit</option>
                <option value="discount">Réduction %</option>
              </select>
            </div>
            {/* Plan (si access) */}
            {form.type === "access" && (
              <div>
                <label style={s.label}>PLAN *</label>
                <select style={{ ...s.select, width:"100%", boxSizing:"border-box" }}
                  value={form.plan}
                  onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                  {["Pro","Business","Agency"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
            {/* Durée (si access) */}
            {form.type === "access" && (
              <div>
                <label style={s.label}>DURÉE</label>
                <select style={{ ...s.select, width:"100%", boxSizing:"border-box" }}
                  value={form.duration_days ?? "null"}
                  onChange={e => setForm(f => ({ ...f, duration_days: e.target.value === "null" ? null : parseInt(e.target.value) }))}>
                  {DURATIONS.map(d => <option key={d.label} value={d.value ?? "null"}>{d.label}</option>)}
                </select>
              </div>
            )}
            {/* Réduction % (si discount) */}
            {form.type === "discount" && (
              <div>
                <label style={s.label}>RÉDUCTION % *</label>
                <input type="number" min="1" max="100" style={{ ...s.select, width:"100%", boxSizing:"border-box" }}
                  placeholder="ex: 50"
                  value={form.discount_percent}
                  onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))}
                />
              </div>
            )}
            {/* Durée réduction (si discount) */}
            {form.type === "discount" && (
              <div>
                <label style={s.label}>DURÉE (MOIS) *</label>
                <input type="number" min="1" style={{ ...s.select, width:"100%", boxSizing:"border-box" }}
                  placeholder="ex: 3"
                  value={form.discount_months}
                  onChange={e => setForm(f => ({ ...f, discount_months: e.target.value }))}
                />
              </div>
            )}
            {/* Max usages */}
            <div>
              <label style={s.label}>MAX USAGES</label>
              <input type="number" min="1" style={{ ...s.select, width:"100%", boxSizing:"border-box" }}
                placeholder="1"
                value={form.max_uses}
                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
              />
              <div style={{ color:"#475569", fontSize:10, marginTop:4 }}>1 = usage unique</div>
            </div>
            {/* Expiration */}
            <div>
              <label style={s.label}>DATE D'EXPIRATION</label>
              <input type="date" style={{ ...s.select, width:"100%", boxSizing:"border-box" }}
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
              />
            </div>
            {/* Note */}
            <div style={{ gridColumn:"1/-1" }}>
              <label style={s.label}>NOTE INTERNE</label>
              <input style={{ ...s.select, width:"100%", boxSizing:"border-box" }}
                placeholder="ex: Campagne LinkedIn Q1 2026"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              />
            </div>
          </div>
          {formErr && <div style={{ color:"#ef4444", fontSize:12, marginTop:10 }}>❌ {formErr}</div>}
          <div style={{ marginTop:16, display:"flex", gap:10 }}>
            <button style={s.btn} onClick={createCode} disabled={saving}>
              {saving ? "Création..." : "✅ Créer le code"}
            </button>
            <button style={{ ...s.btnSm, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", color:"#64748b", padding:"9px 16px" }} onClick={() => setCreating(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Table des codes */}
      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:"#475569" }}>Chargement...</div>
      ) : codes.length === 0 ? (
        <div style={{ ...s.card, textAlign:"center", color:"#475569", padding:40 }}>Aucun code promo créé</div>
      ) : (
        <div style={{ ...s.card, padding:0, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:"rgba(255,255,255,0.03)" }}>
                  {["CODE","TYPE","PLAN/RÉDUCTION","DURÉE","USAGES","EXPIRE","NOTE","STATUT","ACTIONS"].map(h => (
                    <th key={h} style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map(c => {
                  const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
                  const isExhausted = c.max_uses && c.used_count >= c.max_uses;
                  return (
                    <tr key={c.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", opacity: (!c.active || isExpired || isExhausted) ? 0.5 : 1 }}>
                      <td style={{ padding:"10px 14px" }}>
                        <span style={{ fontFamily:"monospace", fontWeight:800, color:"#e2e8f0", fontSize:13, letterSpacing:"1px" }}>{c.code}</span>
                      </td>
                      <td style={{ padding:"10px 14px" }}>
                        <span style={{ background:`${TYPE_COLORS[c.type]}15`, border:`1px solid ${TYPE_COLORS[c.type]}30`, borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, color:TYPE_COLORS[c.type] }}>
                          {c.type === "access" ? "🎁 Accès" : "💰 Réduction"}
                        </span>
                      </td>
                      <td style={{ padding:"10px 14px", color:"#94a3b8" }}>
                        {c.type === "access"
                          ? <span style={s.badge(c.plan)}>{c.plan}</span>
                          : <span style={{ color:"#f59e0b", fontWeight:700 }}>-{c.discount_percent}% · {c.discount_months} mois</span>
                        }
                      </td>
                      <td style={{ padding:"10px 14px", color:"#64748b" }}>
                        {c.type === "access"
                          ? (c.duration_days ? `${c.duration_days}j` : "∞ Permanent")
                          : `${c.discount_months} mois`
                        }
                      </td>
                      <td style={{ padding:"10px 14px" }}>
                        <span style={{ color: isExhausted ? "#ef4444" : "#94a3b8", fontWeight:700 }}>
                          {c.used_count}/{c.max_uses || "∞"}
                        </span>
                      </td>
                      <td style={{ padding:"10px 14px", color: isExpired ? "#ef4444" : "#64748b", fontSize:11 }}>
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td style={{ padding:"10px 14px", color:"#475569", fontSize:11, maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {c.note || "—"}
                      </td>
                      <td style={{ padding:"10px 14px" }}>
                        <span style={{ color: c.active && !isExpired && !isExhausted ? "#22c55e" : "#ef4444", fontSize:10, fontWeight:700 }}>
                          {c.active && !isExpired && !isExhausted ? "✅ Actif" : isExpired ? "⏰ Expiré" : isExhausted ? "🔴 Épuisé" : "⏸ Inactif"}
                        </span>
                      </td>
                      <td style={{ padding:"10px 14px" }}>
                        <div style={{ display:"flex", gap:6, flexWrap:"nowrap" }}>
                          <button title="Voir les usages" style={{ ...s.btnSm, background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.3)", color:"#a78bfa" }} onClick={() => loadUses(c.id, c.code)}>👁</button>
                          <button title={c.active ? "Désactiver" : "Activer"} style={{ ...s.btnSm, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", color:"#f59e0b" }} onClick={() => toggleCode(c.id)}>{c.active ? "⏸" : "▶"}</button>
                          <button title="Supprimer" style={{ ...s.btnSm, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444" }} onClick={() => deleteCode(c.id, c.code)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section Parrainage */}
      <div style={{ marginTop:32 }}>
        <div style={{ color:"#e2e8f0", fontWeight:800, fontSize:16, marginBottom:16 }}>👥 Parrainages</div>
        <ReferralsTab token={token} />
      </div>

      {/* Modal usages */}
      {usesModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={() => setUsesModal(null)}>
          <div style={{ background:"#0f172a", border:"1px solid rgba(220,38,38,0.2)", borderRadius:16, padding:24, maxWidth:600, width:"90%", maxHeight:"80vh", overflow:"auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ color:"#e2e8f0", fontWeight:800, fontSize:14 }}>Usages — <span style={{ fontFamily:"monospace", color:"#ef4444" }}>{usesModal.code}</span></div>
              <button style={{ background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:18 }} onClick={() => setUsesModal(null)}>✕</button>
            </div>
            {usesModal.uses.length === 0 ? (
              <div style={{ color:"#475569", textAlign:"center", padding:24 }}>Aucun usage enregistré</div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                    {["USER","PLAN","DATE"].map(h => (
                      <th key={h} style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, padding:"8px 12px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usesModal.uses.map(u => (
                    <tr key={u.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding:"8px 12px", color:"#94a3b8" }}>{u.user_email}</td>
                      <td style={{ padding:"8px 12px" }}><span style={s.badge(u.plan_granted || u.user_plan)}>{u.plan_granted || u.user_plan || "—"}</span></td>
                      <td style={{ padding:"8px 12px", color:"#64748b" }}>{new Date(u.used_at).toLocaleString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReferralsTab({ token }) {
  const [refs, setRefs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/admin/referrals`, { headers })
      .then(r => r.json())
      .then(d => { setRefs(d.referrals || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const PALIERS = [1,3,5,10,20];
  const PALIER_LABELS = { 1:"+7j", 3:"+1m", 5:"+2m", 10:"+3m", 20:"Agency 1an" };

  if (loading) return <div style={{ color:"#475569", padding:20 }}>Chargement...</div>;
  if (!refs.length) return <div style={{ ...s.card, textAlign:"center", color:"#475569", padding:24 }}>Aucun utilisateur avec un lien de parrainage actif</div>;

  return (
    <div style={{ ...s.card, padding:0, overflow:"hidden" }}>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"rgba(255,255,255,0.03)" }}>
              {["USER","CODE PARRAINAGE","FILLEULS","JOURS RÉCOMPENSE","PROCHAIN PALIER"].map(h => (
                <th key={h} style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {refs.map(r => {
              const nextPalier = PALIERS.find(p => p > r.actual_referrals);
              return (
                <tr key={r.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding:"10px 14px", color:"#94a3b8" }}>{r.email}</td>
                  <td style={{ padding:"10px 14px" }}>
                    <span style={{ fontFamily:"monospace", color:"#60a5fa", fontSize:12, fontWeight:700 }}>{r.referral_code}</span>
                    <span style={{ color:"#334155", fontSize:10, marginLeft:8 }}>aigrowthpilot.app/ref/{r.referral_code}</span>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <span style={{ color:"#f59e0b", fontWeight:800, fontSize:14 }}>{r.actual_referrals}</span>
                    {PALIERS.includes(r.actual_referrals) && (
                      <span style={{ marginLeft:8, background:"rgba(245,158,11,0.15)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, color:"#f59e0b" }}>🏆 {PALIER_LABELS[r.actual_referrals]}</span>
                    )}
                  </td>
                  <td style={{ padding:"10px 14px", color:"#22c55e", fontWeight:700 }}>
                    {r.referral_reward_days > 0 ? `+${r.referral_reward_days}j` : "—"}
                  </td>
                  <td style={{ padding:"10px 14px", color:"#475569" }}>
                    {nextPalier ? `${nextPalier} filleuls → ${PALIER_LABELS[nextPalier]}` : "🎉 Max atteint"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── NotificationsPanel — Panel notifications en temps réel ──────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function NotificationsPanel({ token, onClose }) {
  const [notifs, setNotifs]   = useState([]);
  const [unread, setUnread]   = useState(0);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  const load = async () => {
    try {
      const r = await fetch(`${API}/admin/notifications`, { headers });
      const d = await r.json();
      setNotifs(d.notifications || []);
      setUnread(d.unread || 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // refresh toutes les 30s
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id) => {
    await fetch(`${API}/admin/notifications/${id}/read`, { method:"PATCH", headers });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(u => Math.max(0, u - 1));
  };

  const markAllRead = async () => {
    await fetch(`${API}/admin/notifications/read-all`, { method:"PATCH", headers });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const clearAll = async () => {
    await fetch(`${API}/admin/notifications`, { method:"DELETE", headers });
    setNotifs([]);
    setUnread(0);
  };

  const TYPE_ICON = {
    promo_used:     "🎁",
    promo_created:  "✅",
    promo_expired:  "⚠️",
    promo_exhausted:"🔴",
    referral:       "👥",
    referral_reward:"🏆",
  };

  return (
    <div style={{ position:"fixed", top:0, right:0, bottom:0, width:380, background:"#0a0f1e", borderLeft:"1px solid rgba(220,38,38,0.2)", zIndex:99999, display:"flex", flexDirection:"column", boxShadow:"-20px 0 60px rgba(0,0,0,0.5)" }}>
      {/* Header */}
      <div style={{ padding:"20px 20px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>🔔</span>
          <span style={{ color:"#e2e8f0", fontWeight:800, fontSize:15 }}>Notifications</span>
          {unread > 0 && (
            <span style={{ background:"#ef4444", borderRadius:20, padding:"1px 8px", fontSize:10, fontWeight:800, color:"#fff" }}>{unread}</span>
          )}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {unread > 0 && (
            <button style={{ ...s.btnSm, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", color:"#22c55e", fontSize:10 }} onClick={markAllRead}>
              ✓ Tout lu
            </button>
          )}
          <button style={{ ...s.btnSm, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444", fontSize:10 }} onClick={clearAll}>
            🗑 Vider
          </button>
          <button style={{ background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:18, lineHeight:1 }} onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Liste */}
      <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
        {loading && <div style={{ textAlign:"center", padding:32, color:"#475569" }}>Chargement...</div>}
        {!loading && notifs.length === 0 && (
          <div style={{ textAlign:"center", padding:40, color:"#334155" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🔕</div>
            <div style={{ fontSize:13 }}>Aucune notification</div>
          </div>
        )}
        {notifs.map(n => (
          <div key={n.id}
            style={{
              padding:"14px 20px",
              borderBottom:"1px solid rgba(255,255,255,0.04)",
              background: n.read ? "transparent" : "rgba(220,38,38,0.04)",
              cursor: n.read ? "default" : "pointer",
              transition:"background 0.15s",
            }}
            onClick={() => !n.read && markRead(n.id)}
          >
            <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>{TYPE_ICON[n.type] || "📌"}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color: n.read ? "#64748b" : "#e2e8f0", fontWeight: n.read ? 500 : 700, fontSize:13, marginBottom:3, lineHeight:1.4 }}>
                  {n.title}
                </div>
                {n.body && <div style={{ color:"#475569", fontSize:11, lineHeight:1.5 }}>{n.body}</div>}
                <div style={{ color:"#334155", fontSize:10, marginTop:6 }}>
                  {new Date(n.created_at).toLocaleString("fr-FR")}
                </div>
              </div>
              {!n.read && <span style={{ width:8, height:8, borderRadius:"50%", background:"#ef4444", flexShrink:0, marginTop:5 }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Admin({ token, logout }) {
  const [tab,         setTab]         = useState("users");
  const [logsSubTab,  setLogsSubTab]  = useState("admin");
  const [usersSubTab, setUsersSubTab] = useState("users");
  const [stats,     setStats]     = useState(null);
  const [users,     setUsers]     = useState([]);
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(1);
  const [page,      setPage]      = useState(1);
  const [search,      setSearch]      = useState("");
  const [planFilter,  setPlanFilter]  = useState("");
  const [banFilter,   setBanFilter]   = useState("all");
  const [verifyFilter,setVerifyFilter]= useState("all");
  const [loading,   setLoading]   = useState(false);
  const [editUser,  setEditUser]  = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [confirm,   setConfirm]   = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const headers = { Authorization:`Bearer ${token}` };

  // Polling notifs non lues
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const r = await fetch(`${API}/admin/notifications`, { headers });
        const d = await r.json();
        setUnreadNotifs(d.unread || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000); // toutes les 60s
    return () => clearInterval(interval);
  }, [token]);

  const fetchStats = useCallback(async () => {
    const r = await fetch(`${API}/admin/stats`, { headers });
    const d = await r.json();
    setStats(d);
  }, [token]);

  const fetchUsers = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p });
    if (search)                  params.append("search", search);
    if (planFilter)              params.append("plan",   planFilter);
    if (banFilter !== "all")     params.append("banned", banFilter === "banned" ? "true" : "false");
    if (verifyFilter !== "all")  params.append("verified", verifyFilter === "verified" ? "true" : "false");
    const r = await fetch(`${API}/admin/users?${params}`, { headers });
    const d = await r.json();
    setUsers(d.users || []);
    setTotal(d.total || 0);
    setPages(d.pages || 1);
    setPage(p);
    setLoading(false);
  }, [token, search, planFilter, banFilter, verifyFilter]);

  useEffect(() => { fetchStats(); fetchUsers(); }, []);
  useEffect(() => { fetchUsers(1); }, [search, planFilter, banFilter, verifyFilter]);

  const logAction = async (action, targetUserId, details = {}) => {
    try {
      await fetch(`${API}/admin/logs`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ action, target_user_id: targetUserId ? parseInt(targetUserId) : null, details: JSON.stringify(details) }),
      });
    } catch {}
  };

  const deleteUser = (id, email) => {
    setConfirm({ message: `Supprimer définitivement ${email} ?`, onConfirm: async () => {
      try {
        const r = await fetch(`${API}/admin/users/${id}`, { method:"DELETE", headers });
        if (r.ok) {
          await logAction("delete_user", id, { email });
          fetchUsers(page);
          fetchStats();
          setConfirm({ message: `✅ Utilisateur ${email} supprimé`, onConfirm: () => setConfirm(null) });
        } else {
          setConfirm({ message: `❌ Erreur lors de la suppression de ${email}`, onConfirm: () => setConfirm(null) });
        }
      } catch {
        setConfirm({ message: `❌ Erreur serveur — suppression échouée`, onConfirm: () => setConfirm(null) });
      }
    }});
  };

  const toggleBan = (u) => {
    const action = u.banned ? "débannir" : "bannir";
    setConfirm({ message: `Voulez-vous ${action} ${u.email} ?`, onConfirm: async () => {
      try {
        const r = await fetch(`${API}/admin/users/${u.id}`, {
          method: "PATCH",
          headers: { ...headers, "Content-Type":"application/json" },
          body: JSON.stringify({ banned: !u.banned }),
        });
        if (r.ok) {
          await logAction(u.banned ? "unban_user" : "ban_user", u.id, { email: u.email });
          fetchUsers(page);
          fetchStats();
          setConfirm({ message: `✅ ${u.email} ${u.banned ? "débanni" : "banni"} avec succès`, onConfirm: () => setConfirm(null) });
        } else {
          setConfirm({ message: `❌ Erreur lors de l'action sur ${u.email}`, onConfirm: () => setConfirm(null) });
        }
      } catch {
        setConfirm({ message: `❌ Erreur serveur`, onConfirm: () => setConfirm(null) });
      }
    }});
  };

  const verifyEmail = async (u) => {
    try {
      const r = await fetch(`${API}/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type":"application/json" },
        body: JSON.stringify({ email_verified: true }),
      });
      const d = await r.json();
      if (d.user) {
        logAction("verify_email", u.id, { email: u.email });
        fetchUsers(page);
        setConfirm({ message: `✅ Email de ${u.email} vérifié`, onConfirm: () => setConfirm(null) });
      } else {
        setConfirm({ message: `❌ Erreur lors de la vérification`, onConfirm: () => setConfirm(null) });
      }
    } catch {
      setConfirm({ message: `❌ Erreur serveur`, onConfirm: () => setConfirm(null) });
    }
  };

  const resendVerification = async (u) => {
    try {
      await fetch(`${API}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ email: u.email }),
      });
      await logAction("resend_verification", u.id, { email: u.email });
      setConfirm({ message: `✅ Email de vérification renvoyé à ${u.email}`, onConfirm: () => setConfirm(null) });
    } catch {
      setConfirm({ message: `❌ Erreur lors de l'envoi`, onConfirm: () => setConfirm(null) });
    }
  };

  const exportCSV = () => {
    const headers = ["ID","Email","Plan","Générations","Posts","Stripe","Statut","Vérifié"];
    const rows = users.map(u => [
      u.id, u.email, u.plan, u.generations_count||0, u.post_count||0,
      u.stripe_subscription_id ? "Actif" : "—",
      u.banned ? "Banni" : "Actif",
      u.email_verified ? "Oui" : "Non",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "users.csv"; a.click();
  };

  const resetQuota = async (id) => {
    try {
      const r = await fetch(`${API}/admin/users/${id}/reset-quota`, { method:"POST", headers });
      if (r.ok) {
        await logAction("reset_quota", id);
        fetchUsers(page);
        setConfirm({ message: `✅ Quota réinitialisé`, onConfirm: () => setConfirm(null) });
      } else {
        setConfirm({ message: `❌ Erreur lors du reset quota`, onConfirm: () => setConfirm(null) });
      }
    } catch {
      setConfirm({ message: `❌ Erreur serveur`, onConfirm: () => setConfirm(null) });
    }
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ color:"#ef4444", fontSize:20, fontWeight:900, letterSpacing:"-0.5px" }}>GrowthPILOT</div>
          <div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:6, padding:"3px 10px", fontSize:10, fontWeight:700, color:"#ef4444", letterSpacing:"1px" }}>ADMIN</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {/* Bouton notifications */}
          <button
            style={{ ...s.btnSm, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#94a3b8", padding:"8px 14px", position:"relative" }}
            onClick={() => setShowNotifs(v => !v)}
            title="Notifications"
          >
            🔔
            {unreadNotifs > 0 && (
              <span style={{ position:"absolute", top:-6, right:-6, background:"#ef4444", borderRadius:"50%", width:18, height:18, fontSize:10, fontWeight:800, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {unreadNotifs > 9 ? "9+" : unreadNotifs}
              </span>
            )}
          </button>
          <button style={{ ...s.btnSm, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#94a3b8", padding:"8px 16px" }} onClick={logout}>↩ Logout</button>
        </div>
      </div>

      <div style={s.content}>

        {/* ── Stats compactes ── */}
        {stats && (
          <div style={{ marginBottom:20 }}>

            {/* Ligne 1 : MRR en vedette + métriques clés */}
            <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom:10 }}>

              {/* MRR — mis en avant */}
              <div style={{ background:"linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.04))", border:"1px solid rgba(245,158,11,0.3)", borderRadius:12, padding:"10px 20px", display:"flex", alignItems:"baseline", gap:8 }}>
                <span style={{ color:"#f59e0b", fontSize:26, fontWeight:900, letterSpacing:"-1px" }}>€{stats.mrr}</span>
                <span style={{ color:"#92400e", fontSize:10, fontWeight:700, letterSpacing:"1px" }}>MRR ESTIMÉ</span>
              </div>

              {/* Séparateur */}
              <div style={{ width:1, height:36, background:"rgba(255,255,255,0.06)" }} />

              {/* Métriques inline */}
              {[
                { label:"Users",    value:stats.totalUsers,       color:"#e2e8f0", icon:"👥" },
                { label:"Actifs",   value:stats.activeUsers,      color:"#22c55e", icon:"✅" },
                { label:"Bannis",   value:stats.bannedUsers || 0, color:"#ef4444", icon:"🚫" },
                { label:"Posts",    value:stats.totalPosts,        color:"#94a3b8", icon:"📝" },
              ].map(s => (
                <div key={s.label} style={{ display:"flex", flexDirection:"column", alignItems:"center", minWidth:52 }}>
                  <span style={{ color:s.color, fontSize:20, fontWeight:900 }}>{s.value}</span>
                  <span style={{ color:"#334155", fontSize:9, fontWeight:700, letterSpacing:"0.5px" }}>{s.icon} {s.label}</span>
                </div>
              ))}

              {/* Séparateur */}
              <div style={{ width:1, height:36, background:"rgba(255,255,255,0.06)" }} />

              {/* Plans inline */}
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <span style={{ color:"#475569", fontSize:9, fontWeight:700, letterSpacing:"1px", marginRight:4 }}>PLANS</span>
                {[
                  { label:"Free",     value:stats.plans?.Free     || 0, color:"#64748b" },
                  { label:"Pro",      value:stats.plans?.Pro      || 0, color:"#3b82f6" },
                  { label:"Business", value:stats.plans?.Business || 0, color:"#f59e0b" },
                  { label:"Agency",   value:stats.plans?.Agency   || 0, color:"#8b5cf6" },
                ].map(p => (
                  <div key={p.label} style={{ background:`${p.color}12`, border:`1px solid ${p.color}30`, borderRadius:20, padding:"4px 10px", display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ color:p.color, fontSize:14, fontWeight:900 }}>{p.value}</span>
                    <span style={{ color:p.color, fontSize:9, fontWeight:700, opacity:0.8 }}>{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.07)", marginBottom:24 }}>
          <button style={s.tabBtn(tab==="users")}      onClick={()=>setTab("users")}>👥 Comptes</button>
          <button style={s.tabBtn(tab==="logs")}       onClick={()=>setTab("logs")}>📋 Historique</button>
          <button style={s.tabBtn(tab==="overrides")}  onClick={()=>setTab("overrides")}>🎁 Overrides</button>
          <button style={s.tabBtn(tab==="promos")}     onClick={()=>setTab("promos")}>🎟️ Promos</button>
          <button style={s.tabBtn(tab==="analytics")}  onClick={()=>setTab("analytics")}>📊 Visites</button>
        </div>

        {/* ── Onglet Comptes ── */}
        {tab === "users" && (
          <>
            {/* Sous-onglets */}
            <div style={{ display:"flex", gap:4, marginBottom:16, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <button style={{ ...s.tabBtn(usersSubTab==="users"), fontSize:11, padding:"8px 16px" }} onClick={() => setUsersSubTab("users")}>👥 Utilisateurs</button>
              <button style={{ ...s.tabBtn(usersSubTab==="admins"), fontSize:11, padding:"8px 16px" }} onClick={() => setUsersSubTab("admins")}>🛡️ Administrateurs</button>
            </div>

            {usersSubTab === "admins" && <AdminsTab token={token} />}

            {usersSubTab === "users" && (<>
            <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
              <input
                style={{ ...s.input, width:260 }}
                placeholder="🔍 Rechercher email ou nom..."
                value={search}
                onChange={e=>setSearch(e.target.value)}
              />
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {["", ...PLANS].map(p => (
                  <button key={p||"all"} style={{ ...s.btnSm, background:planFilter===p?"rgba(220,38,38,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${planFilter===p?"rgba(220,38,38,0.4)":"rgba(255,255,255,0.1)"}`, color:planFilter===p?"#ef4444":"#64748b", padding:"7px 12px", fontSize:11 }} onClick={()=>setPlanFilter(p)}>{p||"Tous"}</button>
                ))}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <select style={{ background:"#0f172a", border:"1px solid rgba(220,38,38,0.2)", borderRadius:8, color:"white", fontSize:11, padding:"6px 10px", cursor:"pointer" }} value={banFilter} onChange={e => setBanFilter(e.target.value)}>
                  <option value="all">Tous statuts</option>
                  <option value="active">✅ Actifs</option>
                  <option value="banned">🚫 Bannis</option>
                </select>
                <select style={{ background:"#0f172a", border:"1px solid rgba(220,38,38,0.2)", borderRadius:8, color:"white", fontSize:11, padding:"6px 10px", cursor:"pointer" }} value={verifyFilter} onChange={e => setVerifyFilter(e.target.value)}>
                  <option value="all">Tous comptes</option>
                  <option value="verified">✓ Vérifiés</option>
                  <option value="unverified">⚠ Non vérifiés</option>
                </select>
              </div>
              <button
                style={{ ...s.btnSm, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.25)", color:"#22c55e", padding:"7px 14px", fontSize:11, marginLeft:"auto" }}
                onClick={exportCSV}
              >⬇️ Export CSV</button>
              <div style={{ color:"#475569", fontSize:12 }}>{total} utilisateurs</div>
            </div>

            <div style={{ ...s.card, padding:0, overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ background:"rgba(255,255,255,0.03)" }}>
                      {["ID","EMAIL","NOM","DISPLAY NAME","PLAN","TEAM","GÉNÉRATIONS","POSTS","STRIPE","STATUT","VÉRIFIÉ","ACTIONS"].map(h => (
                        <th key={h} style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan={9} style={{ textAlign:"center", padding:40, color:"#475569" }}>Chargement...</td></tr>}
                    {!loading && users.length === 0 && <tr><td colSpan={9} style={{ textAlign:"center", padding:40, color:"#475569" }}>Aucun utilisateur trouvé</td></tr>}
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", background: u.banned ? "rgba(239,68,68,0.03)" : "transparent" }}>
                        <td style={{ padding:"12px 16px", color:"#475569" }}>#{u.id}</td>
                        <td style={{ padding:"12px 16px" }}>
                          <div style={{ color: u.banned ? "#ef4444" : "#e2e8f0", fontWeight:600 }}>{u.email}</div>
                          {u.banned && <div style={{ color:"#ef4444", fontSize:10, fontWeight:700 }}>🚫 SUSPENDU</div>}
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          {(u.first_name || u.last_name)
                            ? <span style={{ color:"#e2e8f0", fontSize:12 }}>{[u.first_name, u.last_name].filter(Boolean).join(" ")}</span>
                            : <span style={{ color:"#334155" }}>—</span>}
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          {u.display_name
                            ? <span style={{ background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:8, padding:"2px 8px", color:"#a78bfa", fontSize:11, fontWeight:600 }}>@{u.display_name}</span>
                            : <span style={{ color:"#334155" }}>—</span>}
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          <span style={s.badge(u.plan)}>{u.plan}</span>
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          {u.plan_managed_by === "team" ? (
                            <div>
                              <div style={{ color:"#8b5cf6", fontSize:10, fontWeight:700 }}>
                                {u.team_name || "Team"}
                              </div>
                              <div style={{ color:"#475569", fontSize:9, marginTop:2 }}>
                                {u.team_owner_email ? `↳ ${u.team_owner_email}` : "Agency"}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color:"#334155" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding:"12px 16px", color:"#94a3b8" }}>
                          <span style={{ color: planLimit(u.plan) !== "∞" && (u.generations_count || 0) >= PLAN_LIMITS[u.plan] ? "#ef4444" : "#94a3b8", fontWeight:700 }}>
                            {u.generations_count || 0}
                          </span>
                          <span style={{ color:"#475569" }}> / {planLimit(u.plan)}</span>
                        </td>
                        <td style={{ padding:"12px 16px", color:"#94a3b8" }}>{u.post_count || 0}</td>
                        <td style={{ padding:"12px 16px" }}>
                          {u.stripe_subscription_id
                            ? <span style={{ color:"#22c55e", fontSize:11 }}>✓ Actif</span>
                            : <span style={{ color:"#334155", fontSize:11 }}>—</span>}
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          {u.banned
                            ? <span style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, color:"#ef4444" }}>🚫 Banni</span>
                            : <span style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, color:"#22c55e" }}>✓ Actif</span>}
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          {u.email_verified
                            ? <span style={{ color:"#22c55e", fontSize:11 }}>✓ Oui</span>
                            : <span style={{ color:"#f59e0b", fontSize:11 }}>⚠ Non</span>}
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            <button title="Modifier" style={{ ...s.btnSm, background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.3)", color:"#60a5fa" }} onClick={()=>setEditUser(u)}>✏️</button>
                            <button title="Reset mot de passe" style={{ ...s.btnSm, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", color:"#f59e0b" }} onClick={()=>setResetUser(u)}>🔑</button>
                            <button title="Reset quota" style={{ ...s.btnSm, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", color:"#22c55e" }} onClick={()=>resetQuota(u.id)}>↺</button>
                            {!u.email_verified && (
                              <button title="Renvoyer email de vérification" style={{ ...s.btnSm, background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.3)", color:"#f97316" }} onClick={()=>resendVerification(u)}>📧</button>
                            )}
                            <button
                              title={u.email_verified ? "✓ Email vérifié" : "Vérifier manuellement"}
                              style={{ ...s.btnSm, background: u.email_verified ? "rgba(34,197,94,0.05)" : "rgba(34,197,94,0.1)", border:`1px solid ${u.email_verified ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.3)"}`, color: u.email_verified ? "#334155" : "#22c55e", cursor: u.email_verified ? "default" : "pointer" }}
                              onClick={()=>!u.email_verified && verifyEmail(u)}
                            >{u.email_verified ? "✓" : "✓?"}</button>
                            <button
                              title={u.banned ? "Débannir" : "Bannir"}
                              style={{ ...s.btnSm, background: u.banned ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", border: u.banned ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(245,158,11,0.3)", color: u.banned ? "#22c55e" : "#f59e0b" }}
                              onClick={()=>toggleBan(u)}
                            >{u.banned ? "✅" : "🚫"}</button>
                            <button title="Supprimer" style={{ ...s.btnSm, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444" }} onClick={()=>deleteUser(u.id, u.email)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pages > 1 && (
                <div style={{ display:"flex", justifyContent:"center", gap:8, padding:16, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button key={p} style={{ ...s.btnSm, background:page===p?"rgba(220,38,38,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${page===p?"rgba(220,38,38,0.4)":"rgba(255,255,255,0.1)"}`, color:page===p?"#ef4444":"#64748b", width:32, height:32 }} onClick={()=>fetchUsers(p)}>{p}</button>
                  ))}
                </div>
              )}
            </div>
            </>)}
          </>
        )}

        {/* ── Onglet Historique avec sous-onglets ── */}
        {tab === "logs" && (
          <div>
            <div style={{ display:"flex", gap:4, marginBottom:16, borderBottom:"1px solid rgba(255,255,255,0.06)", paddingBottom:0 }}>
              <button style={{ ...s.tabBtn(logsSubTab==="admin"),      fontSize:11, padding:"8px 16px" }} onClick={() => setLogsSubTab("admin")}>🛡️ Actions Admins</button>
              <button style={{ ...s.tabBtn(logsSubTab==="users"),      fontSize:11, padding:"8px 16px" }} onClick={() => setLogsSubTab("users")}>👥 Actions Users</button>
              <button style={{ ...s.tabBtn(logsSubTab==="userevents"), fontSize:11, padding:"8px 16px" }} onClick={() => setLogsSubTab("userevents")}>📊 Events Users</button>
              <button style={{ ...s.tabBtn(logsSubTab==="billing"),    fontSize:11, padding:"8px 16px" }} onClick={() => setLogsSubTab("billing")}>💳 Billing</button>
              <button style={{ ...s.tabBtn(logsSubTab==="team"),       fontSize:11, padding:"8px 16px" }} onClick={() => setLogsSubTab("team")}>👥 Team</button>
            </div>
            {logsSubTab === "admin"      && <AdminLogsTab      token={token} />}
            {logsSubTab === "users"      && <UsersActionsTab   token={token} />}
            {logsSubTab === "userevents" && <UserLogsTab       token={token} />}
            {logsSubTab === "billing"    && <BillingLogsTab    token={token} />}
            {logsSubTab === "team"       && <TeamLogsTab       token={token} />}
          </div>
        )}

        {/* ── Onglet Visites ── */}
        {tab === "overrides" && <OverridesTab token={token} />}
        {tab === "promos"    && <PromoTab token={token} />}
        {tab === "analytics" && <AnalyticsTab token={token} />}
      </div>

      {/* ── Panel Notifications ── */}
      {showNotifs && (
        <NotificationsPanel
          token={token}
          onClose={() => { setShowNotifs(false); setUnreadNotifs(0); }}
        />
      )}

      {editUser  && <EditUserModal user={editUser} token={token} onClose={()=>setEditUser(null)} onSave={()=>{ fetchUsers(page); fetchStats(); }} />}
      {resetUser && <ResetPasswordModal user={resetUser} token={token} onClose={()=>setResetUser(null)} />}
      {confirm   && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)} />}
    </div>
  );
}
