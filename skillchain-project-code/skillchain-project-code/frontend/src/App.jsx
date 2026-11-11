import React, { useState } from "react";
import { api } from "./api.js";

/* ---------------- Login / Register ---------------- */
function Login({ onLogin }) {
  const [f, setF] = useState({ name: "", email: "", password: "", role: "student" });
  const [register, setRegister] = useState(false);
  const [msg, setMsg] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    try {
      if (register) await api("/auth/register", { method: "POST", body: f });
      const d = await api("/auth/login", { method: "POST", body: f });
      localStorage.setItem("token", d.token);
      onLogin(d.user);
    } catch (e) { setMsg(e.message); }
  };

  return (
    <div className="card">
      <h2>{register ? "Register" : "Login"}</h2>
      {register && <input placeholder="Name" onChange={set("name")} />}
      <input placeholder="Email" onChange={set("email")} />
      <input type="password" placeholder="Password" onChange={set("password")} />
      {register && (
        <select onChange={set("role")}>
          <option value="student">Student</option>
          <option value="recruiter">Recruiter</option>
        </select>
      )}
      <button onClick={submit}>{register ? "Register & Login" : "Login"}</button>
      <p onClick={() => setRegister(!register)} style={{ cursor: "pointer" }}>
        {register ? "Have an account? Login" : "New here? Register"}
      </p>
      <p style={{ color: "crimson" }}>{msg}</p>
    </div>
  );
}

/* ---------------- Student portal ---------------- */
function Student() {
  const [list, setList] = useState([]);
  const [f, setF] = useState({ certId: "", skill: "", issuer: "" });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");

  const load = () => api("/certificates/mine").then(setList).catch((e) => setMsg(e.message));
  React.useEffect(() => { load(); }, []);

  const upload = async () => {
    const form = new FormData();
    Object.entries(f).forEach(([k, v]) => form.append(k, v));
    form.append("file", file);
    try { await api("/certificates", { method: "POST", form }); setMsg("Submitted for review"); load(); }
    catch (e) { setMsg(e.message); }
  };

  return (
    <>
      <div className="card">
        <h3>Submit a certificate</h3>
        <input placeholder="Certificate ID (e.g. CERT-2026-0142)" onChange={(e) => setF({ ...f, certId: e.target.value })} />
        <input placeholder="Skill (e.g. Python)" onChange={(e) => setF({ ...f, skill: e.target.value })} />
        <input placeholder="Issuer (e.g. NPTEL)" onChange={(e) => setF({ ...f, issuer: e.target.value })} />
        <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={upload}>Upload</button>
        <p>{msg}</p>
      </div>
      <div className="card">
        <h3>My certificates</h3>
        {list.map((c) => (
          <p key={c.certId}>{c.skill} – {c.issuer} <b>[{c.status}]</b></p>
        ))}
      </div>
    </>
  );
}

/* ---------------- Admin / TPO portal ---------------- */
function Admin() {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState("");
  const load = () => api("/certificates/pending").then(setList).catch((e) => setMsg(e.message));
  React.useEffect(() => { load(); }, []);

  const act = async (certId, action) => {
    try {
      const d = await api(`/certificates/${certId}/${action}`, { method: "POST" });
      setMsg(`${certId}: ${d.status}${d.txHash ? " (tx " + d.txHash.slice(0, 12) + "…)" : ""}`);
      load();
    } catch (e) { setMsg(e.message); }
  };

  return (
    <div className="card">
      <h3>Review submissions</h3>
      {list.map((c) => (
        <div key={c.certId}>
          {c.student?.name} – {c.skill} ({c.issuer}) · {c.certId}{" "}
          <button onClick={() => act(c.certId, "approve")}>Approve</button>{" "}
          <button onClick={() => act(c.certId, "reject")}>Reject</button>
        </div>
      ))}
      <p>{msg}</p>
    </div>
  );
}

/* ---------------- Recruiter portal ---------------- */
function Recruiter() {
  const [certId, setCertId] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const verify = async () => {
    const form = new FormData();
    form.append("certId", certId);
    form.append("file", file);
    try { setErr(""); setResult(await api("/certificates/verify", { method: "POST", form })); }
    catch (e) { setErr(e.message); }
  };

  const label = {
    VERIFIED: "✅ Verified",
    HASH_MISMATCH: "❌ Not verified – file differs from the approved one",
    REVOKED: "⚠️ Certificate was revoked",
    NOT_FOUND: "Record not found",
  };

  return (
    <div className="card">
      <h3>Check certificate</h3>
      <input placeholder="Certificate ID" onChange={(e) => setCertId(e.target.value)} />
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={verify}>Verify</button>
      {result && <h3>{label[result.status]}</h3>}
      {result?.approvedBy && <p>Approved by {result.approvedBy} on {result.approvedOn}</p>}
      <p style={{ color: "crimson" }}>{err}</p>
    </div>
  );
}

/* ---------------- App shell ---------------- */
export default function App() {
  const [user, setUser] = useState(null);
  if (!user) return <Login onLogin={setUser} />;
  return (
    <div style={{ maxWidth: 600, margin: "auto", fontFamily: "sans-serif" }}>
      <h2>Skill Verification – {user.name} ({user.role})</h2>
      {user.role === "student" && <Student />}
      {user.role === "admin" && <Admin />}
      {user.role === "recruiter" && <Recruiter />}
      <button onClick={() => { localStorage.clear(); setUser(null); }}>Logout</button>
    </div>
  );
}
