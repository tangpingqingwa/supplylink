"use client";

import { useState, useMemo } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

const CHANNELS = ["EMAIL", "WHATSAPP", "ALI1688", "FORM"] as const;
const VARS = ["{{product}}", "{{quantity}}", "{{spec}}", "{{company}}", "{{name}}"];

interface TemplateForm {
  name: string;
  language: string;
  subject?: string;
  body: string;
  channels: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: TemplateForm & { id?: string };
}

const EMPTY: TemplateForm = { name: "", language: "zh", subject: "", body: "", channels: ["EMAIL"] };

function renderPreview(body: string) {
  return body
    .replace(/\{\{product\}\}/g, "蓝牙耳机")
    .replace(/\{\{quantity\}\}/g, "1000pcs")
    .replace(/\{\{spec\}\}/g, "TWS 5.0")
    .replace(/\{\{company\}\}/g, "贵司")
    .replace(/\{\{name\}\}/g, "张经理");
}

export function TemplateDrawer({ open, onClose, onSaved, initial }: Props) {
  const [form, setForm] = useState<TemplateForm>(initial ?? EMPTY);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof TemplateForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleChannel = (ch: string) =>
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter((c) => c !== ch) : [...f.channels, ch],
    }));

  const insertVar = (v: string) =>
    setForm((f) => ({ ...f, body: f.body + v }));

  const preview = useMemo(() => renderPreview(form.body), [form.body]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "请填写模板名称";
    if (!form.body.trim()) e.body = "请填写模板内容";
    if (form.channels.length === 0) e.channels = "至少选择一个渠道";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const url = initial?.id ? `/api/templates/${initial.id}` : "/api/templates";
      const method = initial?.id ? "PATCH" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      onSaved();
      onClose();
      setForm(EMPTY);
    } catch {
      setErrors({ submit: "保存失败，请重试" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title={initial?.id ? "编辑模板" : "新建模板"} width="560px">
      <div className="space-y-4">
        <Input id="tname" label="模板名称 *" placeholder="如：标准开发信模板" value={form.name} onChange={set("name")} error={errors.name} />

        {/* 渠道选择 */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>适用渠道 *</p>
          <div className="flex gap-2 flex-wrap">
            {CHANNELS.map((ch) => (
              <button key={ch} onClick={() => toggleChannel(ch)}
                className="cursor-pointer transition-opacity hover:opacity-80"
                style={{ opacity: form.channels.includes(ch) ? 1 : 0.4 }}>
                <Badge value={ch} />
              </button>
            ))}
          </div>
          {errors.channels && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.channels}</p>}
        </div>

        {form.channels.includes("EMAIL") && (
          <Input id="subject" label="邮件主题" placeholder="询盘：{{product}} — {{company}}" value={form.subject} onChange={set("subject")} />
        )}

        {/* 编辑 / 预览切换 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>模板内容 *</p>
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {(["edit", "preview"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-3 py-1 text-xs cursor-pointer transition-colors"
                  style={{
                    background: tab === t ? "var(--accent)" : "var(--bg-elevated)",
                    color: tab === t ? "white" : "var(--text-secondary)",
                  }}>
                  {t === "edit" ? "编辑" : "预览"}
                </button>
              ))}
            </div>
          </div>

          {tab === "edit" ? (
            <>
              <Textarea id="body" placeholder="您好，我司正在采购 {{product}}，规格 {{spec}}，数量 {{quantity}}，请问贵司是否有供货能力？" value={form.body} onChange={set("body")} rows={8} error={errors.body} />
              <div className="flex gap-1 flex-wrap mt-2">
                {VARS.map((v) => (
                  <button key={v} onClick={() => insertVar(v)}
                    className="px-2 py-0.5 rounded text-xs cursor-pointer hover:opacity-70 transition-opacity"
                    style={{ background: "var(--bg-elevated)", color: "var(--accent)", border: "1px solid var(--border)" }}>
                    {v}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg p-4 text-sm whitespace-pre-wrap min-h-[160px]"
              style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
              {preview || <span style={{ color: "var(--text-muted)" }}>（预览内容为示例数据填充）</span>}
            </div>
          )}
        </div>

        {errors.submit && <p className="text-xs" style={{ color: "#ef4444" }}>{errors.submit}</p>}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">取消</Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">保存模板</Button>
        </div>
      </div>
    </Drawer>
  );
}
