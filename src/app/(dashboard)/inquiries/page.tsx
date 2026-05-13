"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Send, Loader2, Search, Trophy } from "lucide-react";
import Link from "next/link";
import { NewInquiryWizard } from "@/components/inquiries/NewInquiryWizard";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Inquiry {
  id: string; name: string; status: string; createdAt: string; sentAt?: string; scheduledAt?: string;
  template: { name: string }; winner?: { name: string } | null; _count: { items: number };
}

const STATUS: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  DRAFT:     { label: "草稿",   bg: "rgba(148,163,184,0.15)", color: "#64748B", dot: "#94A3B8" },
  SCHEDULED: { label: "定时发送", bg: "rgba(124,58,237,0.10)", color: "#7C3AED", dot: "#7C3AED" },
  SENDING:   { label: "发送中", bg: "rgba(37,99,235,0.12)",  color: "#2563EB", dot: "#3B82F6" },
  SENT:      { label: "已发送", bg: "rgba(22,163,74,0.12)",  color: "#16A34A", dot: "#16A34A" },
  PARTIAL:   { label: "部分失败", bg: "rgba(217,119,6,0.12)", color: "#D97706", dot: "#D97706" },
  COMPLETED: { label: "已完成", bg: "rgba(22,163,74,0.12)",  color: "#16A34A", dot: "#16A34A" },
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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

  const filtered = useMemo(() => inquiries.filter(inq => {
    const q = search.trim().toLowerCase();
    if (q && !inq.name.toLowerCase().includes(q)) return false;
    if (statusFilter === "ALL") return true;
    if (statusFilter === "SCHEDULED") return inq.status === "DRAFT" && !!inq.scheduledAt;
    if (statusFilter === "DRAFT") return inq.status === "DRAFT" && !inq.scheduledAt;
    return inq.status === statusFilter;
  }), [inquiries, search, statusFilter]);

  const STATUS_FILTERS = [
    { key: "ALL",       label: "全部" },
    { key: "DRAFT",     label: "草稿" },
    { key: "SCHEDULED", label: "定时发送" },
    { key: "SENT",      label: "已发送" },
    { key: "PARTIAL",   label: "部分失败" },
    { key: "COMPLETED", label: "已完成" },
  ];

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

      {/* Search + Filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "0 0 220px" }}>
          <Search size={13} color="var(--text-muted)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            placeholder="搜索任务名称..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", height: 32, padding: "0 10px 0 30px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)} style={{
              height: 32, padding: "0 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit", border: "1px solid",
              borderColor: statusFilter === f.key ? "var(--accent)" : "var(--border)",
              background: statusFilter === f.key ? "rgba(37,99,235,0.08)" : "var(--bg-surface)",
              color: statusFilter === f.key ? "var(--accent)" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>加载中...</p>
        </div>
      ) : filtered.length === 0 ? (
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
              {filtered.map((inq) => {
                const displayStatus = inq.status === "DRAFT" && inq.scheduledAt ? "SCHEDULED" : inq.status;
                const st = STATUS[displayStatus] ?? STATUS.DRAFT;
                const isHover = hoverId === inq.id;
                return (
                  <tr key={inq.id}
                    onMouseEnter={() => setHoverId(inq.id)}
                    onMouseLeave={() => setHoverId(null)}
                    style={{ borderBottom: "1px solid var(--border-subtle)", background: isHover ? "var(--bg-elevated)" : "transparent", transition: "background 0.1s" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={`/inquiries/${inq.id}`} style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)", textDecoration: "none" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-primary)")}>
                        {inq.name}
                      </Link>
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
                      {inq.winner && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 6, padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: "rgba(245,158,11,0.12)", color: "#D97706" }}>
                          <Trophy size={9} />{inq.winner.name}
                        </div>
                      )}
                      {inq.scheduledAt && inq.status === "DRAFT" && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                          {new Date(inq.scheduledAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                        {formatDistanceToNow(new Date(inq.createdAt), { addSuffix: true, locale: zhCN })}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {((inq.status === "DRAFT" && !inq.scheduledAt) || inq.status === "PARTIAL") && (
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
