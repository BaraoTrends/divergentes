import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { generateBreadcrumbSchema } from "@/lib/seo";
import { ROUTE_KEYWORDS } from "@/lib/keywords";

const Sobre = () => {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Início", url: "/" },
    { name: "Sobre", url: "/sobre" },
  ]);

  return (
    <Layout>
      <SEOHead
        title="Sobre"
        description="Conheça o Neurodivergências: um portal dedicado a oferecer informação acessível e confiável sobre neurodivergências para o público brasileiro."
        path="/sobre"
        keywords={ROUTE_KEYWORDS["/sobre"]}
        schemas={[breadcrumbSchema]}
      />
      <div className="container py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Sobre" }]} />

        <div className="max-w-3xl space-y-6">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Sobre o projeto</h1>

          <p className="text-muted-foreground leading-relaxed">
            O <strong className="text-foreground">Neurodivergências</strong> nasceu da necessidade de oferecer 
            informação acessível, confiável e em português brasileiro sobre as diversas formas de neurodiversidade.
          </p>

          <h2 className="font-heading text-xl font-bold text-foreground mt-8">Nossa missão</h2>
          <p className="text-muted-foreground leading-relaxed">
            Democratizar o acesso à informação de qualidade sobre TDAH, Autismo (TEA), Dislexia, 
            Altas Habilidades/Superdotação, TOC e outras condições neurodivergentes. Acreditamos que 
            o conhecimento é o primeiro passo para a inclusão e o acolhimento.
          </p>

          <h2 className="font-heading text-xl font-bold text-foreground mt-8">Nossos valores</h2>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-foreground font-bold">🎯</span>
              <span><strong className="text-foreground">Acessibilidade</strong> — conteúdo pensado para todos, incluindo pessoas neurodivergentes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-bold">📚</span>
              <span><strong className="text-foreground">Base em evidências</strong> — informações fundamentadas em pesquisa científica atual.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-bold">💛</span>
              <span><strong className="text-foreground">Acolhimento</strong> — linguagem respeitosa e empática, sem julgamentos.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-bold">🤝</span>
              <span><strong className="text-foreground">Inclusão</strong> — reconhecimento da neurodiversidade como parte da diversidade humana.</span>
            </li>
          </ul>

          <h2 className="font-heading text-xl font-bold text-foreground mt-8">Aviso importante</h2>
          <p className="text-muted-foreground leading-relaxed">
            Este site tem caráter exclusivamente informativo e educacional. O conteúdo aqui apresentado 
            <strong className="text-foreground"> não substitui avaliação, diagnóstico ou tratamento profissional</strong>. 
            Se você suspeita de alguma condição neurodivergente, procure um profissional de saúde qualificado.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Sobre;
