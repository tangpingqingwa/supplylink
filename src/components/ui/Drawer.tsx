"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export function Drawer({ open, onClose, title, children, width = "480px" }: DrawerProps) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 40,
        background: "rgba(0,0,0,0.55)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition: "opacity 0.2s",
      }} />
      <div style={{
        position: "fixed", right: 0, top: 0, height: "100%", zIndex: 50,
        width, display: "flex", flexDirection: "column",
        background: "var(--bg-surface)",
        borderLeft: "1px solid var(--border-subtle)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.22s cubic-bezier(0.32,0.72,0,1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 54, borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{title}</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-elevated)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {children}
        </div>
      </div>
    </>
  );
}
