import { useState, useEffect } from "react";
import Landing from "./pages/Index";
import Generator from "./pages/Generator";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";

function App() {
  const [page, setPage] = useState("landing");
  const [token, setToken] = useState(null);
  const [trendsLang, setTrendsLang] = useState("en");
  const [showLangMenu, setShowLangMenu] = useState(false);

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
    if (savedToken && savedToken !== "guest") {
      setToken(savedToken);
      setPage("generator");
    } else if (savedToken === "guest") {
      setPage("generator");
    }
  }, []);

  // Écoute le paramètre URL pour redirection post-paiement
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") === "success") {
      window.history.replaceState({}, "", "/");
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        setToken(savedToken);
        setPage("generator");
      }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setPage("landing");
  };

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    setPage("generator");
  };

  return (
    <>
      {page === "landing" && (
        <Landing
          openApp={() => {
            localStorage.setItem("token", "guest");
            setPage("generator");
          }}
          openLogin={() => setPage("auth")}
          openPricing={() => setPage("pricing")}
        />
      )}

      {page === "auth" && (
        <Auth loginSuccess={handleLoginSuccess} />
      )}

      {page === "pricing" && (
        <Pricing
          token={token}
          openLogin={() => setPage("auth")}
          openApp={() => setPage("generator")}
        />
      )}

      {page === "generator" && (
        <div>
          <div
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              display: "flex",
              gap: 12,
              zIndex: 9999,
            }}
          >
            <button onClick={() => window.location.reload()} style={iconStyle}>
              🏠
            </button>

            {/* Language selector */}
            <div style={{ position:"relative" }}>
              <button
                style={iconStyle}
                onClick={() => setShowLangMenu(!showLangMenu)}
                title="Language"
              >
                {LANGS.find(l => l.key === trendsLang)?.flag || "🌍"}
              </button>
              {showLangMenu && (
                <div style={{ position:"absolute", top:60, right:0, background:"#1a2235", border:"1px solid rgba(220,38,38,0.3)", borderRadius:12, overflow:"hidden", zIndex:99999, minWidth:140, boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>
                  {LANGS.map(l => (
                    <button
                      key={l.key}
                      style={{ width:"100%", padding:"10px 16px", background: trendsLang === l.key ? "rgba(220,38,38,0.15)" : "transparent", border:"none", borderLeft: trendsLang === l.key ? "3px solid #ef4444" : "3px solid transparent", color: trendsLang === l.key ? "#ef4444" : "#94a3b8", fontWeight: trendsLang === l.key ? 800 : 600, fontSize:13, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:8 }}
                      onClick={() => { setTrendsLang(l.key); setShowLangMenu(false); }}
                    >
                      {l.flag} {l.key.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setPage("pricing")}
              style={iconStyle}
              title="Upgrade plan"
            >
              💳
            </button>

            <button
              onClick={() => {
                const event = new CustomEvent("openProfile");
                window.dispatchEvent(event);
              }}
              style={iconStyle}
            >
              👤
            </button>

            <button onClick={logout} style={iconStyle}>
              ↩
            </button>
          </div>

          <Generator token={token} trendsLang={trendsLang} setTrendsLang={setTrendsLang} />
        </div>
      )}
    </>
  );
}

const iconStyle = {
  width: 52,
  height: 52,
  borderRadius: "14px",
  border: "none",
  background: "#1e293b",
  color: "white",
  cursor: "pointer",
  fontSize: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,.25)",
};

export default App;
