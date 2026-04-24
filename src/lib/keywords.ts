/**
 * Central map of SEO secondary keywords per route.
 *
 * Used by both:
 *   - <SEOHead> (client, react-helmet-async) — emits <meta name="keywords">
 *   - supabase/functions/prerender (bots) — same emission, byte-identical list
 *
 * Keep both consumers reading from the SAME source so the build-time SEO
 * consistency check in scripts/validate-seo-consistency.mjs cannot drift.
 *
 * Guidelines:
 *  - Always lowercase, accent-preserved Portuguese.
 *  - Up to ~10 keywords per route (Google ignores meta keywords for ranking
 *    but Bing/Yandex/internal site search still parse it — and many AI crawlers
 *    use it as a topical hint).
 *  - For BlogPost we DO NOT use this map — articles use focus_keyword + tags.
 */

const BRAND_KEYWORDS = [
  "neurodivergência",
  "neurodiversidade",
  "tdah",
  "autismo",
  "tea",
  "dislexia",
  "altas habilidades",
  "superdotação",
  "toc",
];

export const SITE_KEYWORDS = [...BRAND_KEYWORDS];

export const ROUTE_KEYWORDS: Record<string, string[]> = {
  "/": [
    ...BRAND_KEYWORDS,
    "neurodivergência brasil",
    "guia neurodivergência",
    "informação neurodivergente",
    "famílias neurodivergentes",
  ],
  "/blog": [
    ...BRAND_KEYWORDS,
    "blog neurodivergência",
    "artigos tdah",
    "artigos autismo",
    "artigos dislexia",
  ],
  "/perguntas-frequentes": [
    ...BRAND_KEYWORDS,
    "dúvidas tdah",
    "dúvidas autismo",
    "perguntas neurodivergência",
    "faq neurodiversidade",
  ],
  "/glossario": [
    ...BRAND_KEYWORDS,
    "glossário neurodivergência",
    "termos neurodivergente",
    "dicionário neurodiversidade",
    "stimming",
    "masking",
    "hiperfoco",
    "disfunção executiva",
    "comorbidade",
  ],
  "/sobre": [
    ...BRAND_KEYWORDS,
    "sobre neurorotina",
    "portal neurodivergência",
    "informação acessível neurodiversidade",
  ],
  "/contato": [
    ...BRAND_KEYWORDS,
    "contato neurorotina",
    "fale conosco neurodivergência",
  ],
  "/buscar": [
    ...BRAND_KEYWORDS,
    "buscar neurodivergência",
    "pesquisar tdah",
    "pesquisar autismo",
  ],
};

/**
 * Per-category secondary keyword sets. Indexed by category slug
 * (must match `categories[].slug` in src/lib/content.ts).
 */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  tdah: [
    "tdah",
    "transtorno de déficit de atenção",
    "hiperatividade",
    "desatenção",
    "tdah adulto",
    "tdah infantil",
    "metilfenidato",
    "diagnóstico tdah",
    "tratamento tdah",
    "tdah brasil",
  ],
  tea: [
    "tea",
    "autismo",
    "transtorno do espectro autista",
    "espectro autista",
    "autismo infantil",
    "autismo adulto",
    "níveis de suporte autismo",
    "diagnóstico autismo",
    "intervenção precoce autismo",
    "stimming",
  ],
  dislexia: [
    "dislexia",
    "dificuldade de leitura",
    "transtorno de aprendizagem",
    "alfabetização dislexia",
    "diagnóstico dislexia",
    "estratégias dislexia",
    "tecnologia assistiva dislexia",
    "dislexia escolar",
  ],
  "altas-habilidades": [
    "altas habilidades",
    "superdotação",
    "ah/sd",
    "dupla excepcionalidade",
    "criança superdotada",
    "enriquecimento curricular",
    "identificação altas habilidades",
    "criatividade superdotação",
  ],
  toc: [
    "toc",
    "transtorno obsessivo-compulsivo",
    "obsessões",
    "compulsões",
    "tcc-epr",
    "exposição prevenção resposta",
    "tratamento toc",
    "isrs toc",
    "ansiedade toc",
  ],
};

/** Helper: dedupe + lowercase trim. */
export function normalizeKeywords(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of list) {
    const v = (k || "").toLowerCase().trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

/**
 * Build the final keyword list for a single article. Combines:
 *   1. focus_keyword (highest priority)
 *   2. article tags
 *   3. category-specific keywords (from CATEGORY_KEYWORDS)
 *   4. brand fallback (so even untagged articles ship something)
 * Result is normalized (lowercase, trimmed, deduped) and capped at 15 entries
 * to avoid spam-looking meta tags.
 *
 * Returns an empty array if the category is unknown — callers should treat
 * that as "skip this article" so we don't ship a meta-keywords tag built
 * solely from BRAND_KEYWORDS for off-schema content.
 */
export function buildArticleKeywords(input: {
  focusKeyword?: string | null;
  tags?: string[] | null;
  category?: string | null;
}): string[] {
  if (!input.category || !CATEGORY_KEYWORDS[input.category]) return [];
  const merged: string[] = [];
  if (input.focusKeyword) merged.push(input.focusKeyword);
  if (Array.isArray(input.tags)) merged.push(...input.tags);
  merged.push(...CATEGORY_KEYWORDS[input.category]);
  merged.push(...BRAND_KEYWORDS);
  return normalizeKeywords(merged).slice(0, 15);
}

/**
 * Serialize a keyword array into the EXACT string used by
 * `<meta name="keywords" content="...">`. ALL emitters (SEOHead, prerender,
 * build-time validator) MUST go through this so byte-level comparisons stay
 * meaningful.
 */
export function serializeKeywordsMeta(keywords: string[]): string {
  return normalizeKeywords(keywords).join(", ");
}

/** Inverse of serializeKeywordsMeta — used by the validator. */
export function parseKeywordsMeta(content: string): string[] {
  return normalizeKeywords(content.split(",").map((s) => s.trim()));
}
