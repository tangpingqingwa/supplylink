"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface Item {
  id: string;
  supplier: { name: string };
  response?: { id: string; unitPrice?: number; currency?: string; moq?: number; leadTimeDays?: number; rawContent: string; notes?: string } | null;
}

interface Props {
  item: Item;
  existingResponse?: Item["response"];
  onClose: () => void;
  onSaved: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 8,
  border: "1px solid var(--border)", background: "var(--bg-elevated)",
  color: "var(--text-primary)", fontSize: 13.5, fontFamily: "inherit",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500,
  color: "var(--text-secondary)", marginBottom: 5,
};

export function RecordResponseModal({ item, existingResponse, onClose, onSaved }: Props) {
  const ex = existingResponse;
  const [rawContent,   setRawContent]   = useState(ex?.rawContent ?? "");
  const [unitPrice,    setUnitPrice]    = useState(ex?.unitPrice != null ? String(ex.unitPrice) : "");
  const [currency,     setCurrency]     = useState(ex?.currency ?? "CNY");
  const [moq,          setMoq]          = useState(ex?.moq != null ? String(ex.moq) : "");
  const [leadTimeDays, setLeadTimeDays] = useState(ex?.leadTimeDays != null ? String(ex.leadTimeDays) : "");
  const [notes,        setNotes]        = useState(ex?.notes ?? "");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");

  const save = async () => {
    if (!rawContent.trim()) { setError("回复内容不能为空"); return; }
    setSaving(true); setError("");
    const body = {
      rawContent: rawContent.trim(),
      unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
      currency: currency || undefined,
      moq: moq ? parseInt(moq) : undefined,
      leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : undefined,
      notes: notes.trim() || undefined,
    };
    try {
      const res = ex?.id
        ? await fetch(`/api/responses/${ex.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/responses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, inquiryItemId: item.id }) });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "保存失败"); return; }
      onSaved();
    } catch { setError("网络错误，请重试"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "var(--bg-surface)", borderRadius: 14,
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        width: 520, maxWidth: "calc(100vw - 32px)",
        padding: "24px 28px",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>录入回复报价</h2>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 3 }}>{item.supplier.name}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Raw content */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>供应商回复原文 *</label>
          <textarea value={rawContent} onChange={e => setRawContent(e.target.value)} rows={3}
            placeholder="粘贴供应商的回复内容..."
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
        </div>

        {/* Price row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>报价单价</label>
            <input type="number" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)}
              placeholder="如: 8.50" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>币种</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="CNY">CNY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="HKD">HKD</option>
            </select>
          </div>
        </div>

        {/* MOQ + Lead time */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>最小起订量（MOQ）</label>
            <input type="number" value={moq} onChange={e => setMoq(e.target.value)}
              placeholder="如: 3000" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>交期（天）</label>
            <input type="number" value={leadTimeDays} onChange={e => setLeadTimeDays(e.target.value)}
              placeholder="如: 25" style={inputStyle} />
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>备注</label>
          <input value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="资质认证、付款条件等..."
            style={inputStyle} />
        </div>

        {error && <p style={{ fontSize: 12.5, color: "var(--red)", marginBottom: 12 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            height: 36, padding: "0 16px", borderRadius: 8,
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--text-secondary)", fontSize: 13.5, cursor: "pointer", fontFamily: "inherit",
          }}>取消</button>
          <button onClick={save} disabled={saving} style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            height: 36, padding: "0 20px", borderRadius: 8,
            background: "var(--accent)", border: "none",
            color: "white", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            opacity: saving ? 0.7 : 1,
          }}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            保存报价
          </button>
        </div>
      </div>
    </div>
  );
}
