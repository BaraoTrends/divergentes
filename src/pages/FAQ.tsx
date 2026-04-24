import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqItems } from "@/lib/content";
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/seo";
import { ROUTE_KEYWORDS } from "@/lib/keywords";

const FAQ = () => {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Início", url: "/" },
    { name: "Perguntas Frequentes", url: "/perguntas-frequentes" },
  ]);
  const faqSchema = generateFAQSchema(faqItems);

  return (
    <Layout>
      <SEOHead
        title="Perguntas Frequentes"
        description="Respostas para as dúvidas mais comuns sobre TDAH, TEA, Dislexia, Altas Habilidades, TOC e outras neurodivergências."
        path="/perguntas-frequentes"
        keywords={ROUTE_KEYWORDS["/perguntas-frequentes"]}
        schemas={[breadcrumbSchema, faqSchema]}
      />
      <div className="container py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Perguntas Frequentes" }]} />

        <div className="max-w-3xl">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">Perguntas Frequentes</h1>
          <p className="text-muted-foreground mb-8">Respostas claras e baseadas em evidências para as dúvidas mais comuns sobre neurodivergências.</p>

          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Layout>
  );
};

export default FAQ;
