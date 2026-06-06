import { useState, useEffect } from "react";

const API = "https://social-ai-app-production.up.railway.app";

export default function Auth({ loginSuccess, initialMode = "login" }) {
  const [mode, setMode]       = useState(initialMode);
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendSent, setResendSent]     = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  // ── MFA ──
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaEmail, setMfaEmail]       = useState("");
  const [mfaCode, setMfaCode]         = useState("");
  const [mfaLoading, setMfaLoading]   = useState(false);
  const [mfaError, setMfaError]       = useState("");
  const [mfaResent, setMfaResent]     = useState(false);
  // ── Password expiry ──
  const [pwExpired, setPwExpired]     = useState(false);
  const [expiredToken, setExpiredToken] = useState(null);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 480
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const inviteToken = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("invite")
    : null;
  const [inviteInfo, setInviteInfo] = useState(null);

  useEffect(() => {
    if (!inviteToken) return;
    setMode("register");
    fetch(`${API}/team/invite/${inviteToken}`)
      .then(r => r.json())
      .then(d => { if (d.valid) { setInviteInfo(d); setEmail(d.email); } })
      .catch(() => {});
  }, [inviteToken]);

  const submit = async () => {
    setError("");
    try {
      const route = mode === "login" ? `${API}/auth/login` : `${API}/auth/register`;
      const res  = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, ...(mode === "register" && { first_name: firstName, last_name: lastName, display_name: displayName }) }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === "email_not_verified") { setPendingEmail(email); return; }
        // Mot de passe expiré
        if (data.code === "password_expired") {
          setPwExpired(true);
          setExpiredToken(data.reset_token || null);
          return;
        }
        setError(data.message || "Authentication failed");
        return;
      }

      if (mode === "register") {
        if (inviteToken) localStorage.setItem("pendingInviteToken", inviteToken);
        setPendingEmail(email);
        return;
      }

      // Vérifier si MFA requis
      if (data.mfa_required) {
        setMfaRequired(true);
        setMfaEmail(email);
        return;
      }

      localStorage.setItem("token", data.token);
      const pendingInvite = inviteToken || localStorage.getItem("pendingInviteToken");
      if (pendingInvite) {
        try {
          await fetch(`${API}/team/accept`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
            body: JSON.stringify({ token: pendingInvite }),
          });
          localStorage.removeItem("pendingInviteToken");
          window.history.replaceState({}, "", "/");
        } catch {}
      }

      loginSuccess(data.token, email);
    } catch {
      setError("Server unavailable");
    }
  };

  const submitMFA = async () => {
    if (!mfaCode.trim() || mfaCode.length !== 6) { setMfaError("Code à 6 chiffres requis"); return; }
    setMfaLoading(true); setMfaError("");
    try {
      const r = await fetch(`${API}/auth/mfa/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mfaEmail, otp: mfaCode }),
      });
      const d = await r.json();
      if (!r.ok) { setMfaError(d.error || "Code incorrect"); setMfaLoading(false); return; }
      localStorage.setItem("token", d.token);
      loginSuccess(d.token, mfaEmail);
    } catch { setMfaError("Erreur serveur"); }
    setMfaLoading(false);
  };

  const resendMFA = async () => {
    setMfaResent(false);
    try {
      await fetch(`${API}/auth/mfa/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mfaEmail }),
      });
      setMfaResent(true);
    } catch {}
  };

  const resendVerification = async () => {
    setResendLoading(true);
    try {
      await fetch(`${API}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });
      setResendSent(true);
    } catch {}
    setResendLoading(false);
  };

  // ── Écran MFA ──────────────────────────────────────────────────────────────
  if (mfaRequired) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 20 }}>Vérification en 2 étapes</h1>
          <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, margin: "0 0 8px" }}>
            Un code à 6 chiffres a été envoyé à
          </p>
          <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, padding: "10px 16px", marginBottom: 24, color: "#ef4444", fontWeight: 700, fontSize: 14 }}>
            {mfaEmail}
          </div>
          <input
            style={{ ...styles.input, textAlign: "center", fontSize: 24, fontWeight: 800, letterSpacing: "8px" }}
            placeholder="000000"
            value={mfaCode}
            maxLength={6}
            onChange={e => setMfaCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={e => e.key === "Enter" && submitMFA()}
            autoFocus
          />
          {mfaError && <p style={styles.error}>{mfaError}</p>}
          <button style={{ ...styles.button, opacity: mfaLoading ? 0.7 : 1 }} onClick={submitMFA} disabled={mfaLoading}>
            {mfaLoading ? "Vérification..." : "VÉRIFIER LE CODE"}
          </button>
          {mfaResent
            ? <div style={{ color: "#22c55e", fontSize: 13, marginTop: 12 }}>✅ Code renvoyé !</div>
            : <button style={styles.switch} onClick={resendMFA}>Renvoyer le code</button>
          }
          <button style={{ ...styles.switch, marginTop: 4 }} onClick={() => { setMfaRequired(false); setMfaCode(""); setMfaError(""); }}>
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  // ── Écran mot de passe expiré ──────────────────────────────────────────────
  if (pwExpired) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔑</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 20 }}>Mot de passe expiré</h1>
          <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            Votre mot de passe a expiré (politique de sécurité 60 jours). Vous devez le renouveler pour accéder à votre compte.
          </p>
          <button style={styles.button} onClick={() => window.location.href = `/?reset_token=${expiredToken || ""}`}>
            🔄 Changer mon mot de passe
          </button>
          <button style={styles.switch} onClick={() => setPwExpired(false)}>← Retour</button>
        </div>
      </div>
    );
  }

  // ── Écran "Vérifiez votre email" ──────────────────────────────────────────
  if (pendingEmail) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign:"center" }}>
          <div style={{ fontSize:52, marginBottom:16 }}>📬</div>
          <h1 style={{ margin:"0 0 8px", fontSize:22 }}>Check your inbox</h1>
          <p style={{ color:"#64748b", fontSize:14, lineHeight:1.7, margin:"0 0 8px" }}>
            We sent a verification link to
          </p>
          <div style={{ background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.2)", borderRadius:8, padding:"10px 16px", marginBottom:24, color:"#ef4444", fontWeight:700, fontSize:14 }}>
            {pendingEmail}
          </div>
          <p style={{ color:"#475569", fontSize:13, lineHeight:1.6, marginBottom:32 }}>
            Click the link in the email to activate your account. Check your spam folder if you don't see it.
          </p>

          {resendSent ? (
            <div style={{ color:"#22c55e", fontSize:13, marginBottom:16 }}>✅ Email resent!</div>
          ) : (
            <button
              style={{ ...styles.button, background:"transparent", border:"1px solid rgba(220,38,38,0.3)", color:"#ef4444", boxShadow:"none", marginBottom:12, opacity: resendLoading ? 0.6 : 1 }}
              onClick={resendVerification}
              disabled={resendLoading}
            >
              {resendLoading ? "Sending..." : "Resend verification email"}
            </button>
          )}

          <button style={styles.switch} onClick={() => { setPendingEmail(""); setMode("login"); }}>
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  // ── Formulaire login/register ──────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div className="gp-auth-card" style={styles.card}>
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

        {mode === "register" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 10,
            marginTop: 16,
          }}>
            <input
              style={{ ...styles.input, marginTop:0 }}
              placeholder="First name"
              value={firstName}
              type="text"
              autoComplete="given-name"
              onChange={e => setFirstName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
            />
            <input
              style={{ ...styles.input, marginTop:0 }}
              placeholder="Last name"
              value={lastName}
              type="text"
              autoComplete="family-name"
              onChange={e => setLastName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
            />
          </div>
        )}

        {mode === "register" && (
          <input
            style={styles.input}
            placeholder="Display name (shown in app)"
            value={displayName}
            type="text"
            autoComplete="off"
            onChange={e => setDisplayName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
          />
        )}

        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          type="email"
          autoComplete="email"
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
        />

        <input
          type="password"
          style={styles.input}
          placeholder={mode === "register" ? "Password (min. 8 characters)" : "Password"}
          value={password}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={submit}>
          {mode === "login" ? "LOGIN" : "CREATE ACCOUNT"}
        </button>

        <button style={styles.switch} onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "Create a free account" : "Already have an account? Sign in"}
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
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "linear-gradient(145deg,#1a2235,#111827)",
    padding: "clamp(24px, 5vw, 40px)",
    borderRadius: "16px",
    border: "1px solid rgba(220,38,38,0.2)",
    borderLeft: "3px solid #ef4444",
    boxShadow: "0 20px 60px rgba(220,38,38,0.1)",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "12px 16px",
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
