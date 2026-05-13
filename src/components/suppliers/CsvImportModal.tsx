"use client";

import { useRef, useState, useCallback } from "react";
import { X, Upload, CloudUpload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Papa from "papaparse";

interface Props {
  onClose: () => void;
  onImported: (count: number) => void;
}

const REQUIRED_FIELDS = [
  { key: "name",      label: "供应商名称",  required: true  },
  { key: "company",   label: "公司",        required: false },
  { key: "email",     label: "邮箱",        required: false },
  { key: "whatsapp",  label: "WhatsApp",    required: false },
  { key: "wechat",    label: "微信",        required: false },
  { key: "phone",     label: "手机/短信",   required: false },
  { key: "ali1688",   label: "1688 链接",   required: false },
  { key: "website",   label: "网址",        required: false },
  { key: "notes",     label: "备注",        required: false },
];

type Row = Record<string, string>;

function guessMapping(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  const rules: Record<string, RegExp> = {
    name:     /名称|name|supplier|供应商|公司名/i,
    company:  /公司|company|firm/i,
    email:    /邮|email|mail/i,
    whatsapp: /whatsapp|wa/i,
    wechat:   /微信|wechat|weixin/i,
    phone:    /手机|mobile|sms|短信|tel$/i,
    ali1688:  /1688|阿里巴巴国内|ali1688/i,
    website:  /网址|url|site|web|官网/i,
    notes:    /备注|note|remark|comment/i,
  };
  for (const [field, rx] of Object.entries(rules)) {
    const match = headers.find(h => rx.test(h));
    if (match && !Object.values(map).includes(match)) map[field] = match;
  }
  return map;
}

export function CsvImportModal({ onClose, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; fail: number } | null>(null);
  const [error, setError] = useState("");

  const parseFile = useCallback((file: File) => {
    setError("");
    setResult(null);
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (!res.data.length) { setError("文件为空或格式有误"); return; }
        const hdrs = res.meta.fields ?? [];
        setHeaders(hdrs);
        setRows(res.data.slice(0, 200));
        setMapping(guessMapping(hdrs));
      },
      error: () => setError("解析失败，请确认文件格式"),
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const startImport = async () => {
    if (!mapping.name) { setError("请映射「供应商名称」字段"); return; }
    setImporting(true);
    setError("");

    const suppliers = rows.map(row => {
      const channels = [];
      if (mapping.email    && row[mapping.email])    channels.push({ type: "EMAIL",    value: row[mapping.email].trim(),    primary: !channels.length });
      if (mapping.whatsapp && row[mapping.whatsapp]) channels.push({ type: "WHATSAPP", value: row[mapping.whatsapp].trim(), primary: !channels.length });
      if (mapping.wechat   && row[mapping.wechat])   channels.push({ type: "WECHAT",   value: row[mapping.wechat].trim(),   primary: !channels.length });
      if (mapping.phone    && row[mapping.phone])    channels.push({ type: "SMS",      value: row[mapping.phone].trim(),    primary: !channels.length });
      if (mapping.ali1688  && row[mapping.ali1688])  channels.push({ type: "ALI1688",  value: row[mapping.ali1688].trim(),  primary: !channels.length });
      if (mapping.website  && row[mapping.website])  channels.push({ type: "FORM",     value: row[mapping.website].trim(),  primary: !channels.length });
      return {
        name:    row[mapping.name]?.trim() ?? "",
        company: mapping.company ? row[mapping.company]?.trim() : undefined,
        notes:   mapping.notes   ? row[mapping.notes]?.trim()   : undefined,
        channels,
      };
    }).filter(s => s.name);

    try {
      const res = await fetch("/api/suppliers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suppliers }),
      });
      const data = await res.json();
      setResult({ ok: data.imported ?? 0, fail: data.failed ?? 0 });
      onImported(data.imported ?? 0);
    } catch {
      setError("导入请求失败，请重试");
    } finally {
      setImporting(false);
    }
  };

  const previewRows = rows.slice(0, 4);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
        borderRadius: 16, width: "min(720px, 95vw)", maxHeight: "90vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>批量导入供应商</h2>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>支持 CSV / Excel 文件，最多 200 行</p>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-elevated)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} color="var(--text-muted)" />
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 12, padding: "32px 20px", textAlign: "center",
              cursor: "pointer", transition: "border-color 0.2s",
              background: dragging ? "rgba(37,99,235,0.05)" : "var(--bg-elevated)",
            }}>
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={handleFileChange} />
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(37,99,235,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <CloudUpload size={22} color="#3b82f6" />
            </div>
            {rows.length > 0 ? (
              <>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>已加载 {rows.length} 行数据</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>点击重新选择文件</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>拖拽 CSV 文件到这里</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>或点击选择文件 &nbsp;·&nbsp; 支持 .csv .xlsx 格式，最大 5MB</p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.2)" }}>
              <AlertCircle size={14} color="#f85149" />
              <span style={{ fontSize: 13, color: "#f85149" }}>{error}</span>
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(63,185,80,0.08)", border: "1px solid rgba(63,185,80,0.2)" }}>
              <CheckCircle2 size={14} color="#3fb950" />
              <span style={{ fontSize: 13, color: "#3fb950" }}>
                成功导入 {result.ok} 家供应商{result.fail > 0 ? `，${result.fail} 行跳过` : ""}
              </span>
            </div>
          )}

          {/* Field mapping */}
          {headers.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>字段映射</h3>
              <div style={{ background: "var(--bg-elevated)", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                {REQUIRED_FIELDS.map((f, i) => (
                  <div key={f.key} style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center",
                    padding: "10px 14px", gap: 12,
                    borderBottom: i < REQUIRED_FIELDS.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{f.label}</span>
                      {f.required && <span style={{ fontSize: 10.5, color: "#f85149", background: "rgba(248,81,73,0.1)", padding: "1px 6px", borderRadius: 99 }}>必填</span>}
                    </div>
                    <select
                      value={mapping[f.key] ?? ""}
                      onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value }))}
                      style={{
                        height: 32, padding: "0 10px", borderRadius: 7, fontSize: 12.5, outline: "none",
                        background: "var(--bg-surface)", border: "1px solid var(--border)",
                        color: mapping[f.key] ? "var(--text-primary)" : "var(--text-muted)",
                        cursor: "pointer", fontFamily: "inherit", width: "100%",
                      }}>
                      <option value="">— 不导入 —</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {previewRows.length > 0 && mapping.name && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>
                预览（前 {previewRows.length} 行）
              </h3>
              <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-elevated)" }}>
                      {REQUIRED_FIELDS.filter(f => mapping[f.key]).map(f => (
                        <th key={f.key} style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-muted)", fontWeight: 500, whiteSpace: "nowrap", borderBottom: "1px solid var(--border-subtle)" }}>
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: ri < previewRows.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                        {REQUIRED_FIELDS.filter(f => mapping[f.key]).map(f => (
                          <td key={f.key} style={{ padding: "8px 12px", color: "var(--text-secondary)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row[mapping[f.key]] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{
            height: 36, padding: "0 18px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 13.5,
            cursor: "pointer", fontFamily: "inherit",
          }}>取消</button>
          <button
            onClick={startImport}
            disabled={!rows.length || importing || !!result}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              height: 36, padding: "0 18px", borderRadius: 8, border: "none",
              background: "var(--accent)", color: "white", fontSize: 13.5, fontWeight: 500,
              cursor: rows.length && !importing && !result ? "pointer" : "default",
              fontFamily: "inherit", opacity: !rows.length || importing || !!result ? 0.5 : 1,
            }}>
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {result ? "已完成" : importing ? `导入中...` : `开始导入 (${rows.length} 行)`}
          </button>
        </div>
      </div>
    </div>
  );
}
