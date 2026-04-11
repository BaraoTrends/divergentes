import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import ArticleCard from "@/components/ArticleCard";
import NewsletterCTA from "@/components/NewsletterCTA";
import { categories, blogPosts } from "@/lib/content";
import { generateWebSiteSchema, generateOrganizationSchema } from "@/lib/seo";

const Index = () => {
  return (
    <Layout>
      <SEOHead
        title="Informação acessível sobre neurodivergências"
        description="Portal informativo sobre neurodivergências: TDAH, TEA, Dislexia, Altas Habilidades, TOC e mais. Informação acessível e confiável para o público brasileiro."
        path="/"
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
              className="group rounded-lg border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                    {cat.shortName}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{cat.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest articles */}
      <section className="container pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold text-foreground">Artigos recentes</h2>
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blogPosts.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="container pb-16 max-w-2xl mx-auto">
        <NewsletterCTA />
      </section>
    </Layout>
  );
};

export default Index;
