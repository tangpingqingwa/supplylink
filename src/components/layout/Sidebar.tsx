"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, Send, MessageSquare, Settings, Zap, Compass,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "概览" },
  { href: "/suppliers",  icon: Users,           label: "供应商库" },
  { href: "/discover",   icon: Compass,         label: "供应商发现" },
  { href: "/templates",  icon: FileText,        label: "询盘模板" },
  { href: "/inquiries",  icon: Send,            label: "批量询盘" },
  { href: "/responses",  icon: MessageSquare,   label: "回复报价" },
  { href: "/settings",   icon: Settings,        label: "设置" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      height: "100vh",
      position: "sticky",
      top: 0,
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border-subtle)",
    }}>
      {/* Logo */}
      <div style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 18px",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 12px var(--accent-glow)",
        }}>
          <Zap size={14} color="white" strokeWidth={2.5} />
        </div>
        <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          SupplyLink
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 10px",
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: active ? 500 : 400,
              color: active ? "var(--text-primary)" : "var(--text-secondary)",
              background: active ? "var(--bg-elevated)" : "transparent",
              textDecoration: "none",
              transition: "all 0.15s",
              position: "relative",
            }}>
              {active && (
                <span style={{
                  position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                  width: 3, height: 16, borderRadius: 99,
                  background: "var(--accent)",
                }} />
              )}
              <Icon size={15} strokeWidth={active ? 2 : 1.75}
                color={active ? "var(--accent-light)" : "var(--text-muted)"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{
          marginTop: 12, padding: "10px", borderRadius: 8,
          background: "var(--bg-elevated)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 99,
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0,
          }}>T</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              tangpingqingwa
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              跨境电商
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
