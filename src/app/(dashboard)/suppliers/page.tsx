"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, Pencil, Users, SlidersHorizontal, Upload } from "lucide-react";
import { SupplierDrawer } from "@/components/suppliers/SupplierDrawer";
import { CsvImportModal } from "@/components/suppliers/CsvImportModal";

const CHANNEL_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  EMAIL:    { bg: "rgba(59,130,246,0.12)",  color: "#60a5fa", label: "邮件"      },
  WHATSAPP: { bg: "rgba(63,185,80,0.12)",   color: "#4ade80", label: "WhatsApp" },
  ALI1688:  { bg: "rgba(210,153,34,0.12)",  color: "#fbbf24", label: "1688"     },
  FORM:     { bg: "rgba(163,113,247,0.12)", color: "#c4b5fd", label: "表单"     },
  SMS:      { bg: "rgba(14,165,233,0.12)",  color: "#38bdf8", label: "短信"     },
  WECHAT:   { bg: "rgba(7,193,96,0.12)",    color: "#34d058", label: "微信"     },
};

const AVATAR_COLORS = [
  ["#1e3a5f","#3b82f6"],["#1e3a2f","#4ade80"],["#3a1e3a","#c084fc"],
  ["#3a2a1e","#fb923c"],["#1e3a3a","#22d3ee"],["#3a1e2a","#f472b6"],
];

function getAvatar(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return { bg: AVATAR_COLORS[i][0], color: AVATAR_COLORS[i][1], char: name.charAt(0).toUpperCase() };
}

interface Channel { id: string; type: string; value: string; primary: boolean }
interface Supplier {
  id: string; name: string; company?: string; country?: string;
  category?: string; tags: string[]; notes?: string; channels: Channel[];
  createdAt: string;
}

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setSuppliers(await (await fetch("/api/suppliers")).json()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = suppliers.filter((s) =>
    [s.name, s.company, s.category, s.country].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelect = (id: string) =>
    setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.id)));

  const deleteSelected = async () => {
    if (!confirm(`确认删除选中的 ${selected.size} 个供应商？`)) return;
    await Promise.all([...selected].map((id) => fetch(`/api/suppliers/${id}`, { method: "DELETE" })));
    setSelected(new Set());
    load();
  };

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>供应商库</h1>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 4 }}>
            共 {suppliers.length} 家供应商
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setImportOpen(true)} style={{
            display: "flex", alignItems: "center", gap: 7,
            height: 36, padding: "0 16px", borderRadius: 8,
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            color: "var(--text-secondary)", fontSize: 13.5, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            <Upload size={14} />
            导入 CSV
          </button>
          <button onClick={() => { setEditing(null); setDrawerOpen(true); }} style={{
            display: "flex", alignItems: "center", gap: 7,
            height: 36, padding: "0 16px", borderRadius: 8,
            background: "var(--accent)", border: "none",
            color: "white", fontSize: 13.5, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            <Plus size={15} strokeWidth={2.5} />
            添加供应商
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索供应商、品类、国家..."
            style={{
              width: "100%", height: 36, paddingLeft: 34, paddingRight: 12,
              borderRadius: 8, outline: "none", fontSize: 13.5,
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              color: "var(--text-primary)", fontFamily: "inherit",
            }}
          />
        </div>
        <button style={{
          height: 36, padding: "0 14px", borderRadius: 8, cursor: "pointer",
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          color: "var(--text-secondary)", fontSize: 13.5, fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 7,
        }}>
          <SlidersHorizontal size={14} />筛选
        </button>
        {selected.size > 0 && (
          <button onClick={deleteSelected} style={{
            height: 36, padding: "0 14px", borderRadius: 8, cursor: "pointer",
            background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.3)",
            color: "#f85149", fontSize: 13.5, fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <Trash2 size={14} />删除 {selected.size} 项
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <th style={{ width: 44, padding: "10px 16px" }}>
                <input type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll} style={{ cursor: "pointer", accentColor: "var(--accent)" }} />
              </th>
              {["供应商", "品类 / 国家", "联系渠道", "操作"].map((h, i) => (
                <th key={h} style={{
                  padding: "10px 16px", textAlign: "left",
                  fontSize: 12, fontWeight: 500, color: "var(--text-muted)",
                  letterSpacing: "0.02em", textTransform: "uppercase",
                  paddingRight: i === 3 ? 20 : 16,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 60, color: "var(--text-muted)", fontSize: 13 }}>加载中...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "100px 20px", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Users size={22} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>暂无供应商</p>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>点击右上角「添加供应商」开始</p>
                </div>
              </td></tr>
            ) : filtered.map((s) => {
              const av = getAvatar(s.name);
              const isHover = hoverId === s.id;
              return (
                <tr key={s.id}
                  onMouseEnter={() => setHoverId(s.id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                    background: selected.has(s.id) ? "rgba(37,99,235,0.06)" : isHover ? "var(--bg-elevated)" : "transparent",
                    transition: "background 0.1s",
                  }}>
                  <td style={{ padding: "12px 16px", width: 44 }}>
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)}
                      style={{ cursor: "pointer", accentColor: "var(--accent)" }} />
                  </td>
                  <td style={{ padding: "12px 16px", cursor: "pointer" }} onClick={() => router.push(`/suppliers/${s.id}`)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: av.bg, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, color: av.color,
                      }}>{av.char}</div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>{s.name}</div>
                        {s.company && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.company}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.category || "—"}</div>
                    {s.country && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.country}</div>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {s.channels.length === 0 ? (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>未配置</span>
                      ) : s.channels.map((ch) => {
                        const style = CHANNEL_STYLE[ch.type] ?? { bg: "var(--bg-elevated)", color: "var(--text-muted)", label: ch.type };
                        return (
                          <span key={ch.id} style={{
                            display: "inline-flex", alignItems: "center",
                            padding: "2px 9px", borderRadius: 99,
                            fontSize: 11.5, fontWeight: 500,
                            background: style.bg, color: style.color,
                          }}>{style.label}</span>
                        );
                      })}
                    </div>
                  </td>
                  <td style={{ padding: "12px 20px 12px 16px" }}>
                    <div style={{ display: "flex", gap: 4, opacity: isHover ? 1 : 0, transition: "opacity 0.15s" }}>
                      <button onClick={() => { setEditing(s); setDrawerOpen(true); }} style={{
                        width: 30, height: 30, borderRadius: 7, border: "1px solid var(--border)",
                        background: "var(--bg-elevated)", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--text-secondary)",
                      }}><Pencil size={13} /></button>
                      <button onClick={async () => {
                        if (!confirm("确认删除？")) return;
                        await fetch(`/api/suppliers/${s.id}`, { method: "DELETE" });
                        load();
                      }} style={{
                        width: 30, height: 30, borderRadius: 7,
                        border: "1px solid rgba(248,81,73,0.25)",
                        background: "rgba(248,81,73,0.08)", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#f85149",
                      }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div style={{ padding: "10px 20px", borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {selected.size > 0 ? `已选 ${selected.size} / ${filtered.length}` : `共 ${filtered.length} 条`}
            </span>
          </div>
        )}
      </div>

      <SupplierDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={load}
        initial={editing ? { ...editing } : undefined}
      />

      {importOpen && (
        <CsvImportModal
          onClose={() => setImportOpen(false)}
          onImported={(count) => { load(); if (count > 0) setImportOpen(false); }}
        />
      )}
    </div>
  );
}
