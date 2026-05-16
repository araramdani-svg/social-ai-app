// src/pages/Admin.jsx
// GrowthPILOT — Sprint 4 : Admin Dashboard
// Accessible uniquement avec admin@growthpilot.admin

import { useState, useEffect, useCallback } from "react";
import { ConfirmModal } from "./tabs/shared.js";

const API = "https://social-ai-app-production.up.railway.app";

const PLANS = ["Free", "Pro", "Business", "Agency"];
const PLAN_COLORS = { Free:"#64748b", Pro:"#3b82f6", Business:"#f59e0b", Agency:"#8b5cf6" };

const s = {
  page:    { minHeight:"100vh", background:"#0a0f1e", color:"#e2e8f0", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", padding:"0" },
  header:  { background:"#0f172a", borderBottom:"1px solid rgba(220,38,38,0.3)", padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between" },
  content: { padding:"32px", maxWidth:1400, margin:"0 auto" },
  card:    { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 },
  input:   { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 14px", color:"#e2e8f0", fontSize:13, outline:"none", fontFamily:"inherit" },
  btn:     { background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", borderRadius:8, color:"#fff", fontSize:11, fontWeight:700, letterSpacing:"1px", padding:"9px 16px", cursor:"pointer" },
  btnSm:   { border:"none", borderRadius:6, fontSize:10, fontWeight:700, padding:"5px 10px", cursor:"pointer" },
  label:   { fontSize:10, fontWeight:700, letterSpacing:"1.5px", color:"#64748b", marginBottom:4, display:"block" },
  badge:   (plan) => ({ background:`${PLAN_COLORS[plan] || "#64748b"}20`, border:`1px solid ${PLAN_COLORS[plan] || "#64748b"}40`, borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, color:PLAN_COLORS[plan] || "#64748b" }),
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

function EditUserModal({ user, token, onClose, onSave }) {
  const [plan,  setPlan]  = useState(user.plan || "Free");
  const [quota, setQuota] = useState(user.generations_count || 0);
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

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ ...s.card, width:"100%", maxWidth:440, background:"#111827", border:"1px solid rgba(220,38,38,0.25)", boxShadow:"0 30px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ color:"#e2e8f0", fontWeight:800, fontSize:15 }}>✏️ Edit User</div>
          <button style={{ background:"transparent", border:"none", color:"#475569", fontSize:20, cursor:"pointer" }} onClick={onClose}>✕</button>
        </div>

        <div style={{ color:"#64748b", fontSize:12, marginBottom:20, background:"rgba(255,255,255,0.03)", padding:"10px 14px", borderRadius:8 }}>
          <div style={{ color:"#e2e8f0", fontWeight:700 }}>{user.email}</div>
          <div style={{ marginTop:4 }}>ID #{user.id} · Joined {new Date(user.created_at).toLocaleDateString("fr-FR")}</div>
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
          <button style={{ ...s.btn, flex:2, opacity:saving?0.7:1 }} onClick={save} disabled={saving}>{saving?"Saving...":"💾 Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}

export default function Admin({ token, logout }) {
  const [stats,     setStats]     = useState(null);
  const [users,     setUsers]     = useState([]);
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(1);
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState("");
  const [planFilter,setPlanFilter]= useState("");
  const [loading,   setLoading]   = useState(false);
  const [editUser,  setEditUser]  = useState(null);
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
    if (search)     params.append("search", search);
    if (planFilter) params.append("plan",   planFilter);
    const r = await fetch(`${API}/admin/users?${params}`, { headers });
    const d = await r.json();
    setUsers(d.users || []);
    setTotal(d.total || 0);
    setPages(d.pages || 1);
    setPage(p);
    setLoading(false);
  }, [token, search, planFilter]);

  useEffect(() => { fetchStats(); fetchUsers(); }, []);
  useEffect(() => { fetchUsers(1); }, [search, planFilter]);

  const deleteUser = (id, email) => {
    setConfirm({ message: `Supprimer définitivement ${email} ?`, onConfirm: async () => {
      await fetch(`${API}/admin/users/${id}`, { method:"DELETE", headers });
      fetchUsers(page);
      fetchStats();
      setConfirm(null);
    }});
  };

  const resetQuota = async (id) => {
    await fetch(`${API}/admin/users/${id}/reset-quota`, { method:"POST", headers });
    fetchUsers(page);
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
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:32 }}>
            <StatCard label="UTILISATEURS TOTAL" value={stats.totalUsers} color="#e2e8f0" />
            <StatCard label="ACTIFS 30J"          value={stats.activeUsers} color="#22c55e" />
            <StatCard label="POSTS TOTAL"          value={stats.totalPosts} color="#ef4444" />
            <StatCard label="MRR ESTIMÉ"           value={`€${stats.mrr}`} color="#f59e0b" />
            <StatCard label="FREE"     value={stats.plans?.Free     || 0} color="#64748b" />
            <StatCard label="PRO"      value={stats.plans?.Pro      || 0} color="#3b82f6" />
            <StatCard label="BUSINESS" value={stats.plans?.Business || 0} color="#f59e0b" />
            <StatCard label="AGENCY"   value={stats.plans?.Agency   || 0} color="#8b5cf6" />
          </div>
        )}

        {/* Filters */}
        <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
          <input
            style={{ ...s.input, width:260 }}
            placeholder="🔍 Rechercher email ou nom..."
            value={search}
            onChange={e=>setSearch(e.target.value)}
          />
          <div style={{ display:"flex", gap:8 }}>
            {["", ...PLANS].map(p => (
              <button key={p||"all"} style={{ ...s.btnSm, background:planFilter===p?"rgba(220,38,38,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${planFilter===p?"rgba(220,38,38,0.4)":"rgba(255,255,255,0.1)"}`, color:planFilter===p?"#ef4444":"#64748b", padding:"7px 12px", fontSize:11 }} onClick={()=>setPlanFilter(p)}>{p||"Tous"}</button>
            ))}
          </div>
          <div style={{ marginLeft:"auto", color:"#475569", fontSize:12 }}>{total} utilisateurs</div>
        </div>

        {/* Table */}
        <div style={{ ...s.card, padding:0, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:"rgba(255,255,255,0.03)" }}>
                  {["ID","EMAIL","PLAN","GÉNÉRATIONS","POSTS","INSCRIPTION","STRIPE","ACTIONS"].map(h => (
                    <th key={h} style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={8} style={{ textAlign:"center", padding:40, color:"#475569" }}>Chargement...</td></tr>
                )}
                {!loading && users.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign:"center", padding:40, color:"#475569" }}>Aucun utilisateur trouvé</td></tr>
                )}
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"12px 16px", color:"#475569" }}>#{u.id}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ color:"#e2e8f0", fontWeight:600 }}>{u.email}</div>
                      {u.linkedin_name && <div style={{ color:"#64748b", fontSize:11 }}>{u.linkedin_name}</div>}
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={s.badge(u.plan)}>{u.plan}</span>
                    </td>
                    <td style={{ padding:"12px 16px", color:"#94a3b8" }}>
                      {u.generations_count || 0}
                    </td>
                    <td style={{ padding:"12px 16px", color:"#94a3b8" }}>{u.post_count || 0}</td>
                    <td style={{ padding:"12px 16px", color:"#64748b", whiteSpace:"nowrap" }}>
                      —
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      {u.stripe_subscription_id
                        ? <span style={{ color:"#22c55e", fontSize:11 }}>✓ Actif</span>
                        : <span style={{ color:"#334155", fontSize:11 }}>—</span>
                      }
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ display:"flex", gap:6 }}>
                        <button style={{ ...s.btnSm, background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.3)", color:"#60a5fa" }} onClick={()=>setEditUser(u)}>✏️ Edit</button>
                        <button style={{ ...s.btnSm, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", color:"#22c55e" }} onClick={()=>resetQuota(u.id)}>↺ Quota</button>
                        <button style={{ ...s.btnSm, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444" }} onClick={()=>deleteUser(u.id, u.email)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display:"flex", justifyContent:"center", gap:8, padding:16, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} style={{ ...s.btnSm, background:page===p?"rgba(220,38,38,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${page===p?"rgba(220,38,38,0.4)":"rgba(255,255,255,0.1)"}`, color:page===p?"#ef4444":"#64748b", width:32, height:32 }} onClick={()=>fetchUsers(p)}>{p}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {editUser && <EditUserModal user={editUser} token={token} onClose={()=>setEditUser(null)} onSave={()=>{ fetchUsers(page); fetchStats(); }} />}
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)} />}
    </div>
  );
}
