/**
 * GrowthPILOT — Content Calendar
 * File: src/pages/tabs/Calendar.jsx
 *
 * Vue kanban 30 jours avec drag & drop
 * Colonnes : Ideas → Draft → Scheduled → Published
 * Stockage : localStorage (migration DB à faire)
 */

import { useState, useRef } from "react";
import { t as tr } from "../../translations.js";
import { PageHeader } from "./shared.js";

const COLUMNS = (lang) => [
  { id:"ideas",     label:tr(lang,"calendar.colIdeas"),     color:"#475569",  bg:"rgba(71,85,105,0.1)" },
  { id:"draft",     label:tr(lang,"calendar.colDraft"),     color:"#f59e0b",  bg:"rgba(245,158,11,0.08)" },
  { id:"scheduled", label:tr(lang,"calendar.colScheduled"), color:"#60a5fa",  bg:"rgba(96,165,250,0.08)" },
  { id:"published", label:tr(lang,"calendar.colPublished"), color:"#22c55e",  bg:"rgba(34,197,94,0.08)" },
];

const PLATFORMS = ["LinkedIn","Threads","X","Instagram","All"];

function loadCards() {
  try { return JSON.parse(localStorage.getItem("gp_calendar") || "[]"); }
  catch { return []; }
}
function saveCards(cards) {
  try { localStorage.setItem("gp_calendar", JSON.stringify(cards)); }
  catch {}
}

let _id = Date.now();
const uid = () => `card_${_id++}`;

const DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d.toISOString().split("T")[0];
});

export default function Calendar({ trendsLang, isMobile, post, setPost, setTab, showToast }) {
  const [cards,     setCards]     = useState(loadCards);
  const [addingTo,  setAddingTo]  = useState(null);
  const [newTitle,  setNewTitle]  = useState("");
  const [newDate,   setNewDate]   = useState(DAYS[0]);
  const [newPlat,   setNewPlat]   = useState("LinkedIn");
  const [dragging,  setDragging]  = useState(null);
  const [dragOver,  setDragOver]  = useState(null);
  const [filterPlat,setFilterPlat]= useState("All");
  const [viewMode,  setViewMode]  = useState("kanban"); // kanban | timeline

  const persist = (updated) => { setCards(updated); saveCards(updated); };

  /* ── Add card ── */
  const addCard = (colId) => {
    if (!newTitle.trim()) return;
    const card = {
      id: uid(), col: colId, title: newTitle.trim(),
      date: newDate, platform: newPlat,
      content: post || "", createdAt: new Date().toISOString(),
    };
    persist([...cards, card]);
    setNewTitle(""); setAddingTo(null);
    showToast("✓ " + tr(trendsLang,"calendar.addCard"));
  };

  /* ── Import active post ── */
  const importPost = (colId) => {
    if (!post) { showToast("⚠️ No active post — generate one first"); return; }
    const card = {
      id: uid(), col: colId,
      title: post.slice(0, 50) + (post.length > 50 ? "..." : ""),
      date: newDate, platform: newPlat,
      content: post, createdAt: new Date().toISOString(),
    };
    persist([...cards, card]);
    showToast("✓ " + tr(trendsLang,"calendar.importPost"));
  };

  /* ── Delete card ── */
  const deleteCard = (id) => persist(cards.filter(c => c.id !== id));

  /* ── Move card ── */
  const moveCard = (id, newCol) => persist(cards.map(c => c.id === id ? { ...c, col: newCol } : c));

  /* ── Edit ── */
  const editCard = (id, field, val) => persist(cards.map(c => c.id === id ? { ...c, [field]: val } : c));

  /* ── Use in Create ── */
  const useCard = (card) => { setPost(card.content || card.title); setTab("create"); showToast(tr(trendsLang,"calendar.loaded") || "✓ Loaded in Create"); };

  /* ── Drag & drop ── */
  const onDragStart = (e, cardId) => { setDragging(cardId); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver  = (e, colId)  => { e.preventDefault(); setDragOver(colId); };
  const onDrop      = (e, colId)  => { e.preventDefault(); if (dragging) moveCard(dragging, colId); setDragging(null); setDragOver(null); };

  const filteredCards = (colId) => cards.filter(c => c.col === colId && (filterPlat === "All" || c.platform === filterPlat));

  const s = {
    wrap:    { display:"flex", flexDirection:"column", gap:16, paddingBottom:40 },
    tabBtn:  (a) => ({ padding:"8px 16px", background:"transparent", border:"none", borderBottom: a ? "2px solid #ef4444" : "2px solid transparent", color: a ? "#ef4444" : "#475569", fontWeight:700, fontSize:11, letterSpacing:"1px", cursor:"pointer" }),
    col:     (col, over) => ({ flex:"1 1 220px", minWidth: isMobile ? "100%" : 200, background: over ? `rgba(239,68,68,0.05)` : col.bg, border:`1px solid ${over ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius:12, padding:12, transition:"all 0.2s", minHeight:200 }),
    card:    { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"12px 14px", marginBottom:8, cursor:"grab", position:"relative" },
    addBtn:  { width:"100%", padding:"8px", background:"rgba(255,255,255,0.03)", border:"1px dashed rgba(255,255,255,0.1)", borderRadius:8, color:"#334155", fontSize:12, cursor:"pointer", marginTop:8 },
    input:   { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"8px 10px", color:"#e2e8f0", fontSize:12, outline:"none", boxSizing:"border-box", marginBottom:6, fontFamily:"inherit" },
    select:  { width:"100%", background:"rgba(15,23,42,0.8)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"7px 10px", color:"#e2e8f0", fontSize:11, outline:"none", boxSizing:"border-box", marginBottom:6 },
    platBadge:(p) => ({ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:10, background:"rgba(255,255,255,0.06)", color:"#64748b", letterSpacing:"1px" }),
    btn:     { background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", borderRadius:6, color:"#fff", fontSize:11, fontWeight:700, padding:"8px 14px", cursor:"pointer" },
    btnGhost:{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, color:"#64748b", fontSize:11, padding:"7px 12px", cursor:"pointer" },
    filterBtn:(a) => ({ padding:"5px 12px", borderRadius:20, border: a ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.07)", background: a ? "rgba(239,68,68,0.1)" : "transparent", color: a ? "#ef4444" : "#475569", fontSize:10, fontWeight:700, cursor:"pointer" }),
  };

  /* ── Timeline view ── */
  const TimelineView = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      {DAYS.slice(0, 14).map(day => {
        const dayCards = cards.filter(c => c.date === day && (filterPlat === "All" || c.platform === filterPlat));
        return (
          <div key={day} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ minWidth:80, color:"#475569", fontSize:11, fontWeight:700, paddingTop:2 }}>
              {new Date(day).toLocaleDateString(trendsLang === "en" ? "en" : trendsLang, { weekday:"short", month:"short", day:"numeric" })}
            </div>
            <div style={{ flex:1, display:"flex", gap:8, flexWrap:"wrap" }}>
              {dayCards.length === 0
                ? <div style={{ color:"#1e293b", fontSize:11 }}>No posts scheduled</div>
                : dayCards.map(card => (
                  <div key={card.id} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"6px 12px", fontSize:12 }}>
                    <span style={{ color: COLUMNS.find(c=>c.id===card.col)?.color, fontSize:9, fontWeight:700, marginRight:6 }}>{card.col.toUpperCase()}</span>
                    <span style={{ color:"#e2e8f0" }}>{card.title}</span>
                  </div>
                ))
              }
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={s.wrap}>
      <PageHeader tabKey="calendar" trendsLang={trendsLang} isMobile={isMobile} />

      {/* Controls */}
      <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <button style={s.tabBtn(viewMode==="kanban")} onClick={() => setViewMode("kanban")}>📋 {tr(trendsLang,"calendar.kanban")}</button>
          <button style={s.tabBtn(viewMode==="timeline")} onClick={() => setViewMode("timeline")}>📅 {tr(trendsLang,"calendar.timeline")}</button>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginLeft:"auto" }}>
          {PLATFORMS.map(p => <button key={p} style={s.filterBtn(filterPlat===p)} onClick={() => setFilterPlat(p)}>{p === "All" ? tr(trendsLang,"calendar.all") : p}</button>)}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:10 }}>
        {COLUMNS(trendsLang).map(col => (
          <div key={col.id} style={{ flex:1, background:"rgba(255,255,255,0.02)", border:`1px solid rgba(255,255,255,0.06)`, borderTop:`3px solid ${col.color}`, borderRadius:8, padding:"8px 12px", textAlign:"center" }}>
            <div style={{ color:col.color, fontSize:18, fontWeight:900 }}>{cards.filter(c=>c.col===col.id).length}</div>
            <div style={{ color:"#475569", fontSize:9, fontWeight:700, letterSpacing:"1px" }}>{col.id.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Timeline view */}
      {viewMode === "timeline" && (
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:16 }}>
          <TimelineView />
        </div>
      )}

      {/* Kanban view */}
      {viewMode === "kanban" && (
        <div style={{ display:"flex", gap:12, flexWrap: isMobile ? "wrap" : "nowrap", alignItems:"flex-start", overflowX: isMobile ? "visible" : "auto", paddingBottom:8 }}>
          {COLUMNS(trendsLang).map(col => (
            <div
              key={col.id}
              style={s.col(col, dragOver === col.id)}
              onDragOver={e => onDragOver(e, col.id)}
              onDrop={e => onDrop(e, col.id)}
              onDragLeave={() => setDragOver(null)}
            >
              {/* Column header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <span style={{ color:col.color, fontSize:12, fontWeight:700 }}>{col.label}</span>
                <span style={{ color:"#334155", fontSize:10, fontWeight:700 }}>{filteredCards(col.id).length}</span>
              </div>

              {/* Cards */}
              {filteredCards(col.id).map(card => (
                <div
                  key={card.id}
                  style={{ ...s.card, opacity: dragging === card.id ? 0.4 : 1 }}
                  draggable
                  onDragStart={e => onDragStart(e, card.id)}
                >
                  <div style={{ color:"#e2e8f0", fontSize:12, fontWeight:600, marginBottom:6, lineHeight:1.4 }}>{card.title}</div>
                  <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:8 }}>
                    <span style={s.platBadge(card.platform)}>{card.platform}</span>
                    <span style={{ color:"#334155", fontSize:10 }}>{card.date ? new Date(card.date).toLocaleDateString(trendsLang === "en" ? "en" : trendsLang,{month:"short",day:"numeric"}) : tr(trendsLang,"calendar.noDate")}</span>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {card.content && (
                      <button style={s.btnGhost} onClick={() => useCard(card)}>{tr(trendsLang,"calendar.edit")}</button>
                    )}
                    {/* Move buttons */}
                    {COLUMNS(trendsLang).filter(c=>c.id!==col.id).map(c => (
                      <button key={c.id} style={{ ...s.btnGhost, fontSize:9, padding:"4px 8px" }} onClick={() => moveCard(card.id, c.id)}>
                        → {tr(trendsLang,`calendar.col${c.id.charAt(0).toUpperCase()+c.id.slice(1)}`)}
                      </button>
                    ))}
                    <button style={{ ...s.btnGhost, color:"#ef4444", fontSize:9, padding:"4px 8px" }} onClick={() => deleteCard(card.id)}>✕</button>
                  </div>
                </div>
              ))}

              {/* Add card form */}
              {addingTo === col.id ? (
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:10, marginTop:8 }}>
                  <input style={s.input} placeholder={tr(trendsLang,"calendar.addTitle")} value={newTitle} onChange={e=>setNewTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCard(col.id)} autoFocus />
                  <input type="date" style={s.input} value={newDate} onChange={e=>setNewDate(e.target.value)} min={DAYS[0]} max={DAYS[29]} />
                  <select style={s.select} value={newPlat} onChange={e=>setNewPlat(e.target.value)}>
                    {PLATFORMS.filter(p=>p!=="All").map(p=><option key={p}>{p}</option>)}
                  </select>
                  <div style={{ display:"flex", gap:6 }}>
                    <button style={s.btn} onClick={()=>addCard(col.id)}>{tr(trendsLang,"calendar.add")}</button>
                    {post && <button style={s.btnGhost} onClick={()=>importPost(col.id)}>{tr(trendsLang,"calendar.importPost")}</button>}
                    <button style={s.btnGhost} onClick={()=>setAddingTo(null)}>{tr(trendsLang,"calendar.cancel")}</button>
                  </div>
                </div>
              ) : (
                <button style={s.addBtn} onClick={()=>setAddingTo(col.id)}>{tr(trendsLang,"calendar.addCard")}</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {cards.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 20px", color:"#334155" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📅</div>
          <div style={{ color:"#e2e8f0", fontWeight:700, marginBottom:8 }}>{tr(trendsLang,"calendar.emptyTitle")}</div>
          <div style={{ fontSize:13 }}>{tr(trendsLang,"calendar.emptyDesc")}</div>
        </div>
      )}
    </div>
  );
}
