"use client";

import { useState } from "react";
import { Search, Plus, Check, Globe, ExternalLink, Tag, Loader2, Compass } from "lucide-react";

interface Candidate {
  id: string; name: string; website?: string; domain?: string;
  description?: string; tags: string[]; email?: string;
  source: "web" | "1688" | "alibaba"; imported: boolean;
}

const SOURCE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  web:     { bg: "rgba(139,148,158,0.12)", color: "#8b949e", label: "网络"    },
  "1688":  { bg: "rgba(210,153,34,0.12)",  color: "#fbbf24", label: "1688"   },
  alibaba: { bg: "rgba(249,115,22,0.12)",  color: "#fb923c", label: "阿里巴巴" },
};

const AVATAR_COLORS = [
  ["#1e3a5f","#3b82f6"],["#1e3a2f","#4ade80"],["#3a1e3a","#c084fc"],
  ["#3a2a1e","#fb923c"],["#1e3a3a","#22d3ee"],["#3a1e2a","#f472b6"],
];
function avColor(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return { bg: AVATAR_COLORS[i][0], color: AVATAR_COLORS[i][1], char: name.charAt(0).toUpperCase() };
}

export default function DiscoverPage() {
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState<"CN" | "GLOBAL">("CN");
  const [results, setResults] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [importing, setImporting] = useState<Set<string>>(new Set());
  const [imported, setImported] = useState<Set<string>>(new Set());

  const search = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, region }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
      setImported(new Set(data.results?.filter((r: Candidate) => r.imported).map((r: Candidate) => r.id)));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const importSupplier = async (c: Candidate) => {
    setImporting(p => new Set([...p, c.id]));
    try {
      await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: c.name,
          company: c.name,
          country: region === "CN" ? "中国" : undefined,
          notes: c.description,
          channels: c.email ? [{ type: "EMAIL", value: c.email, primary: true }]
            : c.source === "1688" ? [{ type: "ALI1688", value: c.website ?? "", primary: true }]
            : [],
        }),
      });
      setImported(p => new Set([...p, c.id]));
    } finally {
      setImporting(p => { const n = new Set(p); n.delete(c.id); return n; });
    }
  };

  const isImported = (id: string) => imported.has(id);
  const isImporting = (id: string) => importing.has(id);

  return (
    <div style={{ padding: "32px 36px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>供应商发现</h1>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 4 }}>输入产品关键词，自动发现潜在供应商</p>
        </div>
        {results.length > 0 && (
          <span style={{ fontSize: 13, color: "var(--text-muted)", paddingTop: 6 }}>发现 {results.length} 家供应商</span>
        )}
      </div>

      {/* Search bar */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
        borderRadius: 14, padding: "20px 24px", marginBottom: 28,
      }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              placeholder="输入产品关键词，如：蓝牙耳机、TWS、USB-C 充电器..."
              style={{
                width: "100%", height: 42, paddingLeft: 38, paddingRight: 16,
                borderRadius: 10, outline: "none", fontSize: 14,
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                color: "var(--text-primary)", fontFamily: "inherit",
              }}
            />
          </div>

          {/* Region selector */}
          <select value={region} onChange={e => setRegion(e.target.value as "CN" | "GLOBAL")}
            style={{
              height: 42, padding: "0 14px", borderRadius: 10, outline: "none", fontSize: 13.5,
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              color: "var(--text-primary)", cursor: "pointer", fontFamily: "inherit", minWidth: 110,
            }}>
            <option value="CN">🇨🇳 中国</option>
            <option value="GLOBAL">🌐 全球</option>
          </select>

          <button onClick={search} disabled={loading || !keyword.trim()} style={{
            display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 22px",
            borderRadius: 10, border: "none", background: "var(--accent)",
            color: "white", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            opacity: loading || !keyword.trim() ? 0.6 : 1, whiteSpace: "nowrap",
          }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            搜索供应商
          </button>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["OEM/ODM", "出口认证", "工厂直供", "1000+ MOQ", "500以下 MOQ"].map(tag => (
            <button key={tag} style={{
              height: 28, padding: "0 12px", borderRadius: 99, fontSize: 12, cursor: "pointer",
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              color: "var(--text-secondary)", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <Tag size={11} />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <Loader2 size={28} color="var(--accent)" className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>正在搜索供应商，请稍候...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Compass size={20} color="var(--text-muted)" />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>未找到相关供应商</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>尝试换个关键词，或切换地区</p>
        </div>
      )}

      {!loading && !searched && (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Compass size={26} color="var(--text-muted)" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }}>输入产品名称开始发现</p>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>例如：蓝牙耳机、手机壳、LED 灯具、运动水杯...</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {results.map(c => {
            const av = avColor(c.name);
            const src = SOURCE_STYLE[c.source];
            const done = isImported(c.id);
            const busy = isImporting(c.id);
            return (
              <div key={c.id} style={{
                background: "var(--bg-surface)", border: `1px solid ${done ? "rgba(63,185,80,0.2)" : "var(--border-subtle)"}`,
                borderRadius: 12, padding: "18px 20px",
                display: "flex", flexDirection: "column", gap: 12,
                transition: "border-color 0.2s",
              }}>
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: av.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: av.color }}>
                    {av.char}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name}
                    </div>
                    {c.domain && (
                      <a href={c.website} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--text-muted)", textDecoration: "none" }}>
                        <Globe size={10} />
                        {c.domain}
                        <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                  {/* Source badge */}
                  {src && (
                    <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: src.bg, color: src.color, flexShrink: 0 }}>
                      {src.label}
                    </span>
                  )}
                </div>

                {/* Description */}
                {c.description && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0 }}>
                    {c.description}
                  </p>
                )}

                {/* Tags */}
                {c.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {c.tags.map(t => (
                      <span key={t} style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                        {t}
                      </span>
                    ))}
                    {c.email && (
                      <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.15)" }}>
                        邮件
                      </span>
                    )}
                  </div>
                )}

                {/* Import button */}
                <button onClick={() => !done && !busy && importSupplier(c)} disabled={done || busy}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    height: 34, borderRadius: 8, fontSize: 13, fontWeight: 500,
                    cursor: done ? "default" : "pointer", fontFamily: "inherit",
                    border: done ? "1px solid rgba(63,185,80,0.25)" : "1px solid var(--border)",
                    background: done ? "rgba(63,185,80,0.08)" : "var(--bg-elevated)",
                    color: done ? "#3fb950" : "var(--text-secondary)",
                    transition: "all 0.15s",
                    marginTop: "auto",
                  }}>
                  {busy ? <Loader2 size={13} className="animate-spin" /> : done ? <Check size={13} /> : <Plus size={13} />}
                  {done ? "已导入" : busy ? "导入中..." : "导入供应商库"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
