"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Send, ChevronRight, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewInquiryWizard } from "@/components/inquiries/NewInquiryWizard";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Inquiry {
  id: string; name: string; status: string; createdAt: string; sentAt?: string;
  template: { name: string };
  _count: { items: number };
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  DRAFT:     <Clock size={14} />,
  SENDING:   <Loader2 size={14} className="animate-spin" />,
  SENT:      <CheckCircle2 size={14} />,
  PARTIAL:   <AlertCircle size={14} />,
  COMPLETED: <CheckCircle2 size={14} />,
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setInquiries(await (await fetch("/api/inquiries")).json()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendInquiry = async (id: string) => {
    setSending(id);
    try {
      const res = await fetch(`/api/inquiries/${id}/send`, { method: "POST" });
      const data = await res.json();
      alert(`发送完成：成功 ${data.sent} 条，失败 ${data.failed} 条`);
      load();
    } catch {
      alert("发送失败");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="批量询盘"
        description="一键多渠道并发发送询盘，实时追踪发送状态"
        action={<Button icon={<Plus size={14} />} onClick={() => setWizardOpen(true)}>新建询盘</Button>}
      />

      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>加载中...</p>
      ) : inquiries.length === 0 ? (
        <EmptyState icon={Send} title="暂无询盘任务" description="创建第一个批量询盘任务，选择供应商和模板一键发送"
          action={<Button icon={<Plus size={14} />} onClick={() => setWizardOpen(true)}>新建询盘</Button>} />
      ) : (
        <div className="space-y-2">
          {inquiries.map((inq) => (
            <div key={inq.id} className="rounded-xl px-5 py-4 flex items-center gap-4 group"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{inq.name}</span>
                  <Badge value={inq.status} />
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>模板：{inq.template.name}</span>
                  <span>·</span>
                  <span>共 {inq._count.items} 条</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(inq.createdAt), { addSuffix: true, locale: zhCN })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(inq.status === "DRAFT" || inq.status === "PARTIAL") && (
                  <Button size="sm" icon={sending === inq.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    loading={sending === inq.id} onClick={() => sendInquiry(inq.id)}>
                    {inq.status === "PARTIAL" ? "重试失败" : "发送"}
                  </Button>
                )}
                <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <NewInquiryWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onSaved={load} />
    </div>
  );
}
