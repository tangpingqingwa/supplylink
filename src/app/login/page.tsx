"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.ok) {
      router.replace("/dashboard");
    } else {
      setError("邮箱或密码错误");
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: "1.5px solid #E2E8F0", background: "#FAFAFA",
    color: "#111827", fontSize: 14, fontFamily: "inherit",
    outline: "none", transition: "border-color 0.15s",
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "DM Sans, system-ui, sans-serif" }}>
      {/* Left brand panel */}
      <div style={{
        width: "45%", background: "linear-gradient(145deg, #1E3A8A 0%, #1D4ED8 60%, #2563EB 100%)",
        display: "flex", flexDirection: "column", padding: "48px 56px",
        color: "white", position: "relative", overflow: "hidden",
      }}>
        {/* bg decoration */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "auto" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={18} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>SupplyLink</span>
        </div>

        {/* Headline */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: 16 }}>
            智能供应链<br />询盘平台
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 40, lineHeight: 1.6 }}>
            发现供应商 · 批量询盘 · 比价决策
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              "供应商自动发现与一键导入",
              "Email / WhatsApp 多渠道批量发送",
              "结构化报价录入与横向对比",
            ].map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CheckCircle size={16} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.85)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: "auto" }}>© 2025 SupplyLink</p>
      </div>

      {/* Right login form */}
      <div style={{
        flex: 1, background: "#FFFFFF",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "48px",
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111827", letterSpacing: "-0.03em", marginBottom: 8 }}>
            欢迎回来
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 32 }}>登录您的账户以继续</p>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>邮箱</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = "#2563EB"}
                onBlur={e => e.currentTarget.style.borderColor = "#E2E8F0"}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>密码</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={e => e.currentTarget.style.borderColor = "#2563EB"}
                  onBlur={e => e.currentTarget.style.borderColor = "#E2E8F0"}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 2,
                }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ fontSize: 13, color: "#DC2626", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8, margin: 0 }}>{error}</p>
            )}

            <button type="submit" disabled={loading} style={{
              height: 44, borderRadius: 8, background: "#2563EB", border: "none",
              color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: loading ? 0.75 : 1, transition: "opacity 0.15s",
            }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              登录
            </button>
          </form>

          <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginTop: 24 }}>
            首次使用？{" "}
            <a href="/setup" style={{ color: "#2563EB", textDecoration: "none", fontWeight: 500 }}>创建账户</a>
          </p>
        </div>
      </div>
    </div>
  );
}
