// ── Styles partagés ──────────────────────────────────────────────────────────
export const st = {
  page: {
    display:"flex",
    height:"100vh",
    background:"#0f172a",
    color:"white",
    position:"relative",
  },
  sidebar: {
    width:240,
    padding:24,
    background:"#111827",
    borderRight:"1px solid rgba(220,38,38,.18)",
    boxShadow:"10px 0 40px rgba(0,0,0,.25)",
    height:"100vh",
    overflowY:"auto",
    boxSizing:"border-box",
    flexShrink:0,
    scrollbarWidth:"none",
    msOverflowStyle:"none",
  },
  mobileDrawer: {
    position:"fixed",
    left:0, top:0, bottom:0,
    width:280,
    background:"#111827",
    borderRight:"1px solid rgba(220,38,38,0.2)",
    boxShadow:"20px 0 60px rgba(0,0,0,0.5)",
    zIndex:201,
    overflowY:"auto",
    padding:20,
    display:"flex",
    flexDirection:"column",
    gap:4,
  },
  main: {
    flex:1,
    padding:"16px 16px",
    height:"100vh",
    overflowY:"auto",
    boxSizing:"border-box",
    minWidth:0,
  },
  bottomNav: {
    position:"fixed",
    bottom:0, left:0, right:0,
    height:60,
    background:"#111827",
    borderTop:"1px solid rgba(220,38,38,0.2)",
    display:"flex",
    alignItems:"stretch",
    zIndex:100,
    boxShadow:"0 -4px 20px rgba(0,0,0,0.3)",
  },
  bottomNavBtn: {
    flex:1,
    background:"transparent",
    border:"none",
    cursor:"pointer",
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    justifyContent:"center",
    padding:"4px 0",
    transition:"color 0.2s",
  },
  nav: {
    display:"block",
    width:"100%",
    padding:14,
    marginBottom:8,
    borderRadius:0,
    background:"#050505",
    color:"white",
    border:"none",
    cursor:"pointer",
    fontWeight:700,
    letterSpacing:"1px",
    transition:"all 0.25s ease",
    textAlign:"left",
  },
  input: {
    display:"block",
    width:"100%",
    maxWidth:"100%",
    padding:"14px 18px",
    marginBottom:10,
    background:"#0f172a",
    borderRadius:10,
    border:"1px solid rgba(220,38,38,0.2)",
    borderLeft:"3px solid rgba(220,38,38,0.5)",
    color:"white",
    fontSize:"14px",
    outline:"none",
    letterSpacing:"0.5px",
    boxSizing:"border-box",
  },
  button: {
    padding:"14px 22px",
    margin:8,
    background:"linear-gradient(135deg, #dc2626, #991b1b)",
    color:"#fff",
    border:"none",
    borderRadius:10,
    cursor:"pointer",
    fontWeight:800,
    letterSpacing:"1px",
    textShadow:"none",
    boxShadow:"0 4px 16px rgba(220,38,38,0.35)",
    transition:"all .25s ease",
  },
  buttonDanger: {
    padding:"14px 22px",
    margin:8,
    background:"linear-gradient(135deg,#7f1d1d,#450a0a)",
    color:"#fff",
    border:"1px solid rgba(220,38,38,0.3)",
    borderRadius:10,
    cursor:"pointer",
    fontWeight:800,
    letterSpacing:"1px",
    boxShadow:"0 4px 16px rgba(127,29,29,0.4)",
  },
  buttonSecondary: {
    padding:"14px 22px",
    margin:8,
    background:"transparent",
    color:"#ef4444",
    border:"1px solid rgba(220,38,38,0.4)",
    borderRadius:10,
    cursor:"pointer",
    fontWeight:700,
    textShadow:"none",
    transition:"all .25s ease",
  },
  card: {
    borderRadius:12,
    background:"linear-gradient(145deg, #1a2235, #111827)",
    border:"1px solid rgba(220,38,38,0.25)",
    borderLeft:"3px solid #ef4444",
    padding:24,
    marginTop:0,
    boxSizing:"border-box",
    overflow:"hidden",
    boxShadow:"0 4px 24px rgba(220,38,38,0.08)",
  },
  textarea: {
    width:"100%",
    minHeight:300,
    background:"#0f172a",
    color:"white",
    padding:20,
    boxSizing:"border-box",
  },
  brandText: { display:"flex", alignItems:"center", gap:10, marginBottom:24, paddingTop:4 },
  sidebarLogo: { width:36, height:36, objectFit:"contain", filter:"drop-shadow(0 0 12px rgba(99,102,241,.45))", flexShrink:0 },
  brandMini: {
    fontSize:"16px", fontWeight:900, fontStyle:"italic",
    color:"#000", WebkitTextStroke:"0.5px white",
    textShadow:"1px 1px 0 #ef4444", letterSpacing:"0.8px",
    lineHeight:"1", margin:0, whiteSpace:"nowrap",
  },
  chartCard: {
    background:"linear-gradient(145deg, #1a2235, #111827)",
    padding:30, borderRadius:12,
    boxShadow:"0 4px 32px rgba(220,38,38,0.1)",
    marginTop:20, width:"100%", minHeight:170, overflow:"hidden",
    border:"1px solid rgba(220,38,38,0.2)", borderLeft:"3px solid #ef4444", flexShrink:0,
  },
  loaderOverlay: { position:"fixed", inset:0, background:"rgba(2,6,23,.85)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:99999 },
  loaderCard: { background:"#050505", borderRadius:0, border:"1px solid rgba(220,38,38,.15)", padding:"50px 70px", textAlign:"center", boxShadow:"0 20px 80px rgba(0,0,0,.5)" },
  onboardingOverlay: { position:"fixed", inset:0, background:"rgba(2,6,23,.9)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:999999, padding:20 },
  onboardingCard: { background:"#050505", borderRadius:0, border:"1px solid rgba(220,38,38,.15)", textAlign:"center", boxShadow:"0 30px 100px rgba(0,0,0,.6)", boxSizing:"border-box" },
  onboardingSteps: { display:"grid", gap:18, margin:"35px 0", textAlign:"left" },
  feedbackGood: { padding:"8px 14px", borderRadius:999, fontSize:11, fontWeight:700, background:"rgba(34,197,94,0.12)", color:"#22c55e" },
  feedbackWarn: { padding:"8px 14px", borderRadius:999, fontSize:11, fontWeight:700, background:"rgba(245,158,11,0.12)", color:"#f59e0b" },
  feedbackBad:  { padding:"8px 14px", borderRadius:999, fontSize:11, fontWeight:700, background:"rgba(239,68,68,0.12)", color:"#ef4444" },
};

// ── Animations CSS globales ───────────────────────────────────────────────────
if (typeof document !== "undefined") {
  const styleId = "gp-global-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes gpFadeIn    { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      @keyframes gpSlideIn   { from { opacity:0; transform:translateX(100px); } to { opacity:1; transform:translateX(0); } }
      @keyframes gpSlideOut  { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(100px); } }
      @keyframes gpPulse     { 0%,100% { opacity:0.4; } 50% { opacity:0.8; } }
      @keyframes gpSpin      { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      @keyframes gpBounce    { 0%,100% { transform:scale(1); } 50% { transform:scale(1.05); } }
      .gp-skeleton           { background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size:200% 100%; animation:gpShimmer 1.5s infinite; border-radius:6px; }
      @keyframes gpShimmer   { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
    `;
    document.head.appendChild(style);
  }
}

// ── Hook breakpoint ───────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
export function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// ── pageHeader partagé ────────────────────────────────────────────────────────
import { createElement as h } from "react";
import logo from "../../assets/logo.png";
import { t as tr } from "../../translations.js";

export function PageHeader({ tabKey, trendsLang, isMobile }) {
  const title    = tr(trendsLang, `headers.${tabKey}`);
  const subtitle = tr(trendsLang, `subtitles.${tabKey}`);
  return h("div", { style:{ marginBottom: isMobile ? 16 : 20 } },
    h("div", { style:{ display:"flex", alignItems:"center", gap: isMobile ? 10 : 16, marginBottom:6 } },
      h("img", { src:logo, alt:"logo", style:{ width: isMobile ? 28:38, height: isMobile ? 28:38, objectFit:"contain", filter:"drop-shadow(0 0 10px rgba(220,38,38,.4))" } }),
      h("div", { style:{ display:"flex", alignItems:"baseline", gap: isMobile ? 8:12, flexWrap:"wrap" } },
        h("h1", { style:{ fontSize: isMobile ? 20:28, fontWeight:900, letterSpacing: isMobile ? "1px":"2px", margin:0, color:"#fff" } }, title),
        h("span", { style:{ fontSize:10, fontWeight:700, color:"#ef4444", letterSpacing:"2px", background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.25)", borderRadius:4, padding:"2px 8px" } }, "GROWTHPILOT")
      )
    ),
    h("div", { style:{ display:"flex", alignItems:"center", gap:10 } },
      h("div", { style:{ width:3, height:14, background:"#ef4444", borderRadius:2 } }),
      h("p", { style:{ margin:0, fontSize:13, color:"#64748b", letterSpacing:"0.5px" } }, subtitle)
    ),
    h("div", { style:{ height:1, background:"linear-gradient(90deg,rgba(220,38,38,0.4),transparent)", marginTop:14 } })
  );
}

// ── metricColor ───────────────────────────────────────────────────────────────
export const metricColor = (score) => {
  if (score >= 85) return "#22c55e";
  if (score >= 65) return "#f59e0b";
  return "#ef4444";
};

// ── Skeleton loader ───────────────────────────────────────────────────────────
export function Skeleton({ width = "100%", height = 16, style = {} }) {
  return h("div", {
    className: "gp-skeleton",
    style: { width, height, borderRadius:6, ...style },
  });
}

export function SkeletonCard({ lines = 3, style = {} }) {
  return h("div", {
    style: {
      background:"linear-gradient(145deg,#1a2235,#111827)",
      border:"1px solid rgba(220,38,38,0.15)",
      borderLeft:"3px solid rgba(220,38,38,0.3)",
      borderRadius:12, padding:20,
      display:"flex", flexDirection:"column", gap:10,
      ...style,
    },
  },
    h(Skeleton, { height:14, width:"60%" }),
    ...Array.from({ length: lines }, (_, i) =>
      h(Skeleton, { key:i, height:12, width: i === lines-1 ? "40%" : "100%" })
    )
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = "📭", title = "Nothing here yet", desc = "", action = null, actionLabel = "" }) {
  return h("div", {
    style: {
      textAlign:"center", padding:"48px 24px",
      display:"flex", flexDirection:"column", alignItems:"center", gap:12,
    },
  },
    h("div", { style:{ fontSize:48, marginBottom:8, animation:"gpBounce 2s ease infinite" } }, icon),
    h("div", { style:{ color:"#e2e8f0", fontWeight:700, fontSize:15 } }, title),
    desc && h("div", { style:{ color:"#475569", fontSize:13, maxWidth:320, lineHeight:1.6 } }, desc),
    action && h("button", {
      style:{ ...st.button, margin:"8px 0 0", padding:"10px 22px", fontSize:12 },
      onClick: action,
    }, actionLabel)
  );
}

// ── Compteur de caractères LinkedIn ──────────────────────────────────────────
const LI_MAX = 3000;
export function CharCounter({ text = "", max = LI_MAX }) {
  const len   = text.length;
  const pct   = len / max;
  const color = pct > 0.95 ? "#ef4444" : pct > 0.8 ? "#f59e0b" : "#22c55e";
  const remaining = max - len;

  return h("div", {
    style:{ display:"flex", alignItems:"center", gap:10, marginTop:4 },
  },
    // Barre de progression
    h("div", { style:{ flex:1, height:3, background:"rgba(255,255,255,0.06)", borderRadius:2 } },
      h("div", {
        style:{
          width:`${Math.min(pct * 100, 100)}%`, height:"100%",
          background: color, borderRadius:2,
          transition:"width 0.3s ease, background 0.3s ease",
        },
      })
    ),
    // Compteur
    h("span", {
      style:{
        fontSize:11, fontWeight:700, fontFamily:"monospace",
        color: pct > 0.95 ? "#ef4444" : "#475569",
        minWidth:50, textAlign:"right",
      },
    }, pct > 0.95 ? `⚠️ ${remaining}` : `${len} / ${max}`)
  );
}

// ── Toast amélioré (appelé depuis App.jsx via showToast) ─────────────────────
// Type : "success" | "error" | "info" | "warning"
export function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [message]);

  const configs = {
    success: { bg:"linear-gradient(135deg,#166534,#15803d)", icon:"✅", border:"rgba(34,197,94,0.4)" },
    error:   { bg:"linear-gradient(135deg,#7f1d1d,#991b1b)", icon:"❌", border:"rgba(239,68,68,0.4)" },
    warning: { bg:"linear-gradient(135deg,#78350f,#92400e)", icon:"⚠️", border:"rgba(245,158,11,0.4)" },
    info:    { bg:"linear-gradient(135deg,#1e1b4b,#312e81)", icon:"💡", border:"rgba(99,102,241,0.4)" },
  };

  const cfg = configs[type] || configs.info;

  return h("div", {
    style:{
      position:"fixed", bottom:80, right:16, zIndex:99999,
      background: cfg.bg,
      border:`1px solid ${cfg.border}`,
      color:"white", padding:"14px 18px", borderRadius:14,
      fontWeight:700, fontSize:13,
      boxShadow:"0 20px 60px rgba(0,0,0,0.5)",
      display:"flex", alignItems:"center", gap:10,
      maxWidth:"calc(100vw - 32px)", minWidth:200,
      animation:"gpSlideIn 0.3s ease",
      cursor:"pointer",
    },
    onClick: onClose,
  },
    h("span", { style:{ fontSize:16, flexShrink:0 } }, cfg.icon),
    h("span", { style:{ flex:1, lineHeight:1.4 } }, message),
    h("span", { style:{ color:"rgba(255,255,255,0.4)", fontSize:16, flexShrink:0 } }, "×")
  );
}

// ── Auto-save hook ────────────────────────────────────────────────────────────
export function useAutoSave(value, key = "gp_autosave", delay = 2000) {
  useEffect(() => {
    if (!value) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(key, value); } catch {}
    }, delay);
    return () => clearTimeout(t);
  }, [value, key, delay]);

  const restore = useCallback(() => {
    try { return localStorage.getItem(key) || ""; } catch { return ""; }
  }, [key]);

  const clear = useCallback(() => {
    try { localStorage.removeItem(key); } catch {}
  }, [key]);

  return { restore, clear };
}

// ── Keyboard shortcuts hook ───────────────────────────────────────────────────
export function useKeyboardShortcuts(shortcuts = []) {
  useEffect(() => {
    const handler = (e) => {
      const isMeta = e.metaKey || e.ctrlKey;
      shortcuts.forEach(({ meta, key, fn }) => {
        if (meta && isMeta && e.key === key) { e.preventDefault(); fn(); }
        else if (!meta && !isMeta && e.key === key) { fn(); }
      });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}

// ── ConfirmModal ──────────────────────────────────────────────────────────────
export function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = "Confirmer", cancelLabel = "Annuler", danger = true }) {
  return h("div", { style:{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:99999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }},
    h("div", { style:{ background:"#111827", border:"1px solid rgba(220,38,38,0.25)", borderRadius:16, padding:32, width:"100%", maxWidth:420, boxShadow:"0 30px 80px rgba(0,0,0,0.6)" }},
      h("div", { style:{ fontSize:28, textAlign:"center", marginBottom:16 }}, "⚠️"),
      h("div", { style:{ color:"#e2e8f0", fontSize:15, fontWeight:700, textAlign:"center", marginBottom:8 }}, "Confirmation"),
      h("div", { style:{ color:"#94a3b8", fontSize:13, textAlign:"center", lineHeight:1.6, marginBottom:28 }}, message),
      h("div", { style:{ display:"flex", gap:12 }},
        h("button", { style:{ flex:1, padding:"11px 16px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#94a3b8", fontSize:13, fontWeight:700, cursor:"pointer" }, onClick:onCancel }, cancelLabel),
        h("button", { style:{ flex:1, padding:"11px 16px", background: danger ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)", border: danger ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(34,197,94,0.4)", borderRadius:10, color: danger ? "#ef4444" : "#22c55e", fontSize:13, fontWeight:700, cursor:"pointer" }, onClick:onConfirm }, confirmLabel)
      )
    )
  );
}
