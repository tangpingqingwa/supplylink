"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/setup").then(r => r.json()).then(d => {
      if (!d.needsSetup) router.replace("/login");
      else setChecking(false);
    });
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push("/login?setup=1");
    } else {
      setError(typeof data.error === "string" ? data.error : "创建失败，请重试");
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: "1.5px solid #E2E8F0", background: "#FAFAFA",
    color: "#111827", fontSize: 14, fontFamily: "inherit", outline: "none",
  };

  if (checking) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", padding: "40px 44px", width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={16} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>SupplyLink</span>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 6, letterSpacing: "-0.02em" }}>初始化账户</h2>
        <p style={{ fontSize: 13.5, color: "#6B7280", marginBottom: 28 }}>创建第一个管理员账户以开始使用</p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {([
            { label: "姓名", type: "text", value: name, set: setName, placeholder: "如：张三" },
            { label: "邮箱", type: "email", value: email, set: setEmail, placeholder: "your@email.com" },
            { label: "密码（至少6位）", type: "password", value: password, set: setPassword, placeholder: "••••••••" },
          ] as const).map(({ label, type, value, set, placeholder }) => (
            <div key={label}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>{label}</label>
              <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder} required style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = "#2563EB"}
                onBlur={e => e.currentTarget.style.borderColor = "#E2E8F0"} />
            </div>
          ))}

          {error && <p style={{ fontSize: 13, color: "#DC2626", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            height: 44, marginTop: 4, borderRadius: 8, background: "#2563EB", border: "none",
            color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: loading ? 0.75 : 1,
          }}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            创建账户
          </button>
        </form>
      </div>
    </div>
  );
}
