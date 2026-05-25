// src/pages/Admin.jsx
// GrowthPILOT — Sprint 4 : Admin Dashboard
// Accessible uniquement avec admin@growthpilot.admin

import { useState, useEffect, useCallback } from "react";
import { ConfirmModal } from "./tabs/shared.js";

const API = "https://social-ai-app-production.up.railway.app";

const PLANS = ["Free", "Pro", "Business", "Agency"];
const PLAN_COLORS = { Free:"#64748b", Pro:"#3b82f6", Business:"#f59e0b", Agency:"#8b5cf6" };

const ACTION_LABELS = {
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
};

const s = {
  page:    { minHeight:"100vh", background:"#0a0f1e", color:"#e2e8f0", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header:  { background:"#0f172a", borderBottom:"1px solid rgba(220,38,38,0.3)", padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between" },
  content: { padding:"32px", maxWidth:1400, margin:"0 auto" },
  card:    { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 },
  input:   { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 14px", color:"#e2e8f0", fontSize:13, outline:"none", fontFamily:"inherit" },
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
  const [plan,   setPlan]   = useState(user.plan || "Free");
  const [quota,  setQuota]  = useState(user.generations_count || 0);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`${API}/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ plan, generations_count: quota }),
    });
    onSave();
    onClose();
    setSaving(false);
  };

  const resetQuota = async () => {
    await fetch(`${API}/admin/users/${user.id}/reset-quota`, {
      method: "POST",
      headers: { Authorization:`Bearer ${token}` },
    });
    setQuota(0);
  };

  const toggleBan = async () => {
    await fetch(`${API}/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ banned: !user.banned }),
    });
    onSave();
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ ...s.card, width:"100%", maxWidth:440, background:"#111827", border:"1px solid rgba(220,38,38,0.25)", boxShadow:"0 30px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ color:"#e2e8f0", fontWeight:800, fontSize:15 }}>✏️ Edit User</div>
          <button style={{ background:"transparent", border:"none", color:"#475569", fontSize:20, cursor:"pointer" }} onClick={onClose}>✕</button>
        </div>

        <div style={{ color:"#64748b", fontSize:12, marginBottom:20, background:"rgba(255,255,255,0.03)", padding:"10px 14px", borderRadius:8 }}>
          <div style={{ color:"#e2e8f0", fontWeight:700 }}>{user.email}</div>
          <div style={{ marginTop:4 }}>ID #{user.id}</div>
          {user.banned && <div style={{ color:"#ef4444", fontWeight:700, marginTop:6 }}>🚫 Compte suspendu</div>}
        </div>

        <span style={s.label}>PLAN</span>
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          {PLANS.map(p => (
            <button key={p} style={{ ...s.btnSm, background:plan===p?`${PLAN_COLORS[p]}20`:"rgba(255,255,255,0.04)", border:`1px solid ${plan===p?PLAN_COLORS[p]:"rgba(255,255,255,0.1)"}`, color:plan===p?PLAN_COLORS[p]:"#94a3b8", padding:"7px 14px", fontSize:11 }} onClick={()=>setPlan(p)}>{p}</button>
          ))}
        </div>

        <span style={s.label}>GÉNÉRATIONS UTILISÉES</span>
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          <input style={{ ...s.input, flex:1 }} type="number" value={quota} onChange={e=>setQuota(parseInt(e.target.value)||0)} />
          <button style={{ ...s.btnSm, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", color:"#22c55e", padding:"9px 14px" }} onClick={resetQuota}>Reset à 0</button>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"#94a3b8", fontSize:11, fontWeight:700, padding:"10px", cursor:"pointer" }} onClick={onClose}>Annuler</button>
          <button
            style={{ ...s.btnSm, padding:"10px 14px", background: user.banned ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: user.banned ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(239,68,68,0.4)", color: user.banned ? "#22c55e" : "#ef4444", fontSize:11, borderRadius:8 }}
            onClick={toggleBan}
          >{user.banned ? "✅ Débannir" : "🚫 Bannir"}</button>
          <button style={{ ...s.btn, flex:2, opacity:saving?0.7:1 }} onClick={save} disabled={saving}>{saving?"💾 Enregistrement...":"💾 Enregistrer"}</button>
        </div>
      </div>
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
                  <td style={{ padding:"12px 16px", color:"#64748b", fontSize:11 }}>{log.details ? (() => { try { const d = typeof log.details === "string" ? JSON.parse(log.details) : log.details; return JSON.stringify(d, null, 0).slice(0, 80); } catch { return String(log.details).slice(0, 80); } })() : "—"}</td>
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
                  <td style={{ padding:"12px 16px", color:"#64748b", fontSize:11 }}>{log.details ? (() => { try { const d = typeof log.details === "string" ? JSON.parse(log.details) : log.details; return JSON.stringify(d, null, 0).slice(0, 80); } catch { return String(log.details).slice(0, 80); } })() : "—"}</td>
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
  generate_post:        { label:"✍️ Génération",    color:"#ef4444" },
  save_post:            { label:"💾 Sauvegarde",     color:"#22c55e" },
  copy_post:            { label:"📋 Copie",          color:"#64748b" },
  rewrite_post:         { label:"🔄 Réécriture",     color:"#f59e0b" },
  analyze_post:         { label:"🔍 Analyse",        color:"#8b5cf6" },
  create_project:       { label:"📁 Projet créé",    color:"#3b82f6" },
  delete_project:       { label:"🗑️ Projet supprimé",color:"#ef4444" },
  rename_project:       { label:"✏️ Projet renommé", color:"#f59e0b" },
  calendar_add_card:    { label:"📅 Cal. Ajout",     color:"#22c55e" },
  calendar_delete_card: { label:"📅 Cal. Supprim.",  color:"#ef4444" },
  calendar_move_card:   { label:"📅 Cal. Déplace",   color:"#f59e0b" },
  calendar_edit_card:   { label:"📅 Cal. Édition",   color:"#64748b" },
  calendar_import_post: { label:"📅 Cal. Import",    color:"#8b5cf6" },
  update_profile:       { label:"👤 Profil modifié", color:"#3b82f6" },
  change_password:      { label:"🔑 Mdp changé",     color:"#f97316" },
  change_email:         { label:"📧 Email changé",   color:"#f97316" },
  generate_image:       { label:"🖼️ Image générée",  color:"#8b5cf6" },
  attach_media:         { label:"📎 Média attaché",  color:"#38bdf8" },
  watch_search:         { label:"🌍 Veille",         color:"#22c55e" },
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
                  <td style={{ padding:"12px 16px", color:"#64748b", fontSize:11 }}>{log.details ? (() => { try { const d = typeof log.details === "string" ? JSON.parse(log.details) : log.details; return JSON.stringify(d, null, 0).slice(0, 80); } catch { return String(log.details).slice(0, 80); } })() : "—"}</td>
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

  const headers = { Authorization:`Bearer ${token}` };

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
        <button style={{ ...s.btnSm, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#94a3b8", padding:"8px 16px" }} onClick={logout}>↩ Logout</button>
      </div>

      <div style={s.content}>

        {/* Stats globales */}
        {stats && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:32 }}>
            <StatCard label="UTILISATEURS"  value={stats.totalUsers}  color="#e2e8f0" />
            <StatCard label="ACTIFS 30J"    value={stats.activeUsers} color="#22c55e" />
            <StatCard label="BANNIS"        value={stats.bannedUsers || 0} color="#ef4444" />
            <StatCard label="POSTS TOTAL"   value={stats.totalPosts}  color="#94a3b8" />
            <StatCard label="MRR ESTIMÉ"    value={`€${stats.mrr}`}   color="#f59e0b" />
            <StatCard label="FREE"     value={stats.plans?.Free     || 0} color="#64748b" />
            <StatCard label="PRO"      value={stats.plans?.Pro      || 0} color="#3b82f6" />
            <StatCard label="BUSINESS" value={stats.plans?.Business || 0} color="#f59e0b" />
            <StatCard label="AGENCY"   value={stats.plans?.Agency   || 0} color="#8b5cf6" />
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.07)", marginBottom:24 }}>
          <button style={s.tabBtn(tab==="users")}      onClick={()=>setTab("users")}>👥 Comptes</button>
          <button style={s.tabBtn(tab==="logs")}       onClick={()=>setTab("logs")}>📋 Historique</button>
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
                      {["ID","EMAIL","NOM","DISPLAY NAME","PLAN","GÉNÉRATIONS","POSTS","STRIPE","STATUT","VÉRIFIÉ","ACTIONS"].map(h => (
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
                        <td style={{ padding:"12px 16px", color:"#94a3b8" }}>{u.generations_count || 0}</td>
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
              <button style={{ ...s.tabBtn(logsSubTab==="admin"), fontSize:11, padding:"8px 16px" }} onClick={() => setLogsSubTab("admin")}>🛡️ Actions Admins</button>
              <button style={{ ...s.tabBtn(logsSubTab==="users"), fontSize:11, padding:"8px 16px" }} onClick={() => setLogsSubTab("users")}>👥 Actions Users</button>
              <button style={{ ...s.tabBtn(logsSubTab==="userevents"), fontSize:11, padding:"8px 16px" }} onClick={() => setLogsSubTab("userevents")}>📊 Events Users</button>
            </div>
            {logsSubTab === "admin" && <AdminLogsTab token={token} />}
            {logsSubTab === "users" && <UsersActionsTab token={token} />}
            {logsSubTab === "userevents" && <UserLogsTab token={token} />}
          </div>
        )}

        {/* ── Onglet Visites ── */}
        {tab === "analytics" && <AnalyticsTab token={token} />}
      </div>

      {editUser  && <EditUserModal user={editUser} token={token} onClose={()=>setEditUser(null)} onSave={()=>{ fetchUsers(page); fetchStats(); }} />}
      {resetUser && <ResetPasswordModal user={resetUser} token={token} onClose={()=>setResetUser(null)} />}
      {confirm   && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)} />}
    </div>
  );
}
