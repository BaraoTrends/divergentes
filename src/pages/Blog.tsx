import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleCard from "@/components/ArticleCard";
import { blogPosts } from "@/lib/content";
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

const POSTS_PER_PAGE = 4;

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Math.max(1, Number(searchParams.get("pagina") || "1"));
  const totalPages = Math.ceil(blogPosts.length / POSTS_PER_PAGE);
  const safePage = Math.min(currentPage, totalPages);

  const paginatedPosts = blogPosts.slice(
    (safePage - 1) * POSTS_PER_PAGE,
    safePage * POSTS_PER_PAGE
  );

  const goToPage = (page: number) => {
    if (page === 1) {
      setSearchParams({});
    } else {
      setSearchParams({ pagina: String(page) });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        schemas={[breadcrumbSchema]}
      />
      <div className="container py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Blog" }]} />

        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">Blog</h1>
        <p className="text-muted-foreground mb-8">
          Artigos informativos sobre neurodivergências, escritos com base em evidências científicas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedPosts.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>

        {totalPages > 1 && (
          <Pagination className="mt-10">
            <PaginationContent>
              {safePage > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => goToPage(safePage - 1)}
                    className="cursor-pointer"
                  >
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
                    <PaginationLink
                      isActive={p === safePage}
                      onClick={() => goToPage(p)}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              {safePage < totalPages && (
                <PaginationItem>
                  <PaginationNext
                    onClick={() => goToPage(safePage + 1)}
                    className="cursor-pointer"
                  >
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
