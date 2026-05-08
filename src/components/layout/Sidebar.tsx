"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Send,
  MessageSquare,
  Settings,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "概览" },
  { href: "/suppliers", icon: Users, label: "供应商库" },
  { href: "/templates", icon: FileText, label: "询盘模板" },
  { href: "/inquiries", icon: Send, label: "批量询盘" },
  { href: "/responses", icon: MessageSquare, label: "回复 & 报价" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen sticky top-0"
      style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border)" }}>
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-5"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "var(--accent)" }}>
          <Zap size={14} className="text-white" />
        </div>
        <span className="font-semibold text-sm tracking-wide"
          style={{ color: "var(--text-primary)" }}>
          SupplyLink
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "text-white"
                  : "hover:text-white"
              )}
              style={
                active
                  ? { background: "var(--accent)", color: "white" }
                  : { color: "var(--text-secondary)" }
              }
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
        <Link href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: "var(--text-secondary)" }}>
          <Settings size={16} />
          设置
        </Link>
      </div>
    </aside>
  );
}
