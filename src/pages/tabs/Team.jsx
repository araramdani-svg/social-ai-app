import { useState, useEffect, useCallback, useRef } from "react";
import { t as tr } from "../../translations.js";
import { st, PageHeader, ConfirmModal } from "./shared.js";

const API = "https://social-ai-app-production.up.railway.app";
const MAX_MEMBERS_BUSINESS = 5;
const MAX_MEMBERS_AGENCY   = 20;
const MAX_CLIENTS_AGENCY   = 50;

const ROLES = [
  { id:"admin",     label:"Admin",     color:"#ef4444", descKey:"roleDescAdmin" },
  { id:"editor",    label:"Editor",    color:"#f59e0b", descKey:"roleDescEditor" },
  { id:"publisher", label:"Publisher", color:"#60a5fa", descKey:"roleDescPublisher" },
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

function timeAgo(dateStr, lang) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const prefix = tr(lang,"ui.timeAgoPrefix") || "";
  const suffix = tr(lang,"ui.timeAgoSuffix") || "ago";
  const justNow = tr(lang,"ui.timeJustNow") || "just now";
  const fmt = (val, unit) => prefix ? `${prefix} ${val}${unit} ` : `${val}${unit} ${suffix}`;
  if (m < 1) return justNow;
  if (m < 60) return fmt(m, "m");
  const h = Math.floor(m / 60);
  if (h < 24) return fmt(h, "h");
  return fmt(Math.floor(h/24), "d");
}

/* ── TeamChat ─────────────────────────────────────────────────────────────── */
function TeamChat({ token, teamId, trendsLang, isMobile, currentUserEmail, members }) {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [unread,    setUnread]    = useState(0);
  const bottomRef  = useRef(null);
  const pollRef    = useRef(null);
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchMessages = useCallback(async () => {
    try {
    const r = await fetch(`${API}/team/chat`, { headers });
      const d = await r.json();
      setMessages(d.messages || []);
      setLoading(false);
    } catch { setLoading(false); }
  }, [token, teamId]);

  useEffect(() => {
    fetchMessages();
    // Polling toutes les 5 secondes
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    try {
      await fetch(`${API}/team/chat`, {
        method: "POST", headers,
        body: JSON.stringify({ content }),
      });
      await fetchMessages();
    } catch {}
    setSending(false);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (email, name) => (name || email || "?").slice(0, 2).toUpperCase();
  const getColor = (email) => {
    const colors = ["#ef4444","#f97316","#f59e0b","#22c55e","#06b6d4","#8b5cf6","#ec4899"];
    let hash = 0;
    for (let i = 0; i < (email || "").length; i++) hash += email.charCodeAt(i);
    return colors[hash % colors.length];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "60vh" : 520, gap: 0 }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
        <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 13 }}>Chat Équipe</span>
        <span style={{ color: "#475569", fontSize: 11, marginLeft: 4 }}>{members.length + 1} membre{members.length > 0 ? "s" : ""}</span>
        <button onClick={fetchMessages} style={{ marginLeft: "auto", background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14 }}>🔄</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {loading && <div style={{ textAlign: "center", color: "#475569", padding: 20 }}>⏳ Chargement...</div>}
        {!loading && messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#334155" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
            <div style={{ color: "#475569", fontSize: 13 }}>Aucun message — soyez le premier !</div>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_email === currentUserEmail;
          const color = getColor(msg.sender_email);
          const showAvatar = !isMe && (i === 0 || messages[i-1]?.sender_email !== msg.sender_email);
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>
              {!isMe && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: showAvatar ? `${color}22` : "transparent", border: showAvatar ? `1px solid ${color}44` : "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color, flexShrink: 0 }}>
                  {showAvatar ? getInitials(msg.sender_email, msg.sender_name) : ""}
                </div>
              )}
              <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 3 }}>
                {showAvatar && !isMe && (
                  <span style={{ fontSize: 10, color, fontWeight: 700, paddingLeft: 4 }}>
                    {msg.sender_name || msg.sender_email?.split("@")[0]}
                  </span>
                )}
                <div style={{
                  background: isMe ? "linear-gradient(135deg,#dc2626,#991b1b)" : "rgba(255,255,255,0.05)",
                  border: isMe ? "none" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  padding: "9px 13px",
                  color: isMe ? "#fff" : "#e2e8f0",
                  fontSize: 13, lineHeight: 1.5,
                  wordBreak: "break-word",
                }}>
                  {msg.content}
                </div>
                <span style={{ fontSize: 9, color: "#334155", paddingLeft: 4, paddingRight: 4 }}>
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 8 }}>
        <input
          style={{ ...s.input, flex: 1, padding: "10px 14px", fontSize: 13 }}
          placeholder="Envoyer un message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          disabled={sending}
        />
        <button
          style={{ ...s.btn, padding: "10px 16px", opacity: !input.trim() || sending ? 0.5 : 1 }}
          onClick={sendMessage}
          disabled={!input.trim() || sending}
        >
          {sending ? "⏳" : "↑"}
        </button>
      </div>
    </div>
  );
}


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

function ProGate({ setPage }) {
  return (
    <div style={{ ...s.card, textAlign:"center", padding:"60px 32px", border:"1px solid rgba(139,92,246,0.3)", background:"rgba(139,92,246,0.04)" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🏢</div>
      <div style={{ color:"#a855f7", fontSize:18, fontWeight:800, marginBottom:8 }}>Team features require Business</div>
      <div style={{ color:"#475569", fontSize:14, lineHeight:1.7, maxWidth:400, margin:"0 auto 24px" }}>
        Team management, approvals and collaboration are available on the <strong style={{ color:"#a855f7" }}>Business plan</strong>.<br/>
        Your Pro plan includes <strong style={{ color:"#e2e8f0" }}>2 webhook integrations</strong> (Zapier & Slack).
      </div>
      <button style={{ ...s.btn, padding:"14px 28px", fontSize:13, background:"linear-gradient(135deg,#a855f7,#7c3aed)" }} onClick={() => setPage && setPage("pricing")}>
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
                    <div style={{ color:"#475569", fontSize:11 }}>{tr(trendsLang, `ui.team.${r.descKey}`) || r.descKey}</div>
                  </div>
                  {role===r.id && <span style={{ color:"#ef4444", fontSize:14 }}>✓</span>}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button style={{ ...s.btnGhost, flex:1 }} onClick={onClose}>Cancel</button>
              <button style={{ ...s.btn, flex:2, opacity:loading||!email?0.7:1 }} disabled={loading||!email} onClick={submit}>
                {loading ? tr(trendsLang,"ui.team.sending") : "📧 " + tr(trendsLang,"ui.team.sendInvitation") + " →"}
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
function AddClientModal({ token, onClose, onSuccess, editClient, trendsLang }) {
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
          <div style={{ color:"#e2e8f0", fontWeight:800, fontSize:16 }}>🏢 {editClient?.id ? tr(trendsLang,"ui.team.editClient") || "Edit Client" : tr(trendsLang,"ui.team.newClient") || "New Client"}</div>
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
// ─── Integrations Tab (Zapier + Slack) ───────────────────────────────────────
const WEBHOOK_EVENTS = [
  { key:"post.created",       label:"Post created",        icon:"✍️" },
  { key:"post.approved",      label:"Post approved",       icon:"✅" },
  { key:"post.rejected",      label:"Post rejected",       icon:"❌" },
  { key:"post.assigned",      label:"Post assigned",       icon:"🎯" },
  { key:"post.published",     label:"Post published",      icon:"📤" },
  { key:"comment.added",      label:"Comment added",       icon:"💬" },
  { key:"team.member_joined", label:"Member joined",       icon:"👥" },
  { key:"client.added",       label:"Client added",        icon:"🏢" },
];

function IntegrationsTab({ token, trendsLang }) {
  const API = "https://social-ai-app-production.up.railway.app";
  const headers = { "Content-Type":"application/json", Authorization:`Bearer ${token}` };

  const [webhooks,   setWebhooks]   = useState([]);
  const [maxWebhooks,setMaxWebhooks]= useState(10);
  const [loading,    setLoading]    = useState(false);
  const [showForm,   setShowForm]   = useState(null); // "zapier" | "slack" | null
  const [form,       setForm]       = useState({ url:"", label:"", events:[] });
  const [saving,     setSaving]     = useState(false);
  const [testing,    setTesting]    = useState(null); // webhook id
  const [testResult, setTestResult] = useState({}); // { [id]: "ok" | "fail" }
  const [msg,        setMsg]        = useState(null);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/webhooks`, { headers });
      const d = await r.json();
      setWebhooks(d.webhooks || []);
      if (d.max) setMaxWebhooks(d.max);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchWebhooks(); }, []);

  const openForm = (type) => {
    setShowForm(type);
    setForm({ url:"", label:"", events:[] });
    setMsg(null);
  };

  const toggleEvent = (key) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(key) ? f.events.filter(e => e !== key) : [...f.events, key],
    }));
  };

  const subscribe = async () => {
    if (!form.url.startsWith("https://")) return setMsg({ type:"error", text: tr(trendsLang,"ui.team.integ.urlError") || "URL must start with https://" });
    if (!form.events.length) return setMsg({ type:"error", text: tr(trendsLang,"ui.team.integ.eventsError") || "Select at least one event" });
    setSaving(true); setMsg(null);
    try {
      const r = await fetch(`${API}/webhooks/subscribe`, {
        method:"POST", headers,
        body: JSON.stringify({ url:form.url, label:form.label, events:form.events, type:showForm }),
      });
      const d = await r.json();
      if (d.success) {
        setMsg({ type:"success", text: tr(trendsLang,"ui.team.integ.connected") || "Connected! Test sent." });
        fetchWebhooks();
        setTimeout(() => { setShowForm(null); setMsg(null); }, 1500);
      } else {
        setMsg({ type:"error", text: d.error || "Error" });
      }
    } catch { setMsg({ type:"error", text:"Network error" }); }
    setSaving(false);
  };

  const deleteWebhook = async (id) => {
    await fetch(`${API}/webhooks/${id}`, { method:"DELETE", headers });
    fetchWebhooks();
  };

  const testWebhook = async (id) => {
    setTesting(id);
    try {
      const r = await fetch(`${API}/webhooks/${id}/test`, { method:"POST", headers });
      const d = await r.json();
      setTestResult(prev => ({ ...prev, [id]: d.success ? "ok" : "fail" }));
      setTimeout(() => setTestResult(prev => ({ ...prev, [id]: null })), 3000);
    } catch { setTestResult(prev => ({ ...prev, [id]: "fail" })); }
    setTesting(null);
  };

  const toggleActive = async (wh) => {
    await fetch(`${API}/webhooks/${wh.id}`, {
      method:"PATCH", headers,
      body: JSON.stringify({ active: !wh.active }),
    });
    fetchWebhooks();
  };

  const tr_ = (key, fallback) => tr(trendsLang, `ui.team.integ.${key}`) || fallback;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ color:"#e2e8f0", fontWeight:800, fontSize:16, marginBottom:4 }}>🔗 {tr_("title","Integrations")}</div>
          <div style={{ color:"#475569", fontSize:13 }}>{tr_("desc","Connect GrowthPILOT to Zapier, Slack and any webhook-compatible tool.")}</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => openForm("zapier")}
            style={{ padding:"9px 16px", borderRadius:10, border:"1px solid rgba(255,165,0,0.4)", background:"rgba(255,165,0,0.08)", color:"#fb923c", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            ⚡ {tr_("connectZapier","Connect Zapier")}
          </button>
          <button onClick={() => openForm("slack")}
            style={{ padding:"9px 16px", borderRadius:10, border:"1px solid rgba(74,222,128,0.4)", background:"rgba(74,222,128,0.08)", color:"#4ade80", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            💬 {tr_("connectSlack","Connect Slack")}
          </button>
        </div>
      </div>

      {/* Formulaire connexion */}
      {showForm && (
        <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${showForm==="zapier"?"rgba(251,146,60,0.3)":"rgba(74,222,128,0.3)"}`, borderRadius:14, padding:"20px 24px" }}>
          <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:14, marginBottom:16 }}>
            {showForm === "zapier" ? "⚡ Zapier Webhook" : "💬 Slack Incoming Webhook"}
          </div>

          {/* URL */}
          <div style={{ marginBottom:12 }}>
            <div style={{ color:"#64748b", fontSize:11, fontWeight:700, letterSpacing:"1px", marginBottom:6 }}>
              {showForm === "zapier" ? "ZAPIER WEBHOOK URL" : "SLACK WEBHOOK URL"}
            </div>
            <input
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url:e.target.value }))}
              placeholder={showForm === "zapier" ? "https://hooks.zapier.com/hooks/catch/..." : "https://hooks.slack.com/services/..."}
              style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 14px", color:"#e2e8f0", fontSize:13, outline:"none", boxSizing:"border-box" }}
            />
          </div>

          {/* Label optionnel */}
          <div style={{ marginBottom:16 }}>
            <div style={{ color:"#64748b", fontSize:11, fontWeight:700, letterSpacing:"1px", marginBottom:6 }}>LABEL (optionnel)</div>
            <input
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label:e.target.value }))}
              placeholder="ex: Mon Zapier LinkedIn..."
              style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 14px", color:"#e2e8f0", fontSize:13, outline:"none", boxSizing:"border-box" }}
            />
          </div>

          {/* Events */}
          <div style={{ marginBottom:16 }}>
            <div style={{ color:"#64748b", fontSize:11, fontWeight:700, letterSpacing:"1px", marginBottom:10 }}>ÉVÉNEMENTS DÉCLENCHEURS</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
              {WEBHOOK_EVENTS.map(ev => {
                const selected = form.events.includes(ev.key);
                return (
                  <button key={ev.key} onClick={() => toggleEvent(ev.key)}
                    style={{ padding:"8px 10px", borderRadius:10, border:`1px solid ${selected?"rgba(56,189,248,0.5)":"rgba(255,255,255,0.08)"}`, background:selected?"rgba(56,189,248,0.1)":"rgba(255,255,255,0.02)", color:selected?"#38bdf8":"#475569", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, transition:"all 0.15s" }}>
                    <span>{ev.icon}</span>
                    <span style={{ fontSize:9 }}>{ev.label}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setForm(f => ({ ...f, events: f.events.length === WEBHOOK_EVENTS.length ? [] : WEBHOOK_EVENTS.map(e => e.key) }))}
              style={{ marginTop:8, background:"none", border:"none", color:"#38bdf8", fontSize:11, cursor:"pointer", fontWeight:600 }}>
              {form.events.length === WEBHOOK_EVENTS.length ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
          </div>

          {msg && <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:12, background:msg.type==="success"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)", color:msg.type==="success"?"#22c55e":"#ef4444", fontSize:12 }}>{msg.text}</div>}

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => setShowForm(null)}
              style={{ flex:1, padding:"10px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.03)", color:"#64748b", fontSize:12, fontWeight:700, cursor:"pointer" }}>
              Annuler
            </button>
            <button onClick={subscribe} disabled={saving}
              style={{ flex:2, padding:"10px", borderRadius:8, border:"none", background:showForm==="zapier"?"linear-gradient(135deg,#fb923c,#f97316)":"linear-gradient(135deg,#4ade80,#22c55e)", color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer", opacity:saving?0.7:1 }}>
              {saving ? "Connexion..." : `🔗 ${tr_("connect","Connect")} & ${tr_("test","Test")}`}
            </button>
          </div>
        </div>
      )}

      {/* Liste webhooks existants */}
      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:"#475569" }}>⏳ Chargement...</div>
      ) : webhooks.length === 0 ? (
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"48px 24px", textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔗</div>
          <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:15, marginBottom:6 }}>{tr_("noWebhooks","No integrations yet")}</div>
          <div style={{ color:"#475569", fontSize:13, marginBottom:20 }}>{tr_("noWebhooksDesc","Connect Zapier or Slack to automate your workflow.")}</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={() => openForm("zapier")}
              style={{ padding:"10px 20px", borderRadius:10, border:"1px solid rgba(251,146,60,0.4)", background:"rgba(251,146,60,0.1)", color:"#fb923c", fontSize:13, fontWeight:700, cursor:"pointer" }}>⚡ Zapier</button>
            <button onClick={() => openForm("slack")}
              style={{ padding:"10px 20px", borderRadius:10, border:"1px solid rgba(74,222,128,0.4)", background:"rgba(74,222,128,0.1)", color:"#4ade80", fontSize:13, fontWeight:700, cursor:"pointer" }}>💬 Slack</button>
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ color:"#475569", fontSize:10, fontWeight:700, letterSpacing:"2px" }}>
            {tr_("activeWebhooks","ACTIVE INTEGRATIONS")} ({webhooks.length}/{maxWebhooks})
          </div>
          {webhooks.map(wh => {
            const isZapier = wh.type === "zapier";
            const color    = isZapier ? "#fb923c" : "#4ade80";
            const testR    = testResult[wh.id];
            return (
              <div key={wh.id} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${wh.active?`${color}30`:"rgba(255,255,255,0.05)"}`, borderRadius:12, padding:"14px 16px", opacity:wh.active?1:0.5 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:20 }}>{isZapier?"⚡":"💬"}</span>
                    <div>
                      <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13 }}>{wh.label || (isZapier?"Zapier Webhook":"Slack Webhook")}</div>
                      <div style={{ color:"#334155", fontSize:10, marginTop:2, maxWidth:300, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{wh.url}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    {/* Toggle actif */}
                    <button onClick={() => toggleActive(wh)}
                      style={{ padding:"4px 10px", borderRadius:20, border:`1px solid ${wh.active?"rgba(34,197,94,0.4)":"rgba(255,255,255,0.1)"}`, background:wh.active?"rgba(34,197,94,0.1)":"rgba(255,255,255,0.03)", color:wh.active?"#22c55e":"#475569", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                      {wh.active ? "✓ Actif" : "Désactivé"}
                    </button>
                    {/* Test */}
                    <button onClick={() => testWebhook(wh.id)} disabled={testing===wh.id}
                      style={{ padding:"4px 10px", borderRadius:20, border:`1px solid ${testR==="ok"?"rgba(34,197,94,0.4)":testR==="fail"?"rgba(239,68,68,0.4)":"rgba(255,255,255,0.08)"}`, background:testR==="ok"?"rgba(34,197,94,0.1)":testR==="fail"?"rgba(239,68,68,0.1)":"rgba(255,255,255,0.03)", color:testR==="ok"?"#22c55e":testR==="fail"?"#ef4444":"#64748b", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                      {testing===wh.id?"⏳":testR==="ok"?"✓ OK":testR==="fail"?"✗ Fail":"🧪 Test"}
                    </button>
                    {/* Supprimer */}
                    <button onClick={() => deleteWebhook(wh.id)}
                      style={{ padding:"4px 8px", borderRadius:20, border:"1px solid rgba(239,68,68,0.2)", background:"rgba(239,68,68,0.05)", color:"#ef4444", fontSize:10, cursor:"pointer" }}>🗑️</button>
                  </div>
                </div>

                {/* Events + stats */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
                  {(wh.events || []).map(ev => {
                    const info = WEBHOOK_EVENTS.find(e => e.key === ev);
                    return (
                      <span key={ev} style={{ background:`${color}12`, color, fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:10 }}>
                        {info?.icon} {info?.label || ev}
                      </span>
                    );
                  })}
                </div>
                <div style={{ color:"#334155", fontSize:10 }}>
                  {wh.trigger_count > 0 ? `🔥 ${wh.trigger_count} déclenchements` : "Aucun déclenchement"}
                  {wh.last_triggered_at && ` · dernier: ${new Date(wh.last_triggered_at).toLocaleDateString("fr-FR")}`}
                  {` · créé: ${new Date(wh.created_at).toLocaleDateString("fr-FR")}`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Guide rapide */}
      <div style={{ background:"rgba(56,189,248,0.04)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:12, padding:"16px 20px" }}>
        <div style={{ color:"#38bdf8", fontWeight:700, fontSize:12, marginBottom:10 }}>💡 {tr_("guideTitle","How to connect")}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:11, marginBottom:6 }}>⚡ Zapier</div>
            <ol style={{ color:"#475569", fontSize:11, lineHeight:1.8, margin:0, paddingLeft:16 }}>
              <li>{tr_("guideZapier1","Create a new Zap on zapier.com")}</li>
              <li>{tr_("guideZapier2","Choose")} <strong style={{ color:"#e2e8f0" }}>Webhooks by Zapier</strong> → Catch Hook</li>
              <li>{tr_("guideZapier3","Copy the webhook URL and paste it above")}</li>
              <li>{tr_("guideZapier4","Select the events you want to trigger")}</li>
            </ol>
          </div>
          <div>
            <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:11, marginBottom:6 }}>💬 Slack</div>
            <ol style={{ color:"#475569", fontSize:11, lineHeight:1.8, margin:0, paddingLeft:16 }}>
              <li>{tr_("guideSlack1","Go to")} <strong style={{ color:"#e2e8f0" }}>api.slack.com/apps</strong></li>
              <li>{tr_("guideSlack2","Create app → Incoming Webhooks")}</li>
              <li>{tr_("guideSlack3","Add to workspace and copy the URL")}</li>
              <li>{tr_("guideSlack4","Select events to get notified in your channel")}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Agency ─────────────────────────────────────────────────────────
function AgencyAnalytics({ token, trendsLang }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const API     = "https://social-ai-app-production.up.railway.app";
  const headers = { "Content-Type":"application/json", Authorization:`Bearer ${token}` };

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/team/agency/analytics`, { headers })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign:"center", padding:60, color:"#475569" }}>⏳ Chargement analytics...</div>;
  if (!data)   return <div style={{ textAlign:"center", padding:60, color:"#334155" }}>Aucune donnée disponible</div>;

  const { global: g, clients, topPosts, activity30d } = data;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* ── Stats globales ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
        {[
          { label:"CLIENTS", value:g?.total_clients || 0, color:"#8b5cf6", icon:"👥" },
          { label:"POSTS TOTAL", value:g?.total_posts || 0, color:"#ef4444", icon:"📝" },
          { label:"POSTS 30J", value:g?.posts_30d || 0, color:"#22c55e", icon:"📈" },
          { label:"SCORE VIRAL MOY.", value:g?.avg_viral_score ? `${g.avg_viral_score}/100` : "—", color:"#f59e0b", icon:"⚡" },
          { label:"APPROUVÉS", value:g?.approved_posts || 0, color:"#22c55e", icon:"✅" },
          { label:"EN ATTENTE", value:g?.pending_posts || 0, color:"#f59e0b", icon:"⏳" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderTop:`3px solid ${s.color}`, borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
            <div style={{ color:s.color, fontSize:22, fontWeight:900 }}>{s.value}</div>
            <div style={{ color:"#475569", fontSize:9, fontWeight:700, letterSpacing:"1px", marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Activité 30j sparkline simple ── */}
      {activity30d?.length > 0 && (
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"16px 20px" }}>
          <div style={{ color:"#e2e8f0", fontSize:12, fontWeight:700, marginBottom:12 }}>📅 Activité 30 derniers jours</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:48 }}>
            {(() => {
              const max = Math.max(...activity30d.map(d => d.posts_count), 1);
              return activity30d.map((d, i) => (
                <div key={i} title={`${d.day}: ${d.posts_count} posts`} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                  <div style={{ width:"100%", background:"rgba(236,72,153,0.7)", borderRadius:"2px 2px 0 0", height:`${(d.posts_count / max) * 40}px`, minHeight: d.posts_count > 0 ? 4 : 0, transition:"height 0.3s" }} />
                </div>
              ));
            })()}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", color:"#334155", fontSize:9, marginTop:4 }}>
            <span>J-30</span><span>Aujourd'hui</span>
          </div>
        </div>
      )}

      {/* ── Stats par client ── */}
      <div>
        <div style={{ color:"#475569", fontSize:10, fontWeight:700, letterSpacing:"2px", marginBottom:10 }}>PERFORMANCE PAR CLIENT</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {clients?.length === 0 && (
            <div style={{ textAlign:"center", padding:"32px 20px", color:"#334155" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
              <div>Aucun client avec des posts liés</div>
              <div style={{ fontSize:12, marginTop:4, color:"#1e293b" }}>Liez des posts à vos clients depuis l'Historique</div>
            </div>
          )}
          {clients?.map(c => {
            const activity = c.posts_30d > 0 ? "🟢 Actif" : c.total_posts > 0 ? "🟡 Inactif" : "⚪ Nouveau";
            return (
              <div key={c.id} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderLeft:`3px solid ${c.color || "#8b5cf6"}`, borderRadius:12, padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:`${c.color || "#8b5cf6"}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:c.color || "#8b5cf6" }}>
                      {c.name?.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13 }}>{c.name}</div>
                      <div style={{ color:"#475569", fontSize:10 }}>{c.niche || c.email || "—"}</div>
                    </div>
                  </div>
                  <span style={{ fontSize:10, color:"#64748b" }}>{activity}</span>
                </div>

                {/* Métriques client */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                  {[
                    { label:"Posts", value:c.total_posts || 0, color:"#e2e8f0" },
                    { label:"30 jours", value:c.posts_30d || 0, color:"#22c55e" },
                    { label:"Score moy.", value:c.avg_viral_score ? `${c.avg_viral_score}` : "—", color:"#f59e0b" },
                    { label:"Approuvés", value:c.approved_posts || 0, color:"#60a5fa" },
                  ].map(m => (
                    <div key={m.label} style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                      <div style={{ color:m.color, fontSize:16, fontWeight:800 }}>{m.value}</div>
                      <div style={{ color:"#334155", fontSize:9, fontWeight:700, letterSpacing:"0.5px" }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Barre progression viral score */}
                {c.avg_viral_score > 0 && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ color:"#475569", fontSize:10 }}>Score viral moyen</span>
                      <span style={{ color: c.avg_viral_score >= 70 ? "#22c55e" : c.avg_viral_score >= 50 ? "#f59e0b" : "#ef4444", fontSize:10, fontWeight:700 }}>{c.avg_viral_score}/100</span>
                    </div>
                    <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden" }}>
                      <div style={{ width:`${c.avg_viral_score}%`, height:"100%", background: c.avg_viral_score >= 70 ? "linear-gradient(90deg,#22c55e,#16a34a)" : c.avg_viral_score >= 50 ? "linear-gradient(90deg,#f59e0b,#d97706)" : "linear-gradient(90deg,#ef4444,#dc2626)", transition:"width 0.5s ease" }} />
                    </div>
                  </div>
                )}

                {/* Dernière activité */}
                {c.last_post_at && (
                  <div style={{ marginTop:8, color:"#334155", fontSize:10 }}>
                    Dernier post : {new Date(c.last_post_at).toLocaleDateString("fr-FR", { day:"numeric", month:"short" })}
                    {c.total_comments > 0 && ` · ${c.total_comments} commentaire${c.total_comments > 1 ? "s" : ""}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Top posts ── */}
      {topPosts?.length > 0 && (
        <div>
          <div style={{ color:"#475569", fontSize:10, fontWeight:700, letterSpacing:"2px", marginBottom:10 }}>🏆 TOP POSTS (MEILLEUR SCORE)</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {topPosts.map((p, i) => (
              <div key={p.id} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(245,158,11,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#f59e0b", flexShrink:0 }}>
                  {i + 1}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:"#e2e8f0", fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {p.title || p.content?.slice(0,60) || "Post"}
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:3 }}>
                    {p.client_name && <span style={{ background:`${p.client_color || "#8b5cf6"}15`, color:p.client_color || "#8b5cf6", fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:6 }}>🏢 {p.client_name}</span>}
                    <span style={{ color:"#475569", fontSize:10 }}>{new Date(p.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
                <div style={{ flexShrink:0, textAlign:"right" }}>
                  <div style={{ color: p.viral_score >= 70 ? "#22c55e" : p.viral_score >= 50 ? "#f59e0b" : "#ef4444", fontSize:16, fontWeight:900 }}>⚡{p.viral_score}</div>
                  <div style={{ color:"#334155", fontSize:9 }}>/100</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AgencyDashboard({ token, trendsLang, clients, onAddClient, onEditClient, onDeleteClient, onRefresh, loading, onConfirm }) {
  const [dashStats,   setDashStats]   = useState(null);
  const [activeClient,setActiveClient]= useState(null);
  const [pdfLoading,  setPdfLoading]  = useState(null);
  const [clientPosts, setClientPosts] = useState({});
  const [clientPostsLoading, setClientPostsLoading] = useState({});
  const headers = { "Content-Type":"application/json", Authorization:`Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/agency/dashboard`, { headers })
      .then(r=>r.json())
      .then(setDashStats)
      .catch(()=>{});
  }, [clients]);

  const deleteClient = (id) => {
    if (onConfirm) {
      onConfirm({
        message: tr(trendsLang,"ui.team.confirmRemoveClient") || "Remove this client?",
        onConfirm: async () => {
          await fetch(`${API}/agency/clients/${id}`, { method:"DELETE", headers });
          onRefresh();
        }
      });
    } else {
      // fallback natif si onConfirm non fourni
      if (window.confirm(tr(trendsLang,"ui.team.confirmRemoveClient") || "Remove this client?")) {
        fetch(`${API}/agency/clients/${id}`, { method:"DELETE", headers }).then(onRefresh);
      }
    }
  };

  const fetchClientPosts = async (clientId) => {
    setClientPostsLoading(prev => ({ ...prev, [clientId]: true }));
    try {
      const r = await fetch(`${API}/agency/clients/${clientId}/posts`, { headers });
      const d = await r.json();
      setClientPosts(prev => ({ ...prev, [clientId]: d.posts || [] }));
      console.log(`[Team] fetchClientPosts client=${clientId} → ${d.posts?.length || 0} posts`);
    } catch (err) {
      console.error("[Team] fetchClientPosts error:", err.message);
    }
    setClientPostsLoading(prev => ({ ...prev, [clientId]: false }));
  };

  const toggleClient = (client) => {
    const isOpen = activeClient?.id === client.id;
    setActiveClient(isOpen ? null : client);
    if (!isOpen && !clientPosts[client.id]) fetchClientPosts(client.id);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Stats agence */}
      {dashStats && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {[
            [`👥 ${tr(trendsLang,"ui.team.agencyClients") || "CLIENTS"}`,    dashStats.totalClients,    "#8b5cf6"],
            [`📝 ${tr(trendsLang,"ui.statPosts") || "POSTS"}`,      dashStats.totalPosts,      "#ef4444"],
            [`💬 ${tr(trendsLang,"ui.team.agencyEngagement") || "ENGAGEMENT"}`, dashStats.totalEngagement, "#22c55e"],
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
          <div style={{ color:"#e2e8f0", fontWeight:800, fontSize:15 }}>{tr(trendsLang,"ui.team.clientPortfolio") || "Client Portfolio"}</div>
          <div style={{ color:"#475569", fontSize:12, marginTop:2 }}>{clients.length} / {MAX_CLIENTS_AGENCY} {tr(trendsLang,"ui.team.clientsLabel") || "clients"}</div>
        </div>
        <button style={s.btnAgency} onClick={onAddClient}>➕ {tr(trendsLang,"ui.team.newClient") || "New Client"}</button>
      </div>

      {/* Barre de capacité */}
      <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
        <div style={{ width:`${(clients.length/MAX_CLIENTS_AGENCY)*100}%`, height:"100%", background:"linear-gradient(90deg,#8b5cf6,#7c3aed)", borderRadius:2, transition:"width 0.4s" }} />
      </div>

      {/* Liste clients */}
      {loading && <div style={{ color:"#475569", textAlign:"center", padding:32 }}>{tr(trendsLang,"ui.team.loadingClients") || "Loading clients..."}</div>}

      {!loading && clients.length === 0 && (
        <div style={{ ...s.card, textAlign:"center", padding:"40px 24px", border:"1px dashed rgba(139,92,246,0.3)" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🏢</div>
          <div style={{ color:"#e2e8f0", fontWeight:700, marginBottom:8 }}>{tr(trendsLang,"ui.team.noClientsYet") || "No clients yet"}</div>
          <div style={{ color:"#475569", fontSize:13, marginBottom:20 }}>{tr(trendsLang,"ui.team.noClientsDesc") || "Add your first client to start managing their content."}</div>
          <button style={s.btnAgency} onClick={onAddClient}>➕ {tr(trendsLang,"ui.team.addFirstClient") || "Add First Client"}</button>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
        {clients.map(client => (
          <div key={client.id} style={{ ...s.card, borderLeft:`3px solid ${client.color}`, position:"relative", cursor:"pointer" }}
            onClick={() => toggleClient(client)}>

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
              <span style={{ color:"#334155", fontSize:11 }}>📝 {client.post_count || 0} {tr(trendsLang,"ui.team.reportPosts") || "posts"}</span>
              <span style={{ color:"#334155", fontSize:10 }}>{tr(trendsLang,"ui.team.addedLabel") || "Added"} {timeAgo(client.created_at, trendsLang)}</span>
            </div>

            {/* Panel expandable : notes + posts liés */}
            {activeClient?.id === client.id && (
              <div style={{ marginTop:12, borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:12 }}>
                {/* Notes */}
                {client.notes && (
                  <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#94a3b8", lineHeight:1.6, marginBottom:10 }}>
                    💡 {client.notes}
                  </div>
                )}
                {/* Posts liés */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ color:"#475569", fontSize:11, fontWeight:700 }}>
                    📝 {tr(trendsLang,"ui.team.linkedPosts") || "Linked posts"} {clientPosts[client.id] ? `(${clientPosts[client.id].length})` : ""}
                  </span>
                  <button onClick={e => { e.stopPropagation(); fetchClientPosts(client.id); }}
                    style={{ background:"none", border:"none", color:"#475569", fontSize:10, cursor:"pointer" }}>🔄</button>
                </div>
                {clientPostsLoading[client.id] ? (
                  <div style={{ color:"#334155", fontSize:11, textAlign:"center", padding:8 }}>⏳</div>
                ) : (clientPosts[client.id] || []).length === 0 ? (
                  <div style={{ color:"#334155", fontSize:11, textAlign:"center", padding:"8px 0", fontStyle:"italic" }}>
                    {tr(trendsLang,"ui.team.noLinkedPosts") || "No posts linked yet — link posts from History"}
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:200, overflowY:"auto" }}>
                    {(clientPosts[client.id] || []).map(p => {
                      const statusColor = { approved:"#22c55e", pending_approval:"#f59e0b", rejected:"#ef4444" }[p.approval_status] || "#64748b";
                      return (
                        <div key={p.id} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${client.color}20`, borderLeft:`3px solid ${client.color}`, borderRadius:7, padding:"7px 10px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                            <span style={{ color:"#e2e8f0", fontSize:11, fontWeight:600 }}>{(p.title || p.content?.split(" ").slice(0,5).join(" ") || "Post")}</span>
                            <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                              {p.viral_score > 0 && <span style={{ color: p.viral_score>=70?"#22c55e":p.viral_score>=50?"#f59e0b":"#ef4444", fontSize:9, fontWeight:700 }}>⚡{p.viral_score}</span>}
                              <span style={{ background:`${statusColor}15`, color:statusColor, fontSize:8, fontWeight:700, padding:"1px 5px", borderRadius:4 }}>{p.approval_status?.replace("_"," ") || "draft"}</span>
                            </div>
                          </div>
                          <div style={{ color:"#475569", fontSize:10 }}>{new Date(p.created_at).toLocaleDateString()}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function Team({ trendsLang, isMobile, token, userPlan, planManagedBy, projects, autoPosts, scheduledPosts, workspace, setPage, onApprovalsCount }) {

  const [members,     setMembers]     = useState([]);
  const [clients,     setClients]     = useState([]);
  const [activity,    setActivity]    = useState([]);
  const [teamLogs,    setTeamLogs]    = useState([]);
  const [approvals,   setApprovals]   = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approving,   setApproving]   = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // { postId, authorName }
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
  const [assigning,   setAssigning]   = useState(null); // post_id en cours d'assignation
  const [comments,      setComments]      = useState({}); // { [postId]: Comment[] }
  const [commentsOpen,  setCommentsOpen]  = useState({}); // { [postId]: bool }
  const [commentsLoading, setCommentsLoading] = useState({}); // { [postId]: bool }
  const [commentInput,  setCommentInput]  = useState({}); // { [postId]: string }
  const [commentPosting,setCommentPosting]= useState(null); // postId en cours d'envoi
  // Calendrier partagé
  const [teamCal,       setTeamCal]       = useState([]);
  const [teamCalLoading,setTeamCalLoading]= useState(false);
  const [teamCalLoaded, setTeamCalLoaded] = useState(false);
  const [calView,       setCalView]       = useState("kanban");
  const [calAddingTo,   setCalAddingTo]   = useState(null);
  const [calNewTitle,   setCalNewTitle]   = useState("");
  const [calNewDate,    setCalNewDate]    = useState(new Date().toISOString().split("T")[0]);
  const [calNewPlat,    setCalNewPlat]    = useState("LinkedIn");
  const [calDragging,   setCalDragging]   = useState(null);
  const [calDragOver,   setCalDragOver]   = useState(null);
  const [calConfirmDelete, setCalConfirmDelete] = useState(null);

  const isBusiness = userPlan === "Business" || userPlan === "Agency";
  const isAgency   = userPlan === "Agency";
  const isPro      = userPlan === "Pro";
  const isOwner    = isBusiness;
  const MAX_MEMBERS = isAgency ? MAX_MEMBERS_AGENCY : MAX_MEMBERS_BUSINESS;

  // Email depuis JWT pour le chat
  const myEmail = (() => {
    try { return JSON.parse(atob(token.split(".")[1])).email || ""; } catch { return ""; }
  })();

  // Rôle du membre connecté (si planManagedBy === "team")
  const myRole = myTeamView?.myRole?.toLowerCase() || null;
  // isTeamAdmin : membre avec rôle admin dans l'équipe
  const isTeamAdmin = myRole === "admin";

  // ── Permissions par rôle ──────────────────────────────────────────────────
  // owner   → tout
  // admin   → membres (lecture), activité, rôles (lecture), approbations, historique, calendrier, chat
  // editor  → activité, historique, calendrier, chat
  // publisher → activité, calendrier, chat
  const canAccess = (tab) => {
    if (isOwner) return true; // owner voit tout
    if (!myRole) return tab === "chat"; // non membre → seulement chat
    const perms = {
      owner:     ["members","activity","perms","approvals","logs","plans","calendar","chat"],
      admin:     ["members","activity","perms","approvals","logs","calendar","chat"],
      editor:    ["activity","logs","calendar","chat"],
      publisher: ["activity","calendar","chat"],
    };
    return (perms[myRole] || ["chat"]).includes(tab);
  };

  // Lecture seule pour certains onglets selon le rôle
  const isReadOnly = (tab) => {
    if (isOwner) return false;
    const readOnly = {
      admin:  ["members","perms"],
      editor: [],
    };
    return (readOnly[myRole] || []).includes(tab);
  };

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
      console.log("[Team] saveTeamName response:", r.status, d);
      if (d.success) {
        setConfirm({ message: `✅ ${tr(trendsLang,"ui.team.teamNameSaved") || "Team name saved!"}`, onConfirm: () => setConfirm(null) });
      } else {
        setConfirm({ message: `⚠️ ${d.error || "Failed to save team name"}`, onConfirm: () => setConfirm(null) });
      }
    } catch (err) {
      console.error("[Team] saveTeamName error:", err.message);
      setConfirm({ message: `⚠️ Network error: ${err.message}`, onConfirm: () => setConfirm(null) });
    }
    setTeamNameSaving(false);
  };

  const removeMember = (id) => {
    setConfirm({ message: tr(trendsLang,"ui.team.confirmRemoveMember"), onConfirm: async () => {
      await fetch(`${API}/team/members/${id}`, { method:"DELETE", headers });
      fetchTeamData();
      setConfirm(null);
    }});
  };

  const updateRole = async (id, role) => {
    await fetch(`${API}/team/members/${id}`, { method:"PATCH", headers, body:JSON.stringify({ role }) });
    fetchTeamData();
  };

  const fetchApprovals = async () => {
    setApprovalsLoading(true);
    try {
      const r = await fetch(`${API}/team/approvals`, { headers });
      const d = await r.json();
      const posts = d.posts || [];
      setApprovals(posts);
      onApprovalsCount?.(posts.length); // notifier la sidebar
    } catch {}
    setApprovalsLoading(false);
  };

  const approvePost = async (postId) => {
    setApproving(postId);
    try {
      const r = await fetch(`${API}/team/approvals/${postId}/approve`, { method: "POST", headers });
      const d = await r.json();
      if (d.success) { fetchApprovals(); fetchTeamData(); }
    } catch {}
    setApproving(null);
  };

  const rejectPost = async (postId, reason) => {
    try {
      await fetch(`${API}/team/approvals/${postId}/reject`, {
        method: "POST", headers,
        body: JSON.stringify({ reason }),
      });
      setRejectModal(null);
      fetchApprovals();
    } catch {}
  };

  const assignPost = async (postId, memberId) => {
    setAssigning(postId);
    try {
      const r = await fetch(`${API}/team/approvals/${postId}/assign`, {
        method: "PATCH", headers,
        body: JSON.stringify({ assigned_to: memberId || null }),
      });
      const d = await r.json();
      if (d.success) {
        // Mettre à jour localement dans approvals
        setApprovals(prev => prev.map(p =>
          p.id === postId ? { ...p, assigned_to: memberId || null, assignee_name: d.assignee_name } : p
        ));
        console.log(`[Team] post ${postId} assigned to ${memberId || "nobody"}`);
      } else {
        console.error("[Team] assignPost error:", d.error);
      }
    } catch (err) {
      console.error("[Team] assignPost fetch error:", err.message);
    }
    setAssigning(null);
  };

  const fetchComments = async (postId) => {
    setCommentsLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const r = await fetch(`${API}/team/posts/${postId}/comments`, { headers });
      const d = await r.json();
      setComments(prev => ({ ...prev, [postId]: d.comments || [] }));
      console.log(`[Team] fetchComments post=${postId} → ${d.comments?.length} comments`);
    } catch (err) {
      console.error("[Team] fetchComments error:", err.message);
    }
    setCommentsLoading(prev => ({ ...prev, [postId]: false }));
  };

  const toggleComments = (postId) => {
    const isOpen = commentsOpen[postId];
    setCommentsOpen(prev => ({ ...prev, [postId]: !isOpen }));
    if (!isOpen && !comments[postId]) fetchComments(postId);
  };

  const postComment = async (postId) => {
    const content = (commentInput[postId] || "").trim();
    if (!content) return;
    setCommentPosting(postId);
    try {
      const r = await fetch(`${API}/team/posts/${postId}/comments`, {
        method: "POST", headers,
        body: JSON.stringify({ content }),
      });
      const d = await r.json();
      if (d.success) {
        setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), d.comment] }));
        setCommentInput(prev => ({ ...prev, [postId]: "" }));
        console.log(`[Team] comment posted on post=${postId}`);
      } else {
        console.error("[Team] postComment error:", d.error);
      }
    } catch (err) {
      console.error("[Team] postComment fetch error:", err.message);
    }
    setCommentPosting(null);
  };

  const deleteComment = async (postId, commentId) => {
    try {
      const r = await fetch(`${API}/team/comments/${commentId}`, { method: "DELETE", headers });
      const d = await r.json();
      if (d.success) {
        setComments(prev => ({ ...prev, [postId]: prev[postId].filter(c => c.id !== commentId) }));
        console.log(`[Team] comment ${commentId} deleted`);
      }
    } catch (err) {
      console.error("[Team] deleteComment error:", err.message);
    }
  };

  // ── Calendrier partagé ────────────────────────────────────────────────────
  const CAL_COLS = [
    { id:"ideas",     label: tr(trendsLang,"calendar.colIdeas")     || "💡 Ideas",     color:"#475569", bg:"rgba(71,85,105,0.1)" },
    { id:"draft",     label: tr(trendsLang,"calendar.colDraft")     || "✏️ Draft",     color:"#f59e0b", bg:"rgba(245,158,11,0.08)" },
    { id:"scheduled", label: tr(trendsLang,"calendar.colScheduled") || "📅 Scheduled", color:"#60a5fa", bg:"rgba(96,165,250,0.08)" },
    { id:"published", label: tr(trendsLang,"calendar.colPublished") || "✅ Published",  color:"#22c55e", bg:"rgba(34,197,94,0.08)" },
  ];
  const CAL_PLATFORMS = ["LinkedIn","Threads","X","Instagram"];

  const fetchTeamCal = async () => {
    setTeamCalLoading(true);
    try {
      const r = await fetch(`${API}/team/calendar`, { headers });
      const d = await r.json();
      setTeamCal(d.cards || []);
      setTeamCalLoaded(true);
      console.log(`[Team] fetchTeamCal → ${d.cards?.length || 0} cards`);
    } catch (err) {
      console.error("[Team] fetchTeamCal error:", err.message);
    }
    setTeamCalLoading(false);
  };

  const calAddCard = async (colId) => {
    if (!calNewTitle.trim()) return;
    try {
      const r = await fetch(`${API}/team/calendar`, {
        method: "POST", headers,
        body: JSON.stringify({ title: calNewTitle.trim(), col: colId, date: calNewDate, platform: calNewPlat }),
      });
      const d = await r.json();
      if (d.success) {
        setTeamCal(prev => [...prev, d.card]);
        setCalNewTitle(""); setCalAddingTo(null);
        console.log(`[Team] calAddCard → card ${d.card.id}`);
      }
    } catch (err) { console.error("[Team] calAddCard error:", err.message); }
  };

  const calMoveCard = async (id, newCol) => {
    setTeamCal(prev => prev.map(c => c.id === id ? { ...c, col: newCol } : c));
    try {
      await fetch(`${API}/team/calendar/${id}`, { method:"PATCH", headers, body: JSON.stringify({ col: newCol }) });
      console.log(`[Team] calMoveCard ${id} → ${newCol}`);
    } catch (err) { console.error("[Team] calMoveCard error:", err.message); }
  };

  const calDeleteCard = async (id) => {
    setTeamCal(prev => prev.filter(c => c.id !== id));
    try {
      await fetch(`${API}/team/calendar/${id}`, { method:"DELETE", headers });
      console.log(`[Team] calDeleteCard ${id}`);
    } catch (err) { console.error("[Team] calDeleteCard error:", err.message); }
  };

  const calOnDragStart = (e, id) => { setCalDragging(id); e.dataTransfer.effectAllowed = "move"; };
  const calOnDragOver  = (e, colId) => { e.preventDefault(); setCalDragOver(colId); };
  const calOnDrop      = (e, colId) => { e.preventDefault(); if (calDragging) calMoveCard(calDragging, colId); setCalDragging(null); setCalDragOver(null); };

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
        <span style={{ color:"#334155", fontSize:11 }}>{tr(trendsLang,"ui.team.betaDesc") || "Full collaboration features coming soon"}</span>
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
            <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:12 }}>👥 {tr(trendsLang,"ui.team.myTeam")}</div>
            {/* Owner */}
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", marginBottom:10 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(239,68,68,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#ef4444", fontWeight:800, fontSize:12 }}>
                {(myTeamView.owner.name || myTeamView.owner.email)[0].toUpperCase()}
              </div>
              <div>
                <div style={{ color:"#e2e8f0", fontSize:12, fontWeight:600 }}>{myTeamView.owner.name || myTeamView.owner.email}</div>
                <div style={{ color:"#475569", fontSize:10 }}>Owner</div>
              </div>
              <div style={{ marginLeft:"auto", background:"rgba(239,68,68,0.1)", border:"1px solid #ef444433", borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:"#ef4444" }}>{tr(trendsLang,"ui.team.owner")}</div>
            </div>
            {/* Mon rôle */}
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"10px 14px", marginBottom:10 }}>
              <div style={{ color:"#64748b", fontSize:10, letterSpacing:"1px", marginBottom:4 }}>{tr(trendsLang,"ui.team.myRole")}</div>
              <div style={{ color:"#f59e0b", fontWeight:800, fontSize:13 }}>{myTeamView.myRole?.toUpperCase()}</div>
              <div style={{ color:"#475569", fontSize:11, marginTop:2 }}>
                {tr(trendsLang,"ui.team.joined")} {myTeamView.joinedAt ? new Date(myTeamView.joinedAt).toLocaleDateString() : "—"}
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

      {/* ── VUE MEMBRES : onglets selon rôle ── */}
      {planManagedBy === "team" && (
        <>
          <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.07)", marginBottom:16, flexWrap:"wrap" }}>
            {canAccess("members")   && <button style={s.tabBtn(mainTab==="members")}            onClick={()=>setMainTab("members")}>👥 {tr(trendsLang,"ui.team.tabMembers")}</button>}
            {canAccess("activity")  && <button style={s.tabBtn(mainTab==="activity")}           onClick={()=>setMainTab("activity")}>📊 {tr(trendsLang,"ui.team.tabActivity")}</button>}
            {canAccess("perms")     && <button style={s.tabBtn(mainTab==="perms")}              onClick={()=>setMainTab("perms")}>🔑 {tr(trendsLang,"ui.team.tabRoles")}</button>}
            {canAccess("approvals") && <button style={s.tabBtn(mainTab==="approvals","#f59e0b")} onClick={()=>{ setMainTab("approvals"); fetchApprovals(); }}>
              ✅ {tr(trendsLang,"ui.team.tabApprovals")}
              {approvals.length > 0 && <span style={{ background:"#ef4444", color:"#fff", borderRadius:"50%", padding:"1px 5px", fontSize:9, marginLeft:4 }}>{approvals.length}</span>}
            </button>}
            {canAccess("logs")      && <button style={s.tabBtn(mainTab==="logs")}               onClick={()=>{ setMainTab("logs"); fetchTeamLogs(); }}>📋 {tr(trendsLang,"ui.team.tabHistory")}</button>}
            {canAccess("calendar")  && <button style={s.tabBtn(mainTab==="calendar","#22c55e")} onClick={()=>{ setMainTab("calendar"); if (!teamCalLoaded) fetchTeamCal(); }}>📅 {tr(trendsLang,"ui.team.tabCalendar")||"CALENDRIER"}</button>}
            <button style={s.tabBtn(mainTab==="chat","#22c55e")} onClick={()=>setMainTab("chat")}>💬 CHAT</button>
          </div>

          {/* Badge lecture seule */}
          {mainTab !== "chat" && isReadOnly(mainTab) && (
            <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8, padding:"8px 14px", marginBottom:12, fontSize:11, color:"#f59e0b", display:"flex", alignItems:"center", gap:8 }}>
              👁 Lecture seule — votre rôle <strong>{myRole?.toUpperCase()}</strong> ne permet pas de modifier cet onglet
            </div>
          )}

          {/* Membres */}
          {mainTab === "members" && canAccess("members") && (
            <div style={s.card}>
              <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:12 }}>👥 {tr(trendsLang,"ui.team.myTeam")}</div>
              {myTeamView?.owner && (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", marginBottom:10 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(239,68,68,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#ef4444", fontWeight:800, fontSize:12 }}>
                    {(myTeamView.owner.name||myTeamView.owner.email||"?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color:"#e2e8f0", fontSize:12, fontWeight:600 }}>{myTeamView.owner.name||myTeamView.owner.email}</div>
                    <div style={{ color:"#475569", fontSize:10 }}>Owner</div>
                  </div>
                  <div style={{ marginLeft:"auto", background:"rgba(239,68,68,0.1)", border:"1px solid #ef444433", borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:"#ef4444" }}>OWNER</div>
                </div>
              )}
              {myTeamView?.colleagues?.map((c,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(100,116,139,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748b", fontWeight:800, fontSize:11 }}>
                    {(c.name||c.email||"?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:"#e2e8f0", fontSize:12 }}>{c.name||c.email}</div>
                    <div style={{ color:"#475569", fontSize:10 }}>{c.role?.toUpperCase()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Activité */}
          {mainTab === "activity" && canAccess("activity") && (
            <div style={s.card}>
              <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:12 }}>📊 {tr(trendsLang,"ui.team.tabActivity")}</div>
              <div style={{ color:"#475569", fontSize:12 }}>Activité de l'équipe disponible pour les owners.</div>
            </div>
          )}

          {/* Rôles — lecture seule pour admin */}
          {mainTab === "perms" && canAccess("perms") && (
            <div style={s.card}>
              <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:4 }}>🔑 {tr(trendsLang,"ui.team.tabRoles")}</div>
              <div style={{ color:"#475569", fontSize:12, marginBottom:16 }}>Permissions par défaut par rôle</div>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign:"left", color:"#64748b", fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>PERMISSION</th>
                    {ROLES.map(r=><th key={r.id} style={{ textAlign:"center", color:r.color, fontWeight:700, fontSize:10, letterSpacing:"1px", padding:"8px 8px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{r.label.toUpperCase()}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    [tr(trendsLang,"ui.team.perm.generate"),   true,  true,  false],
                    [tr(trendsLang,"ui.team.perm.publish"),     true,  false, true ],
                    [tr(trendsLang,"ui.team.perm.analyze"),     true,  true,  true ],
                    [tr(trendsLang,"ui.team.perm.brandMemory"), true,  true,  false],
                    [tr(trendsLang,"ui.team.perm.manageTeam"),  true,  false, false],
                    [tr(trendsLang,"ui.team.perm.projects"),    true,  true,  true ],
                    [tr(trendsLang,"ui.team.perm.analytics"),   true,  true,  true ],
                  ].map(([label,admin,editor,publisher])=>(
                    <tr key={label}>
                      <td style={{ color:"#94a3b8", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>{label}</td>
                      {[admin,editor,publisher].map((v,i)=>(
                        <td key={i} style={{ textAlign:"center", padding:"10px 8px", borderBottom:"1px solid rgba(255,255,255,0.04)", color:v?"#22c55e":"#334155", fontSize:15 }}>{v?"✓":"✗"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Approbations — admin + owner */}
          {mainTab === "approvals" && canAccess("approvals") && (
            <div style={s.card}>
              <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:12 }}>✅ {tr(trendsLang,"ui.team.tabApprovals")}</div>
              {approvals.length === 0 ? (
                <div style={{ textAlign:"center", color:"#334155", padding:24 }}>Aucun post en attente d'approbation</div>
              ) : (
                <div style={{ color:"#94a3b8", fontSize:12 }}>{approvals.length} post(s) en attente</div>
              )}
            </div>
          )}

          {/* Historique — admin + editor + owner */}
          {mainTab === "logs" && canAccess("logs") && (
            <div style={s.card}>
              <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:12 }}>📋 {tr(trendsLang,"ui.team.tabHistory")}</div>
              <div style={{ color:"#475569", fontSize:12 }}>Historique de l'équipe disponible pour les owners.</div>
            </div>
          )}

          {/* Calendrier — tous */}
          {mainTab === "calendar" && canAccess("calendar") && (
            <div style={s.card}>
              <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:12 }}>📅 {tr(trendsLang,"ui.team.tabCalendar")||"Calendrier partagé"}</div>
              <div style={{ color:"#475569", fontSize:12 }}>Le calendrier partagé est accessible via l'onglet Équipe (owner).</div>
            </div>
          )}

          {/* Chat */}
          {mainTab === "chat" && (
            <div style={{ ...s.card, padding:0, overflow:"hidden" }}>
              <TeamChat token={token} trendsLang={trendsLang} isMobile={isMobile} currentUserEmail={myEmail} members={[]} />
            </div>
          )}
        </>
      )}

      {planManagedBy === "team" ? null : (!isBusiness && !isPro) ? <BusinessGate setPage={setPage} /> : (
        <>
          {/* Main tabs */}
          <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.07)", marginBottom:16, flexWrap:"wrap" }}>
            {isBusiness && <button style={s.tabBtn(mainTab==="team")}   onClick={()=>setMainTab("team")}>{tr(trendsLang,"ui.team.tabTeam")}</button>}
            {isAgency   && <button style={s.tabBtn(mainTab==="agency","#8b5cf6")} onClick={()=>setMainTab("agency")}>{tr(trendsLang,"ui.team.tabAgence")}</button>}
            {isAgency   && <button style={s.tabBtn(mainTab==="analytics","#ec4899")} onClick={()=>setMainTab("analytics")}>{tr(trendsLang,"ui.team.tabAnalytics") || "📊 ANALYTICS"}</button>}
            <button style={s.tabBtn(mainTab==="integrations","#38bdf8")} onClick={()=>setMainTab("integrations")}>{tr(trendsLang,"ui.team.tabIntegrations") || "🔗 INTEGRATIONS"}</button>
            <button style={{ ...s.tabBtn(mainTab==="chat","#22c55e"), position:"relative" }} onClick={()=>setMainTab("chat")}>
              💬 CHAT
            </button>
          </div>

          {/* Pro : affiche ProGate + onglet Intégrations */}
          {isPro && mainTab !== "integrations" && <ProGate setPage={setPage} />}

          {/* ── TAB TEAM ── */}
          {mainTab === "team" && (
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap:16 }}>

              {/* Left */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                  <button style={s.tabBtn(activeTab==="members")}  onClick={()=>setActiveTab("members")}>{tr(trendsLang,"ui.team.tabMembers")}</button>
                  <button style={s.tabBtn(activeTab==="activity")} onClick={()=>setActiveTab("activity")}>{tr(trendsLang,"ui.team.tabActivity")}</button>
                  <button style={s.tabBtn(activeTab==="perms")}    onClick={()=>setActiveTab("perms")}>{tr(trendsLang,"ui.team.tabRoles")}</button>
                  {isOwner && <button style={s.tabBtn(activeTab==="approvals","#f59e0b")} onClick={()=>{ setActiveTab("approvals"); fetchApprovals(); }}>{tr(trendsLang,"ui.team.tabApprovals")} {approvals.length > 0 && <span style={{ background:"#ef4444", color:"#fff", borderRadius:"50%", padding:"1px 5px", fontSize:9, marginLeft:4 }}>{approvals.length}</span>}</button>}
                  {isOwner && <button style={s.tabBtn(activeTab==="logs")}  onClick={()=>{ setActiveTab("logs"); fetchTeamLogs(); }}>{tr(trendsLang,"ui.team.tabHistory")}</button>}
                  {isOwner && <button style={s.tabBtn(activeTab==="plans")} onClick={()=>setActiveTab("plans")}>{tr(trendsLang,"ui.team.tabPlans")}</button>}
                  <button style={s.tabBtn(activeTab==="calendar","#22c55e")} onClick={()=>{ setActiveTab("calendar"); if (!teamCalLoaded) fetchTeamCal(); }}>{tr(trendsLang,"ui.team.tabCalendar") || "📅 CALENDRIER"}</button>
                </div>

                {/* Members */}
                {activeTab === "members" && (
                  <div style={s.card}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                      <div>
                        <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13 }}>{tr(trendsLang,"ui.team.teamMembers")}</div>
                        <div style={{ color:"#475569", fontSize:11, marginTop:2 }}>{used}/{MAX_MEMBERS} {tr(trendsLang,"ui.team.slotsUsed")}</div>
                      </div>
                      {isOwner && remaining > 0 && <button style={s.btn} onClick={()=>setShowInvite(true)}>+  {tr(trendsLang,"ui.team.invite")}</button>}
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
                      <div style={{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:"#ef4444", letterSpacing:"1px" }}>{tr(trendsLang,"ui.team.owner")}</div>
                    </div>
                    {loading && <div style={{ color:"#475569", textAlign:"center", padding:20 }}>Loading...</div>}
                    {!loading && members.length === 0 && (
                      <div style={{ textAlign:"center", padding:"28px 0" }}>
                        <div style={{ fontSize:28, marginBottom:8 }}>👥</div>
                        <div style={{ color:"#475569", fontSize:13, marginBottom:16 }}>{tr(trendsLang,"ui.team.noMembers")}</div>
                        {isOwner && <button style={s.btn} onClick={()=>setShowInvite(true)}>+ {tr(trendsLang,"ui.team.inviteFirst")}</button>}
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
                              <span style={{ color:"#334155", fontSize:10 }}>· {m.status==="pending"?`${tr(trendsLang,"ui.team.invited")} ${timeAgo(m.invited_at, trendsLang)}`:`${tr(trendsLang,"ui.team.joined")} ${timeAgo(m.joined_at, trendsLang)}`}</span>
                            </div>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                            <div style={{ background:`rgba(${roleInfo.color==="#ef4444"?"239,68,68":roleInfo.color==="#f59e0b"?"245,158,11":"96,165,250"},0.1)`, border:`1px solid ${roleInfo.color}33`, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:roleInfo.color }}>{roleInfo.label.toUpperCase()}</div>
                            <select style={{ ...s.select, color:roleInfo.color }} value={m.role} onChange={e=>updateRole(m.id, e.target.value)}>
                              {ROLES.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
                            </select>
                            <button style={s.btnDanger} onClick={()=>removeMember(m.id)}>{tr(trendsLang,"ui.team.remove")}</button>
                            {m.status === "pending" && (
                              <button
                                style={{ ...s.btn, background:"linear-gradient(135deg,#3b82f6,#2563eb)", fontSize:10, padding:"7px 12px", opacity: resending===m.id ? 0.6 : 1 }}
                                onClick={() => resendInvite(m.id, m.member_email)}
                                disabled={resending === m.id}
                              >
                                {resending === m.id ? tr(trendsLang,"ui.team.sending") : "↩ " + tr(trendsLang,"ui.team.resendInvite")}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {!loading && members.length > 0 && remaining > 0 && isOwner && (
                      <button style={{ ...s.btn, width:"100%", marginTop:12 }} onClick={()=>setShowInvite(true)}>+ {tr(trendsLang,"ui.team.inviteAnother")} ({remaining} {tr(trendsLang,"ui.team.slotsLeft") || "slots left"})</button>
                    )}
                  </div>
                )}

                {/* Activity */}
                {activeTab === "activity" && (
                  <div style={s.card}>
                    <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:14 }}>📊 {tr(trendsLang,"ui.team.activity")}</div>
                    {activity.length === 0 ? (
                      <div style={{ color:"#475569", textAlign:"center", padding:24, fontSize:13 }}>{tr(trendsLang,"ui.team.noActivity")}</div>
                    ) : activity.map((a,i) => (
                      <div key={i} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ width:30, height:30, borderRadius:"50%", background:"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#64748b", flexShrink:0 }}>
                          {(a.linkedin_name||a.email)?.slice(0,2).toUpperCase()}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ color:"#e2e8f0", fontSize:12, fontWeight:600 }}>{a.linkedin_name||a.email}</div>
                          <div style={{ color:"#64748b", fontSize:12 }}>{tr(trendsLang,`ui.actionLabels.${a.action}`) || tr(trendsLang,`ui.team.activity.${a.action}`) || a.action.replace(/_/g," ")}</div>
                        </div>
                        <div style={{ color:"#334155", fontSize:11, flexShrink:0 }}>{timeAgo(a.created_at, trendsLang)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Permissions */}
                {activeTab === "perms" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                    {/* Tableau référence par rôle */}
                    <div style={s.card}>
                      <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:4 }}>🔐 {tr(trendsLang,"ui.team.rolePerms")}</div>
                      <div style={{ color:"#475569", fontSize:12, marginBottom:16 }}>{tr(trendsLang,"ui.team.rolePermsDesc")}</div>
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
                              [tr(trendsLang,"ui.team.perm.generate"),    true,  true,  false],
                              [tr(trendsLang,"ui.team.perm.publish"),      true,  false, true ],
                              [tr(trendsLang,"ui.team.perm.analyze"),      true,  true,  true ],
                              [tr(trendsLang,"ui.team.perm.brandMemory"),  true,  true,  false],
                              [tr(trendsLang,"ui.team.perm.manageTeam"),   true,  false, false],
                              [tr(trendsLang,"ui.team.perm.projects"),     true,  true,  true ],
                              [tr(trendsLang,"ui.team.perm.analytics"),    true,  true,  true ],
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

                    {/* Permissions granulaires par membre */}
                    {isOwner && members.filter(m => m.status === "active" && m.role !== "owner").length > 0 && (
                      <div style={s.card}>
                        <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:4 }}>⚙️ {tr(trendsLang,"ui.team.permsByMember") || "Permissions par membre"}</div>
                        <div style={{ color:"#475569", fontSize:12, marginBottom:16 }}>{tr(trendsLang,"ui.team.permsByMemberDesc") || "Personnalisez les permissions individuellement au-delà du rôle par défaut."}</div>
                        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                          {members.filter(m => m.status === "active" && m.role !== "owner").map(m => {
                            const perms = m.permissions || {};
                            const roleInfo = ROLES.find(r => r.id === m.role) || ROLES[1];

                            const togglePerm = async (permKey, currentVal) => {
                              const newPerms = { ...perms, [permKey]: !currentVal };
                              try {
                                const r = await fetch(`${API}/team/members/${m.id}/permissions`, {
                                  method: "PATCH",
                                  headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
                                  body: JSON.stringify({ permissions: newPerms }),
                                });
                                if (r.ok) fetchMembers();
                              } catch {}
                            };

                            const PERM_ITEMS = [
                              { key:"canGenerate",       label: tr(trendsLang,"ui.team.permGenerate")  || "Générer",    icon:"✍️" },
                              { key:"canPublish",        label: tr(trendsLang,"ui.team.permPublish")   || "Publier",    icon:"📤" },
                              { key:"canApprove",        label: tr(trendsLang,"ui.team.permApprove")   || "Approuver",  icon:"✅" },
                              { key:"canManageCalendar", label: tr(trendsLang,"ui.team.permCalendar")  || "Calendrier", icon:"📅" },
                            ];

                            return (
                              <div key={m.id} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"14px 16px" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                                  <div style={{ width:32, height:32, borderRadius:"50%", background:`${roleInfo.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:roleInfo.color }}>
                                    {(m.display_name || m.member_email || "?").slice(0,2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ color:"#e2e8f0", fontSize:12, fontWeight:700 }}>{m.display_name || m.member_email}</div>
                                    <span style={{ background:`${roleInfo.color}20`, color:roleInfo.color, fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:10 }}>{roleInfo.label}</span>
                                  </div>
                                </div>
                                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                                  {PERM_ITEMS.map(({ key, label, icon }) => {
                                    const val = perms[key] !== false; // défaut true
                                    return (
                                      <button key={key} onClick={() => togglePerm(key, val)}
                                        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"8px 6px", borderRadius:10, border:`1px solid ${val ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.06)"}`, background:val ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)", cursor:"pointer", transition:"all 0.15s" }}>
                                        <span style={{ fontSize:16 }}>{icon}</span>
                                        <span style={{ color:val ? "#22c55e" : "#475569", fontSize:9, fontWeight:700 }}>{label}</span>
                                        <span style={{ fontSize:12 }}>{val ? "✓" : "✗"}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Onglet Historique ── */}
                {/* ── Onglet Approvals ── */}
                {activeTab === "approvals" && isOwner && (
                  <div style={s.card}>
                    <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:4 }}>✅ {tr(trendsLang,"ui.team.approvalTitle")}</div>
                    <div style={{ color:"#475569", fontSize:12, marginBottom:16 }}>{tr(trendsLang,"ui.team.approvalDesc")}</div>
                    {approvalsLoading ? (
                      <div style={{ textAlign:"center", color:"#475569", padding:20 }}>{tr(trendsLang,"ui.team.loading") || "Loading..."}</div>
                    ) : approvals.length === 0 ? (
                      <div style={{ textAlign:"center", padding:"32px 0" }}>
                        <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
                        <div style={{ color:"#475569", fontSize:13 }}>{tr(trendsLang,"ui.team.noApprovals")}</div>
                      </div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        {approvals.map(p => (
                          <div key={p.id} style={{ background:"rgba(245,158,11,0.05)", border:"1px solid rgba(245,158,11,0.2)", borderLeft:"3px solid #f59e0b", borderRadius:10, padding:"14px 16px" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                              <div>
                                <div style={{ color:"#e2e8f0", fontSize:12, fontWeight:600 }}>{p.author_name || p.author_email}</div>
                                <div style={{ color:"#64748b", fontSize:10 }}>{new Date(p.created_at).toLocaleString()}</div>
                              </div>
                              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                                <span style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:"#f59e0b" }}>⏳ PENDING</span>
                                {/* Dropdown assignation — Owner + Admin seulement */}
                                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                  <span style={{ color:"#475569", fontSize:10 }}>{tr(trendsLang,"ui.team.assignTo") || "Assign to"}:</span>
                                  <select
                                    value={p.assigned_to || ""}
                                    disabled={assigning === p.id}
                                    onChange={e => assignPost(p.id, e.target.value || null)}
                                    style={{ background:"#0f172a", border:`1px solid ${p.assigned_to ? "rgba(96,165,250,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius:6, padding:"3px 8px", color: p.assigned_to ? "#60a5fa" : "#64748b", fontSize:10, outline:"none", cursor:"pointer", opacity: assigning === p.id ? 0.6 : 1 }}
                                  >
                                    <option value="">{tr(trendsLang,"ui.team.unassigned") || "— unassigned —"}</option>
                                    {members.filter(m => m.status === "active").map(m => (
                                      <option key={m.member_id || m.id} value={m.member_id}>
                                        {m.member_name || m.member_email}
                                      </option>
                                    ))}
                                  </select>
                                  {assigning === p.id && <span style={{ color:"#f59e0b", fontSize:10 }}>⏳</span>}
                                </div>
                              </div>
                            </div>
                            {p.media_url && <img src={p.media_url} alt="" style={{ width:"100%", height:80, objectFit:"cover", borderRadius:6, marginBottom:8 }} />}
                            <p style={{ color:"#94a3b8", fontSize:12, lineHeight:1.5, margin:"0 0 12px" }}>{(p.content || "").slice(0, 200)}{p.content?.length > 200 ? "..." : ""}</p>
                            <div style={{ display:"flex", gap:8 }}>
                              <button
                                onClick={() => approvePost(p.id)}
                                disabled={approving === p.id}
                                style={{ flex:1, background:"linear-gradient(135deg,#22c55e,#16a34a)", border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, padding:"10px", cursor:"pointer", opacity: approving === p.id ? 0.6 : 1 }}
                              >{approving === p.id ? "⏳" : `✅ ${tr(trendsLang,"ui.team.approve")}`}</button>
                              <button
                                onClick={() => setRejectModal({ postId: p.id, authorName: p.author_name || p.author_email })}
                                style={{ flex:1, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:8, color:"#ef4444", fontSize:12, fontWeight:700, padding:"10px", cursor:"pointer" }}
                              >{`❌ ${tr(trendsLang,"ui.team.reject")}`}</button>
                              <button
                                onClick={() => toggleComments(p.id)}
                                style={{ background:"rgba(96,165,250,0.1)", border:"1px solid rgba(96,165,250,0.25)", borderRadius:8, color:"#60a5fa", fontSize:12, fontWeight:700, padding:"10px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap" }}
                              >
                                💬 {comments[p.id]?.length || 0}
                              </button>
                            </div>

                            {/* ── Section commentaires ── */}
                            {commentsOpen[p.id] && (
                              <div style={{ marginTop:12, borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:12 }}>
                                {commentsLoading[p.id] ? (
                                  <div style={{ color:"#475569", fontSize:11, textAlign:"center", padding:8 }}>⏳</div>
                                ) : (
                                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:10 }}>
                                    {(comments[p.id] || []).length === 0 && (
                                      <div style={{ color:"#334155", fontSize:11, textAlign:"center", padding:"8px 0" }}>{tr(trendsLang,"ui.team.noComments") || "No comments yet"}</div>
                                    )}
                                    {(comments[p.id] || []).map(c => (
                                      <div key={c.id} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                                        <div style={{ width:24, height:24, borderRadius:"50%", background:"rgba(96,165,250,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:"#60a5fa", flexShrink:0 }}>
                                          {(c.display_name || c.first_name || c.email || "?")[0].toUpperCase()}
                                        </div>
                                        <div style={{ flex:1, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"7px 10px" }}>
                                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                                            <span style={{ color:"#60a5fa", fontSize:10, fontWeight:700 }}>{c.display_name || c.first_name || c.email?.split("@")[0]}</span>
                                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                              <span style={{ color:"#334155", fontSize:9 }}>{new Date(c.created_at).toLocaleString()}</span>
                                              <button onClick={() => deleteComment(p.id, c.id)} style={{ background:"none", border:"none", color:"#475569", fontSize:10, cursor:"pointer", padding:"0 2px", lineHeight:1 }} title="Delete">✕</button>
                                            </div>
                                          </div>
                                          <div style={{ color:"#94a3b8", fontSize:11, lineHeight:1.5 }}>{c.content}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Input nouveau commentaire */}
                                <div style={{ display:"flex", gap:6 }}>
                                  <input
                                    value={commentInput[p.id] || ""}
                                    onChange={e => setCommentInput(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && postComment(p.id)}
                                    placeholder={tr(trendsLang,"ui.team.commentPlaceholder") || "Add a comment..."}
                                    style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"7px 10px", color:"#e2e8f0", fontSize:11, outline:"none", fontFamily:"inherit" }}
                                  />
                                  <button
                                    onClick={() => postComment(p.id)}
                                    disabled={commentPosting === p.id || !commentInput[p.id]?.trim()}
                                    style={{ background:"linear-gradient(135deg,#60a5fa,#3b82f6)", border:"none", borderRadius:8, color:"#fff", fontSize:11, fontWeight:700, padding:"7px 12px", cursor:"pointer", opacity: commentPosting === p.id || !commentInput[p.id]?.trim() ? 0.5 : 1 }}
                                  >{commentPosting === p.id ? "⏳" : tr(trendsLang,"ui.team.send") || "Send"}</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Modale reject */}
                {rejectModal && (
                  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
                    <div style={{ ...s.card, maxWidth:420, width:"100%", padding:24 }}>
                      <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:15, marginBottom:8 }}>❌ {tr(trendsLang,"ui.team.rejectPost")}</div>
                      <div style={{ color:"#64748b", fontSize:12, marginBottom:16 }}>{rejectModal.authorName}</div>
                      <textarea
                        placeholder={tr(trendsLang,"ui.team.rejectReason") || "Reason (optional)..."}
                        id="rejectReason"
                        style={{ width:"100%", background:"#0f172a", border:"1px solid rgba(220,38,38,0.2)", borderRadius:8, color:"#e2e8f0", fontSize:13, padding:"10px 12px", minHeight:80, boxSizing:"border-box", outline:"none", resize:"vertical" }}
                      />
                      <div style={{ display:"flex", gap:10, marginTop:14 }}>
                        <button onClick={() => setRejectModal(null)} style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"#94a3b8", fontSize:13, fontWeight:700, padding:"10px", cursor:"pointer" }}>{tr(trendsLang,"ui.cancel") || "Cancel"}</button>
                        <button onClick={() => rejectPost(rejectModal.postId, document.getElementById("rejectReason")?.value)} style={{ flex:1, background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", borderRadius:8, color:"#fff", fontSize:13, fontWeight:700, padding:"10px", cursor:"pointer" }}>❌ {tr(trendsLang,"ui.team.reject")}</button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "logs" && isOwner && (
                  <div style={s.card}>
                    <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:4 }}>📋 {tr(trendsLang,"ui.team.history")}</div>
                    <div style={{ color:"#475569", fontSize:12, marginBottom:16 }}>{tr(trendsLang,"ui.team.historyDesc")}</div>
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
                            {teamLogs.map(log => {
                              // Extraire les infos d'assignation si applicable
                              let detailsObj = null;
                              try { detailsObj = typeof log.details === "string" ? JSON.parse(log.details) : log.details; } catch {}
                              const isAssignAction = log.action === "post_assigned" || log.action === "post_assigned_to_me";
                              return (
                              <tr key={log.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                                <td style={{ padding:"10px 12px", color:"#475569", fontSize:10, whiteSpace:"nowrap" }}>
                                  {new Date(log.created_at).toLocaleString()}
                                </td>
                                <td style={{ padding:"10px 12px", color:"#94a3b8", fontSize:11 }}>
                                  {log.display_name || log.first_name || log.email?.split("@")[0]}
                                </td>
                                <td style={{ padding:"10px 12px" }}>
                                  <span style={{ background: isAssignAction ? "rgba(96,165,250,0.1)" : "rgba(239,68,68,0.1)", border:`1px solid ${isAssignAction ? "rgba(96,165,250,0.3)" : "rgba(239,68,68,0.2)"}`, borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, color: isAssignAction ? "#60a5fa" : "#ef4444" }}>
                                    {log.action === "post_assigned" ? `🎯 ${tr(trendsLang,"ui.team.assigned") || "ASSIGNED"}` : log.action === "post_assigned_to_me" ? `📥 ${tr(trendsLang,"ui.team.assignedToMe") || "ASSIGNED TO ME"}` : log.action}
                                  </span>
                                </td>
                                <td style={{ padding:"10px 12px", color:"#475569", fontSize:11, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                                  title={typeof log.details === "string" ? log.details : JSON.stringify(log.details)}>
                                  {isAssignAction && detailsObj?.assignee_name
                                    ? `→ ${detailsObj.assignee_name}`
                                    : typeof log.details === "string" ? log.details.slice(0,80) : JSON.stringify(log.details).slice(0,80)}
                                </td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Onglet Plans ── */}
                {activeTab === "plans" && isOwner && (
                  <div style={s.card}>
                    <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:4 }}>💳 {tr(trendsLang,"ui.team.memberPlans")}</div>
                    <div style={{ color:"#475569", fontSize:12, marginBottom:16 }}>{tr(trendsLang,"ui.team.plansDesc")}</div>
                    {members.filter(m => m.status === "active").length === 0 ? (
                      <div style={{ textAlign:"center", color:"#334155", padding:20 }}>{tr(trendsLang,"ui.team.noActiveMembers")}</div>
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
                                  <div style={{ color:"#475569", fontSize:10 }}>{m.role} · {genCount} {tr(trendsLang,"ui.team.generationsUsed")}</div>
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
                                  {quotaResetting === m.id ? "⏳" : tr(trendsLang,"ui.team.resetQuota")}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Calendrier partagé ── */}
                {activeTab === "calendar" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    {/* Header */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:14 }}>📅 {tr(trendsLang,"ui.team.sharedCalendar") || "Calendrier partagé"}</div>
                        <div style={{ color:"#475569", fontSize:12, marginTop:2 }}>{tr(trendsLang,"ui.team.sharedCalendarDesc") || "Planifiez le contenu de votre équipe"}</div>
                      </div>
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <button onClick={() => setCalView("kanban")} style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${calView==="kanban" ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.08)"}`, background: calView==="kanban" ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)", color: calView==="kanban" ? "#22c55e" : "#64748b", fontSize:10, fontWeight:700, cursor:"pointer" }}>📋 Kanban</button>
                        <button onClick={() => setCalView("timeline")} style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${calView==="timeline" ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.08)"}`, background: calView==="timeline" ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)", color: calView==="timeline" ? "#22c55e" : "#64748b", fontSize:10, fontWeight:700, cursor:"pointer" }}>📅 Timeline</button>
                        <button onClick={fetchTeamCal} style={{ padding:"6px 10px", borderRadius:6, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"#64748b", fontSize:10, cursor:"pointer" }}>🔄</button>
                      </div>
                    </div>

                    {/* Stats mini */}
                    <div style={{ display:"flex", gap:8 }}>
                      {CAL_COLS.map(col => (
                        <div key={col.id} style={{ flex:1, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderTop:`3px solid ${col.color}`, borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                          <div style={{ color:col.color, fontSize:16, fontWeight:900 }}>{teamCal.filter(c=>c.col===col.id).length}</div>
                          <div style={{ color:"#475569", fontSize:8, fontWeight:700, letterSpacing:"0.5px" }}>{col.label.replace(/^[^\w\u00C0-\u024F]*/, "").toUpperCase()}</div>
                        </div>
                      ))}
                    </div>

                    {teamCalLoading ? (
                      <div style={{ textAlign:"center", padding:40, color:"#475569" }}>⏳ {tr(trendsLang,"calendar.loading") || "Loading..."}</div>
                    ) : calView === "kanban" ? (
                      /* ── Kanban ── */
                      <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:4 }}>
                        {CAL_COLS.map(col => (
                          <div
                            key={col.id}
                            style={{ minWidth:200, flex:1, background: calDragOver===col.id ? col.bg : "rgba(255,255,255,0.02)", border:`1px solid ${calDragOver===col.id ? col.color+"50" : "rgba(255,255,255,0.06)"}`, borderRadius:10, padding:12, transition:"all 0.2s" }}
                            onDragOver={e => calOnDragOver(e, col.id)}
                            onDrop={e => calOnDrop(e, col.id)}
                            onDragLeave={() => setCalDragOver(null)}
                          >
                            {/* Col header */}
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                              <span style={{ color:col.color, fontSize:11, fontWeight:700 }}>{col.label}</span>
                              <span style={{ color:"#334155", fontSize:9, fontWeight:700 }}>{teamCal.filter(c=>c.col===col.id).length}</span>
                            </div>

                            {/* Cards */}
                            {teamCal.filter(c=>c.col===col.id).map(card => (
                              <div
                                key={card.id}
                                draggable
                                onDragStart={e => calOnDragStart(e, card.id)}
                                style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderLeft:`3px solid ${col.color}`, borderRadius:8, padding:"10px 12px", marginBottom:8, opacity: calDragging===card.id ? 0.4 : 1, cursor:"grab" }}
                              >
                                {/* Auteur */}
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                    <div style={{ width:18, height:18, borderRadius:"50%", background:`${col.color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:800, color:col.color, flexShrink:0 }}>
                                      {(card.display_name || card.first_name || card.email || "?")[0].toUpperCase()}
                                    </div>
                                    <span style={{ color:"#475569", fontSize:9 }}>{card.display_name || card.first_name || card.email?.split("@")[0]}</span>
                                  </div>
                                  <button onClick={() => setCalConfirmDelete(card.id)} style={{ background:"none", border:"none", color:"#334155", fontSize:10, cursor:"pointer", lineHeight:1 }}>✕</button>
                                </div>

                                <div style={{ color:"#e2e8f0", fontSize:11, fontWeight:600, marginBottom:5, lineHeight:1.4 }}>{card.title}</div>

                                <div style={{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
                                  <span style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:4, padding:"1px 6px", fontSize:9, color:"#64748b", fontWeight:600 }}>{card.platform}</span>
                                  {card.date && <span style={{ color:"#334155", fontSize:9 }}>{new Date(card.date).toLocaleDateString()}</span>}
                                </div>

                                {/* Boutons déplacer */}
                                <div style={{ display:"flex", gap:4, marginTop:6, flexWrap:"wrap" }}>
                                  {CAL_COLS.filter(c => c.id !== col.id).map(c => (
                                    <button key={c.id} onClick={() => calMoveCard(card.id, c.id)} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:4, color:c.color, fontSize:8, fontWeight:700, padding:"2px 6px", cursor:"pointer" }}>→ {c.label.replace(/^[^\w\u00C0-\u024F]*/, "")}</button>
                                  ))}
                                </div>
                              </div>
                            ))}

                            {/* Add form */}
                            {calAddingTo === col.id ? (
                              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:10, marginTop:4 }}>
                                <input
                                  value={calNewTitle}
                                  onChange={e => setCalNewTitle(e.target.value)}
                                  onKeyDown={e => e.key === "Enter" && calAddCard(col.id)}
                                  placeholder={tr(trendsLang,"calendar.addTitle") || "Title..."}
                                  autoFocus
                                  style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"6px 8px", color:"#e2e8f0", fontSize:11, outline:"none", marginBottom:6, boxSizing:"border-box", fontFamily:"inherit" }}
                                />
                                <input type="date" value={calNewDate} onChange={e => setCalNewDate(e.target.value)} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"5px 8px", color:"#94a3b8", fontSize:10, outline:"none", marginBottom:6, boxSizing:"border-box" }} />
                                <select value={calNewPlat} onChange={e => setCalNewPlat(e.target.value)} style={{ width:"100%", background:"#0f172a", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"5px 8px", color:"#94a3b8", fontSize:10, outline:"none", marginBottom:8 }}>
                                  {CAL_PLATFORMS.map(p => <option key={p}>{p}</option>)}
                                </select>
                                <div style={{ display:"flex", gap:6 }}>
                                  <button onClick={() => calAddCard(col.id)} style={{ flex:1, background:"linear-gradient(135deg,#22c55e,#16a34a)", border:"none", borderRadius:6, color:"#fff", fontSize:10, fontWeight:700, padding:"7px", cursor:"pointer" }}>{tr(trendsLang,"calendar.add") || "Add"}</button>
                                  <button onClick={() => setCalAddingTo(null)} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, color:"#64748b", fontSize:10, fontWeight:700, padding:"7px 10px", cursor:"pointer" }}>✕</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => { setCalAddingTo(col.id); setCalNewTitle(""); }} style={{ width:"100%", background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(255,255,255,0.07)", borderRadius:8, color:"#334155", fontSize:10, padding:"8px", cursor:"pointer", marginTop:4 }}>+ {tr(trendsLang,"calendar.addCard") || "Add card"}</button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* ── Timeline ── */
                      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:16 }}>
                        {Array.from({ length: 14 }, (_, i) => {
                          const d = new Date(); d.setDate(d.getDate() + i);
                          const dateStr = d.toISOString().split("T")[0];
                          const dayCards = teamCal.filter(c => c.date?.startsWith(dateStr));
                          return (
                            <div key={dateStr} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                              <div style={{ width:56, flexShrink:0, textAlign:"right" }}>
                                <div style={{ color: i===0 ? "#22c55e" : "#475569", fontSize:10, fontWeight: i===0 ? 800 : 600 }}>{d.toLocaleDateString(trendsLang, { weekday:"short" })}</div>
                                <div style={{ color: i===0 ? "#22c55e" : "#334155", fontSize:11, fontWeight:700 }}>{d.getDate()}</div>
                              </div>
                              <div style={{ flex:1, display:"flex", gap:6, flexWrap:"wrap" }}>
                                {dayCards.length === 0
                                  ? <div style={{ color:"#1e293b", fontSize:10, padding:"4px 0" }}>—</div>
                                  : dayCards.map(card => {
                                      const colColor = CAL_COLS.find(c=>c.id===card.col)?.color || "#64748b";
                                      return (
                                        <div key={card.id} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${colColor}30`, borderLeft:`3px solid ${colColor}`, borderRadius:6, padding:"5px 10px", fontSize:10 }}>
                                          <span style={{ color:colColor, fontSize:8, fontWeight:700, marginRight:5 }}>{card.col.toUpperCase()}</span>
                                          <span style={{ color:"#e2e8f0" }}>{card.title}</span>
                                          <span style={{ color:"#475569", fontSize:8, marginLeft:5 }}>· {card.display_name || card.first_name || card.email?.split("@")[0]}</span>
                                        </div>
                                      );
                                    })
                                }
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Empty state */}
                    {!teamCalLoading && teamCal.length === 0 && (
                      <div style={{ textAlign:"center", padding:"32px 20px", color:"#334155" }}>
                        <div style={{ fontSize:36, marginBottom:10 }}>📅</div>
                        <div style={{ color:"#e2e8f0", fontWeight:700, marginBottom:6 }}>{tr(trendsLang,"ui.team.calendarEmpty") || "Calendrier vide"}</div>
                        <div style={{ fontSize:12 }}>{tr(trendsLang,"ui.team.calendarEmptyDesc") || "Ajoutez une card dans une colonne pour planifier le contenu de l'équipe."}</div>
                      </div>
                    )}

                    {/* Confirm delete */}
                    {calConfirmDelete !== null && (
                      <ConfirmModal
                        message={tr(trendsLang,"calendar.confirmDelete") || "Supprimer cette carte ?"}
                        confirmLabel={tr(trendsLang,"ui.delete") || "Supprimer"}
                        cancelLabel={tr(trendsLang,"ui.cancel") || "Annuler"}
                        danger={true}
                        onConfirm={() => { calDeleteCard(calConfirmDelete); setCalConfirmDelete(null); }}
                        onCancel={() => setCalConfirmDelete(null)}
                      />
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
                  <span style={s.label}>{tr(trendsLang,"ui.team.teamName")}</span>
                  <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4 }}>
                    <input
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      placeholder={tr(trendsLang,"ui.team.teamNamePlaceholder") || "My Agency Team"}
                      maxLength={50}
                      style={{ flex:1, background:"#0f172a", border:"1px solid rgba(220,38,38,0.2)", borderRadius:6, color:"#e2e8f0", fontSize:12, padding:"6px 10px", outline:"none" }}
                    />
                    <button
                      onClick={saveTeamName}
                      disabled={teamNameSaving}
                      style={{ background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", borderRadius:6, color:"#fff", fontSize:11, fontWeight:700, padding:"6px 12px", cursor:"pointer", opacity: teamNameSaving ? 0.6 : 1 }}
                    >{teamNameSaving ? "..." : tr(trendsLang,"ui.team.save") || "Save"}</button>
                  </div>
                  <div style={s.divider} />
                  <span style={s.label}>PLAN</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ color: isAgency?"#8b5cf6":"#f97316", fontSize:14, fontWeight:800 }}>{isAgency?"🏢 AGENCY":"💎 BUSINESS"}</span>
                    <div style={{ background: isAgency?"rgba(139,92,246,0.12)":"rgba(249,115,22,0.12)", border:`1px solid ${isAgency?"rgba(139,92,246,0.25)":"rgba(249,115,22,0.25)"}`, borderRadius:20, padding:"2px 9px", fontSize:10, fontWeight:700, color:isAgency?"#8b5cf6":"#f97316" }}>ACTIVE</div>
                  </div>
                  <div style={s.divider} />
                  <span style={s.label}>{tr(trendsLang,"ui.team.capacity") || "CAPACITY"}</span>
                  <div style={{ color:"#e2e8f0", fontSize:13 }}>{used} / {MAX_MEMBERS} {tr(trendsLang,"ui.team.membersLabel") || "members"}</div>
                  <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, marginTop:8 }}>
                    <div style={{ width:`${(used/MAX_MEMBERS)*100}%`, height:"100%", background:used===MAX_MEMBERS?"#ef4444":"linear-gradient(90deg,#22c55e,#16a34a)", borderRadius:2, transition:"width 0.4s" }} />
                  </div>
                  {isAgency && (
                    <>
                      <div style={s.divider} />
                      <span style={s.label}>CLIENTS</span>
                      <div style={{ color:"#e2e8f0", fontSize:13 }}>{clients.length} / {MAX_CLIENTS_AGENCY} {tr(trendsLang,"ui.team.clientsLabel") || "clients"}</div>
                    </>
                  )}
                </div>

                {remaining > 0 && (
                  <div style={{ ...s.card, background:"rgba(239,68,68,0.04)", border:"1px solid rgba(239,68,68,0.15)", textAlign:"center", padding:24 }}>
                    <div style={{ fontSize:28, marginBottom:10 }}>👋</div>
                    <div style={{ color:"#e2e8f0", fontWeight:700, marginBottom:6 }}>{tr(trendsLang,"ui.team.inviteYourTeam")}</div>
                    <div style={{ color:"#475569", fontSize:12, marginBottom:16, lineHeight:1.6 }}>{remaining} {tr(trendsLang,"ui.team.slotsRemaining")}</div>
                    {isOwner && <button style={{ ...s.btn, width:"100%", padding:"12px" }} onClick={()=>setShowInvite(true)}>+ {tr(trendsLang,"ui.team.sendInvitation")}</button>}
                  </div>
                )}

                <div style={s.card}>
                  <span style={s.label}>ROLES</span>
                  {ROLES.map(r => (
                    <div key={r.id} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:r.color, marginTop:4, flexShrink:0 }} />
                      <div>
                        <div style={{ color:r.color, fontSize:12, fontWeight:700 }}>{r.label}</div>
                        <div style={{ color:"#475569", fontSize:11, marginTop:2 }}>{tr(trendsLang, `ui.team.${r.descKey}`) || r.descKey}</div>
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
              trendsLang={trendsLang}
              clients={clients}
              loading={loading}
              onAddClient={()=>{ setEditClient(null); setShowClient(true); }}
              onEditClient={(c)=>{ setEditClient(c); setShowClient(true); }}
              onDeleteClient={(id)=>fetchClients()}
              onRefresh={fetchClients}
              onConfirm={(opts) => setConfirm({ message: opts.message, onConfirm: async () => { await opts.onConfirm(); setConfirm(null); } })}
            />
          )}

          {mainTab === "analytics" && isAgency && (
            <AgencyAnalytics token={token} trendsLang={trendsLang} />
          )}

          {mainTab === "integrations" && (
            <IntegrationsTab token={token} trendsLang={trendsLang} />
          )}

          {mainTab === "chat" && (
            <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
              <TeamChat
                token={token}
                teamId={ownerInfo?.id || null}
                trendsLang={trendsLang}
                isMobile={isMobile}
                currentUserEmail={myEmail}
                members={members}
              />
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showInvite && <InviteModal token={token} onClose={()=>setShowInvite(false)} onSuccess={()=>{ fetchTeamData(); setShowInvite(false); }} />}
      {showClient && <AddClientModal token={token} trendsLang={trendsLang} editClient={editClient} onClose={()=>{ setShowClient(false); setEditClient(null); }} onSuccess={fetchClients} />}
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)} />}
    </>
  );
}
