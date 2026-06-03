import { useState, useEffect, useCallback } from "react";
import Landing   from "./pages/Index";
import Generator from "./pages/Generator";
import Auth      from "./pages/Auth";
import Pricing   from "./pages/Pricing";
import { Toast } from "./pages/tabs/shared.js";
import Admin    from "./pages/Admin";
import { initSentry } from "./sentry.js";

initSentry();

/* ── Hook breakpoint ── */
function useWindowWidth() {
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

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);

  const [page, setPageState] = useState(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return "landing";
    return sessionStorage.getItem("gp_page") || "generator";
  });

  const setPage = (p) => {
    setPageState(p);
    sessionStorage.setItem("gp_page", p);
    // Tracking visites (silencieux)
    fetch("https://social-ai-app-production.up.railway.app/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: p }),
    }).catch(() => {});
  };

  const setLang = (l) => {
    setTrendsLang(l);
    localStorage.setItem("gp_lang", l);
  };

  const [trendsLang,   setTrendsLang]   = useState(() => localStorage.getItem("gp_lang") || "en");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [tooltip,      setTooltip]      = useState(null); // label affiché au hover

  // ── Toast system ────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    // Détecter le type automatiquement si non fourni
    let detectedType = type;
    if (type === "info") {
      if (message.startsWith("✅") || message.startsWith("✓")) detectedType = "success";
      else if (message.startsWith("❌"))                        detectedType = "error";
      else if (message.startsWith("⚠️"))                       detectedType = "warning";
    }

    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-2), { id, message, type: detectedType }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const width    = useWindowWidth();
  const isMobile = width < 768;

  const LANGS = [
    { key:"en", flag:"🇬🇧" },
    { key:"fr", flag:"🇫🇷" },
    { key:"es", flag:"🇪🇸" },
    { key:"de", flag:"🇩🇪" },
    { key:"it", flag:"🇮🇹" },
    { key:"pt", flag:"🇵🇹" },
  ];

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      if (!sessionStorage.getItem("gp_page")) setPage("generator");
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Vérification email
    const verifyToken = params.get("verify");
    if (verifyToken) {
      window.history.replaceState({}, "", "/");
      fetch(`https://social-ai-app-production.up.railway.app/auth/verify-email/${verifyToken}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            showToast("✅ Email verified! You can now log in.", "success");
            setPage("auth");
          } else {
            showToast("❌ Invalid or expired verification link.", "error");
            setPage("auth");
          }
        })
        .catch(() => { setPage("auth"); });
    }

    if (params.get("upgrade") === "success") {
      window.history.replaceState({}, "", "/");
      const savedToken = localStorage.getItem("token");
      if (savedToken) { setToken(savedToken); setPage("generator"); }
      showToast("✅ Subscription activated!", "success");
    }

    if (params.get("twitter") === "connected") {
      window.history.replaceState({}, "", "/");
      showToast("✅ X (Twitter) connected!", "success");
    }

    if (params.get("instagram") === "connected") {
      window.history.replaceState({}, "", "/");
      showToast("✅ Instagram connected!", "success");
    }

    if (params.get("linkedin") === "connected" || params.get("threads") === "connected") {
      window.history.replaceState({}, "", "/");
      const platform = params.get("linkedin") ? "LinkedIn" : "Threads";
      showToast(`✅ ${platform} connected!`, "success");
      if (window.opener) {
        window.opener.postMessage({ type:"oauth_success", platform: platform.toLowerCase() }, "*");
        window.close();
      }
    }

    if (params.get("twitter") === "error" || params.get("instagram") === "error") {
      window.history.replaceState({}, "", "/");
      showToast("❌ Connection failed. Please try again.", "error");
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "oauth_success") {
        const savedToken = localStorage.getItem("token");
        if (savedToken) setToken(savedToken);
        window.dispatchEvent(new CustomEvent("oauthSuccess", { detail: event.data.platform }));
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("gp_page");
    setToken(null);
    setPage("landing");
  };

  const handleLoginSuccess = async (newToken, email) => {
    setToken(newToken);
    // Vérifier is_admin depuis l'API plutôt que par email hardcodé
    try {
      const r = await fetch("https://social-ai-app-production.up.railway.app/auth/me", {
        headers: { Authorization: `Bearer ${newToken}` }
      });
      const user = await r.json();
      if (user.is_admin || email === "admin@growthpilot.admin") {
        setPage("admin");
      } else {
        setPage("generator");
        showToast("✅ Welcome back!", "success");
      }
    } catch {
      // Fallback sur l'email
      if (email === "admin@growthpilot.admin") {
        setPage("admin");
      } else {
        setPage("generator");
        showToast("✅ Welcome back!", "success");
      }
    }
  };

  /* ── Menu radial arc ─────────────────────────────────────────────────────── */

  // Items du menu — desktop
  const MENU_ITEMS = [
    { icon:"🏠", label:"Accueil",   action: () => { if(token){ sessionStorage.setItem("gp_tab","home"); window.dispatchEvent(new CustomEvent("navigateTab",{detail:"home"})); setPage("generator"); } else setPage("landing"); } },
    { icon:"🌍", label:"Langue",    action: () => setShowLangMenu(m => !m) },
    { icon:"💳", label:"Upgrade",   action: () => setPage("pricing") },
    { icon:"👤", label:"Profil",    action: () => window.dispatchEvent(new CustomEvent("openProfile")) },
    { icon:"↩",  label:"Déconnexion", action: logout },
  ];

  // Arc depuis coin haut-droit → déploiement vers bas et gauche
  const ARC_START = 195;
  const ARC_END   = 265;
  const RADIUS    = 80;
  const getPos = (i, total) => {
    const angle = ARC_START + (ARC_END - ARC_START) * (i / (total - 1));
    const rad   = (angle * Math.PI) / 180;
    return { x: Math.cos(rad) * RADIUS, y: Math.sin(rad) * RADIUS };
  };

  const floatingBar = (
    <div style={{ position:"fixed", top:36, right:24, zIndex:9999 }}>

      {/* Overlay click-outside pour fermer */}
      {menuOpen && (
        <div
          style={{ position:"fixed", inset:0, zIndex:-1 }}
          onClick={() => { setMenuOpen(false); setShowLangMenu(false); setTooltip(null); }}
        />
      )}

      {/* Tooltip */}
      {tooltip && menuOpen && (
        <div style={{
          position:"absolute", top:"50%", right:70,
          transform:"translateY(-50%)",
          background:"#0f172a", border:"1px solid rgba(255,255,255,0.12)",
          borderRadius:8, padding:"5px 12px",
          color:"#e2e8f0", fontSize:12, fontWeight:700,
          whiteSpace:"nowrap", pointerEvents:"none",
          boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
          zIndex:10000,
        }}>
          {tooltip}
        </div>
      )}

      {/* Boutons arc */}
      {MENU_ITEMS.map((item, i) => {
        const pos = getPos(i, MENU_ITEMS.length);
        return (
          <div
            key={i}
            style={{
              position:"absolute",
              top:  `calc(26px + ${menuOpen ? pos.y : 0}px)`,
              right:`calc(26px - ${menuOpen ? pos.x : 0}px)`,
              transition:`all ${0.25 + i * 0.04}s cubic-bezier(0.34,1.56,0.64,1)`,
              opacity: menuOpen ? 1 : 0,
              pointerEvents: menuOpen ? "auto" : "none",
              transform:`scale(${menuOpen ? 1 : 0.3})`,
            }}
            onMouseEnter={() => setTooltip(item.label)}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Bouton action */}
            <button
              onClick={() => { item.action(); if(item.label !== "Langue") { setMenuOpen(false); setTooltip(null); } }}
              style={{
                width:48, height:48, borderRadius:"50%",
                border:"2px solid rgba(255,255,255,0.1)",
                background:"rgba(15,23,42,0.95)",
                backdropFilter:"blur(12px)",
                color:"white", cursor:"pointer", fontSize:18,
                boxShadow:"0 8px 24px rgba(0,0,0,0.4)",
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(220,38,38,0.2)"; e.currentTarget.style.borderColor="rgba(220,38,38,0.5)"; e.currentTarget.style.transform="scale(1.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(15,23,42,0.95)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.transform="scale(1)"; }}
            >
              {item.icon}
            </button>

            {/* Sous-menu langue */}
            {item.label === "Langue" && showLangMenu && (
              <div style={{
                position:"absolute", top:0, right:56,
                background:"#0f172a",
                border:"1px solid rgba(220,38,38,0.3)",
                borderRadius:12, overflow:"hidden",
                zIndex:99999, minWidth:130,
                boxShadow:"0 20px 60px rgba(0,0,0,0.6)",
              }}>
                {LANGS.map(l => (
                  <button key={l.key} style={{
                    width:"100%", padding:"9px 14px",
                    background: trendsLang===l.key ? "rgba(220,38,38,0.15)" : "transparent",
                    border:"none",
                    borderLeft: trendsLang===l.key ? "3px solid #ef4444" : "3px solid transparent",
                    color: trendsLang===l.key ? "#ef4444" : "#94a3b8",
                    fontWeight: trendsLang===l.key ? 800 : 600,
                    fontSize:12, cursor:"pointer", textAlign:"left",
                    display:"flex", alignItems:"center", gap:8,
                  }} onClick={() => { setLang(l.key); setShowLangMenu(false); }}>
                    {l.flag} {l.key.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Bouton principal — trigger */}
      <button
        onClick={() => { setMenuOpen(o => !o); setShowLangMenu(false); setTooltip(null); }}
        style={{
          width:52, height:52, borderRadius:"50%",
          border:"none",
          background: menuOpen
            ? "linear-gradient(135deg,#ef4444,#dc2626)"
            : "linear-gradient(135deg,#1e293b,#0f172a)",
          color:"white", cursor:"pointer",
          fontSize: menuOpen ? "20px" : "22px",
          boxShadow: menuOpen
            ? "0 0 0 3px rgba(220,38,38,0.3), 0 12px 32px rgba(220,38,38,0.3)"
            : "0 10px 30px rgba(0,0,0,0.4)",
          transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          transform: menuOpen ? "rotate(45deg)" : "rotate(0deg)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:10001, position:"relative",
        }}
        title={menuOpen ? "Fermer" : "Menu"}
      >
        {menuOpen ? "✕" : "⚡"}
      </button>
    </div>
  );

  return (
    <>
      {page === "landing" && (
        <Landing
          openApp={() => setPage("register")}
          openLogin={() => setPage("auth")}
          openPricing={() => setPage("pricing")}
          lang={trendsLang}
          setLang={setLang}
        />
      )}

      {page === "auth" && (
        <Auth loginSuccess={handleLoginSuccess} initialMode="login" />
      )}

      {page === "register" && (
        <Auth loginSuccess={handleLoginSuccess} initialMode="register" />
      )}

      {page === "pricing" && (
        <Pricing token={token} openLogin={() => setPage("auth")} openApp={() => setPage("generator")} />
      )}

      {page === "admin" && (
        <Admin token={token} logout={logout} />
      )}

      {page === "generator" && (
        <div>
          {floatingBar}
          <Generator
            token={token}
            trendsLang={trendsLang}
            setTrendsLang={setLang}
            setPage={setPage}
            showToast={showToast}
          />
        </div>
      )}

      {/* ── Toast stack ── */}
      <div style={{ position:"fixed", bottom:80, right:16, zIndex:99999, display:"flex", flexDirection:"column", gap:8 }}>
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </>
  );
}

const langMenuStyle = {
  position:"absolute", top:60, right:0,
  background:"#1a2235",
  border:"1px solid rgba(220,38,38,0.3)",
  borderRadius:12, overflow:"hidden",
  zIndex:99999, minWidth:140,
  boxShadow:"0 20px 60px rgba(0,0,0,0.5)",
};

export default App;
