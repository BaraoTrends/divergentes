import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";

const TermosDeUso = () => {
  return (
    <Layout>
      <SEOHead
        title="Termos de Uso"
        description="Termos de uso do Neuro Rotina. Conheça as regras e condições para utilizar nosso site."
        path="/termos-de-uso"
      />

      <div className="container max-w-3xl py-12">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-8">
          Termos de Uso
        </h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              1. Aceitação dos Termos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e utilizar o site Neuro Rotina ("Site"), você concorda com estes Termos de Uso. Caso não concorde com qualquer disposição, recomendamos que não utilize o Site.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              2. Finalidade do Site
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              O Neuro Rotina é um portal informativo dedicado a neurodivergências, incluindo TDAH, TEA, Dislexia, Altas Habilidades e TOC. Todo o conteúdo é elaborado com base em evidências científicas e tem caráter exclusivamente informativo e educacional.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              3. Isenção de Responsabilidade Médica
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              O conteúdo disponível no Site <strong>não substitui</strong> avaliação, diagnóstico ou tratamento profissional. As informações publicadas não devem ser utilizadas para autodiagnóstico. Sempre consulte um profissional de saúde qualificado para orientações sobre condições específicas.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              4. Propriedade Intelectual
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo do Site — incluindo textos, imagens, logotipos, design e código — é de propriedade do Neuro Rotina ou de seus licenciadores e é protegido pela legislação brasileira de direitos autorais (Lei nº 9.610/98). É proibida a reprodução, distribuição ou modificação sem autorização prévia por escrito.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              5. Uso Permitido
            </h2>
            <p className="text-muted-foreground leading-relaxed">Ao utilizar o Site, você concorda em:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
              <li>Utilizar o conteúdo apenas para fins pessoais e não comerciais</li>
              <li>Não copiar, distribuir ou republicar o conteúdo sem autorização</li>
              <li>Não utilizar o Site para fins ilegais ou prejudiciais</li>
              <li>Não tentar acessar áreas restritas do Site sem autorização</li>
              <li>Não utilizar ferramentas automatizadas para extrair conteúdo (scraping)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              6. Links Externos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              O Site pode conter links para sites de terceiros. O Neuro Rotina não se responsabiliza pelo conteúdo, políticas de privacidade ou práticas de sites externos. Recomendamos que leia os termos e políticas de cada site que visitar.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              7. Anúncios
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              O Site pode exibir anúncios de terceiros. A presença de anúncios não implica endosso ou recomendação dos produtos ou serviços anunciados. A interação com anunciantes é de responsabilidade exclusiva do usuário.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              8. Disponibilidade do Site
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              O Neuro Rotina se esforça para manter o Site disponível de forma contínua, mas não garante disponibilidade ininterrupta. O Site pode ficar temporariamente indisponível para manutenção, atualizações ou por motivos técnicos.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              9. Limitação de Responsabilidade
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              O Neuro Rotina não será responsável por danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou da impossibilidade de uso do Site ou de seu conteúdo.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              10. Alterações nos Termos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de alterar estes Termos de Uso a qualquer momento. Alterações significativas serão comunicadas por meio do Site. O uso continuado após a publicação de alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              11. Legislação Aplicável
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será submetida ao foro da comarca do domicílio do Neuro Rotina.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              12. Contato
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas ou esclarecimentos sobre estes Termos, entre em contato através da nossa{" "}
              <a href="/contato" className="text-primary underline underline-offset-2 hover:text-primary/80">
                página de contato
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default TermosDeUso;
