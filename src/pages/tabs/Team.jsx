import { useState, useEffect, useCallback } from "react";
import { t as tr } from "../../translations.js";
import { st, PageHeader, ConfirmModal } from "./shared.js";

const API = "https://social-ai-app-production.up.railway.app";
const MAX_MEMBERS_BUSINESS = 5;
const MAX_MEMBERS_AGENCY   = 20;
const MAX_CLIENTS_AGENCY   = 50;

const ROLES = [
  { id:"admin",     label:"Admin",     color:"#ef4444", desc:"Full access — manage team, generate, publish & analyze" },
  { id:"editor",    label:"Editor",    color:"#f59e0b", desc:"Generate content, analyze posts & access brand memory" },
  { id:"publisher", label:"Publisher", color:"#60a5fa", desc:"Publish content across all connected platforms" },
];

const CLIENT_COLORS = ["#ef4444","#f97316","#f59e0b","#22c55e","#06b6d4","#8b5cf6","#ec4899","#64748b"];

const s = {
  card:      { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 },
  btn:       { background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", borderRadius:8, color:"#fff", fontSize:11, fontWeight:700, letterSpacing:"1px", padding:"10px 18px", cursor:"pointer" },
  btnAgency: { background:"linear-gradient(135deg,#8b5cf6,#7c3aed)", border:"none", borderRadius:8, color:"#fff", fontSize:11, fontWeight:700, letterSpacing:"1px", padding:"10px 18px", cursor:"pointer" },
  btnGhost:  { background:"transparent", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"#94a3b8", fontSize:11, fontWeight:700, padding:"9px 14px", cursor:"pointer" },
  btnDanger: { background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, color:"#ef4444", fontSize:11, fontWeight:700, padding:"7px 12px", cursor:"pointer" },
  input:     { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 14px", color:"#e2e8f0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" },
  textarea:  { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 14px", color:"#e2e8f0", fontSize:12, outline:"none", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical", minHeight:60 },
  select:    { background:"rgba(15,23,42,0.8)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"4px 8px", color:"#e2e8f0", fontSize:11, outline:"none" },
  label:     { fontSize:10, fontWeight:700, letterSpacing:"1.5px", color:"#64748b", marginBottom:6, display:"block" },
  divider:   { height:1, background:"rgba(255,255,255,0.06)", margin:"14px 0" },
  tabBtn:    (active, color="#ef4444") => ({ flex:1, padding:"10px", background:"transparent", border:"none", borderBottom: active ? `2px solid ${color}` : "2px solid transparent", color: active ? color : "#475569", fontWeight:700, fontSize:11, letterSpacing:"1px", cursor:"pointer" }),
};

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

/* ── Gate ─────────────────────────────────────────────────────────────────── */
function BusinessGate({ setPage }) {
  return (
    <div style={{ ...s.card, textAlign:"center", padding:"60px 32px", border:"1px solid rgba(249,115,22,0.3)", background:"rgba(249,115,22,0.04)" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🏢</div>
      <div style={{ color:"#f97316", fontSize:18, fontWeight:800, marginBottom:8 }}>Business Plan Required</div>
      <div style={{ color:"#475569", fontSize:14, lineHeight:1.7, maxWidth:380, margin:"0 auto 24px" }}>
        Team Console is exclusively available on the <strong style={{color:"#f97316"}}>Business plan</strong>. Invite up to {MAX_MEMBERS_BUSINESS} members, assign roles, and collaborate in real time.
      </div>
      <button style={{ ...s.btn, padding:"14px 28px", fontSize:13 }} onClick={() => setPage && setPage("pricing")}>
        💎 Upgrade to Business →
      </button>
    </div>
  );
}

/* ── Invite Modal ─────────────────────────────────────────────────────────── */
function InviteModal({ token, onClose, onSuccess }) {
  const [email,   setEmail]   = useState("");
  const [role,    setRole]    = useState("editor");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [copied,  setCopied]  = useState(false);
  const headers = { "Content-Type":"application/json", Authorization:`Bearer ${token}` };

  const submit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/team/invite`, { method:"POST", headers, body:JSON.stringify({ email:email.trim(), role }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || d.error);
      setResult(d); onSuccess?.();
    } catch (err) { setResult({ error: err.message }); }
    setLoading(false);
  };

  const copyLink = () => {
    if (result?.inviteUrl) { navigator.clipboard.writeText(result.inviteUrl); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ ...s.card, width:"100%", maxWidth:480, background:"#111827", border:"1px solid rgba(220,38,38,0.25)", boxShadow:"0 30px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ color:"#e2e8f0", fontWeight:800, fontSize:16 }}>👥 Invite a Member</div>
          <button style={{ background:"transparent", border:"none", color:"#475569", fontSize:20, cursor:"pointer" }} onClick={onClose}>✕</button>
        </div>
        {!result ? (
          <>
            <span style={s.label}>EMAIL ADDRESS</span>
            <input style={{ ...s.input, marginBottom:16 }} type="email" placeholder="colleague@company.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} autoFocus />
            <span style={s.label}>ROLE</span>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
              {ROLES.map(r => (
                <button key={r.id} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px", background:role===r.id?"rgba(239,68,68,0.08)":"rgba(255,255,255,0.02)", border:role===r.id?"1px solid rgba(239,68,68,0.3)":"1px solid rgba(255,255,255,0.07)", borderRadius:10, cursor:"pointer", textAlign:"left" }} onClick={()=>setRole(r.id)}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:r.color, marginTop:4, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ color:role===r.id?"#ef4444":"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:2 }}>{r.label}</div>
                    <div style={{ color:"#475569", fontSize:11 }}>{r.desc}</div>
                  </div>
                  {role===r.id && <span style={{ color:"#ef4444", fontSize:14 }}>✓</span>}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button style={{ ...s.btnGhost, flex:1 }} onClick={onClose}>Cancel</button>
              <button style={{ ...s.btn, flex:2, opacity:loading||!email?0.7:1 }} disabled={loading||!email} onClick={submit}>
                {loading ? "⏳ Sending..." : "📧 Send Invitation →"}
              </button>
            </div>
          </>
        ) : result.error ? (
          <div>
            <div style={{ color:"#ef4444", fontSize:14, marginBottom:16 }}>❌ {result.error}</div>
            <button style={s.btnGhost} onClick={()=>setResult(null)}>← Try again</button>
          </div>
        ) : (
          <div>
            <div style={{ color:"#22c55e", fontSize:13, fontWeight:700, marginBottom:12 }}>✅ {result.message}</div>
            {result.inviteUrl && (
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"12px 14px", marginBottom:14 }}>
                <div style={{ color:"#64748b", fontSize:10, fontWeight:700, letterSpacing:"1px", marginBottom:6 }}>INVITE LINK</div>
                <div style={{ color:"#94a3b8", fontSize:11, wordBreak:"break-all", marginBottom:10 }}>{result.inviteUrl}</div>
                <button style={{ ...s.btn, padding:"8px 14px", fontSize:11 }} onClick={copyLink}>{copied?"✓ Copied!":"📋 Copy Link"}</button>
              </div>
            )}
            <button style={s.btnGhost} onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Add Client Modal ─────────────────────────────────────────────────────── */
function AddClientModal({ token, onClose, onSuccess, editClient }) {
  const [form,    setForm]    = useState({ name:"", email:"", brand:"", niche:"", notes:"", color:"#ef4444", ...editClient });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const headers = { "Content-Type":"application/json", Authorization:`Bearer ${token}` };

  const submit = async () => {
    if (!form.name.trim()) { setError("Client name is required"); return; }
    setLoading(true);
    try {
      const isEdit = !!editClient?.id;
      const url    = isEdit ? `${API}/agency/clients/${editClient.id}` : `${API}/agency/clients`;
      const r      = await fetch(url, { method:isEdit?"PATCH":"POST", headers, body:JSON.stringify(form) });
      const d      = await r.json();
      if (!r.ok) throw new Error(d.error);
      onSuccess?.(); onClose();
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const f = (key) => ({ ...s.input, marginBottom:12 });

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ ...s.card, width:"100%", maxWidth:500, background:"#111827", border:"1px solid rgba(139,92,246,0.3)", boxShadow:"0 30px 80px rgba(0,0,0,0.6)", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ color:"#e2e8f0", fontWeight:800, fontSize:16 }}>🏢 {editClient?.id ? "Edit Client" : "New Client"}</div>
          <button style={{ background:"transparent", border:"none", color:"#475569", fontSize:20, cursor:"pointer" }} onClick={onClose}>✕</button>
        </div>

        {error && <div style={{ color:"#ef4444", fontSize:12, marginBottom:12 }}>❌ {error}</div>}

        <span style={s.label}>CLIENT NAME *</span>
        <input style={f()} placeholder="Acme Corp" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoFocus />

        <span style={s.label}>CONTACT EMAIL</span>
        <input style={f()} type="email" placeholder="contact@client.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />

        <span style={s.label}>BRAND NAME</span>
        <input style={f()} placeholder="Brand or product name" value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} />

        <span style={s.label}>NICHE</span>
        <input style={f()} placeholder="e.g. SaaS, E-commerce, Coaching..." value={form.niche} onChange={e=>setForm({...form,niche:e.target.value})} />

        <span style={s.label}>NOTES</span>
        <textarea style={{ ...s.textarea, marginBottom:16 }} placeholder="Tone of voice, objectives, constraints..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />

        <span style={s.label}>COLOR TAG</span>
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {CLIENT_COLORS.map(c => (
            <div key={c} onClick={()=>setForm({...form,color:c})} style={{ width:24, height:24, borderRadius:"50%", background:c, cursor:"pointer", border:form.color===c?"3px solid #fff":"2px solid transparent", transition:"all 0.15s" }} />
          ))}
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button style={{ ...s.btnGhost, flex:1 }} onClick={onClose}>Cancel</button>
          <button style={{ ...s.btnAgency, flex:2, opacity:loading?0.7:1 }} disabled={loading} onClick={submit}>
            {loading ? "⏳ Saving..." : editClient?.id ? "💾 Save Changes" : "➕ Add Client"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Agency Dashboard ─────────────────────────────────────────────────────── */
function AgencyDashboard({ token, clients, onAddClient, onEditClient, onDeleteClient, onRefresh, loading }) {
  const [dashStats,   setDashStats]   = useState(null);
  const [activeClient,setActiveClient]= useState(null);
  const headers = { "Content-Type":"application/json", Authorization:`Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/agency/dashboard`, { headers })
      .then(r=>r.json())
      .then(setDashStats)
      .catch(()=>{});
  }, [clients]);

  const deleteClient = (id) => {
    setConfirm({ message: "Remove this client?", onConfirm: async () => {
      await fetch(`${API}/agency/clients/${id}`, { method:"DELETE", headers });
      onRefresh();
      setConfirm(null);
    }});
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Stats agence */}
      {dashStats && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {[
            ["👥 CLIENTS",    dashStats.totalClients,    "#8b5cf6"],
            ["📝 POSTS",      dashStats.totalPosts,      "#ef4444"],
            ["💬 ENGAGEMENT", dashStats.totalEngagement, "#22c55e"],
          ].map(([label, val, color]) => (
            <div key={label} style={{ ...s.card, textAlign:"center", padding:16 }}>
              <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px", marginBottom:6 }}>{label}</div>
              <div style={{ color, fontSize:24, fontWeight:900 }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Header clients */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ color:"#e2e8f0", fontWeight:800, fontSize:15 }}>Client Portfolio</div>
          <div style={{ color:"#475569", fontSize:12, marginTop:2 }}>{clients.length} / {MAX_CLIENTS_AGENCY} clients</div>
        </div>
        <button style={s.btnAgency} onClick={onAddClient}>➕ New Client</button>
      </div>

      {/* Barre de capacité */}
      <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
        <div style={{ width:`${(clients.length/MAX_CLIENTS_AGENCY)*100}%`, height:"100%", background:"linear-gradient(90deg,#8b5cf6,#7c3aed)", borderRadius:2, transition:"width 0.4s" }} />
      </div>

      {/* Liste clients */}
      {loading && <div style={{ color:"#475569", textAlign:"center", padding:32 }}>Loading clients...</div>}

      {!loading && clients.length === 0 && (
        <div style={{ ...s.card, textAlign:"center", padding:"40px 24px", border:"1px dashed rgba(139,92,246,0.3)" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🏢</div>
          <div style={{ color:"#e2e8f0", fontWeight:700, marginBottom:8 }}>No clients yet</div>
          <div style={{ color:"#475569", fontSize:13, marginBottom:20 }}>Add your first client to start managing their content.</div>
          <button style={s.btnAgency} onClick={onAddClient}>➕ Add First Client</button>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
        {clients.map(client => (
          <div key={client.id} style={{ ...s.card, borderLeft:`3px solid ${client.color}`, position:"relative", cursor:"pointer" }}
            onClick={() => setActiveClient(activeClient?.id===client.id ? null : client)}>

            {/* Header client */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:client.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color:"#fff", flexShrink:0 }}>
                {client.name.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{client.name}</div>
                {client.brand && <div style={{ color:"#64748b", fontSize:11 }}>{client.brand}</div>}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button style={{ ...s.btnGhost, padding:"5px 8px", fontSize:10 }}
                  onClick={e=>{ e.stopPropagation(); onEditClient(client); }}>✏️</button>
                <button style={{ ...s.btnDanger, padding:"5px 8px", fontSize:10 }}
                  onClick={e=>{ e.stopPropagation(); deleteClient(client.id); }}>✕</button>
              </div>
            </div>

            {/* Infos */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
              {client.niche && <span style={{ background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:10, padding:"2px 8px", fontSize:10, color:"#8b5cf6", fontWeight:700 }}>{client.niche}</span>}
              {client.email && <span style={{ color:"#475569", fontSize:11 }}>{client.email}</span>}
            </div>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ color:"#334155", fontSize:11 }}>📝 {client.post_count || 0} posts</span>
              <span style={{ color:"#334155", fontSize:10 }}>Added {timeAgo(client.created_at)}</span>
            </div>

            {/* Notes expandable */}
            {activeClient?.id === client.id && client.notes && (
              <div style={{ marginTop:12, padding:"10px 12px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>
                {client.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function Team({ trendsLang, isMobile, token, userPlan, planManagedBy, projects, autoPosts, scheduledPosts, workspace, setPage }) {

  const [members,     setMembers]     = useState([]);
  const [clients,     setClients]     = useState([]);
  const [activity,    setActivity]    = useState([]);
  const [teamLogs,    setTeamLogs]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showInvite,  setShowInvite]  = useState(false);
  const [showClient,  setShowClient]  = useState(false);
  const [editClient,  setEditClient]  = useState(null);
  const [ownerInfo,   setOwnerInfo]   = useState(null);
  const [teamName,    setTeamName]    = useState("");
  const [teamNameSaving, setTeamNameSaving] = useState(false);
  const [activeTab,   setActiveTab]   = useState("members");
  const [mainTab,     setMainTab]     = useState("team");
  const [confirm,     setConfirm]     = useState(null);
  const [planUpdating,setPlanUpdating]= useState(null);
  const [resending,   setResending]   = useState(null);
  const [quotaResetting, setQuotaResetting] = useState(null);
  const [myTeamView,  setMyTeamView]  = useState(null);

  const isBusiness = userPlan === "Business" || userPlan === "Agency";
  const isAgency   = userPlan === "Agency";
  const isOwner    = isBusiness; // l'owner est celui qui a le plan Business/Agency
  const MAX_MEMBERS = isAgency ? MAX_MEMBERS_AGENCY : MAX_MEMBERS_BUSINESS;

  const headers = { "Content-Type":"application/json", Authorization:`Bearer ${token}` };

  const fetchTeamData = useCallback(async () => {
    if (!token || !isBusiness) return;
    setLoading(true);
    try {
      const [mRes, aRes] = await Promise.all([
        fetch(`${API}/team/members`,  { headers }),
        fetch(`${API}/team/activity`, { headers }),
      ]);
      const mData = await mRes.json();
      const aData = await aRes.json();
      setMembers(mData.members || []);
      setOwnerInfo(mData.owner || null);
      if (mData.owner?.teamName) setTeamName(mData.owner.teamName);
      setActivity(aData.activity || []);
    } catch {}
    setLoading(false);
  }, [token, isBusiness]);

  // Vue lecture seule pour les membres
  useEffect(() => {
    if (token && planManagedBy === "team") {
      fetch(`${API}/team/my-team-view`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.myRole) setMyTeamView(d); })
        .catch(() => {});
    }
  }, [token, userPlan]);

  const fetchClients = useCallback(async () => {
    if (!token || !isAgency) return;
    try {
      const r = await fetch(`${API}/agency/clients`, { headers });
      const d = await r.json();
      setClients(d.clients || []);
    } catch {}
  }, [token, isAgency]);

  useEffect(() => { fetchTeamData(); }, [fetchTeamData]);
  useEffect(() => { if (isAgency) fetchClients(); }, [fetchClients]);

  const saveTeamName = async () => {
    setTeamNameSaving(true);
    try {
      const r = await fetch(`${API}/team/name`, { method: "PATCH", headers, body: JSON.stringify({ teamName }) });
      const d = await r.json();
      if (!d.success) setConfirm({ message: `⚠️ ${d.error}`, onConfirm: () => setConfirm(null) });
    } catch {}
    setTeamNameSaving(false);
  };

  const removeMember = (id) => {
    setConfirm({ message: "Remove this member from your team?", onConfirm: async () => {
      await fetch(`${API}/team/members/${id}`, { method:"DELETE", headers });
      fetchTeamData();
      setConfirm(null);
    }});
  };

  const updateRole = async (id, role) => {
    await fetch(`${API}/team/members/${id}`, { method:"PATCH", headers, body:JSON.stringify({ role }) });
    fetchTeamData();
  };

  const fetchTeamLogs = async () => {
    setLogsLoading(true);
    try {
      const r = await fetch(`${API}/team/logs`, { headers });
      const d = await r.json();
      setTeamLogs(d.logs || []);
    } catch {}
    setLogsLoading(false);
  };

  const updateMemberPlan = async (memberId, plan) => {
    setPlanUpdating(memberId);
    try {
      const r = await fetch(`${API}/team/members/${memberId}/plan`, {
        method: "PATCH", headers,
        body: JSON.stringify({ plan }),
      });
      const d = await r.json();
      if (!d.success) setConfirm({ message: `⚠️ ${d.error || "Failed to update plan"}`, onConfirm: () => setConfirm(null) });
      fetchTeamData();
    } catch {}
    setPlanUpdating(null);
  };

  const resetMemberQuota = async (memberId) => {
    setQuotaResetting(memberId);
    try {
      const r = await fetch(`${API}/team/members/${memberId}/reset-quota`, { method: "POST", headers });
      const d = await r.json();
      if (d.success) {
        setConfirm({ message: "✅ Quota reset successfully", onConfirm: () => setConfirm(null) });
        fetchTeamData();
      } else {
        setConfirm({ message: `⚠️ ${d.error}`, onConfirm: () => setConfirm(null) });
      }
    } catch {}
    setQuotaResetting(null);
  };

  const resendInvite = async (id, email) => {
    setResending(id);
    try {
      const r = await fetch(`${API}/team/resend/${id}`, { method: "POST", headers });
      const d = await r.json();
      if (d.success) {
        setConfirm({
          message: `✅ Invitation resent to ${email}`,
          onConfirm: () => setConfirm(null),
        });
      } else {
        setConfirm({
          message: `⚠️ ${d.message || "Failed to resend invitation"}`,
          onConfirm: () => setConfirm(null),
        });
      }
    } catch {
      setConfirm({ message: "⚠️ Network error", onConfirm: () => setConfirm(null) });
    }
    setResending(null);
  };

  const used      = members.length;
  const remaining = MAX_MEMBERS - used;

  return (
    <>
      <PageHeader tabKey="team" trendsLang={trendsLang} isMobile={isMobile} />
      <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ background:"rgba(139,92,246,0.15)", border:"1px solid rgba(139,92,246,0.3)", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, color:"#8b5cf6", letterSpacing:"1px" }}>
          🧪 BETA
        </span>
        <span style={{ color:"#334155", fontSize:11 }}>Full collaboration features coming soon</span>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          [tr(trendsLang,"ui.statProjects"), projects.length,              "#ef4444"],
          [tr(trendsLang,"ui.queued"),       autoPosts?.length||0,         "#f59e0b"],
          [tr(trendsLang,"ui.scheduled"),    scheduledPosts?.length||0,    "#22c55e"],
          ["MEMBERS",                        isBusiness?`${used}/${MAX_MEMBERS}`:"—","#60a5fa"],
        ].map(([label, val, color]) => (
          <div key={label} style={{ ...st.card, marginTop:0, padding:14 }}>
            <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1.5px" }}>{label}</div>
            <div style={{ color, fontSize:22, fontWeight:800, marginTop:6 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Vue membre lecture seule */}
      {planManagedBy === "team" && myTeamView && (
        <div style={{ padding:"0 0 24px" }}>
          <div style={{ ...s.card, marginBottom:12 }}>
            <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:12 }}>👥 My Team</div>
            {/* Owner */}
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", marginBottom:10 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(239,68,68,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#ef4444", fontWeight:800, fontSize:12 }}>
                {(myTeamView.owner.name || myTeamView.owner.email)[0].toUpperCase()}
              </div>
              <div>
                <div style={{ color:"#e2e8f0", fontSize:12, fontWeight:600 }}>{myTeamView.owner.name || myTeamView.owner.email}</div>
                <div style={{ color:"#475569", fontSize:10 }}>Owner</div>
              </div>
              <div style={{ marginLeft:"auto", background:"rgba(239,68,68,0.1)", border:"1px solid #ef444433", borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:"#ef4444" }}>OWNER</div>
            </div>
            {/* Mon rôle */}
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"10px 14px", marginBottom:10 }}>
              <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1px", marginBottom:4 }}>MY ROLE</div>
              <div style={{ color:"#f59e0b", fontWeight:800, fontSize:13 }}>{myTeamView.myRole?.toUpperCase()}</div>
              <div style={{ color:"#475569", fontSize:11, marginTop:2 }}>
                Joined {myTeamView.joinedAt ? new Date(myTeamView.joinedAt).toLocaleDateString() : "—"}
              </div>
            </div>
            {/* Collègues */}
            {myTeamView.colleagues?.length > 0 && (
              <div>
                <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1px", marginBottom:8 }}>TEAM MEMBERS</div>
                {myTeamView.colleagues.map((c, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8", fontWeight:800, fontSize:10 }}>
                      {(c.member_name || c.member_email || "?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ color:"#e2e8f0", fontSize:11 }}>{c.member_name || c.member_email}</div>
                      <div style={{ color:"#475569", fontSize:10 }}>{c.role}</div>
                    </div>
                    <div style={{ fontSize:10, color: c.status === "active" ? "#22c55e" : "#f59e0b", fontWeight:700 }}>
                      {c.status?.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gate */}
      {planManagedBy !== "team" && !isBusiness ? <BusinessGate setPage={setPage} /> : planManagedBy === "team" ? null : (
        <>
          {/* Main tabs — Agency uniquement */}
          {isAgency && (
            <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.07)", marginBottom:16 }}>
              <button style={s.tabBtn(mainTab==="team")}   onClick={()=>setMainTab("team")}>👥 TEAM</button>
              <button style={s.tabBtn(mainTab==="agency","#8b5cf6")} onClick={()=>setMainTab("agency")}>🏢 AGENCE</button>
            </div>
          )}

          {/* ── TAB TEAM ── */}
          {mainTab === "team" && (
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap:16 }}>

              {/* Left */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                  <button style={s.tabBtn(activeTab==="members")}  onClick={()=>setActiveTab("members")}>👥 MEMBERS</button>
                  <button style={s.tabBtn(activeTab==="activity")} onClick={()=>setActiveTab("activity")}>📊 ACTIVITY</button>
                  <button style={s.tabBtn(activeTab==="perms")}    onClick={()=>setActiveTab("perms")}>🔐 ROLES</button>
                  {isOwner && <button style={s.tabBtn(activeTab==="logs")}  onClick={()=>{ setActiveTab("logs"); fetchTeamLogs(); }}>📋 HISTORIQUE</button>}
                  {isOwner && <button style={s.tabBtn(activeTab==="plans")} onClick={()=>setActiveTab("plans")}>💳 PLANS</button>}
                </div>

                {/* Members */}
                {activeTab === "members" && (
                  <div style={s.card}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                      <div>
                        <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13 }}>Team Members</div>
                        <div style={{ color:"#475569", fontSize:11, marginTop:2 }}>{used}/{MAX_MEMBERS} slots used</div>
                      </div>
                      {isOwner && remaining > 0 && <button style={s.btn} onClick={()=>setShowInvite(true)}>+ Invite</button>}
                    </div>
                    <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:2, marginBottom:16 }}>
                      <div style={{ width:`${(used/MAX_MEMBERS)*100}%`, height:"100%", background:"linear-gradient(90deg,#ef4444,#f97316)", borderRadius:2, transition:"width 0.4s" }} />
                    </div>
                    {/* Owner row */}
                    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#dc2626,#991b1b)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", flexShrink:0 }}>
                        {(ownerInfo?.name||ownerInfo?.email||"ME").slice(0,2).toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ color:"#e2e8f0", fontSize:13, fontWeight:600 }}>{ownerInfo?.name||ownerInfo?.email||"You"}</div>
                        <div style={{ color:"#475569", fontSize:11 }}>{ownerInfo?.email}</div>
                      </div>
                      <div style={{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:"#ef4444", letterSpacing:"1px" }}>OWNER</div>
                    </div>
                    {loading && <div style={{ color:"#475569", textAlign:"center", padding:20 }}>Loading...</div>}
                    {!loading && members.length === 0 && (
                      <div style={{ textAlign:"center", padding:"28px 0" }}>
                        <div style={{ fontSize:28, marginBottom:8 }}>👥</div>
                        <div style={{ color:"#475569", fontSize:13, marginBottom:16 }}>No members yet.</div>
                        {isOwner && <button style={s.btn} onClick={()=>setShowInvite(true)}>+ Invite your first member</button>}
                      </div>
                    )}
                    {members.map(m => {
                      const roleInfo = ROLES.find(r=>r.id===m.role) || ROLES[1];
                      const statusColor = m.status==="active"?"#22c55e":"#f59e0b";
                      return (
                        <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                          <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#94a3b8", flexShrink:0 }}>
                            {m.member_email?.slice(0,2).toUpperCase()}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ color:"#e2e8f0", fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.member_name||m.member_email}</div>
                            <div style={{ color:"#475569", fontSize:11 }}>{m.member_email}</div>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
                              <div style={{ width:5, height:5, borderRadius:"50%", background:statusColor }} />
                              <span style={{ color:statusColor, fontSize:10, fontWeight:700 }}>{m.status.toUpperCase()}</span>
                              <span style={{ color:"#334155", fontSize:10 }}>· {m.status==="pending"?`Invited ${timeAgo(m.invited_at)}`:`Joined ${timeAgo(m.joined_at)}`}</span>
                            </div>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                            <div style={{ background:`rgba(${roleInfo.color==="#ef4444"?"239,68,68":roleInfo.color==="#f59e0b"?"245,158,11":"96,165,250"},0.1)`, border:`1px solid ${roleInfo.color}33`, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:roleInfo.color }}>{roleInfo.label.toUpperCase()}</div>
                            <select style={{ ...s.select, color:roleInfo.color }} value={m.role} onChange={e=>updateRole(m.id, e.target.value)}>
                              {ROLES.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
                            </select>
                            <button style={s.btnDanger} onClick={()=>removeMember(m.id)}>Remove</button>
                            {m.status === "pending" && (
                              <button
                                style={{ ...s.btn, background:"linear-gradient(135deg,#3b82f6,#2563eb)", fontSize:10, padding:"7px 12px", opacity: resending===m.id ? 0.6 : 1 }}
                                onClick={() => resendInvite(m.id, m.member_email)}
                                disabled={resending === m.id}
                              >
                                {resending === m.id ? "Sending..." : "↩ Resend invite"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {!loading && members.length > 0 && remaining > 0 && isOwner && (
                      <button style={{ ...s.btn, width:"100%", marginTop:12 }} onClick={()=>setShowInvite(true)}>+ Invite Another ({remaining} slot{remaining!==1?"s":""} left)</button>
                    )}
                  </div>
                )}

                {/* Activity */}
                {activeTab === "activity" && (
                  <div style={s.card}>
                    <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:14 }}>📊 Team Activity</div>
                    {activity.length === 0 ? (
                      <div style={{ color:"#475569", textAlign:"center", padding:24, fontSize:13 }}>No activity recorded yet.</div>
                    ) : activity.map((a,i) => (
                      <div key={i} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ width:30, height:30, borderRadius:"50%", background:"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#64748b", flexShrink:0 }}>
                          {(a.linkedin_name||a.email)?.slice(0,2).toUpperCase()}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ color:"#e2e8f0", fontSize:12, fontWeight:600 }}>{a.linkedin_name||a.email}</div>
                          <div style={{ color:"#64748b", fontSize:12 }}>{a.action.replace(/_/g," ")}</div>
                        </div>
                        <div style={{ color:"#334155", fontSize:11, flexShrink:0 }}>{timeAgo(a.created_at)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Permissions */}
                {activeTab === "perms" && (
                  <div style={s.card}>
                    <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:4 }}>🔐 Role Permissions</div>
                    <div style={{ color:"#475569", fontSize:12, marginBottom:16 }}>Default permissions per role — customizable per member</div>
                    <div style={{ overflowX:"auto" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>PERMISSION</th>
                            {ROLES.map(r=><th key={r.id} style={{ textAlign:"center", color:r.color, fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"8px 8px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{r.label.toUpperCase()}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ["Generate content",    true,  true,  false],
                            ["Publish posts",       true,  false, true ],
                            ["Analyze content",     true,  true,  true ],
                            ["View Brand Memory",   true,  true,  false],
                            ["Manage team members", true,  false, false],
                            ["Access all projects", true,  true,  true ],
                            ["View analytics",      true,  true,  true ],
                          ].map(([label,admin,editor,publisher]) => (
                            <tr key={label}>
                              <td style={{ color:"#94a3b8", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>{label}</td>
                              {[admin,editor,publisher].map((v,i) => (
                                <td key={i} style={{ textAlign:"center", padding:"10px 8px", borderBottom:"1px solid rgba(255,255,255,0.04)", color:v?"#22c55e":"#334155", fontSize:15 }}>{v?"✓":"✗"}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Onglet Historique ── */}
                {activeTab === "logs" && isOwner && (
                  <div style={s.card}>
                    <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:4 }}>📋 Team History</div>
                    <div style={{ color:"#475569", fontSize:12, marginBottom:16 }}>All actions by team members</div>
                    {logsLoading ? (
                      <div style={{ textAlign:"center", color:"#475569", padding:20 }}>Loading...</div>
                    ) : teamLogs.length === 0 ? (
                      <div style={{ textAlign:"center", color:"#334155", padding:20 }}>No activity yet</div>
                    ) : (
                      <div style={{ overflowY:"auto", maxHeight:400 }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                          <thead>
                            <tr style={{ background:"rgba(255,255,255,0.03)" }}>
                              {["DATE","MEMBER","ACTION","DETAILS"].map(h => (
                                <th key={h} style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {teamLogs.map(log => (
                              <tr key={log.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                                <td style={{ padding:"10px 12px", color:"#475569", fontSize:10, whiteSpace:"nowrap" }}>
                                  {new Date(log.created_at).toLocaleString()}
                                </td>
                                <td style={{ padding:"10px 12px", color:"#94a3b8", fontSize:11 }}>
                                  {log.display_name || log.first_name || log.email?.split("@")[0]}
                                </td>
                                <td style={{ padding:"10px 12px" }}>
                                  <span style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, color:"#ef4444" }}>
                                    {log.action}
                                  </span>
                                </td>
                                <td style={{ padding:"10px 12px", color:"#475569", fontSize:11, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                                  title={typeof log.details === "string" ? log.details : JSON.stringify(log.details)}>
                                  {typeof log.details === "string" ? log.details.slice(0,80) : JSON.stringify(log.details).slice(0,80)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Onglet Plans ── */}
                {activeTab === "plans" && isOwner && (
                  <div style={s.card}>
                    <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:4 }}>💳 Member Plans</div>
                    <div style={{ color:"#475569", fontSize:12, marginBottom:16 }}>Manage plans for your team members · Pro seats billed at <strong style={{color:"#22c55e"}}>5€/month</strong> on your account</div>
                    {members.filter(m => m.status === "active").length === 0 ? (
                      <div style={{ textAlign:"center", color:"#334155", padding:20 }}>No active members yet</div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        {members.filter(m => m.status === "active").map(m => {
                          const currentPlan = m.current_plan || "Free";
                          const genCount = m.generations_count ?? 0;
                          return (
                            <div key={m.id} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"14px 16px" }}>
                              {/* Header membre */}
                              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                                <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(239,68,68,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#ef4444", fontWeight:800, fontSize:12, flexShrink:0 }}>
                                  {(m.member_name || m.member_email || "?")[0].toUpperCase()}
                                </div>
                                <div style={{ flex:1 }}>
                                  <div style={{ color:"#e2e8f0", fontSize:12, fontWeight:600 }}>{m.member_name || m.member_email}</div>
                                  <div style={{ color:"#475569", fontSize:10 }}>{m.role} · {genCount} generation{genCount !== 1 ? "s" : ""} used</div>
                                </div>
                              </div>
                              {/* Boutons plan style Admin */}
                              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                                {["Free", "Pro"].map(p => (
                                  <button
                                    key={p}
                                    onClick={() => currentPlan !== p && updateMemberPlan(m.id, p)}
                                    disabled={planUpdating === m.id}
                                    style={{
                                      padding:"6px 18px", borderRadius:6, fontSize:11, fontWeight:700, cursor: currentPlan === p ? "default" : "pointer",
                                      background: currentPlan === p ? (p === "Pro" ? "rgba(245,158,11,0.15)" : "rgba(100,116,139,0.15)") : "rgba(255,255,255,0.03)",
                                      border: currentPlan === p ? `1px solid ${p === "Pro" ? "#f59e0b" : "#64748b"}` : "1px solid rgba(255,255,255,0.08)",
                                      color: currentPlan === p ? (p === "Pro" ? "#f59e0b" : "#94a3b8") : "#475569",
                                    }}
                                  >{p}{planUpdating === m.id && currentPlan !== p ? " ⏳" : ""}</button>
                                ))}
                                {/* Reset quota */}
                                <button
                                  onClick={() => setConfirm({ message: `Reset quota for ${m.member_name || m.member_email}?`, onConfirm: async () => { setConfirm(null); await resetMemberQuota(m.id); } })}
                                  disabled={quotaResetting === m.id || genCount === 0}
                                  style={{ marginLeft:"auto", padding:"6px 14px", borderRadius:6, fontSize:11, fontWeight:700, cursor: genCount === 0 ? "default" : "pointer", background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", color: genCount === 0 ? "#334155" : "#22c55e", opacity: quotaResetting === m.id ? 0.6 : 1 }}
                                >
                                  {quotaResetting === m.id ? "⏳" : "Reset à 0"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={s.card}>
                  <span style={s.label}>WORKSPACE</span>
                  <div style={{ color:"#ef4444", fontSize:18, fontWeight:800 }}>{workspace||"PERSONAL"}</div>
                  <div style={s.divider} />
                  {/* Team Name */}
                  <span style={s.label}>TEAM NAME</span>
                  <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4 }}>
                    <input
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      placeholder="My Agency Team"
                      maxLength={50}
                      style={{ flex:1, background:"#0f172a", border:"1px solid rgba(220,38,38,0.2)", borderRadius:6, color:"#e2e8f0", fontSize:12, padding:"6px 10px", outline:"none" }}
                    />
                    <button
                      onClick={saveTeamName}
                      disabled={teamNameSaving}
                      style={{ background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", borderRadius:6, color:"#fff", fontSize:11, fontWeight:700, padding:"6px 12px", cursor:"pointer", opacity: teamNameSaving ? 0.6 : 1 }}
                    >{teamNameSaving ? "..." : "Save"}</button>
                  </div>
                  <div style={s.divider} />
                  <span style={s.label}>PLAN</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ color: isAgency?"#8b5cf6":"#f97316", fontSize:14, fontWeight:800 }}>{isAgency?"🏢 AGENCY":"💎 BUSINESS"}</span>
                    <div style={{ background: isAgency?"rgba(139,92,246,0.12)":"rgba(249,115,22,0.12)", border:`1px solid ${isAgency?"rgba(139,92,246,0.25)":"rgba(249,115,22,0.25)"}`, borderRadius:20, padding:"2px 9px", fontSize:10, fontWeight:700, color:isAgency?"#8b5cf6":"#f97316" }}>ACTIVE</div>
                  </div>
                  <div style={s.divider} />
                  <span style={s.label}>CAPACITY</span>
                  <div style={{ color:"#e2e8f0", fontSize:13 }}>{used} / {MAX_MEMBERS} members</div>
                  <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, marginTop:8 }}>
                    <div style={{ width:`${(used/MAX_MEMBERS)*100}%`, height:"100%", background:used===MAX_MEMBERS?"#ef4444":"linear-gradient(90deg,#22c55e,#16a34a)", borderRadius:2, transition:"width 0.4s" }} />
                  </div>
                  {isAgency && (
                    <>
                      <div style={s.divider} />
                      <span style={s.label}>CLIENTS</span>
                      <div style={{ color:"#e2e8f0", fontSize:13 }}>{clients.length} / {MAX_CLIENTS_AGENCY} clients</div>
                    </>
                  )}
                </div>

                {remaining > 0 && (
                  <div style={{ ...s.card, background:"rgba(239,68,68,0.04)", border:"1px solid rgba(239,68,68,0.15)", textAlign:"center", padding:24 }}>
                    <div style={{ fontSize:28, marginBottom:10 }}>👋</div>
                    <div style={{ color:"#e2e8f0", fontWeight:700, marginBottom:6 }}>Invite your team</div>
                    <div style={{ color:"#475569", fontSize:12, marginBottom:16, lineHeight:1.6 }}>{remaining} invitation slot{remaining!==1?"s":""} remaining</div>
                    {isOwner && <button style={{ ...s.btn, width:"100%", padding:"12px" }} onClick={()=>setShowInvite(true)}>+ Send Invitation</button>}
                  </div>
                )}

                <div style={s.card}>
                  <span style={s.label}>ROLES</span>
                  {ROLES.map(r => (
                    <div key={r.id} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:r.color, marginTop:4, flexShrink:0 }} />
                      <div>
                        <div style={{ color:r.color, fontSize:12, fontWeight:700 }}>{r.label}</div>
                        <div style={{ color:"#475569", fontSize:11, marginTop:2 }}>{r.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB AGENCY ── */}
          {mainTab === "agency" && isAgency && (
            <AgencyDashboard
              token={token}
              clients={clients}
              loading={loading}
              onAddClient={()=>{ setEditClient(null); setShowClient(true); }}
              onEditClient={(c)=>{ setEditClient(c); setShowClient(true); }}
              onDeleteClient={(id)=>fetchClients()}
              onRefresh={fetchClients}
            />
          )}
        </>
      )}

      {/* Modals */}
      {showInvite && <InviteModal token={token} onClose={()=>setShowInvite(false)} onSuccess={()=>{ fetchTeamData(); setShowInvite(false); }} />}
      {showClient && <AddClientModal token={token} editClient={editClient} onClose={()=>{ setShowClient(false); setEditClient(null); }} onSuccess={fetchClients} />}
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)} />}
    </>
  );
}
