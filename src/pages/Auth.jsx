import { useState, useEffect } from "react";

export default function Auth({ loginSuccess }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Detect invite token
  const inviteToken = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("invite")
    : null;
  const [inviteInfo, setInviteInfo] = useState(null);

  useEffect(() => {
    if (!inviteToken) return;
    setMode("register");
    fetch(`https://social-ai-app-production.up.railway.app/team/invite/${inviteToken}`)
      .then(r => r.json())
      .then(d => { if (d.valid) { setInviteInfo(d); setEmail(d.email); } })
      .catch(() => {});
  }, [inviteToken]);

  const submit = async () => {
    setError("");

    try {
      const route =
        mode === "login"
          ? "https://social-ai-app-production.up.railway.app/auth/login"
          : "https://social-ai-app-production.up.railway.app/auth/register";

      const res = await fetch(route, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Authentication failed");
        return;
      }

      localStorage.setItem("token", data.token);

      // Accept team invite if coming from invitation link
      if (inviteToken && mode === "register") {
        try {
          await fetch("https://social-ai-app-production.up.railway.app/team/accept", {
            method: "POST",
            headers: { "Content-Type":"application/json", Authorization:`Bearer ${data.token}` },
            body: JSON.stringify({ token: inviteToken }),
          });
          window.history.replaceState({}, "", "/");
        } catch {}
      }

      loginSuccess(data.token);

    } catch {
      setError("Server unavailable");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {inviteInfo && (
          <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"12px 16px", marginBottom:20 }}>
            <div style={{ color:"#ef4444", fontSize:11, fontWeight:700, letterSpacing:"1px", marginBottom:4 }}>👥 TEAM INVITATION</div>
            <div style={{ color:"#e2e8f0", fontSize:13 }}>
              <strong>{inviteInfo.ownerName}</strong> invited you as <strong style={{color:"#ef4444"}}>{inviteInfo.role?.toUpperCase()}</strong>
            </div>
            <div style={{ color:"#475569", fontSize:11, marginTop:4 }}>Create your account to join the team.</div>
          </div>
        )}
        <h1>{mode === "login" ? "Login" : inviteInfo ? "Join the team" : "Create account"}</h1>

        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          type="email"
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        <input
          type="password"
          style={styles.input}
          placeholder="Password"
          value={password}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={submit}>
          {mode === "login" ? "LOGIN" : "REGISTER"}
        </button>

        <button
          style={styles.switch}
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Create account" : "Already have an account"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#020617,#0f172a,#1a0a0a)",
    color: "white",
  },
  card: {
    width: "420px",
    background: "linear-gradient(145deg,#1a2235,#111827)",
    padding: "40px",
    borderRadius: "16px",
    border: "1px solid rgba(220,38,38,0.2)",
    borderLeft: "3px solid #ef4444",
    boxShadow: "0 20px 60px rgba(220,38,38,0.1)",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "14px 18px",
    marginTop: "16px",
    background: "#0f172a",
    borderRadius: 10,
    border: "1px solid rgba(220,38,38,0.2)",
    borderLeft: "3px solid rgba(220,38,38,0.5)",
    color: "white",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "16px",
    marginTop: "24px",
    background: "linear-gradient(135deg,#dc2626,#991b1b)",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontWeight: 800,
    letterSpacing: "1px",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(220,38,38,0.35)",
  },
  switch: {
    width: "100%",
    marginTop: "16px",
    background: "transparent",
    color: "#64748b",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
  },
  error: {
    color: "#ef4444",
    marginTop: "12px",
    fontSize: "13px",
  },
};
