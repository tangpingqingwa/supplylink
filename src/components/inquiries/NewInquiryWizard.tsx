"use client";

import { useState, useEffect, useMemo } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { extractVariables, renderTemplate } from "@/lib/template";

const CHANNELS = ["EMAIL", "WHATSAPP", "ALI1688", "FORM", "SMS", "WECHAT"] as const;

interface Template { id: string; name: string; body: string; subject?: string; channels: string[] }
interface Supplier { id: string; name: string; company?: string; channels: { type: string }[] }

interface Props { open: boolean; onClose: () => void; onSaved: () => void }

const STEPS = ["选模板", "填变量", "选供应商", "确认发送"];

export function NewInquiryWizard({ open, onClose, onSaved }: Props) {
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set(["EMAIL"]));
  const [name, setName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [filterByChannel, setFilterByChannel] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/templates").then((r) => r.json()).then(setTemplates);
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers);
  }, [open]);

  const varNames = useMemo(
    () => (selectedTemplate ? extractVariables(selectedTemplate.body) : []),
    [selectedTemplate]
  );

  const preview = useMemo(
    () => (selectedTemplate ? renderTemplate(selectedTemplate.body, variables) : ""),
    [selectedTemplate, variables]
  );

  const toggleSupplier = (id: string) =>
    setSelectedSuppliers((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleChannel = (ch: string) =>
    setSelectedChannels((p) => { const n = new Set(p); n.has(ch) ? n.delete(ch) : n.add(ch); return n; });

  const filteredSuppliers = filterByChannel && selectedChannels.size > 0
    ? suppliers.filter(s => s.channels.some(ch => selectedChannels.has(ch.type)))
    : suppliers;

  const canNext = [
    !!selectedTemplate,
    true,
    selectedSuppliers.size > 0 && selectedChannels.size > 0,
    !!name.trim(),
  ][step];

  const handleCreate = async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    try {
      await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          templateId: selectedTemplate.id,
          variables,
          supplierIds: [...selectedSuppliers],
          channels: [...selectedChannels],
          ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
        }),
      });
      onSaved();
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(0); setSelectedTemplate(null); setVariables({});
    setSelectedSuppliers(new Set()); setSelectedChannels(new Set(["EMAIL"]));
    setFilterByChannel(true); setName(""); setScheduledAt(""); onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)" }} onClick={handleClose} />
      <div className="relative z-10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>新建询盘任务</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>步骤 {step + 1} / {STEPS.length}：{STEPS[step]}</p>
          </div>
          <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:opacity-70"
            style={{ color: "var(--text-secondary)" }}><X size={16} /></button>
        </div>

        {/* Progress */}
        <div className="flex px-6 pt-4 gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-colors"
              style={{ background: i <= step ? "var(--accent)" : "var(--border)" }} />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step 0: 选模板 */}
          {step === 0 && (
            <div className="space-y-2">
              {templates.length === 0 && <p className="text-sm" style={{ color: "var(--text-muted)" }}>暂无模板，请先创建</p>}
              {templates.map((t) => (
                <div key={t.id} onClick={() => setSelectedTemplate(t)}
                  className="rounded-xl p-4 cursor-pointer transition-colors"
                  style={{
                    background: selectedTemplate?.id === t.id ? "var(--accent)15" : "var(--bg-elevated)",
                    border: `1px solid ${selectedTemplate?.id === t.id ? "var(--accent)" : "var(--border)"}`,
                  }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t.name}</span>
                    <div className="flex gap-1">{t.channels.map((ch) => <Badge key={ch} value={ch} />)}</div>
                  </div>
                  <p className="text-xs mt-1 line-clamp-1" style={{ color: "var(--text-muted)" }}>{t.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Step 1: 填变量 */}
          {step === 1 && selectedTemplate && (
            <div className="space-y-4">
              {varNames.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>此模板无需填写变量</p>
              ) : (
                varNames.map((v) => (
                  <Input key={v} label={`{{${v}}}`} placeholder={`请填写 ${v}`}
                    value={variables[v] ?? ""} onChange={(e) => setVariables((p) => ({ ...p, [v]: e.target.value }))} />
                ))
              )}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>预览</p>
                <div className="rounded-lg p-4 text-sm whitespace-pre-wrap"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)", minHeight: 80 }}>
                  {preview}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 选供应商 */}
          {step === 2 && (
            <div>
              <div className="flex gap-2 flex-wrap mb-3">
                {CHANNELS.map((ch) => (
                  <button key={ch} onClick={() => toggleChannel(ch)}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    style={{ opacity: selectedChannels.has(ch) ? 1 : 0.4 }}>
                    <Badge value={ch} />
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => setFilterByChannel(f => !f)}
                  className="text-xs cursor-pointer hover:opacity-70 flex items-center gap-1.5"
                  style={{ color: filterByChannel ? "var(--accent)" : "var(--text-muted)" }}>
                  <span style={{ width: 28, height: 15, borderRadius: 99, background: filterByChannel ? "var(--accent)" : "var(--border)", display: "inline-flex", alignItems: "center", padding: "0 2px", transition: "background 0.2s" }}>
                    <span style={{ width: 11, height: 11, borderRadius: 99, background: "white", transform: filterByChannel ? "translateX(13px)" : "translateX(0)", transition: "transform 0.2s", display: "block" }} />
                  </span>
                  仅显示含选中渠道的供应商（{filteredSuppliers.length} 家）
                </button>
                <button onClick={() => setSelectedSuppliers(
                  selectedSuppliers.size === filteredSuppliers.length ? new Set() : new Set(filteredSuppliers.map((s) => s.id))
                )} className="text-xs cursor-pointer hover:opacity-70" style={{ color: "var(--accent)" }}>
                  {selectedSuppliers.size === filteredSuppliers.length && filteredSuppliers.length > 0 ? "取消全选" : "全选"}
                </button>
              </div>
              <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>已选 {selectedSuppliers.size} / {filteredSuppliers.length}</p>
              <div className="space-y-1">
                {filteredSuppliers.map((s) => (
                  <div key={s.id} onClick={() => toggleSupplier(s.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors"
                    style={{
                      background: selectedSuppliers.has(s.id) ? "var(--accent)15" : "var(--bg-elevated)",
                      border: `1px solid ${selectedSuppliers.has(s.id) ? "var(--accent)" : "var(--border)"}`,
                    }}>
                    <input type="checkbox" checked={selectedSuppliers.has(s.id)} readOnly className="cursor-pointer" />
                    <div className="flex-1">
                      <span className="text-sm" style={{ color: "var(--text-primary)" }}>{s.name}</span>
                      {s.company && <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>{s.company}</span>}
                    </div>
                    <div className="flex gap-1">{s.channels.map((ch, i) => <Badge key={i} value={ch.type} />)}</div>
                  </div>
                ))}
                {filteredSuppliers.length === 0 && (
                  <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
                    没有含选中渠道的供应商
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: 确认 */}
          {step === 3 && (
            <div className="space-y-4">
              <Input label="任务名称 *" placeholder="如：2024Q3 蓝牙耳机询盘" value={name}
                onChange={(e) => setName(e.target.value)} />
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>定时发送（可选）</p>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  style={{
                    width: "100%", height: 36, padding: "0 12px", borderRadius: 8,
                    border: "1px solid var(--border)", background: "var(--bg-elevated)",
                    color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
                {scheduledAt && (
                  <p className="text-xs mt-1" style={{ color: "var(--accent)" }}>
                    将在 {new Date(scheduledAt).toLocaleString("zh-CN")} 自动发送
                  </p>
                )}
              </div>
              <div className="rounded-xl p-4 space-y-2 text-sm"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>模板</span>
                  <span style={{ color: "var(--text-primary)" }}>{selectedTemplate?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>供应商数量</span>
                  <span style={{ color: "var(--text-primary)" }}>{selectedSuppliers.size} 家</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>发送渠道</span>
                  <div className="flex gap-1">{[...selectedChannels].map((ch) => <Badge key={ch} value={ch} />)}</div>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>预计发送条数</span>
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                    {selectedSuppliers.size * selectedChannels.size} 条
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          {step > 0 && (
            <Button variant="secondary" icon={<ChevronLeft size={14} />} onClick={() => setStep((s) => s - 1)}>上一步</Button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <Button icon={<ChevronRight size={14} />} disabled={!canNext} onClick={() => setStep((s) => s + 1)}>下一步</Button>
          ) : (
            <Button loading={loading} disabled={!canNext} onClick={handleCreate}>
              {scheduledAt ? "创建并定时发送" : "创建并保存"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
