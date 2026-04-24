import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { glossaryTerms } from "@/lib/content";
import { generateBreadcrumbSchema } from "@/lib/seo";
import { ROUTE_KEYWORDS } from "@/lib/keywords";

const Glossario = () => {
  const sorted = [...glossaryTerms].sort((a, b) => a.term.localeCompare(b.term, "pt-BR"));
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Início", url: "/" },
    { name: "Glossário", url: "/glossario" },
  ]);

  return (
    <Layout>
      <SEOHead
        title="Glossário de Neurodivergências"
        description="Glossário com os principais termos relacionados a neurodivergências: definições claras e acessíveis."
        path="/glossario"
        keywords={ROUTE_KEYWORDS["/glossario"]}
        schemas={[breadcrumbSchema]}
      />
      <div className="container py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Glossário" }]} />

        <div className="max-w-3xl">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">Glossário</h1>
          <p className="text-muted-foreground mb-8">Termos importantes para entender o universo das neurodivergências.</p>

          <div className="space-y-6">
            {sorted.map((item) => (
              <div key={item.term} id={item.term.toLowerCase().replace(/[^a-z0-9]/g, "-")} className="scroll-mt-20">
                <h2 className="font-heading font-bold text-foreground text-lg">{item.term}</h2>
                <p className="text-muted-foreground leading-relaxed mt-1">{item.definition}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Glossario;
