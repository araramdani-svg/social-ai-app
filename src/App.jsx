import { useState, useEffect } from "react";
import Landing from "./pages/Index";
import Generator from "./pages/Generator";
import Auth from "./pages/Auth";

function App() {
  const [page, setPage] = useState("landing");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setPage("generator");
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setPage("landing");
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
        />
      )}

      {page === "auth" && (
        <Auth loginSuccess={() => setPage("generator")} />
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
              zIndex: 9999
            }}
          >
            <button
              onClick={() => window.location.reload()}
              style={iconStyle}
            >
              🏠
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

            <button
              onClick={logout}
              style={iconStyle}
            >
              ↩
            </button>
          </div>

          <Generator />
        </div>
      )}
    </>
  );
}

const styles = {
  topButton:{
    padding:"12px 20px",
    border:"none",
    borderRadius:12,
    background:"#4f46e5",
    color:"white",
    cursor:"pointer",
    fontWeight:700
  }
};
const iconStyle = {
  width: 52,
  height: 52,
  borderRadius: "14px",
  border: "none",
  background: "#1e293b",
  color: "white",
  cursor: "pointer",
  fontSize: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,.25)"
};
export default App;