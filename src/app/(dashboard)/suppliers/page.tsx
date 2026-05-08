"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, Pencil, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SupplierDrawer } from "@/components/suppliers/SupplierDrawer";

interface Channel { id: string; type: string; value: string; primary: boolean }
interface Supplier {
  id: string; name: string; company?: string; country?: string;
  category?: string; tags: string[]; notes?: string; channels: Channel[];
  createdAt: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/suppliers");
      setSuppliers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = suppliers.filter((s) =>
    [s.name, s.company, s.category, s.country].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.id)));

  const deleteSelected = async () => {
    if (!confirm(`确认删除选中的 ${selected.size} 个供应商？`)) return;
    await Promise.all([...selected].map((id) => fetch(`/api/suppliers/${id}`, { method: "DELETE" })));
    setSelected(new Set());
    load();
  };

  const openEdit = (s: Supplier) => { setEditing(s); setDrawerOpen(true); };
  const openAdd = () => { setEditing(null); setDrawerOpen(true); };

  return (
    <div className="p-8">
      <PageHeader
        title="供应商库"
        description={`共 ${suppliers.length} 家供应商`}
        action={
          <Button icon={<Plus size={14} />} onClick={openAdd}>添加供应商</Button>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索供应商名称、品类..."
            className="h-9 pl-9 pr-3 rounded-lg text-sm w-full outline-none"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>
        {selected.size > 0 && (
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={deleteSelected}>
            删除 {selected.size} 项
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll} className="cursor-pointer" />
              </th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--text-secondary)" }}>供应商</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--text-secondary)" }}>品类</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--text-secondary)" }}>渠道</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--text-secondary)" }}>国家</th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12" style={{ color: "var(--text-muted)" }}>加载中...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}>
                <EmptyState icon={Users} title="暂无供应商" description="点击右上角添加第一个供应商" />
              </td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className="group transition-colors"
                style={{ borderBottom: "1px solid var(--border)", background: selected.has(s.id) ? "var(--bg-elevated)" : undefined }}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} className="cursor-pointer" />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>{s.name}</div>
                  {s.company && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.company}</div>}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{s.category || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.channels.map((ch) => <Badge key={ch.id} value={ch.type} />)}
                    {s.channels.length === 0 && <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{s.country || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(s)} className="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:opacity-70"
                      style={{ color: "var(--text-secondary)" }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={async () => { if (confirm("确认删除？")) { await fetch(`/api/suppliers/${s.id}`, { method: "DELETE" }); load(); } }}
                      className="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:opacity-70"
                      style={{ color: "#ef4444" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SupplierDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={load}
        initial={editing ? { ...editing, id: editing.id } : undefined}
      />
    </div>
  );
}
