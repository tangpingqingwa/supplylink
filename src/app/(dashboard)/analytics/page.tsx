"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Users, Send, MessageSquare, Clock } from "lucide-react";

type Overview = {
  totalInquiries: number;
  totalItems: number;
  repliedItems: number;
  suppliers: number;
  avgReplyHours: number | null;
  replyRate: number;
};

type SupplierRow = {
  id: string;
  name: string;
  sent: number;
  replied: number;
  replyRate: number;
  avgPrice: number | null;
  avgLeadDays: number | null;
};

type MonthPoint = { month: string; sent: number; replied: number };

type ChannelRow = {
  channel: string;
  label: string;
  sent: number;
  replied: number;
  replyRate: number;
};

type Analytics = {
  overview: Overview;
  leaderboard: SupplierRow[];
  monthlyTrend: MonthPoint[];
  channelComparison: ChannelRow[];
};

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: accent ? `${accent}1a` : "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} color={accent ?? "var(--text-secondary)"} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

function BarRow({ label, value, max, color, suffix = "" }: {
  label: string; value: number; max: number; color: string; suffix?: string;
}) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 4;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
      <span style={{ width: 120, color: "var(--text-secondary)", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 6, borderRadius: 99, background: "var(--bg-elevated)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: color, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ width: 48, textAlign: "right", color: "var(--text-primary)", fontWeight: 500, flexShrink: 0 }}>{value}{suffix}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "28px 32px", color: "var(--text-muted)", fontSize: 13.5 }}>
        加载中…
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "28px 32px", color: "var(--text-muted)", fontSize: 13.5 }}>
        无法加载数据，请刷新重试
      </div>
    );
  }

  const { overview, leaderboard, monthlyTrend, channelComparison } = data;
  const maxMonthSent = Math.max(...monthlyTrend.map(m => m.sent), 1);

  const CHANNEL_COLORS: Record<string, string> = {
    EMAIL: "#2563eb", WHATSAPP: "#25a244", ALI1688: "#d4a017",
    FORM: "#7c3aed", SMS: "#0ea5e9", WECHAT: "#07c160",
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>数据分析</h1>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 4 }}>询盘效果与供应商可靠性洞察</p>
      </div>

      {/* Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard icon={TrendingUp} label="询盘总数" value={overview.totalInquiries} sub="历史累计" accent="#2563eb" />
        <StatCard icon={Send}       label="发送条数" value={overview.totalItems}     sub="已发出" accent="#7c3aed" />
        <StatCard icon={MessageSquare} label="回复率" value={`${overview.replyRate}%`} sub={`${overview.repliedItems} 条已回复`} accent="#059669" />
        <StatCard icon={Clock}      label="平均回复时长" value={overview.avgReplyHours != null ? `${overview.avgReplyHours}h` : "—"} sub="从发出到收到" accent="#d97706" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Monthly trend */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "20px 24px" }}>
          <h2 style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>询盘月度趋势</h2>
          {monthlyTrend.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>暂无数据</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {monthlyTrend.map(m => (
                <div key={m.month}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11.5, color: "var(--text-muted)" }}>
                    <span>{m.month}</span>
                    <span>{m.replied}/{m.sent} 回复</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: "var(--bg-elevated)", overflow: "hidden", position: "relative" }}>
                    <div style={{ width: `${Math.round((m.sent / maxMonthSent) * 100)}%`, height: "100%", borderRadius: 99, background: "#2563eb22", position: "absolute" }} />
                    <div style={{ width: `${m.sent > 0 ? Math.round((m.replied / m.sent) * 100) : 0}%`, height: "100%", borderRadius: 99, background: "#2563eb" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Channel comparison */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "20px 24px" }}>
          <h2 style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>渠道效果对比</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {channelComparison.map(ch => (
              <div key={ch.channel}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12.5 }}>
                  <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{ch.label}</span>
                  <span style={{ color: "var(--text-muted)" }}>发送 {ch.sent} · 回复 {ch.replied}</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: "var(--bg-elevated)", overflow: "hidden" }}>
                  <div style={{
                    width: `${ch.replyRate}%`,
                    height: "100%", borderRadius: 99,
                    background: CHANNEL_COLORS[ch.channel] ?? "#6b7280",
                    transition: "width 0.6s ease",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4, fontSize: 12, fontWeight: 600, color: CHANNEL_COLORS[ch.channel] ?? "#6b7280" }}>
                  {ch.replyRate}% 回复率
                </div>
              </div>
            ))}
            {channelComparison.every(c => c.sent === 0) && (
              <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>暂无发送数据</p>
            )}
          </div>
        </div>
      </div>

      {/* Supplier leaderboard */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>供应商排行榜 · 回复率</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>有发送记录的供应商，按回复率降序（最多 10 条）</p>
        </div>
        {leaderboard.length === 0 ? (
          <div style={{ padding: "24px", fontSize: 13, color: "var(--text-muted)" }}>暂无数据</div>
        ) : (
          <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            {leaderboard.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 20, fontSize: 12, color: "var(--text-muted)", textAlign: "center", flexShrink: 0 }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <BarRow
                    label={s.name}
                    value={s.replyRate}
                    max={100}
                    color={i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : i === 2 ? "#b45309" : "#2563eb"}
                    suffix="%"
                  />
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: "var(--text-muted)", flexShrink: 0 }}>
                  {s.avgPrice != null && <span>均价 {s.avgPrice}</span>}
                  {s.avgLeadDays != null && <span>交期 {s.avgLeadDays}天</span>}
                  <span style={{ color: "var(--text-secondary)" }}>{s.replied}/{s.sent}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
