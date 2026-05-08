"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Send, CheckCircle2, AlertCircle, Clock, Loader2, ChevronRight } from "lucide-react";
import { NewInquiryWizard } from "@/components/inquiries/NewInquiryWizard";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Inquiry {
  id: string; name: string; status: string; createdAt: string; sentAt?: string;
  template: { name: string }; _count: { items: number };
}

const STATUS: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  DRAFT:     { label: "草稿",   bg: "rgba(72,79,88,0.4)",   color: "#8b949e", dot: "#484f58" },
  SENDING:   { label: "发送中", bg: "rgba(59,130,246,0.12)", color: "#60a5fa", dot: "#3b82f6" },
  SENT:      { label: "已发送", bg: "rgba(63,185,80,0.12)",  color: "#4ade80", dot: "#3fb950" },
  PARTIAL:   { label: "部分失败", bg: "rgba(210,153,34,0.12)", color: "#fbbf24", dot: "#d29922" },
  COMPLETED: { label: "已完成", bg: "rgba(63,185,80,0.12)",  color: "#4ade80", dot: "#3fb950" },
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setInquiries(await (await fetch("/api/inquiries")).json()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendInquiry = async (id: string) => {
    setSending(id);
    try {
      const res = await fetch(`/api/inquiries/${id}/send`, { method: "POST" });
      const data = await res.json();
      alert(`发送完成：成功 ${data.sent} 条，失败 ${data.failed} 条`);
      load();
    } catch { alert("发送失败"); }
    finally { setSending(null); }
  };

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>批量询盘</h1>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 4 }}>一键多渠道并发发送，实时追踪状态</p>
        </div>
        <button onClick={() => setWizardOpen(true)} style={{
          display: "flex", alignItems: "center", gap: 7, height: 36, padding: "0 16px",
          borderRadius: 8, background: "var(--accent)", border: "none",
          color: "white", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
        }}>
          <Plus size={15} strokeWidth={2.5} />新建询盘
        </button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>加载中...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Send size={22} color="var(--text-muted)" />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>暂无询盘任务</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6, marginBottom: 20 }}>创建任务后一键向所有供应商发送询盘</p>
          <button onClick={() => setWizardOpen(true)} style={{
            display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 18px",
            borderRadius: 8, background: "var(--accent)", border: "none",
            color: "white", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>
            <Plus size={14} />新建询盘
          </button>
        </div>
      ) : (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["任务名称", "模板", "发送数量", "状态", "创建时间", "操作"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", letterSpacing: "0.02em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => {
                const st = STATUS[inq.status] ?? STATUS.DRAFT;
                const isHover = hoverId === inq.id;
                return (
                  <tr key={inq.id}
                    onMouseEnter={() => setHoverId(inq.id)}
                    onMouseLeave={() => setHoverId(null)}
                    style={{ borderBottom: "1px solid var(--border-subtle)", background: isHover ? "var(--bg-elevated)" : "transparent", transition: "background 0.1s" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>{inq.name}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{inq.template.name}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{inq._count.items} 条</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500, background: st.bg, color: st.color }}>
                        <span style={{ width: 6, height: 6, borderRadius: 99, background: st.dot, flexShrink: 0 }} />
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                        {formatDistanceToNow(new Date(inq.createdAt), { addSuffix: true, locale: zhCN })}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {(inq.status === "DRAFT" || inq.status === "PARTIAL") && (
                        <button onClick={() => sendInquiry(inq.id)}
                          disabled={sending === inq.id}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            height: 30, padding: "0 12px", borderRadius: 7,
                            background: "var(--accent)", border: "none",
                            color: "white", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit",
                            opacity: sending === inq.id ? 0.7 : 1,
                          }}>
                          {sending === inq.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                          {inq.status === "PARTIAL" ? "重试" : "发送"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <NewInquiryWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onSaved={load} />
    </div>
  );
}
