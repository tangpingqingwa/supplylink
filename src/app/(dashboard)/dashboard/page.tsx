export const dynamic = "force-dynamic";

import { Users, Send, MessageSquare, Clock, ArrowUpRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

async function getStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [supplierTotal, supplierMonth, sentTotal, sentMonth, pendingReplies, receivedReplies, templateTotal] =
    await Promise.all([
      prisma.supplier.count(),
      prisma.supplier.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.inquiryItem.count({ where: { status: { in: ["SENT", "REPLIED"] } } }),
      prisma.inquiryItem.count({ where: { status: { in: ["SENT", "REPLIED"] }, sentAt: { gte: monthStart } } }),
      prisma.inquiryItem.count({ where: { status: "SENT" } }),
      prisma.response.count(),
      prisma.template.count(),
    ]);
  const replyRate = sentTotal > 0 ? Math.round((receivedReplies / sentTotal) * 100) : 0;
  return { supplierTotal, supplierMonth, sentTotal, sentMonth, pendingReplies, receivedReplies, replyRate, templateTotal };
}

export default async function DashboardPage() {
  const s = await getStats();

  const stats = [
    { label: "供应商总数",  value: String(s.supplierTotal), sub: `本月新增 ${s.supplierMonth}`,         icon: Users,         color: "#3b82f6", bg: "rgba(59,130,246,0.1)"  },
    { label: "询盘已发送",  value: String(s.sentTotal),     sub: `本月发送 ${s.sentMonth} 条`,          icon: Send,          color: "#a371f7", bg: "rgba(163,113,247,0.1)" },
    { label: "待跟进回复",  value: String(s.pendingReplies),sub: "已发送未回复",                        icon: Clock,         color: "#d29922", bg: "rgba(210,153,34,0.1)"  },
    { label: "已收到回复",  value: String(s.receivedReplies),sub: `回复率 ${s.replyRate}%`,             icon: MessageSquare, color: "#3fb950", bg: "rgba(63,185,80,0.1)"   },
  ];

  const quickActions = [
    { href: "/suppliers", label: "添加供应商", desc: "录入厂商联系信息",   icon: Users, color: "#3b82f6", primary: false },
    { href: "/templates", label: "新建模板",   desc: "设计询盘消息模板",   icon: Send,  color: "#a371f7", primary: false },
    { href: "/inquiries", label: "发起询盘",   desc: "一键多渠道批量发送", icon: Send,  color: "#2563eb", primary: true  },
  ];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>工作台</h1>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 4 }}>供应链询盘管理中心</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 500 }}>{label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={15} color={color} strokeWidth={2} />
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 14 }}>
        {/* Quick actions */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>快捷操作</span>
          </div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {quickActions.map(({ href, label, desc, icon: Icon, color, primary }) => (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                borderRadius: 10, textDecoration: "none",
                background: primary ? "var(--accent)" : "var(--bg-elevated)",
                border: `1px solid ${primary ? "transparent" : "var(--border-subtle)"}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: primary ? "rgba(255,255,255,0.15)" : colorBg(color),
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={16} color={primary ? "white" : color} strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: primary ? "white" : "var(--text-primary)" }}>{label}</div>
                  <div style={{ fontSize: 12, marginTop: 2, color: primary ? "rgba(255,255,255,0.6)" : "var(--text-muted)" }}>{desc}</div>
                </div>
                <ChevronRight size={14} color={primary ? "rgba(255,255,255,0.5)" : "var(--text-muted)"} />
              </Link>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>起步指引</span>
          </div>
          <div style={{ padding: "8px 12px" }}>
            {[
              { step: "1", label: "添加供应商",   href: "/suppliers",  done: s.supplierTotal > 0 },
              { step: "2", label: "创建询盘模板", href: "/templates",  done: s.templateTotal > 0 },
              { step: "3", label: "发起批量询盘", href: "/inquiries",  done: s.sentTotal > 0 },
              { step: "4", label: "录入回复报价", href: "/responses",  done: s.receivedReplies > 0 },
            ].map(({ step, label, href, done }) => (
              <Link key={step} href={href} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 8px", borderRadius: 8, textDecoration: "none",
                color: done ? "var(--text-muted)" : "var(--text-secondary)", fontSize: 13,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 99, flexShrink: 0,
                  border: done ? "1.5px solid #3fb950" : "1.5px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 600,
                  color: done ? "#3fb950" : "var(--text-muted)",
                  background: done ? "rgba(63,185,80,0.08)" : "transparent",
                }}>{done ? "✓" : step}</div>
                <span style={{ textDecoration: done ? "line-through" : "none" }}>{label}</span>
                <ArrowUpRight size={13} style={{ marginLeft: "auto" }} color="var(--text-muted)" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function colorBg(color: string) {
  const map: Record<string, string> = {
    "#3b82f6": "rgba(59,130,246,0.1)",
    "#a371f7": "rgba(163,113,247,0.1)",
    "#2563eb": "rgba(37,99,235,0.1)",
  };
  return map[color] ?? "var(--bg-elevated)";
}
