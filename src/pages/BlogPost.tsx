import { useParams, Link } from "react-router-dom";
import ArticleCard from "@/components/ArticleCard";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import ReadingProgress from "@/components/ReadingProgress";
import CategoryBadge from "@/components/CategoryBadge";
import NewsletterCTA from "@/components/NewsletterCTA";
import { blogPosts as staticPosts } from "@/lib/content";
import { blogImages } from "@/lib/images";
import { useArticleBySlug, useArticles } from "@/hooks/useArticles";
import { generateBreadcrumbSchema, generateArticleSchema, SITE_URL } from "@/lib/seo";
import { Clock, Calendar } from "lucide-react";
import type { BlogPost as BlogPostType } from "@/lib/content";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: dbArticle, isLoading } = useArticleBySlug(slug);
  const { data: dbArticles = [] } = useArticles({ publishedOnly: true });

  const staticPost = staticPosts.find((p) => p.slug === slug);

  // Use DB article if found, otherwise static
  const post: BlogPostType | undefined = dbArticle
    ? {
        slug: dbArticle.slug,
        title: dbArticle.title,
        excerpt: dbArticle.excerpt || "",
        category: dbArticle.category,
        author: "Equipe Neurodivergências",
        datePublished: dbArticle.created_at.split("T")[0],
        dateModified: dbArticle.updated_at.split("T")[0],
        readingTime: dbArticle.read_time,
        image: dbArticle.image_url || "/placeholder.svg",
        content: dbArticle.content,
      }
    : staticPost;

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold">Artigo não encontrado</h1>
          <Link to="/blog" className="text-primary hover:underline mt-4 inline-block">Voltar ao blog</Link>
        </div>
      </Layout>
    );
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Início", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url: `/blog/${post.slug}` },
  ]);

  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.excerpt,
    url: `/blog/${post.slug}`,
    image: `${SITE_URL}${post.image}`,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    author: post.author,
  });

  // Build all posts (DB + static) for related
  const dbAsBlogPosts: BlogPostType[] = dbArticles.map((a) => ({
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
  }));
  const dbSlugs = new Set(dbAsBlogPosts.map((p) => p.slug));
  const allPosts = [...dbAsBlogPosts, ...staticPosts.filter((p) => !dbSlugs.has(p.slug))];

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    const lines = content.trim().split("\n");
    const elements: JSX.Element[] = [];
    let inList = false;
    let listItems: string[] = [];
    let inBlockquote = false;
    let blockquoteLines: string[] = [];
    let inOrderedList = false;
    let orderedItems: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-6 space-y-1 text-muted-foreground">
            {listItems.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    const flushOrderedList = () => {
      if (orderedItems.length > 0) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-6 space-y-1 text-muted-foreground">
            {orderedItems.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ol>
        );
        orderedItems = [];
        inOrderedList = false;
      }
    };

    const flushBlockquote = () => {
      if (blockquoteLines.length > 0) {
        elements.push(
          <blockquote key={`bq-${elements.length}`} className="border-l-4 border-primary/30 pl-4 py-2 text-muted-foreground italic bg-accent/30 rounded-r-md">
            {blockquoteLines.map((line, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
            ))}
          </blockquote>
        );
        blockquoteLines = [];
        inBlockquote = false;
      }
    };

    const formatInline = (text: string) => {
      return text
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
    };

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === "") {
        flushList();
        flushOrderedList();
        flushBlockquote();
        continue;
      }

      if (trimmed === "---") {
        flushList();
        flushOrderedList();
        flushBlockquote();
        elements.push(<hr key={`hr-${elements.length}`} className="my-6 border-border" />);
        continue;
      }

      if (trimmed.startsWith("### ")) {
        flushList();
        flushOrderedList();
        flushBlockquote();
        elements.push(<h3 key={`h3-${elements.length}`} className="font-heading text-lg font-bold text-foreground mt-6 mb-2">{trimmed.slice(4)}</h3>);
        continue;
      }

      if (trimmed.startsWith("## ")) {
        flushList();
        flushOrderedList();
        flushBlockquote();
        elements.push(<h2 key={`h2-${elements.length}`} className="font-heading text-xl font-bold text-foreground mt-8 mb-3">{trimmed.slice(3)}</h2>);
        continue;
      }

      if (trimmed.startsWith("- ")) {
        flushOrderedList();
        flushBlockquote();
        inList = true;
        listItems.push(trimmed.slice(2));
        continue;
      }

      if (/^\d+\.\s/.test(trimmed)) {
        flushList();
        flushBlockquote();
        inOrderedList = true;
        orderedItems.push(trimmed.replace(/^\d+\.\s/, ""));
        continue;
      }

      if (trimmed.startsWith("> ")) {
        flushList();
        flushOrderedList();
        inBlockquote = true;
        blockquoteLines.push(trimmed.slice(2));
        continue;
      }

      flushList();
      flushOrderedList();
      flushBlockquote();
      elements.push(
        <p key={`p-${elements.length}`} className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
      );
    }

    flushList();
    flushOrderedList();
    flushBlockquote();

    return <div className="space-y-4">{elements}</div>;
  };

  const coverImage = dbArticle?.image_url || blogImages[post.slug];

  return (
    <Layout>
      <ReadingProgress />
      <SEOHead
        title={post.title}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        type="article"
        schemas={[breadcrumbSchema, articleSchema]}
      />
      <article className="container py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />

        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <CategoryBadge category={post.category} />
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime} min de leitura
            </span>
          </div>

          <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground leading-tight mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">
            <span>Por {post.author}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(post.datePublished).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>

          {coverImage && (
            <div className="rounded-lg overflow-hidden mb-8">
              <img
                src={coverImage}
                alt={post.title}
                width={1200}
                height={672}
                className="w-full h-auto"
              />
            </div>
          )}

          {isHtmlContent(post.content) ? (
            <div
              className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-heading prose-strong:text-foreground prose-a:text-primary prose-blockquote:border-primary/30 prose-blockquote:bg-accent/30 prose-blockquote:rounded-r-md prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            renderContent(post.content)
          )}

          <div className="mt-12">
            <NewsletterCTA />
          </div>

          {(() => {
            const related = allPosts
              .filter((p) => p.slug !== post.slug && p.category === post.category)
              .slice(0, 2);
            const extras = related.length < 2
              ? allPosts.filter((p) => p.slug !== post.slug && p.category !== post.category).slice(0, 2 - related.length)
              : [];
            const relatedPosts = [...related, ...extras];
            if (relatedPosts.length === 0) return null;
            return (
              <section className="mt-12 pt-8 border-t border-border">
                <h2 className="font-heading text-xl font-bold text-foreground mb-6">Artigos Relacionados</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedPosts.map((rp) => (
                    <ArticleCard key={rp.slug} post={rp} />
                  ))}
                </div>
              </section>
            );
          })()}
        </div>
      </article>
    </Layout>
  );
};

export default BlogPost;
