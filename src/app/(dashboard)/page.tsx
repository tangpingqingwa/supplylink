import { Users, Send, MessageSquare, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const stats = [
  { label: "供应商总数", value: "0", icon: Users, color: "#2563eb" },
  { label: "本月询盘", value: "0", icon: Send, color: "#6366f1" },
  { label: "待跟进", value: "0", icon: Clock, color: "#f59e0b" },
  { label: "已回复", value: "0", icon: MessageSquare, color: "#22c55e" },
];

const recentActivity = [
  { type: "inquiry", text: "暂无询盘记录", time: "", status: "" },
];

export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          概览
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          供应链询盘管理中心
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl p-5"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${color}20` }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <div className="text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <a href="/suppliers"
          className="rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-colors hover:opacity-80"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)" }}>
            <Users size={18} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>添加供应商</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>录入厂商联系方式</div>
          </div>
        </a>
        <a href="/templates"
          className="rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-colors hover:opacity-80"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: "#6366f1" }}>
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>创建模板</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>设计询盘消息模板</div>
          </div>
        </a>
        <a href="/inquiries"
          className="rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-colors hover:opacity-80"
          style={{ background: "var(--accent)", border: "1px solid var(--accent)" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/20">
            <Send size={18} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-white">批量发询盘</div>
            <div className="text-xs mt-0.5 text-white/70">一键多渠道并发发送</div>
          </div>
        </a>
      </div>

      {/* Recent */}
      <div className="rounded-xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>最近活动</h2>
        </div>
        <div className="px-6 py-10 text-center">
          <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>暂无活动记录</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>开始添加供应商并发送第一条询盘</p>
        </div>
      </div>
    </div>
  );
}
