"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, ExternalLink, Pencil, Send, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { SupplierDrawer } from "@/components/suppliers/SupplierDrawer";

interface Channel { id: string; type: string; value: string; label?: string; primary: boolean }
interface InquiryRef { id: string; name: string; sentAt?: string }
interface ResponseData { unitPrice?: number; currency?: string; moq?: number; leadTimeDays?: number; notes?: string; receivedAt: string }
interface InquiryItem {
  id: string; channel: string; status: string; sentAt?: string;
  inquiry: InquiryRef;
  response: ResponseData | null;
}
interface Supplier {
  id: string; name: string; company?: string; country?: string; category?: string;
  tags: string[]; notes?: string; channels: Channel[]; inquiryItems: InquiryItem[];
  createdAt: string;
}

const CHANNEL_META: Record<string, { label: string; color: string; bg: string }> = {
  EMAIL:    { label: "邮件",    color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
  WHATSAPP: { label: "WhatsApp", color: "#4ade80", bg: "rgba(63,185,80,0.12)" },
  ALI1688:  { label: "1688",    color: "#fbbf24", bg: "rgba(210,153,34,0.12)" },
  FORM:     { label: "表单",    color: "#c4b5fd", bg: "rgba(163,113,247,0.12)" },
  SMS:      { label: "短信",    color: "#38bdf8", bg: "rgba(14,165,233,0.12)" },
  WECHAT:   { label: "微信",    color: "#4ade80", bg: "rgba(7,193,96,0.12)" },
};

const ITEM_STATUS: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  PENDING: { label: "待发送",  color: "#64748B", icon: Clock },
  SENT:    { label: "已发送",  color: "#2563EB", icon: Send },
  FAILED:  { label: "失败",    color: "#DC2626", icon: XCircle },
  REPLIED: { label: "已回复",  color: "#16A34A", icon: CheckCircle2 },
  IGNORED: { label: "手动",    color: "#D97706", icon: Clock },
};

const AVATAR_COLORS = [
  ["#1e3a5f","#3b82f6"],["#1e3a2f","#4ade80"],["#3a1e3a","#c084fc"],
  ["#3a2a1e","#fb923c"],["#1e3a3a","#22d3ee"],["#3a1e2a","#f472b6"],
];
function getAvatar(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return { bg: AVATAR_COLORS[i][0], color: AVATAR_COLORS[i][1] };
}

function copyText(text: string, label = "已复制") {
  navigator.clipboard.writeText(text).then(() => alert(label));
}

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers/${id}`);
      if (res.status === 404) { router.push("/suppliers"); return; }
      setSupplier(await res.json());
    } finally { setLoading(false); }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <Loader2 size={20} color="var(--text-muted)" className="animate-spin" />
    </div>
  );
  if (!supplier) return null;

  const av = getAvatar(supplier.name);

  // Compute stats
  const sentItems = supplier.inquiryItems.filter(i => ["SENT","REPLIED","FAILED"].includes(i.status));
  const repliedItems = supplier.inquiryItems.filter(i => i.status === "REPLIED");
  const replyRate = sentItems.length > 0 ? Math.round((repliedItems.length / sentItems.length) * 100) : null;
  const prices = supplier.inquiryItems.map(i => i.response?.unitPrice).filter((p): p is number => p != null);
  const avgPrice = prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length) : null;
  const leads = supplier.inquiryItems.map(i => i.response?.leadTimeDays).filter((l): l is number => l != null);
  const avgLead = leads.length > 0 ? Math.round(leads.reduce((a, b) => a + b, 0) / leads.length) : null;

  // Price trend — last 8 items with a price
  const pricedItems = supplier.inquiryItems
    .filter(i => i.response?.unitPrice != null)
    .slice(0, 8)
    .reverse();
  const maxPrice = pricedItems.length > 0 ? Math.max(...pricedItems.map(i => i.response!.unitPrice!)) : 0;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 900 }}>

      {/* Back */}
      <Link href="/suppliers" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", marginBottom: 20 }}>
        <ArrowLeft size={14} />供应商库
      </Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: av.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: av.color, flexShrink: 0 }}>
            {supplier.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{supplier.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
              {supplier.company && <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{supplier.company}</span>}
              {supplier.country && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· {supplier.country}</span>}
              {supplier.category && (
                <span style={{ fontSize: 11.5, padding: "2px 8px", borderRadius: 99, background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>{supplier.category}</span>
              )}
              {supplier.tags.map(t => (
                <span key={t} style={{ fontSize: 11.5, padding: "2px 8px", borderRadius: 99, background: "rgba(37,99,235,0.08)", color: "var(--accent)" }}>{t}</span>
              ))}
            </div>
            {supplier.notes && <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 6, maxWidth: 480 }}>{supplier.notes}</p>}
          </div>
        </div>
        <button onClick={() => setEditOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-secondary)", fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}>
          <Pencil size={13} />编辑
        </button>
      </div>

      {/* Contact channels */}
      {supplier.channels.length > 0 && (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: 12, letterSpacing: "0.04em" }}>联系渠道</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {supplier.channels.map(ch => {
              const meta = CHANNEL_META[ch.type] ?? { label: ch.type, color: "var(--text-secondary)", bg: "var(--bg-elevated)" };
              const isLink = ch.type === "ALI1688" || ch.type === "FORM";
              return (
                <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, background: meta.bg, border: `1px solid ${meta.color}22` }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: meta.color }}>{meta.label}</span>
                  <span style={{ fontSize: 12.5, color: "var(--text-primary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.value}</span>
                  <button onClick={() => copyText(ch.value, `${meta.label}已复制`)} title="复制" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                    <Copy size={12} />
                  </button>
                  {isLink && (
                    <button onClick={() => window.open(ch.value, "_blank")} title="打开" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: meta.color, display: "flex", alignItems: "center" }}>
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "发送次数", value: sentItems.length > 0 ? `${sentItems.length} 次` : "—" },
          { label: "回复率",   value: replyRate != null ? `${replyRate}%` : "—" },
          { label: "平均报价", value: avgPrice != null ? `¥${avgPrice.toFixed(2)}` : "—" },
          { label: "平均交期", value: avgLead != null ? `${avgLead} 天` : "—" },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Price trend */}
      {pricedItems.length >= 2 && (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: 14, letterSpacing: "0.04em" }}>价格走势（最近 {pricedItems.length} 次）</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pricedItems.map((item, i) => {
              const price = item.response!.unitPrice!;
              const pct = maxPrice > 0 ? Math.max(6, Math.round((price / maxPrice) * 100)) : 6;
              const date = item.response?.receivedAt ? new Date(item.response.receivedAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }) : "";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 42, fontSize: 11.5, color: "var(--text-muted)", flexShrink: 0, textAlign: "right" }}>{date}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 99, background: "var(--bg-elevated)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: "var(--accent)", transition: "width 0.4s ease" }} />
                  </div>
                  <span style={{ width: 60, fontSize: 12, fontWeight: 600, color: "var(--text-primary)", flexShrink: 0 }}>
                    {item.response?.currency === "USD" ? "$" : "¥"}{price}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quote history */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>询盘记录</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>最近 {supplier.inquiryItems.length} 条，按时间倒序</p>
        </div>
        {supplier.inquiryItems.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>暂无询盘记录</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["询盘", "渠道", "状态", "单价", "MOQ", "交期", "收到时间"].map(h => (
                  <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 500, color: "var(--text-muted)", letterSpacing: "0.03em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {supplier.inquiryItems.map(item => {
                const st = ITEM_STATUS[item.status] ?? ITEM_STATUS.PENDING;
                const StatusIcon = st.icon;
                const ch = CHANNEL_META[item.channel] ?? { label: item.channel, color: "var(--text-muted)", bg: "var(--bg-elevated)" };
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--border-subtle)", background: item.response ? "rgba(22,163,74,0.02)" : "transparent" }}>
                    <td style={{ padding: "10px 16px" }}>
                      <Link href={`/inquiries/${item.inquiry.id}`} style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
                        {item.inquiry.name}
                      </Link>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ fontSize: 11.5, padding: "2px 8px", borderRadius: 99, background: ch.bg, color: ch.color, fontWeight: 500 }}>{ch.label}</span>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: st.color }}>
                        <StatusIcon size={11} strokeWidth={2.5} />{st.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: item.response?.unitPrice ? 600 : 400, color: item.response?.unitPrice ? "#16A34A" : "var(--text-muted)" }}>
                      {item.response?.unitPrice != null ? `¥${item.response.unitPrice}` : "—"}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--text-secondary)" }}>
                      {item.response?.moq != null ? `${item.response.moq.toLocaleString()} pcs` : "—"}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--text-secondary)" }}>
                      {item.response?.leadTimeDays != null ? `${item.response.leadTimeDays} 天` : "—"}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-muted)" }}>
                      {item.response?.receivedAt ? new Date(item.response.receivedAt).toLocaleDateString("zh-CN") : (item.sentAt ? new Date(item.sentAt).toLocaleDateString("zh-CN") : "—")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editOpen && (
        <SupplierDrawer
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); load(); }}
          initial={{ ...supplier }}
        />
      )}
    </div>
  );
}
