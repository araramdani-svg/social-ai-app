import { useState } from "react";

export default function Auth({ loginSuccess }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Authentication failed");
        return;
      }

      localStorage.setItem("token", data.token);
      loginSuccess();

    } catch {
      setError("Server unavailable");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>
          {mode === "login" ? "Login" : "Create account"}
        </h1>

        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          style={styles.input}
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={submit}>
          {mode === "login" ? "LOGIN" : "REGISTER"}
        </button>

        <button
          style={styles.switch}
          onClick={() =>
            setMode(mode === "login" ? "register" : "login")
          }
        >
          {mode === "login"
            ? "Create account"
            : "Already have an account"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page:{
    minHeight:"100vh",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    background:"linear-gradient(135deg,#020617,#0f172a,#1a0a0a)",
    color:"white"
  },

  card:{
    width:"420px",
    background:"linear-gradient(145deg,#1a2235,#111827)",
    padding:"40px",
    borderRadius:"16px",
    border:"1px solid rgba(220,38,38,0.2)",
    borderLeft:"3px solid #ef4444",
    boxShadow:"0 20px 60px rgba(220,38,38,0.1)"
  },

  input:{
    display:"block",
    width:"100%",
    padding:"14px 18px",
    marginTop:"16px",
    background:"#0f172a",
    borderRadius:10,
    border:"1px solid rgba(220,38,38,0.2)",
    borderLeft:"3px solid rgba(220,38,38,0.5)",
    color:"white",
    fontSize:"14px",
    outline:"none",
    boxSizing:"border-box"
  },

  button:{
    width:"100%",
    padding:"16px",
    marginTop:"24px",
    background:"linear-gradient(135deg,#dc2626,#991b1b)",
    border:"none",
    borderRadius:10,
    color:"white",
    fontWeight:800,
    letterSpacing:"1px",
    cursor:"pointer",
    boxShadow:"0 4px 16px rgba(220,38,38,0.35)"
  },

  switch:{
    width:"100%",
    marginTop:"16px",
    background:"transparent",
    color:"#64748b",
    border:"none",
    cursor:"pointer",
    fontSize:"13px"
  },

  error:{
    color:"#ef4444",
    marginTop:"12px",
    fontSize:"13px"
  }
};