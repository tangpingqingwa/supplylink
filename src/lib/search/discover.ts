export interface SupplierCandidate {
  id: string;
  name: string;
  website?: string;
  domain?: string;
  description?: string;
  tags: string[];
  email?: string;
  source: "web" | "1688" | "alibaba";
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function extractEmails(text: string): string | undefined {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m?.[0];
}

function extractTags(name: string, desc: string): string[] {
  const tags: string[] = [];
  const text = name + " " + desc;
  if (/OEM|代工/i.test(text)) tags.push("OEM");
  if (/ODM/i.test(text)) tags.push("ODM");
  if (/出口|外贸|export/i.test(text)) tags.push("出口");
  if (/工厂|factory/i.test(text)) tags.push("工厂");
  if (/批发|wholesale/i.test(text)) tags.push("批发");
  if (/认证|certified|CE|RoHS/i.test(text)) tags.push("认证");
  return tags.slice(0, 4);
}

// DuckDuckGo HTML search — no API key required
async function searchDDG(keyword: string, region: string): Promise<SupplierCandidate[]> {
  const suffix = region === "CN" ? "工厂 批发 厂家" : "factory manufacturer wholesale";
  const query = `${keyword} ${suffix}`;

  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=${region === "CN" ? "cn-zh" : "us-en"}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html",
        "Accept-Language": region === "CN" ? "zh-CN,zh;q=0.9" : "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    }
  );

  const html = await res.text();
  const candidates: SupplierCandidate[] = [];

  // DDG wraps real URLs in redirect: href="//duckduckgo.com/l/?uddg=ENCODED_URL&..."
  // class attribute is "links_main links_deep result__body", not exact match
  const titleRx = /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const snippetRx = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  const titles: { raw: string; name: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = titleRx.exec(html)) !== null) {
    titles.push({ raw: m[1], name: decodeHtml(m[2].replace(/<[^>]+>/g, "").trim()) });
  }

  const snippets: string[] = [];
  let s: RegExpExecArray | null;
  while ((s = snippetRx.exec(html)) !== null) {
    snippets.push(s[1].replace(/<[^>]+>/g, "").trim());
  }

  for (let i = 0; i < Math.min(titles.length, 12); i++) {
    const { raw, name } = titles[i];
    if (!name) continue;

    // Decode DDG redirect URL → real URL
    let url = raw.startsWith("//") ? "https:" + raw : raw;
    try {
      const uddg = new URL(url).searchParams.get("uddg");
      if (uddg) url = decodeURIComponent(uddg);
    } catch { /* keep original */ }

    if (url.includes("duckduckgo.com")) continue;

    const description = snippets[i] ?? "";
    const domain = extractDomain(url);
    const email = extractEmails(description);
    const tags = extractTags(name, description);

    let source: SupplierCandidate["source"] = "web";
    if (domain.includes("1688.com")) source = "1688";
    else if (domain.includes("alibaba.com")) source = "alibaba";

    candidates.push({
      id: Buffer.from(url).toString("base64").slice(0, 12),
      name: name.length > 40 ? name.slice(0, 40) + "…" : name,
      website: url,
      domain,
      description: description.length > 120 ? description.slice(0, 120) + "…" : description,
      tags,
      email,
      source,
    });
  }

  return candidates;
}

// SerpAPI (requires SERP_API_KEY in .env)
async function searchSerpAPI(keyword: string, region: string): Promise<SupplierCandidate[]> {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) return [];

  const query = `${keyword} ${region === "CN" ? "工厂 厂家 批发" : "factory manufacturer wholesale"}`;
  const res = await fetch(
    `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}&num=12`,
    { signal: AbortSignal.timeout(8000) }
  );
  const data = await res.json();
  const results = data.organic_results ?? [];

  return results.map((r: { title: string; link: string; snippet?: string }) => {
    const description = r.snippet ?? "";
    return {
      id: Buffer.from(r.link).toString("base64").slice(0, 12),
      name: r.title?.length > 40 ? r.title.slice(0, 40) + "…" : r.title,
      website: r.link,
      domain: extractDomain(r.link),
      description: description.length > 120 ? description.slice(0, 120) + "…" : description,
      tags: extractTags(r.title, description),
      email: extractEmails(description),
      source: "web" as const,
    };
  });
}

export async function discoverSuppliers(keyword: string, region = "CN"): Promise<SupplierCandidate[]> {
  try {
    // Prefer SerpAPI if key configured, else DuckDuckGo
    if (process.env.SERP_API_KEY) {
      return await searchSerpAPI(keyword, region);
    }
    return await searchDDG(keyword, region);
  } catch (err) {
    console.error("Discover search failed:", err);
    return [];
  }
}

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
