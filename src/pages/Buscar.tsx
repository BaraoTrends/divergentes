import { useMemo, useEffect, useState, useDeferredValue } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useArticles } from "@/hooks/useArticles";
import { categories, faqItems, glossaryTerms } from "@/lib/content";
import {
  generateBreadcrumbSchema,
  generateWebSiteSchema,
  SITE_URL,
} from "@/lib/seo";

interface Hit {
  type: "artigo" | "categoria" | "faq" | "glossário";
  title: string;
  description: string;
  url: string;
  score: number;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(q: string): string[] {
  return normalize(q).split(" ").filter((t) => t.length >= 2);
}

function scoreText(haystack: string, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const norm = normalize(haystack);
  let score = 0;
  for (const t of tokens) {
    if (!norm.includes(t)) continue;
    score += 1;
    // Boost for word-boundary matches
    const re = new RegExp(`(^|\\s)${t}(\\s|$)`);
    if (re.test(norm)) score += 1;
  }
  // Bonus when ALL tokens matched
  const allMatched = tokens.every((t) => norm.includes(t));
  if (allMatched) score += 2;
  return score;
}

const Buscar = () => {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") || "";
  const [query, setQuery] = useState(initial);
  const deferredQuery = useDeferredValue(query);

  const { data: dbArticles = [] } = useArticles({ publishedOnly: true });

  // Sync URL with current query (debounced via useDeferredValue)
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (deferredQuery.trim()) next.set("q", deferredQuery.trim());
    else next.delete("q");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredQuery]);

  const tokens = useMemo(() => tokenize(deferredQuery), [deferredQuery]);

  const hits = useMemo<Hit[]>(() => {
    if (tokens.length === 0) return [];
    const all: Hit[] = [];

    for (const a of dbArticles) {
      const haystack = `${a.title} ${a.excerpt || ""} ${(a.tags || []).join(" ")} ${a.focus_keyword || ""} ${a.category}`;
      const score = scoreText(haystack, tokens);
      if (score > 0) {
        all.push({
          type: "artigo",
          title: a.title,
          description: a.excerpt || "",
          url: `/blog/${a.slug}`,
          score: score + 2, // articles slightly favored
        });
      }
    }

    for (const c of categories) {
      const score = scoreText(`${c.name} ${c.shortName} ${c.description}`, tokens);
      if (score > 0) {
        all.push({
          type: "categoria",
          title: c.name,
          description: c.description,
          url: `/${c.slug}`,
          score,
        });
      }
    }

    for (const f of faqItems) {
      const score = scoreText(`${f.question} ${f.answer}`, tokens);
      if (score > 0) {
        all.push({
          type: "faq",
          title: f.question,
          description: f.answer.slice(0, 180),
          url: "/perguntas-frequentes",
          score,
        });
      }
    }

    for (const g of glossaryTerms) {
      const score = scoreText(`${g.term} ${g.definition}`, tokens);
      if (score > 0) {
        all.push({
          type: "glossário",
          title: g.term,
          description: g.definition,
          url: "/glossario",
          score,
        });
      }
    }

    return all.sort((a, b) => b.score - a.score).slice(0, 50);
  }, [tokens, dbArticles]);

  const seoTitle = deferredQuery.trim()
    ? `Resultados para “${deferredQuery.trim()}”`
    : "Buscar no site";
  const seoDescription = deferredQuery.trim()
    ? `${hits.length} ${hits.length === 1 ? "resultado encontrado" : "resultados encontrados"} para “${deferredQuery.trim()}” em artigos, categorias, FAQ e glossário.`
    : "Busque por temas, sintomas ou termos relacionados a TDAH, TEA, Dislexia, Altas Habilidades, TOC e neurodivergências.";

  // SearchResultsPage schema — explicit when there's a query, plus the WebSite SearchAction.
  const schemas = useMemo(() => {
    const list: object[] = [
      generateWebSiteSchema(),
      generateBreadcrumbSchema([
        { name: "Início", url: "/" },
        { name: "Buscar", url: "/buscar" },
      ]),
    ];
    if (deferredQuery.trim()) {
      list.push({
        "@context": "https://schema.org",
        "@type": "SearchResultsPage",
        url: `${SITE_URL}/buscar?q=${encodeURIComponent(deferredQuery.trim())}`,
        name: seoTitle,
        about: deferredQuery.trim(),
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: hits.length,
          itemListElement: hits.slice(0, 10).map((h, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}${h.url}`,
            name: h.title,
          })),
        },
      });
    }
    return list;
  }, [deferredQuery, hits, seoTitle]);

  return (
    <Layout>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        path={deferredQuery.trim() ? `/buscar?q=${encodeURIComponent(deferredQuery.trim())}` : "/buscar"}
        schemas={schemas}
        // Don't index the long-tail of empty / arbitrary search pages
        noindex
      />

      <div className="container max-w-3xl py-10">
        <Breadcrumbs items={[{ label: "Buscar", href: "/buscar" }]} />

        <header className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
            Buscar no site
          </h1>
          <p className="text-muted-foreground">
            Procure por artigos, categorias, perguntas frequentes e termos do glossário.
          </p>
        </header>

        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="relative mb-8"
        >
          <label htmlFor="site-search" className="sr-only">
            Termo de busca
          </label>
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="site-search"
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: TDAH em adultos, dislexia, hiperfoco…"
            autoComplete="off"
            autoFocus
            className="pl-9"
          />
        </form>

        {deferredQuery.trim() === "" ? (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
            Digite ao menos 2 caracteres para começar. A busca cobre o conteúdo
            público do site (artigos publicados, categorias, FAQ e glossário).
          </div>
        ) : hits.length === 0 ? (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
            Nenhum resultado para <strong className="text-foreground">“{deferredQuery.trim()}”</strong>.
            Tente termos mais curtos ou variações (por exemplo, "tdah" em vez de "TDA").
          </div>
        ) : (
          <ul className="space-y-3" aria-label="Resultados da busca">
            {hits.map((hit, i) => (
              <li key={`${hit.type}-${hit.url}-${i}`}>
                <Link
                  to={hit.url}
                  className="block rounded-lg border border-border/60 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                      {hit.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">{hit.url}</span>
                  </div>
                  <h2 className="font-medium text-foreground">{hit.title}</h2>
                  {hit.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {hit.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
};

export default Buscar;
