"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, FileText, Pencil, Trash2, Copy } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TemplateDrawer } from "@/components/templates/TemplateDrawer";

interface Template {
  id: string; name: string; language: string; subject?: string;
  body: string; channels: string[]; createdAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setTemplates(await (await fetch("/api/templates")).json()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteTemplate = async (id: string) => {
    if (!confirm("确认删除此模板？")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    load();
  };

  const duplicate = async (t: Template) => {
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...t, name: `${t.name}（副本）` }),
    });
    load();
  };

  return (
    <div className="p-8">
      <PageHeader
        title="询盘模板"
        description="管理多渠道询盘消息模板，支持变量自动填充"
        action={<Button icon={<Plus size={14} />} onClick={() => { setEditing(null); setDrawerOpen(true); }}>新建模板</Button>}
      />

      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>加载中...</p>
      ) : templates.length === 0 ? (
        <EmptyState icon={FileText} title="暂无模板" description="创建询盘模板，支持 {{product}} 等变量自动替换"
          action={<Button icon={<Plus size={14} />} onClick={() => setDrawerOpen(true)}>新建模板</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl p-5 group"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{t.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                      {t.language === "zh" ? "中文" : t.language === "en" ? "英文" : t.language}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap mb-2">
                    {t.channels.map((ch) => <Badge key={ch} value={ch} />)}
                  </div>
                  {t.subject && (
                    <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>主题：{t.subject}</p>
                  )}
                  <p className="text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>{t.body}</p>
                </div>
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => duplicate(t)} title="复制" className="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:opacity-70"
                    style={{ color: "var(--text-secondary)" }}><Copy size={13} /></button>
                  <button onClick={() => { setEditing(t); setDrawerOpen(true); }} className="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:opacity-70"
                    style={{ color: "var(--text-secondary)" }}><Pencil size={13} /></button>
                  <button onClick={() => deleteTemplate(t.id)} className="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:opacity-70"
                    style={{ color: "#ef4444" }}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={load}
        initial={editing ? { ...editing, id: editing.id } : undefined}
      />
    </div>
  );
}
