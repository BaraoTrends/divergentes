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
