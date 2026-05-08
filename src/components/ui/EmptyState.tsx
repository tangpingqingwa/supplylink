import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "var(--bg-elevated)" }}>
        <Icon size={22} style={{ color: "var(--text-muted)" }} />
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>{title}</p>
      {description && (
        <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>{description}</p>
      )}
      {action}
    </div>
  );
}
