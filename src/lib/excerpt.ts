/**
 * Generates a clean, plain-text excerpt from HTML content.
 * Designed for meta description and Open Graph tags.
 *
 * - Strips all HTML tags, scripts, styles
 * - Decodes common HTML entities
 * - Normalizes whitespace
 * - Targets ~150 chars (Google meta description sweet spot)
 * - Cuts at sentence/word boundaries to avoid mid-word truncation
 * - Deterministic: same input → same output (no AI cost, instant)
 */

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&hellip;": "…",
  "&mdash;": "—",
  "&ndash;": "–",
  "&laquo;": "«",
  "&raquo;": "»",
  "&ldquo;": "“",
  "&rdquo;": "”",
  "&lsquo;": "‘",
  "&rsquo;": "’",
};

export function stripHtml(html: string): string {
  if (!html) return "";
  let out = html;
  // Remove script/style blocks completely (including content)
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
  out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  // Remove HTML comments
  out = out.replace(/<!--[\s\S]*?-->/g, " ");
  // Replace block-level tags with a space to preserve word boundaries
  out = out.replace(/<\/?(p|div|br|h[1-6]|li|ul|ol|blockquote|tr|td|th|section|article|header|footer|figure|figcaption)\b[^>]*>/gi, " ");
  // Remove remaining tags
  out = out.replace(/<[^>]+>/g, "");
  // Decode named entities
  out = out.replace(/&[a-z]+;|&#\d+;/gi, (m) => {
    if (HTML_ENTITIES[m]) return HTML_ENTITIES[m];
    const numeric = m.match(/^&#(\d+);$/);
    if (numeric) {
      const code = parseInt(numeric[1], 10);
      if (!isNaN(code)) return String.fromCharCode(code);
    }
    return " ";
  });
  // Collapse whitespace
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

export interface ExcerptOptions {
  /** Min characters for a "good" excerpt. Default 120. */
  min?: number;
  /** Max characters (hard cap). Default 155. */
  max?: number;
}

/**
 * Generates a meta-description-ready excerpt from HTML.
 * Tries to cut at sentence end within [min, max], falls back to word boundary.
 */
export function generateExcerpt(html: string, opts: ExcerptOptions = {}): string {
  const min = opts.min ?? 120;
  const max = opts.max ?? 155;
  const text = stripHtml(html);
  if (!text) return "";
  if (text.length <= max) return text;

  // Try sentence boundaries (. ! ? …) within [min, max]
  const window = text.slice(0, max + 1);
  const sentenceMatches = [...window.matchAll(/[.!?…]/g)];
  for (let i = sentenceMatches.length - 1; i >= 0; i--) {
    const idx = sentenceMatches[i].index ?? -1;
    if (idx >= min && idx <= max) {
      return text.slice(0, idx + 1).trim();
    }
  }

  // Fallback: cut at last word boundary before max, append ellipsis
  const truncated = text.slice(0, max - 1);
  const lastSpace = truncated.lastIndexOf(" ");
  const safe = lastSpace > min ? truncated.slice(0, lastSpace) : truncated;
  return safe.replace(/[,;:\-–—\s]+$/, "") + "…";
}
