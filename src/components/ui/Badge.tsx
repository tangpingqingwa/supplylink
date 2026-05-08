import { clsx } from "clsx";

type BadgeVariant = "email" | "whatsapp" | "ali1688" | "form" |
  "sent" | "pending" | "replied" | "failed" | "draft" | "sending" | "ignored" | "default";

const styles: Record<BadgeVariant, React.CSSProperties> = {
  email:     { background: "#2563eb20", color: "#60a5fa" },
  whatsapp:  { background: "#22c55e20", color: "#4ade80" },
  ali1688:   { background: "#f59e0b20", color: "#fbbf24" },
  form:      { background: "#8b5cf620", color: "#a78bfa" },
  sent:      { background: "#22c55e20", color: "#4ade80" },
  pending:   { background: "#f59e0b20", color: "#fbbf24" },
  replied:   { background: "#6366f120", color: "#818cf8" },
  failed:    { background: "#ef444420", color: "#f87171" },
  draft:     { background: "#566778", color: "#8899aa" },
  sending:   { background: "#2563eb20", color: "#60a5fa" },
  ignored:   { background: "#1e2d3d", color: "#566778" },
  default:   { background: "var(--bg-elevated)", color: "var(--text-secondary)" },
};

const LABELS: Record<string, string> = {
  EMAIL: "邮件", WHATSAPP: "WhatsApp", ALI1688: "1688", FORM: "表单",
  SENT: "已发送", PENDING: "待发送", REPLIED: "已回复",
  FAILED: "失败", DRAFT: "草稿", SENDING: "发送中", IGNORED: "已忽略",
};

interface BadgeProps {
  value: string;
  className?: string;
}

export function Badge({ value, className }: BadgeProps) {
  const key = value.toLowerCase() as BadgeVariant;
  const style = styles[key] ?? styles.default;
  return (
    <span
      className={clsx("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", className)}
      style={style}
    >
      {LABELS[value.toUpperCase()] ?? value}
    </span>
  );
}
