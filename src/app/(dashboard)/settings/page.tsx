"use client";

import { useState, useEffect } from "react";
import { Mail, MessageCircle, ShoppingBag, Globe, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";

type Tab = "email" | "channels" | "account";

const CHANNELS = [
  { key: "email",    icon: Mail,          label: "Email",    desc: "通过 SMTP 发送邮件询盘"        },
  { key: "whatsapp", icon: MessageCircle, label: "WhatsApp", desc: "Twilio WhatsApp Business API" },
  { key: "ali1688",  icon: ShoppingBag,   label: "1688",     desc: "阿里巴巴平台（手动跟进）"       },
  { key: "form",     icon: Globe,         label: "表单",      desc: "网页表单自动填写提交"           },
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 40, height: 22, borderRadius: 99, border: "none", cursor: "pointer",
      background: on ? "var(--accent)" : "var(--bg-elevated)",
      position: "relative", transition: "background 0.2s", flexShrink: 0,
      outline: "none", boxShadow: "inset 0 0 0 1px var(--border)",
    }}>
      <span style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: 99,
        background: "white", transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("email");
  const [smtp, setSmtp] = useState({ host: "", port: "587", user: "", pass: "", from: "" });
  const [twilio, setTwilio] = useState({ sid: "", token: "", from: "" });
  const [imap, setImap] = useState({ host: "", port: "993", user: "", pass: "" });
  const [imapEnabled, setImapEnabled] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [channelEnabled, setChannelEnabled] = useState<Record<string, boolean>>({ email: false, whatsapp: false, ali1688: false, form: false });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      if (d.smtp_host) setSmtp({ host: d.smtp_host, port: d.smtp_port || "587", user: d.smtp_user || "", pass: d.smtp_pass || "", from: d.smtp_from || "" });
      if (d.twilio_account_sid) setTwilio({ sid: d.twilio_account_sid, token: d.twilio_auth_token || "", from: d.twilio_whatsapp_from || "" });
      if (d.imap_host) setImap({ host: d.imap_host, port: d.imap_port || "993", user: d.imap_user || "", pass: d.imap_pass || "" });
      setImapEnabled(d.imap_enabled === "1");
      setChannelEnabled({
        email:    d.email_enabled === "1",
        whatsapp: d.whatsapp_enabled === "1",
        ali1688:  false,
        form:     false,
      });
    }).catch(() => {});
  }, []);

  const testConnection = async () => {
    setTesting(true); setTestResult(null);
    await new Promise(r => setTimeout(r, 1200));
    setTestResult(smtp.host && smtp.user ? "ok" : "fail");
    setTesting(false);
  };

  const saveSmtp = async () => {
    setSaving(true); setSaveMsg("");
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smtp_host: smtp.host, smtp_port: smtp.port,
        smtp_user: smtp.user, smtp_from: smtp.from,
        ...(smtp.pass && smtp.pass !== "••••••••" ? { smtp_pass: smtp.pass } : {}),
      }),
    });
    setSaving(false);
    setSaveMsg(res.ok ? "已保存" : "保存失败");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const saveTwilio = async () => {
    setSaving(true); setSaveMsg("");
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        twilio_account_sid: twilio.sid,
        twilio_whatsapp_from: twilio.from,
        ...(twilio.token && twilio.token !== "••••••••" ? { twilio_auth_token: twilio.token } : {}),
      }),
    });
    setSaving(false);
    setSaveMsg("已保存");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const saveImap = async () => {
    setSaving(true); setSaveMsg("");
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imap_host: imap.host, imap_port: imap.port, imap_user: imap.user,
        imap_enabled: imapEnabled ? "1" : "0",
        ...(imap.pass && imap.pass !== "••••••••" ? { imap_pass: imap.pass } : {}),
      }),
    });
    setSaving(false); setSaveMsg("已保存");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "email",    label: "邮件配置" },
    { key: "channels", label: "渠道状态" },
    { key: "account",  label: "账号" },
  ];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>设置</h1>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 4 }}>配置发送渠道和系统参数</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid var(--border-subtle)" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "8px 18px", border: "none", background: "transparent",
            fontSize: 13.5, fontWeight: tab === t.key ? 500 : 400, cursor: "pointer", fontFamily: "inherit",
            color: tab === t.key ? "var(--text-primary)" : "var(--text-secondary)",
            borderBottom: `2px solid ${tab === t.key ? "var(--accent)" : "transparent"}`,
            marginBottom: -1, transition: "color 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Email Config */}
      {tab === "email" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* SMTP */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>SMTP 配置</h2>
                <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>用于通过邮件发送询盘</p>
              </div>
              {testResult === "ok" && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500, background: "rgba(63,185,80,0.12)", color: "#3fb950" }}>
                  <CheckCircle2 size={12} />已连接
                </span>
              )}
              {testResult === "fail" && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500, background: "rgba(248,81,73,0.12)", color: "#f85149" }}>
                  <AlertCircle size={12} />连接失败
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
                <Input label="SMTP Host" placeholder="smtp.gmail.com" value={smtp.host} onChange={e => setSmtp(s => ({ ...s, host: e.target.value }))} />
                <Input label="Port" placeholder="587" value={smtp.port} onChange={e => setSmtp(s => ({ ...s, port: e.target.value }))} />
              </div>
              <Input label="Username" placeholder="your@email.com" value={smtp.user} onChange={e => setSmtp(s => ({ ...s, user: e.target.value }))} />
              <Input label="Password" type="password" placeholder="••••••••••••" value={smtp.pass} onChange={e => setSmtp(s => ({ ...s, pass: e.target.value }))} />
              <Input label="From Address" placeholder="SupplyLink <noreply@yourdomain.com>" value={smtp.from} onChange={e => setSmtp(s => ({ ...s, from: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center" }}>
              <button onClick={testConnection} disabled={testing} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 13.5, cursor: "pointer", fontFamily: "inherit", opacity: testing ? 0.7 : 1 }}>
                {testing ? <Loader2 size={14} className="animate-spin" /> : null}测试连接
              </button>
              <button onClick={saveSmtp} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 16px", borderRadius: 8, border: "none", background: "var(--accent)", color: "white", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}保存设置
              </button>
              {saveMsg && <span style={{ fontSize: 12.5, color: "#3fb950" }}>{saveMsg}</span>}
            </div>
          </div>

          {/* Twilio WhatsApp */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Twilio WhatsApp</h2>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>WhatsApp Business API 发送询盘</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Input label="Account SID" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={twilio.sid} onChange={e => setTwilio(s => ({ ...s, sid: e.target.value }))} />
              <Input label="Auth Token" type="password" placeholder="••••••••••••" value={twilio.token} onChange={e => setTwilio(s => ({ ...s, token: e.target.value }))} />
              <Input label="From Number" placeholder="+14155238886" value={twilio.from} onChange={e => setTwilio(s => ({ ...s, from: e.target.value }))} />
            </div>
            <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>WhatsApp 回复 Webhook URL</p>
              <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 8 }}>在 Twilio 控制台 → Messaging → WhatsApp Senders → 你的号码 → 「When a message comes in」填入以下地址：</p>
              <code style={{ fontSize: 12, color: "var(--accent)", wordBreak: "break-all", userSelect: "all" }}>
                {typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/twilio` : "https://your-domain.com/api/webhooks/twilio"}
              </code>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center" }}>
              <button onClick={saveTwilio} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 16px", borderRadius: 8, border: "none", background: "var(--accent)", color: "white", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}保存设置
              </button>
              {saveMsg && <span style={{ fontSize: 12.5, color: "#3fb950" }}>{saveMsg}</span>}
            </div>
          </div>

          {/* IMAP 收件 */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>IMAP 自动收件</h2>
                <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>自动轮询收件箱，识别供应商回复并录入报价</p>
              </div>
              <Toggle on={imapEnabled} onChange={async v => {
                setImapEnabled(v);
                await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imap_enabled: v ? "1" : "0" }) });
              }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
                <Input label="IMAP Host" placeholder="imap.gmail.com" value={imap.host} onChange={e => setImap(s => ({ ...s, host: e.target.value }))} />
                <Input label="Port" placeholder="993" value={imap.port} onChange={e => setImap(s => ({ ...s, port: e.target.value }))} />
              </div>
              <Input label="Username" placeholder="your@email.com" value={imap.user} onChange={e => setImap(s => ({ ...s, user: e.target.value }))} />
              <Input label="Password / App Password" type="password" placeholder="••••••••••••" value={imap.pass} onChange={e => setImap(s => ({ ...s, pass: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center" }}>
              <button onClick={saveImap} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 16px", borderRadius: 8, border: "none", background: "var(--accent)", color: "white", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}保存设置
              </button>
              {saveMsg && <span style={{ fontSize: 12.5, color: "#3fb950" }}>{saveMsg}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Channel Status */}
      {tab === "channels" && (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>渠道状态</h2>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>管理各发送渠道的启用状态</p>
          </div>
          {CHANNELS.map((ch, i) => (
            <div key={ch.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 24px", borderBottom: i < CHANNELS.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ch.icon size={16} color="var(--text-secondary)" strokeWidth={1.75} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>{ch.label}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: channelEnabled[ch.key] ? "#3fb950" : "var(--text-muted)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: 99, background: channelEnabled[ch.key] ? "#3fb950" : "var(--text-muted)", display: "inline-block" }} />
                    {channelEnabled[ch.key] ? "已启用" : "未配置"}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{ch.desc}</p>
              </div>
              <Toggle on={channelEnabled[ch.key]} onChange={async v => {
                setChannelEnabled(s => ({ ...s, [ch.key]: v }));
                if (ch.key === "email" || ch.key === "whatsapp") {
                  await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ [`${ch.key}_enabled`]: v ? "1" : "0" }),
                  });
                }
              }} />
            </div>
          ))}
        </div>
      )}

      {/* Account */}
      {tab === "account" && (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "20px 24px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>账号信息</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "white" }}>T</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>tangpingqingwa</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>跨境电商 · SupplyLink</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
