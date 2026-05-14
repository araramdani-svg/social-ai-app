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
  toast: {
    position:"fixed", bottom:72, right:16,
    background:"linear-gradient(135deg,#4f46e5,#7c3aed)",
    color:"white", padding:"16px 22px", borderRadius:"16px",
    fontWeight:700, boxShadow:"0 20px 60px rgba(0,0,0,.35)",
    zIndex:9999, animation:"fadeIn .35s ease", maxWidth:"calc(100vw - 32px)",
  },
  loaderOverlay: { position:"fixed", inset:0, background:"rgba(2,6,23,.85)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:99999 },
  loaderCard: { background:"#050505", borderRadius:0, border:"1px solid rgba(220,38,38,.15)", padding:"50px 70px", textAlign:"center", boxShadow:"0 20px 80px rgba(0,0,0,.5)" },
  onboardingOverlay: { position:"fixed", inset:0, background:"rgba(2,6,23,.9)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:999999, padding:20 },
  onboardingCard: { background:"#050505", borderRadius:0, border:"1px solid rgba(220,38,38,.15)", textAlign:"center", boxShadow:"0 30px 100px rgba(0,0,0,.6)", boxSizing:"border-box" },
  onboardingSteps: { display:"grid", gap:18, margin:"35px 0", textAlign:"left" },
  feedbackGood: { padding:"8px 14px", borderRadius:999, fontSize:11, fontWeight:700, background:"rgba(34,197,94,0.12)", color:"#22c55e" },
  feedbackWarn: { padding:"8px 14px", borderRadius:999, fontSize:11, fontWeight:700, background:"rgba(245,158,11,0.12)", color:"#f59e0b" },
  feedbackBad: { padding:"8px 14px", borderRadius:999, fontSize:11, fontWeight:700, background:"rgba(239,68,68,0.12)", color:"#ef4444" },
};

// ── Hook breakpoint ───────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
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
  const title = tr(trendsLang, `headers.${tabKey}`);
  const subtitle = tr(trendsLang, `subtitles.${tabKey}`);
  return h("div", { style: { marginBottom: isMobile ? 16 : 20 } },
    h("div", { style: { display:"flex", alignItems:"center", gap: isMobile ? 10 : 16, marginBottom:6 } },
      h("img", { src: logo, alt: "logo", style: { width: isMobile ? 28 : 38, height: isMobile ? 28 : 38, objectFit:"contain", filter:"drop-shadow(0 0 10px rgba(220,38,38,.4))" } }),
      h("div", { style: { display:"flex", alignItems:"baseline", gap: isMobile ? 8 : 12, flexWrap:"wrap" } },
        h("h1", { style: { fontSize: isMobile ? 20 : 28, fontWeight:900, letterSpacing: isMobile ? "1px" : "2px", margin:0, color:"#fff" } }, title),
        h("span", { style: { fontSize:10, fontWeight:700, color:"#ef4444", letterSpacing:"2px", background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.25)", borderRadius:4, padding:"2px 8px" } }, "GROWTHPILOT")
      )
    ),
    h("div", { style: { display:"flex", alignItems:"center", gap:10 } },
      h("div", { style: { width:3, height:14, background:"#ef4444", borderRadius:2 } }),
      h("p", { style: { margin:0, fontSize:13, color:"#64748b", letterSpacing:"0.5px" } }, subtitle)
    ),
    h("div", { style: { height:1, background:"linear-gradient(90deg,rgba(220,38,38,0.4),transparent)", marginTop:14 } })
  );
}

// ── metricColor ───────────────────────────────────────────────────────────────
export const metricColor = (score) => {
  if (score >= 85) return "#22c55e";
  if (score >= 65) return "#f59e0b";
  return "#ef4444";
};
