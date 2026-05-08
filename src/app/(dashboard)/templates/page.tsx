"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, FileText, Pencil, Trash2, Copy, Mail, MessageCircle, ShoppingBag, Globe } from "lucide-react";
import { TemplateDrawer } from "@/components/templates/TemplateDrawer";

const CH_ICON: Record<string, { icon: React.ElementType; bg: string; color: string; label: string }> = {
  EMAIL:    { icon: Mail,          bg: "rgba(59,130,246,0.12)",  color: "#60a5fa", label: "邮件"     },
  WHATSAPP: { icon: MessageCircle, bg: "rgba(63,185,80,0.12)",   color: "#4ade80", label: "WhatsApp" },
  ALI1688:  { icon: ShoppingBag,   bg: "rgba(210,153,34,0.12)",  color: "#fbbf24", label: "1688"     },
  FORM:     { icon: Globe,         bg: "rgba(163,113,247,0.12)", color: "#c4b5fd", label: "表单"     },
};

interface Template {
  id: string; name: string; language: string; subject?: string;
  body: string; channels: string[]; createdAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setTemplates(await (await fetch("/api/templates")).json()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async (id: string) => {
    if (!confirm("确认删除此模板？")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    load();
  };

  const dup = async (t: Template) => {
    await fetch("/api/templates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...t, name: `${t.name}（副本）` }),
    });
    load();
  };

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>询盘模板</h1>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 4 }}>管理多渠道模板，支持变量自动填充</p>
        </div>
        <button onClick={() => { setEditing(null); setDrawerOpen(true); }} style={{
          display: "flex", alignItems: "center", gap: 7, height: 36, padding: "0 16px",
          borderRadius: 8, background: "var(--accent)", border: "none",
          color: "white", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
        }}>
          <Plus size={15} strokeWidth={2.5} />新建模板
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>加载中...</p>
      ) : templates.length === 0 ? (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "60px 20px", textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <FileText size={20} color="var(--text-muted)" />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>暂无模板</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>创建模板后可快速填入变量批量发送</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
          {templates.map((t) => (
            <div key={t.id}
              onMouseEnter={() => setHoverId(t.id)}
              onMouseLeave={() => setHoverId(null)}
              style={{
                background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                borderRadius: 12, padding: "18px 20px",
                transition: "border-color 0.15s",
                borderColor: hoverId === t.id ? "var(--border)" : undefined,
              }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.name}</span>
                    <span style={{
                      fontSize: 11, padding: "1px 7px", borderRadius: 99,
                      background: "var(--bg-elevated)", color: "var(--text-muted)",
                    }}>{t.language === "zh" ? "中文" : t.language === "en" ? "英文" : t.language}</span>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {t.channels.map((ch) => {
                      const s = CH_ICON[ch];
                      if (!s) return null;
                      return (
                        <span key={ch} style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "2px 8px", borderRadius: 99, fontSize: 11.5, fontWeight: 500,
                          background: s.bg, color: s.color,
                        }}>
                          <s.icon size={11} strokeWidth={2.5} />
                          {s.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, opacity: hoverId === t.id ? 1 : 0, transition: "opacity 0.15s", flexShrink: 0 }}>
                  <button onClick={() => dup(t)} title="复制" style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-elevated)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}><Copy size={12} /></button>
                  <button onClick={() => { setEditing(t); setDrawerOpen(true); }} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-elevated)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}><Pencil size={12} /></button>
                  <button onClick={() => del(t.id)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(248,81,73,0.25)", background: "rgba(248,81,73,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#f85149" }}><Trash2 size={12} /></button>
                </div>
              </div>

              {t.subject && (
                <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 8 }}>
                  <span style={{ color: "var(--text-muted)" }}>主题：</span>{t.subject}
                </p>
              )}
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {t.body}
              </p>
            </div>
          ))}
        </div>
      )}

      <TemplateDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSaved={load}
        initial={editing ? { ...editing } : undefined} />
    </div>
  );
}
