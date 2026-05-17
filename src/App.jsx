import { useState, useEffect, useCallback } from "react";
import Landing   from "./pages/Index";
import Generator from "./pages/Generator";
import Auth      from "./pages/Auth";
import Pricing   from "./pages/Pricing";
import { Toast } from "./pages/tabs/shared.js";
import Admin    from "./pages/Admin";

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

  const handleLoginSuccess = (newToken, email) => {
    setToken(newToken);
    if (email === "admin@growthpilot.admin") {
      setPage("admin");
    } else {
      setPage("generator");
      showToast("✅ Welcome back!", "success");
    }
  };

  /* ── Boutons flottants ── */
  const floatingBar = !isMobile ? (
    <div style={floatingStyle}>
      <button onClick={() => {
        if (token) {
          sessionStorage.setItem("gp_tab", "home");
          window.dispatchEvent(new CustomEvent("navigateTab", { detail:"home" }));
          setPage("generator");
        } else {
          setPage("landing");
        }
      }} style={iconStyle} title="Home">🏠</button>

      {/* Language selector */}
      <div style={{ position:"relative" }}>
        <button style={iconStyle} onClick={() => setShowLangMenu(!showLangMenu)} title="Language">🌍</button>
        {showLangMenu && (
          <div style={langMenuStyle}>
            {LANGS.map(l => (
              <button
                key={l.key}
                style={{
                  width:"100%", padding:"10px 16px",
                  background: trendsLang === l.key ? "rgba(220,38,38,0.15)" : "transparent",
                  border:"none",
                  borderLeft: trendsLang === l.key ? "3px solid #ef4444" : "3px solid transparent",
                  color: trendsLang === l.key ? "#ef4444" : "#94a3b8",
                  fontWeight: trendsLang === l.key ? 800 : 600,
                  fontSize:13, cursor:"pointer", textAlign:"left",
                  display:"flex", alignItems:"center", gap:8,
                }}
                onClick={() => { setLang(l.key); setShowLangMenu(false); }}
              >
                {l.flag} {l.key.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => setPage("pricing")} style={iconStyle} title="Upgrade">💳</button>
      <button onClick={() => window.dispatchEvent(new CustomEvent("openProfile"))} style={iconStyle} title="Profile">👤</button>
      <button onClick={logout} style={iconStyle} title="Logout">↩</button>
    </div>
  ) : (
    page === "generator" ? (
      <div style={{ ...floatingStyle, gap:8 }}>
        <button onClick={() => { sessionStorage.setItem("gp_tab","home"); window.dispatchEvent(new CustomEvent("navigateTab",{detail:"home"})); }} style={{ ...iconStyle, width:40, height:40, fontSize:16, borderRadius:10 }} title="Home">🏠</button>
        <button onClick={() => setPage("pricing")} style={{ ...iconStyle, width:40, height:40, fontSize:16, borderRadius:10 }} title="Upgrade">💳</button>
        <button onClick={() => window.dispatchEvent(new CustomEvent("openProfile"))} style={{ ...iconStyle, width:40, height:40, fontSize:16, borderRadius:10 }} title="Profile">👤</button>
        <button onClick={logout} style={{ ...iconStyle, width:40, height:40, fontSize:16, borderRadius:10 }} title="Logout">↩</button>
      </div>
    ) : null
  );

  return (
    <>
      {page === "landing" && (
        <Landing
          openApp={() => setPage("register")}
          openLogin={() => setPage("auth")}
          openPricing={() => setPage("pricing")}
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

const floatingStyle = {
  position:"fixed", top:20, right:20,
  display:"flex", gap:12, zIndex:9999,
};

const langMenuStyle = {
  position:"absolute", top:60, right:0,
  background:"#1a2235",
  border:"1px solid rgba(220,38,38,0.3)",
  borderRadius:12, overflow:"hidden",
  zIndex:99999, minWidth:140,
  boxShadow:"0 20px 60px rgba(0,0,0,0.5)",
};

const iconStyle = {
  width:52, height:52, borderRadius:"14px",
  border:"none", background:"#1e293b",
  color:"white", cursor:"pointer",
  fontSize:"20px", boxShadow:"0 10px 30px rgba(0,0,0,.25)",
};

export default App;
