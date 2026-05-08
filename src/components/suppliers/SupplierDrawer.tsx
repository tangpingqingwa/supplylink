"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

const CHANNEL_OPTIONS = [
  { value: "EMAIL", label: "邮件" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "ALI1688", label: "1688" },
  { value: "FORM", label: "表单" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "选择品类" },
  { value: "电子", label: "电子" },
  { value: "服装", label: "服装" },
  { value: "家居", label: "家居" },
  { value: "玩具", label: "玩具" },
  { value: "其他", label: "其他" },
];

interface Channel {
  type: string;
  value: string;
  label?: string;
  primary?: boolean;
}

interface SupplierForm {
  name: string;
  company?: string;
  country?: string;
  category?: string;
  notes?: string;
  channels: Channel[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: SupplierForm & { id?: string };
}

const EMPTY: SupplierForm = { name: "", company: "", country: "", category: "", notes: "", channels: [] };


export function SupplierDrawer({ open, onClose, onSaved, initial }: Props) {
  const [form, setForm] = useState<SupplierForm>(initial ?? EMPTY);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof SupplierForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const addChannel = () =>
    setForm((f) => ({ ...f, channels: [...f.channels, { type: "EMAIL", value: "", primary: f.channels.length === 0 }] }));

  const removeChannel = (i: number) =>
    setForm((f) => ({ ...f, channels: f.channels.filter((_, idx) => idx !== i) }));

  const setChannel = (i: number, key: keyof Channel, value: string | boolean) =>
    setForm((f) => {
      const channels = [...f.channels];
      channels[i] = { ...channels[i], [key]: value };
      return { ...f, channels };
    });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "请填写供应商名称";
    form.channels.forEach((c, i) => {
      if (!c.value.trim()) e[`ch_${i}`] = "请填写联系方式";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const url = initial?.id ? `/api/suppliers/${initial.id}` : "/api/suppliers";
      const method = initial?.id ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("保存失败");
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
    <Drawer open={open} onClose={onClose} title={initial?.id ? "编辑供应商" : "添加供应商"}>
      <div className="space-y-4">
        <Input id="name" label="供应商名称 *" placeholder="如：深圳科技有限公司" value={form.name} onChange={set("name")} error={errors.name} />
        <Input id="company" label="公司全称" placeholder="可选" value={form.company} onChange={set("company")} />
        <div className="grid grid-cols-2 gap-3">
          <Input id="country" label="国家/地区" placeholder="中国" value={form.country} onChange={set("country")} />
          <Select id="category" label="品类" options={CATEGORY_OPTIONS} value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
        </div>
        <Input id="notes" label="备注" placeholder="可选" value={form.notes} onChange={set("notes")} />

        {/* Channels */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>联系渠道</span>
            <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={addChannel}>添加渠道</Button>
          </div>
          <div className="space-y-2">
            {form.channels.map((ch, i) => (
              <div key={i} className="flex gap-2 items-start">
                <select value={ch.type} onChange={(e) => setChannel(i, "type", e.target.value)}
                  className="h-9 px-2 rounded-lg text-xs shrink-0 cursor-pointer outline-none"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", width: 90 }}>
                  {CHANNEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="flex-1">
                  <input
                    value={ch.value}
                    onChange={(e) => setChannel(i, "value", e.target.value)}
                    placeholder={ch.type === "EMAIL" ? "example@factory.com" : ch.type === "WHATSAPP" ? "+86 138..." : "https://..."}
                    className="h-9 px-3 rounded-lg text-sm w-full outline-none"
                    style={{ background: "var(--bg-elevated)", border: `1px solid ${errors[`ch_${i}`] ? "#ef4444" : "var(--border)"}`, color: "var(--text-primary)" }}
                  />
                  {errors[`ch_${i}`] && <p className="text-xs mt-0.5" style={{ color: "#ef4444" }}>{errors[`ch_${i}`]}</p>}
                </div>
                <button onClick={() => removeChannel(i)} className="h-9 w-9 flex items-center justify-center rounded-lg hover:opacity-70 cursor-pointer shrink-0"
                  style={{ color: "#ef4444" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {form.channels.length === 0 && (
              <p className="text-xs py-2" style={{ color: "var(--text-muted)" }}>暂无联系渠道，点击上方添加</p>
            )}
          </div>
        </div>

        {errors.submit && <p className="text-xs" style={{ color: "#ef4444" }}>{errors.submit}</p>}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">取消</Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">保存</Button>
        </div>
      </div>
    </Drawer>
  );
}
