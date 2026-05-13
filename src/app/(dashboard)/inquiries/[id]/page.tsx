"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2, CheckCircle2, XCircle, Clock, Mail, MessageSquare, Plus, Download, Copy, ExternalLink, RefreshCw, Trophy } from "lucide-react";
import Link from "next/link";
import { RecordResponseModal } from "@/components/responses/RecordResponseModal";

interface Response { id: string; unitPrice?: number; currency?: string; moq?: number; leadTimeDays?: number; rawContent: string; notes?: string; receivedAt: string; }
interface SupplierChannel { type: string; value: string; }
interface Item {
  id: string; channel: string; status: string; sentAt?: string; errorMsg?: string;
  supplier: { id: string; name: string; company?: string; channels: SupplierChannel[] };
  response: Response | null;
}
interface Inquiry {
  id: string; name: string; status: string; createdAt: string; sentAt?: string;
  winnerId?: string; closedAt?: string;
  winner?: { id: string; name: string } | null;
  variables: Record<string, string>;
  template: { id: string; name: string; body: string };
  items: Item[];
}

const ITEM_STATUS: Record<string, { label: string; bg: string; color: string; icon: typeof CheckCircle2 }> = {
  PENDING: { label: "待发送",  bg: "rgba(148,163,184,0.15)", color: "#64748B", icon: Clock },
  SENT:    { label: "已发送",  bg: "rgba(37,99,235,0.10)",   color: "#2563EB", icon: Send },
  FAILED:  { label: "发送失败", bg: "rgba(220,38,38,0.10)",  color: "#DC2626", icon: XCircle },
  REPLIED: { label: "已回复",  bg: "rgba(22,163,74,0.10)",   color: "#16A34A", icon: CheckCircle2 },
  IGNORED: { label: "手动发送", bg: "rgba(217,119,6,0.10)",  color: "#D97706", icon: Clock },
};

const INQ_STATUS: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  DRAFT:   { label: "草稿",   bg: "rgba(148,163,184,0.2)", color: "#64748B", dot: "#94A3B8" },
  SENDING: { label: "发送中", bg: "rgba(37,99,235,0.12)",  color: "#2563EB", dot: "#3B82F6" },
  SENT:    { label: "已发送", bg: "rgba(22,163,74,0.12)",  color: "#16A34A", dot: "#16A34A" },
  PARTIAL: { label: "部分失败", bg: "rgba(217,119,6,0.12)", color: "#D97706", dot: "#D97706" },
  COMPLETED: { label: "已完成", bg: "rgba(22,163,74,0.12)", color: "#16A34A", dot: "#16A34A" },
};

function avatarColor(name: string) {
  const colors = ["#3B82F6","#8B5CF6","#EC4899","#F97316","#14B8A6","#F59E0B","#06B6D4","#6366F1"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

const CHANNEL_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  EMAIL:    { label: "邮件",    color: "#2563EB", icon: <Mail size={13} color="#2563EB" /> },
  WHATSAPP: { label: "WhatsApp", color: "#25D366", icon: <MessageSquare size={13} color="#25D366" /> },
  ALI1688:  { label: "1688",    color: "#FF6600", icon: <ExternalLink size={13} color="#FF6600" /> },
  FORM:     { label: "表单",    color: "#7C3AED", icon: <ExternalLink size={13} color="#7C3AED" /> },
  SMS:      { label: "短信",    color: "#0EA5E9", icon: <MessageSquare size={13} color="#0EA5E9" /> },
  WECHAT:   { label: "微信",    color: "#07C160", icon: <MessageSquare size={13} color="#07C160" /> },
};

function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [recordItem, setRecordItem] = useState<Item | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inquiries/${id}`);
      if (res.status === 404) { router.push("/inquiries"); return; }
      setInquiry(await res.json());
    } finally { setLoading(false); }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const sendInquiry = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/inquiries/${id}/send`, { method: "POST" });
      const data = await res.json();
      alert(`发送完成：成功 ${data.sent} 条，失败 ${data.failed} 条`);
      load();
    } catch { alert("发送失败"); }
    finally { setSending(false); }
  };

  const resendItem = async (itemId: string) => {
    setResendingId(itemId);
    try {
      const res = await fetch(`/api/inquiries/items/${itemId}/resend`, { method: "POST" });
      const data = await res.json();
      const ok = data.sent ?? 0;
      alert(ok > 0 ? "重发成功" : `重发失败：${data.failed ?? 0} 条失败`);
      load();
    } catch { alert("重发请求失败"); }
    finally { setResendingId(null); }
  };

  const selectWinner = async (supplierId: string | null) => {
    await fetch(`/api/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerId: supplierId }),
    });
    load();
  };

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <Loader2 size={20} color="var(--text-muted)" className="animate-spin" />
    </div>
  );
  if (!inquiry) return null;

  const repliedCount  = inquiry.items.filter(i => i.status === "REPLIED").length;
  const sentCount     = inquiry.items.filter(i => i.status === "SENT").length;
  const failedCount   = inquiry.items.filter(i => i.status === "FAILED").length;
  const pendingCount  = inquiry.items.filter(i => i.status === "PENDING").length;
  const inqSt = INQ_STATUS[inquiry.status] ?? INQ_STATUS.DRAFT;

  const canSend = inquiry.status === "DRAFT" || inquiry.status === "PARTIAL";

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh" }}>

      {/* Back */}
      <Link href="/inquiries" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={14} /> 批量询盘
      </Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 8 }}>
            {inquiry.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500, background: inqSt.bg, color: inqSt.color }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: inqSt.dot, flexShrink: 0 }} />
              {inqSt.label}
            </span>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>模板：{inquiry.template.name}</span>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{inquiry.items.length} 个供应商</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href={`/api/inquiries/${id}/export`} download style={{
            display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 16px",
            borderRadius: 8, background: "transparent",
            border: "1.5px solid var(--accent)", color: "var(--accent)",
            fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", textDecoration: "none",
          }}>
            <Download size={14} />导出报价单
          </a>
          {canSend && (
            <button onClick={sendInquiry} disabled={sending} style={{
              display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 16px",
              borderRadius: 8, background: "var(--accent)", border: "none",
              color: "white", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              opacity: sending ? 0.7 : 1,
            }}>
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {inquiry.status === "PARTIAL" ? "重试失败项" : "发送询盘"}
            </button>
          )}
        </div>
      </div>

      {/* Stat chips */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "已发送", value: sentCount,   color: "#2563EB", bg: "rgba(37,99,235,0.08)" },
          { label: "发送失败", value: failedCount, color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
          { label: "待回复", value: sentCount + failedCount - repliedCount, color: "#D97706", bg: "rgba(217,119,6,0.08)" },
          { label: "已回复", value: repliedCount, color: "#16A34A", bg: "rgba(22,163,74,0.08)" },
          { label: "待发送", value: pendingCount, color: "#64748B", bg: "rgba(148,163,184,0.08)" },
        ].filter(c => c.value > 0 || c.label === "已回复").map(({ label, value, color, bg }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.3 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Winner banner */}
      {inquiry.winner && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", marginBottom: 16, borderRadius: 10, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}>
          <Trophy size={15} color="#16A34A" />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "#16A34A" }}>中标供应商：{inquiry.winner.name}</span>
          {inquiry.closedAt && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· 选定于 {new Date(inquiry.closedAt).toLocaleDateString("zh-CN")}</span>}
          <div style={{ flex: 1 }} />
          <button onClick={() => selectWinner(null)} style={{ fontSize: 12, color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer", padding: "2px 8px" }}>取消选定</button>
        </div>
      )}

      {/* Supplier table */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              {["供应商", "渠道", "状态", "报价单价", "MOQ", "交期", "备注", "操作"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", letterSpacing: "0.02em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inquiry.items.map((item) => {
              const st = ITEM_STATUS[item.status] ?? ITEM_STATUS.PENDING;
              const StatusIcon = st.icon;
              const hasReply = !!item.response;
              const color = avatarColor(item.supplier.name);
              return (
                <tr key={item.id} style={{
                  borderBottom: "1px solid var(--border-subtle)",
                  borderLeft: hasReply ? "3px solid #16A34A" : "3px solid transparent",
                  background: hasReply ? "rgba(22,163,74,0.03)" : "transparent",
                }}>
                  {/* Supplier */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 700, color: "white" }}>
                        {item.supplier.name.slice(0, 1)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                          {item.supplier.name}
                        </div>
                        {item.supplier.company && item.supplier.company !== item.supplier.name && (
                          <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{item.supplier.company}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Channel */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {CHANNEL_META[item.channel]?.icon ?? <Mail size={13} color="var(--text-muted)" />}
                      <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{CHANNEL_META[item.channel]?.label ?? item.channel}</span>
                    </div>
                  </td>
                  {/* Status */}
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 99, fontSize: 12, fontWeight: 500, background: st.bg, color: st.color }}>
                      <StatusIcon size={11} strokeWidth={2.5} />
                      {st.label}
                    </span>
                  </td>
                  {/* Price */}
                  <td style={{ padding: "12px 16px" }}>
                    {item.response?.unitPrice != null ? (
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "#16A34A" }}>
                        ¥{item.response.unitPrice} <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>{item.response.currency}</span>
                      </span>
                    ) : <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>}
                  </td>
                  {/* MOQ */}
                  <td style={{ padding: "12px 16px" }}>
                    {item.response?.moq != null ? (
                      <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{item.response.moq.toLocaleString()} pcs</span>
                    ) : <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>}
                  </td>
                  {/* Lead time */}
                  <td style={{ padding: "12px 16px" }}>
                    {item.response?.leadTimeDays != null ? (
                      <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{item.response.leadTimeDays} 天</span>
                    ) : <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>}
                  </td>
                  {/* Notes */}
                  <td style={{ padding: "12px 16px", maxWidth: 160 }}>
                    {item.response?.notes ? (
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{item.response.notes}</span>
                    ) : <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>}
                  </td>
                  {/* Actions */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {/* Manual-channel helpers for ALI1688 / WECHAT / FORM */}
                      {["ALI1688", "FORM"].includes(item.channel) && (() => {
                        const ch = item.supplier.channels.find(c => c.type === item.channel);
                        return (
                          <>
                            <button
                              onClick={() => {
                                const body = renderTemplate(inquiry.template.body, inquiry.variables);
                                navigator.clipboard.writeText(body).then(() => alert("询盘内容已复制，请前往平台粘贴发送"));
                              }}
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                            >
                              <Copy size={11} />复制询盘
                            </button>
                            {ch?.value && (
                              <button
                                onClick={() => window.open(ch.value, "_blank")}
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid #FF6600", background: "rgba(255,102,0,0.06)", color: "#FF6600", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                              >
                                <ExternalLink size={11} />打开{CHANNEL_META[item.channel]?.label}
                              </button>
                            )}
                          </>
                        );
                      })()}
                      {item.channel === "WECHAT" && (
                        <button
                          onClick={() => {
                            const body = renderTemplate(inquiry.template.body, inquiry.variables);
                            navigator.clipboard.writeText(body).then(() => alert("询盘内容已复制，请在微信中粘贴发送"));
                          }}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid #07C160", background: "rgba(7,193,96,0.06)", color: "#07C160", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          <Copy size={11} />复制询盘
                        </button>
                      )}
                      {/* Winner selection for REPLIED */}
                      {item.status === "REPLIED" && (
                        inquiry.winnerId === item.supplier.id ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 28, padding: "0 10px", borderRadius: 6, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#D97706", fontSize: 12, fontWeight: 600 }}>
                            <Trophy size={11} />中标
                          </span>
                        ) : (
                          <button
                            onClick={() => selectWinner(item.supplier.id)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid rgba(22,163,74,0.4)", background: "rgba(22,163,74,0.06)", color: "#16A34A", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                          >
                            <CheckCircle2 size={11} />选定
                          </button>
                        )
                      )}
                      {/* Resend for FAILED */}
                      {item.status === "FAILED" && (
                        <button
                          onClick={() => resendItem(item.id)}
                          disabled={resendingId === item.id}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid rgba(220,38,38,0.4)", background: "rgba(220,38,38,0.06)", color: "#DC2626", fontSize: 12, cursor: "pointer", fontFamily: "inherit", opacity: resendingId === item.id ? 0.6 : 1 }}
                        >
                          {resendingId === item.id ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                          重发
                        </button>
                      )}
                      {/* Record / edit reply */}
                      {hasReply ? (
                        <button onClick={() => setRecordItem(item)} style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>编辑回复</button>
                      ) : (
                        <button onClick={() => setRecordItem(item)} style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid var(--accent)", background: "rgba(37,99,235,0.06)", color: "var(--accent)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                          <Plus size={11} strokeWidth={2.5} />录入回复
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {recordItem && (
        <RecordResponseModal
          item={recordItem}
          existingResponse={recordItem.response}
          onClose={() => setRecordItem(null)}
          onSaved={() => { setRecordItem(null); load(); }}
        />
      )}
    </div>
  );
}
