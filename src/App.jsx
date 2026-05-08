import { useState, useEffect } from "react";
import Landing from "./pages/Index";
import Generator from "./pages/Generator";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";

function App() {
  const [page, setPage] = useState("landing");
  const [token, setToken] = useState(null);

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

          <Generator token={token} />
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
