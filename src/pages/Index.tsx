import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import ArticleCard from "@/components/ArticleCard";
import NewsletterCTA from "@/components/NewsletterCTA";
import { categories } from "@/lib/content";
import type { BlogPost } from "@/lib/content";
import { categoryImages } from "@/lib/images";
import { generateWebSiteSchema, generateOrganizationSchema } from "@/lib/seo";
import { ROUTE_KEYWORDS } from "@/lib/keywords";
import { useArticles } from "@/hooks/useArticles";

const Index = () => {
  const { data: dbArticles = [] } = useArticles({ publishedOnly: true });

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of dbArticles) {
      counts[a.category] = (counts[a.category] || 0) + 1;
    }
    return counts;
  }, [dbArticles]);

  const recentPosts: BlogPost[] = dbArticles.slice(0, 4).map((a) => ({
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

  return (
    <Layout>
      <SEOHead
        title="TDAH, Autismo, Dislexia, Altas Habilidades e TOC"
        description="Guia completo sobre TDAH, Autismo (TEA), Dislexia, Altas Habilidades e TOC. Artigos baseados em evidências, glossário e recursos para famílias brasileiras."
        path="/"
        keywords={ROUTE_KEYWORDS["/"]}
        schemas={[generateWebSiteSchema(), generateOrganizationSchema()]}
      />

      {/* Hero */}
      <section className="container py-12 md:py-20">
        <div className="max-w-3xl">
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4">
            Entendendo as <span className="text-primary">neurodivergências</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl">
            Informação acessível e baseada em evidências sobre TDAH, Autismo, Dislexia, 
            Altas Habilidades, TOC e outras formas de neurodiversidade. Para você, sua família e educadores.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/perguntas-frequentes"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Começar a explorar <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/sobre"
              className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Sobre o projeto
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container pb-16">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Explore por categoria</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/${cat.slug}`}
              className="group rounded-lg border bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/20"
            >
              {categoryImages[cat.slug] && (
                <div className="h-32 overflow-hidden">
                  <img
                    src={categoryImages[cat.slug]}
                    alt={cat.name}
                    width={1200}
                    height={672}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                        {cat.shortName}
                      </h3>
                      {categoryCounts[cat.slug] != null && (
                        <span className="text-[11px] font-medium bg-primary/10 text-primary rounded-full px-2 py-0.5">
                          {categoryCounts[cat.slug]} {categoryCounts[cat.slug] === 1 ? "artigo" : "artigos"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{cat.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest articles */}
      {recentPosts.length > 0 && (
        <section className="container pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold text-foreground">Artigos recentes</h2>
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentPosts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="container pb-16 max-w-2xl mx-auto">
        <NewsletterCTA />
      </section>
    </Layout>
  );
};

export default Index;
