// Client-side search over the prebuilt index at /search-index.json (AGENTS.md section 6). Pure functions, unit tested.

export type IndexEntry = {
  t: string | null; // title
  d: string | null; // dek
  u: string; // canonical path
  s: string | null; // school short name
  k: string | null; // content type
  a: Array<string | null> | null; // authors
  g: Array<string | null> | null; // tags
  p: string | null; // published
};

export type Hit = { entry: IndexEntry; score: number };

export function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(query: string): string[] {
  return normalize(query)
    .split(" ")
    .filter((t) => t.length > 1 || /\d/.test(t))
    .slice(0, 8);
}

const WEIGHTS = { t: 6, g: 4, a: 4, s: 3, k: 2, d: 1 } as const;

function fields(e: IndexEntry): Record<keyof typeof WEIGHTS, string> {
  return {
    t: normalize(e.t ?? ""),
    g: normalize((e.g ?? []).join(" ")),
    a: normalize((e.a ?? []).join(" ")),
    s: normalize(e.s ?? ""),
    k: normalize(e.k ?? ""),
    d: normalize(e.d ?? ""),
  };
}

/**
 * Every token must appear somewhere (AND). Score favors title, tag, and author matches, whole-word over prefix,
 * then recency. Good to a few thousand articles, which is the spec's ceiling before moving to a hosted index.
 */
export function search(index: IndexEntry[], query: string, limit = 50): Hit[] {
  const qs = tokens(query);
  if (qs.length === 0) return [];
  const hits: Hit[] = [];
  for (const entry of index) {
    const f = fields(entry);
    let score = 0;
    let all = true;
    for (const q of qs) {
      let best = 0;
      for (const key of Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>) {
        const text = f[key];
        if (!text.includes(q)) continue;
        const whole = new RegExp(`(^|\\s)${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(text);
        best = Math.max(best, WEIGHTS[key] * (whole ? 2 : 1));
      }
      if (best === 0) {
        all = false;
        break;
      }
      score += best;
    }
    if (all) hits.push({ entry, score });
  }
  hits.sort((a, b) => b.score - a.score || (b.entry.p ?? "").localeCompare(a.entry.p ?? ""));
  return hits.slice(0, limit);
}

/** Splits text into plain and matched runs for highlighting, matching tokens case- and accent-insensitively. */
export function highlight(text: string, query: string): Array<{ text: string; match: boolean }> {
  const qs = tokens(query);
  if (!qs.length || !text) return [{ text, match: false }];
  const folded = text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
  // Folding can change length only for decomposed input; fall back to no highlight if it does.
  if (folded.length !== text.length) return [{ text, match: false }];
  const marks = new Array<boolean>(text.length).fill(false);
  for (const q of qs) {
    let i = folded.indexOf(q);
    while (i !== -1) {
      for (let j = i; j < i + q.length; j++) marks[j] = true;
      i = folded.indexOf(q, i + q.length);
    }
  }
  const out: Array<{ text: string; match: boolean }> = [];
  for (let i = 0; i < text.length; i++) {
    const last = out[out.length - 1];
    if (last && last.match === marks[i]) last.text += text[i];
    else out.push({ text: text[i]!, match: marks[i]! });
  }
  return out;
}
