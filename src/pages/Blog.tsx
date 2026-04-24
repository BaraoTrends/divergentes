import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleCard from "@/components/ArticleCard";
import AdSlot from "@/components/AdSlot";
import { blogPosts as staticPosts, categories } from "@/lib/content";
import { useArticles } from "@/hooks/useArticles";
import { generateBreadcrumbSchema } from "@/lib/seo";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { Tag, X } from "lucide-react";
import type { BlogPost as BlogPostType } from "@/lib/content";

const POSTS_PER_PAGE = 4;

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("categoria") || "";
  const activeTag = searchParams.get("tag") || "";
  const currentPage = Math.max(1, Number(searchParams.get("pagina") || "1"));
  const [showAllTags, setShowAllTags] = useState(false);

  const { data: dbArticles = [] } = useArticles({ publishedOnly: true });

  // Collect unique tags from DB articles
  const allTags = Array.from(
    new Set(dbArticles.flatMap((a) => a.tags || []))
  ).sort();

  const visibleTags = showAllTags ? allTags : allTags.slice(0, 10);

  // Merge DB articles with static posts, DB articles first
  const dbAsBlogPosts: (BlogPostType & { tags?: string[] })[] = dbArticles.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt || "",
    category: a.category,
    author: "Equipe Neurodivergências",
    datePublished: a.created_at.split("T")[0],
    dateModified: a.updated_at.split("T")[0],
    readingTime: a.read_time,
    image: a.image_url || "/placeholder.svg",
    content: a.content,
    tags: a.tags || [],
  }));

  const dbSlugs = new Set(dbAsBlogPosts.map((p) => p.slug));
  const allPosts = [...dbAsBlogPosts, ...staticPosts.filter((p) => !dbSlugs.has(p.slug))];

  // Filter by category then by tag
  let filteredPosts = activeCategory
    ? allPosts.filter((p) => p.category === activeCategory)
    : allPosts;

  if (activeTag) {
    filteredPosts = filteredPosts.filter((p) =>
      "tags" in p && Array.isArray((p as any).tags) && (p as any).tags.includes(activeTag)
    );
  }

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));

  const paginatedPosts = filteredPosts.slice(
    (safePage - 1) * POSTS_PER_PAGE,
    safePage * POSTS_PER_PAGE
  );

  const updateParams = (cat: string, tag: string, page: number) => {
    const params: Record<string, string> = {};
    if (cat) params.categoria = cat;
    if (tag) params.tag = tag;
    if (page > 1) params.pagina = String(page);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPage = (page: number) => updateParams(activeCategory, activeTag, page);
  const setCategory = (slug: string) => updateParams(slug === activeCategory ? "" : slug, "", 1);
  const setTag = (tag: string) => updateParams(activeCategory, tag === activeTag ? "" : tag, 1);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Início", url: "/" },
    { name: "Blog", url: "/blog" },
  ]);

  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
        pages.push(i);
      }
      if (safePage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <Layout>
      <SEOHead
        title="Blog — Artigos sobre Neurodivergências"
        description="Artigos informativos sobre TDAH, TEA, Dislexia, Altas Habilidades, TOC e outras neurodivergências. Conteúdo baseado em evidências para o público brasileiro."
        path="/blog"
        keywords={ROUTE_KEYWORDS["/blog"]}
        schemas={[breadcrumbSchema]}
      />
      <div className="container py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Blog" }]} />

        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">Blog</h1>
        <p className="text-muted-foreground mb-6">
          Artigos informativos sobre neurodivergências, escritos com base em evidências científicas.
        </p>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setCategory("")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
              !activeCategory
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                activeCategory === cat.slug
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {cat.icon} {cat.shortName}
            </button>
          ))}
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Tags</span>
              {activeTag && (
                <button
                  onClick={() => setTag("")}
                  className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <X className="h-3 w-3" /> Limpar filtro
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTag(tag)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    activeTag === tag
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {tag}
                </button>
              ))}
              {allTags.length > 10 && (
                <button
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium text-primary hover:underline"
                >
                  {showAllTags ? "Ver menos" : `+${allTags.length - 10} mais`}
                </button>
              )}
            </div>
          </div>
        )}

        {paginatedPosts.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            {activeTag
              ? `Nenhum artigo encontrado com a tag "${activeTag}".`
              : "Nenhum artigo encontrado nesta categoria."}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedPosts.map((post, index) => (
              <React.Fragment key={post.slug}>
                <ArticleCard post={post} />
                {/* Insert ad after every 2nd article */}
                {index === 1 && paginatedPosts.length > 2 && (
                  <div className="col-span-1 md:col-span-2 flex justify-center py-2">
                    <AdSlot slotId="blog-between-articles" format="banner" className="hidden md:flex" />
                    <AdSlot slotId="blog-between-articles-mobile" format="mobile" className="md:hidden" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination className="mt-10">
            <PaginationContent>
              {safePage > 1 && (
                <PaginationItem>
                  <PaginationPrevious onClick={() => goToPage(safePage - 1)} className="cursor-pointer">
                    Anterior
                  </PaginationPrevious>
                </PaginationItem>
              )}
              {getVisiblePages().map((p, i) =>
                p === "ellipsis" ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink isActive={p === safePage} onClick={() => goToPage(p)} className="cursor-pointer">
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              {safePage < totalPages && (
                <PaginationItem>
                  <PaginationNext onClick={() => goToPage(safePage + 1)} className="cursor-pointer">
                    Próximo
                  </PaginationNext>
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </Layout>
  );
};

export default Blog;
