import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleCard from "@/components/ArticleCard";
import { blogPosts } from "@/lib/content";
import { generateBreadcrumbSchema } from "@/lib/seo";

const Blog = () => {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Início", url: "/" },
    { name: "Blog", url: "/blog" },
  ]);

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
        <p className="text-muted-foreground mb-8">Artigos informativos sobre neurodivergências, escritos com base em evidências científicas.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blogPosts.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Blog;
