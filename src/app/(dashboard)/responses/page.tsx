"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, MessageSquare, Pencil, Trophy, Download } from "lucide-react";
import Link from "next/link";
import { Drawer } from "@/components/ui/Drawer";
import { Input, Textarea } from "@/components/ui/Input";
import { RecordResponseModal } from "@/components/responses/RecordResponseModal";

const AVATAR_COLORS = [
  ["#1e3a5f","#3b82f6"],["#1e3a2f","#4ade80"],["#3a1e3a","#c084fc"],
  ["#3a2a1e","#fb923c"],["#1e3a3a","#22d3ee"],["#3a1e2a","#f472b6"],
];
function avatar(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return { bg: AVATAR_COLORS[i][0], color: AVATAR_COLORS[i][1], char: name.charAt(0).toUpperCase() };
}

const CH_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  EMAIL:    { bg: "rgba(59,130,246,0.12)",  color: "#60a5fa", label: "邮件"      },
  WHATSAPP: { bg: "rgba(63,185,80,0.12)",   color: "#4ade80", label: "WhatsApp" },
  ALI1688:  { bg: "rgba(210,153,34,0.12)",  color: "#fbbf24", label: "1688"     },
  FORM:     { bg: "rgba(163,113,247,0.12)", color: "#c4b5fd", label: "表单"     },
  SMS:      { bg: "rgba(14,165,233,0.12)",  color: "#38bdf8", label: "短信"     },
  WECHAT:   { bg: "rgba(7,193,96,0.12)",    color: "#34d058", label: "微信"     },
};

interface Response {
  id: string; rawContent: string; unitPrice?: number; currency?: string;
  moq?: number; leadTimeDays?: number; notes?: string; receivedAt: string;
  inquiryItem: {
    id: string; channel: string;
    supplier: { id: string; name: string; company?: string };
    inquiry: { name: string };
  };
}

function RecordDrawer({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [items, setItems] = useState<{ id: string; channel: string; supplier: { name: string } }[]>([]);
  const [form, setForm] = useState({ inquiryItemId: "", rawContent: "", unitPrice: "", currency: "CNY", moq: "", leadTimeDays: "", notes: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/inquiries/items").then(r => r.json()).then(setItems).catch(() => {});
  }, [open]);

  const save = async () => {
    if (!form.inquiryItemId || !form.rawContent) return;
    setLoading(true);
    try {
      await fetch("/api/responses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
          moq: form.moq ? Number(form.moq) : undefined,
          leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
        }),
      });
      onSaved(); onClose();
      setForm({ inquiryItemId: "", rawContent: "", unitPrice: "", currency: "CNY", moq: "", leadTimeDays: "", notes: "" });
    } finally { setLoading(false); }
  };

  return (
    <Drawer open={open} onClose={onClose} title="录入回复报价">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>对应询盘记录</label>
          <select value={form.inquiryItemId} onChange={e => setForm(f => ({ ...f, inquiryItemId: e.target.value }))}
            style={{ width: "100%", height: 36, padding: "0 12px", borderRadius: 8, outline: "none", fontSize: 13.5, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "inherit" }}>
            <option value="">选择询盘记录...</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>{item.supplier.name} — {CH_STYLE[item.channel]?.label ?? item.channel}</option>
            ))}
          </select>
        </div>
        <Textarea label="回复原文" placeholder="粘贴供应商的原始回复内容" value={form.rawContent}
          onChange={e => setForm(f => ({ ...f, rawContent: e.target.value }))} rows={4} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="单价" placeholder="12.50" value={form.unitPrice}
            onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} />
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>币种</label>
            <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              style={{ width: "100%", height: 36, padding: "0 12px", borderRadius: 8, outline: "none", fontSize: 13.5, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "inherit" }}>
              {["CNY","USD","EUR"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="最小起订量 MOQ" placeholder="500" value={form.moq}
            onChange={e => setForm(f => ({ ...f, moq: e.target.value }))} />
          <Input label="交期（天）" placeholder="30" value={form.leadTimeDays}
            onChange={e => setForm(f => ({ ...f, leadTimeDays: e.target.value }))} />
        </div>
        <Input label="备注" placeholder="可选" value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, height: 36, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}>取消</button>
          <button onClick={save} disabled={loading} style={{ flex: 1, height: 36, borderRadius: 8, border: "none", background: "var(--accent)", color: "white", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
            {loading ? "保存中..." : "保存报价"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}

function exportCsv(responses: Response[]) {
  const headers = ["询盘", "供应商", "公司", "渠道", "单价", "币种", "MOQ", "交期(天)", "备注", "收到时间"];
  const rows = responses.map(r => [
    r.inquiryItem.inquiry.name,
    r.inquiryItem.supplier.name,
    r.inquiryItem.supplier.company ?? "",
    CH_STYLE[r.inquiryItem.channel]?.label ?? r.inquiryItem.channel,
    r.unitPrice ?? "",
    r.currency ?? "",
    r.moq ?? "",
    r.leadTimeDays ?? "",
    r.notes ?? "",
    new Date(r.receivedAt).toLocaleString("zh-CN"),
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `报价对比_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResponsesPage() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<Response | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setResponses(await (await fetch("/api/responses")).json()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // group by inquiry name
  const grouped = responses.reduce<Record<string, Response[]>>((acc, r) => {
    const key = r.inquiryItem.inquiry.name;
    (acc[key] ??= []).push(r);
    return acc;
  }, {});

  // find best price per group
  const bestPrice = (items: Response[]) => {
    const prices = items.map(r => r.unitPrice).filter(Boolean) as number[];
    return prices.length ? Math.min(...prices) : null;
  };

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>回复 & 报价</h1>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 4 }}>汇总供应商回复，横向对比报价</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {responses.length > 0 && (
            <button onClick={() => exportCsv(responses)} style={{
              display: "flex", alignItems: "center", gap: 7, height: 36, padding: "0 16px",
              borderRadius: 8, background: "var(--bg-surface)", border: "1px solid var(--border)",
              color: "var(--text-secondary)", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            }}>
              <Download size={14} />导出 CSV
            </button>
          )}
          <button onClick={() => setDrawerOpen(true)} style={{
            display: "flex", alignItems: "center", gap: 7, height: 36, padding: "0 16px",
            borderRadius: 8, background: "var(--accent)", border: "none",
            color: "white", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>
            <Plus size={15} strokeWidth={2.5} />录入回复
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>加载中...</p>
        </div>
      ) : responses.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <MessageSquare size={22} color="var(--text-muted)" />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>暂无回复记录</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6, marginBottom: 20 }}>询盘发出后，在此录入供应商回复和报价进行对比</p>
          <button onClick={() => setDrawerOpen(true)} style={{
            display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 18px",
            borderRadius: 8, background: "var(--accent)", border: "none",
            color: "white", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>
            <Plus size={14} />录入回复
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {Object.entries(grouped).map(([inquiryName, items]) => {
            const best = bestPrice(items);
            return (
              <div key={inquiryName}>
                {/* Group header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {inquiryName}
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>— {items.length} 家回复</span>
                  <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
                </div>

                {/* Table */}
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        {["供应商","渠道","单价","MOQ","交期","备注",""].map((h, i) => (
                          <th key={i} style={{ padding: "9px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 500, color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items
                        .sort((a, b) => (a.unitPrice ?? 999999) - (b.unitPrice ?? 999999))
                        .map((r, idx) => {
                          const isBest = best !== null && r.unitPrice === best;
                          const av = avatar(r.inquiryItem.supplier.name);
                          const ch = CH_STYLE[r.inquiryItem.channel];
                          const isHover = hoverId === r.id;
                          return (
                            <tr key={r.id}
                              onMouseEnter={() => setHoverId(r.id)}
                              onMouseLeave={() => setHoverId(null)}
                              style={{
                                borderBottom: idx < items.length - 1 ? "1px solid var(--border-subtle)" : "none",
                                background: isHover ? "var(--bg-elevated)" : "transparent",
                                borderLeft: isBest ? "3px solid #3fb950" : "3px solid transparent",
                                transition: "background 0.1s",
                              }}>
                              <td style={{ padding: "12px 16px" }}>
                                <Link href={`/suppliers/${r.inquiryItem.supplier.id}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                                  <div style={{ width: 30, height: 30, borderRadius: 8, background: av.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: av.color, flexShrink: 0 }}>{av.char}</div>
                                  <div>
                                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>{r.inquiryItem.supplier.name}</div>
                                    {r.inquiryItem.supplier.company && <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{r.inquiryItem.supplier.company}</div>}
                                  </div>
                                </Link>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                {ch && <span style={{ display: "inline-flex", padding: "2px 9px", borderRadius: 99, fontSize: 11.5, fontWeight: 500, background: ch.bg, color: ch.color }}>{ch.label}</span>}
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: isBest ? "#3fb950" : "var(--accent-light)" }}>
                                    {r.unitPrice ? `${r.unitPrice} ${r.currency ?? "CNY"}` : "—"}
                                  </span>
                                  {isBest && (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 6px", borderRadius: 99, fontSize: 10.5, fontWeight: 600, background: "rgba(63,185,80,0.15)", color: "#3fb950" }}>
                                      <Trophy size={9} />最低价
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)" }}>
                                {r.moq ? r.moq.toLocaleString() + " pcs" : "—"}
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)" }}>
                                {r.leadTimeDays ? `${r.leadTimeDays} 天` : "—"}
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--text-muted)", maxWidth: 180 }}>
                                <span style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.notes || "—"}</span>
                              </td>
                              <td style={{ padding: "12px 16px", width: 36 }}>
                                <button
                                  onClick={() => setEditingResponse(r)}
                                  style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", opacity: isHover ? 1 : 0, transition: "opacity 0.15s" }}>
                                  <Pencil size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RecordDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSaved={load} />

      {editingResponse && (
        <RecordResponseModal
          item={{ id: editingResponse.inquiryItem.id, supplier: editingResponse.inquiryItem.supplier }}
          existingResponse={{
            id: editingResponse.id,
            unitPrice: editingResponse.unitPrice,
            currency: editingResponse.currency,
            moq: editingResponse.moq,
            leadTimeDays: editingResponse.leadTimeDays,
            rawContent: editingResponse.rawContent,
            notes: editingResponse.notes,
          }}
          onClose={() => setEditingResponse(null)}
          onSaved={() => { setEditingResponse(null); load(); }}
        />
      )}
    </div>
  );
}
