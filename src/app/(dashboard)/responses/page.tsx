"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Plus, DollarSign, Clock, Package } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { Input, Textarea } from "@/components/ui/Input";

interface Response {
  id: string;
  rawContent: string;
  unitPrice?: number;
  currency?: string;
  moq?: number;
  leadTimeDays?: number;
  notes?: string;
  receivedAt: string;
  inquiryItem: {
    id: string;
    channel: string;
    supplier: { id: string; name: string; company?: string };
    inquiry: { name: string };
  };
}

interface InquiryItem {
  id: string;
  channel: string;
  status: string;
  supplier: { id: string; name: string; company?: string };
}

function RecordDrawer({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [form, setForm] = useState({ inquiryItemId: "", rawContent: "", unitPrice: "", currency: "CNY", moq: "", leadTimeDays: "", notes: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/inquiries/items").then((r) => r.json()).then(setItems).catch(() => {});
  }, [open]);

  const handleSave = async () => {
    if (!form.inquiryItemId || !form.rawContent) return;
    setLoading(true);
    try {
      await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
          moq: form.moq ? Number(form.moq) : undefined,
          leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
        }),
      });
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="录入回复报价">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>对应询盘</label>
          <select value={form.inquiryItemId} onChange={(e) => setForm((f) => ({ ...f, inquiryItemId: e.target.value }))}
            className="h-9 px-3 rounded-lg text-sm w-full outline-none"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
            <option value="">选择询盘记录</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.supplier.name} — {item.channel}
              </option>
            ))}
          </select>
        </div>
        <Textarea label="回复原文" placeholder="粘贴供应商的回复内容" value={form.rawContent}
          onChange={(e) => setForm((f) => ({ ...f, rawContent: e.target.value }))} rows={5} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="单价" placeholder="0.00" value={form.unitPrice}
            onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))} />
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>币种</label>
            <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              className="h-9 px-3 rounded-lg text-sm w-full outline-none"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
              {["CNY", "USD", "EUR"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="最小起订量 (MOQ)" placeholder="1000" value={form.moq}
            onChange={(e) => setForm((f) => ({ ...f, moq: e.target.value }))} />
          <Input label="交期（天）" placeholder="30" value={form.leadTimeDays}
            onChange={(e) => setForm((f) => ({ ...f, leadTimeDays: e.target.value }))} />
        </div>
        <Input label="备注" placeholder="可选" value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">取消</Button>
          <Button loading={loading} onClick={handleSave} className="flex-1">保存报价</Button>
        </div>
      </div>
    </Drawer>
  );
}

export default function ResponsesPage() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setResponses(await (await fetch("/api/responses")).json()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = responses.reduce<Record<string, Response[]>>((acc, r) => {
    const key = r.inquiryItem.inquiry.name;
    (acc[key] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="p-8">
      <PageHeader
        title="回复 & 报价"
        description="汇总供应商回复，横向对比报价"
        action={<Button icon={<Plus size={14} />} onClick={() => setDrawerOpen(true)}>录入回复</Button>}
      />

      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>加载中...</p>
      ) : responses.length === 0 ? (
        <EmptyState icon={MessageSquare} title="暂无回复记录" description="供应商回复后在此录入，系统自动对比报价"
          action={<Button icon={<Plus size={14} />} onClick={() => setDrawerOpen(true)}>录入回复</Button>} />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([inquiryName, items]) => (
            <div key={inquiryName}>
              <h3 className="text-xs font-medium mb-3 px-1" style={{ color: "var(--text-secondary)" }}>{inquiryName}</h3>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                      {["供应商", "渠道", "单价", "MOQ", "交期", "备注"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "var(--text-secondary)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-3">
                          <div className="font-medium" style={{ color: "var(--text-primary)" }}>{r.inquiryItem.supplier.name}</div>
                          {r.inquiryItem.supplier.company && (
                            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{r.inquiryItem.supplier.company}</div>
                          )}
                        </td>
                        <td className="px-4 py-3"><Badge value={r.inquiryItem.channel} /></td>
                        <td className="px-4 py-3 font-medium" style={{ color: r.unitPrice ? "var(--accent)" : "var(--text-muted)" }}>
                          {r.unitPrice ? `${r.unitPrice} ${r.currency}` : "—"}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                          {r.moq ? `${r.moq.toLocaleString()}` : "—"}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                          {r.leadTimeDays ? `${r.leadTimeDays}天` : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{r.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <RecordDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSaved={load} />
    </div>
  );
}
