import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";

const PoliticaPrivacidade = () => {
  return (
    <Layout>
      <SEOHead
        title="Política de Privacidade"
        description="Política de privacidade do Neuro Rotina. Saiba como coletamos, usamos e protegemos seus dados pessoais."
        path="/politica-de-privacidade"
      />

      <div className="container max-w-3xl py-12">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-8">
          Política de Privacidade
        </h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              1. Introdução
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              O Neuro Rotina ("nós", "nosso") se compromete a proteger a privacidade dos visitantes do nosso site. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              2. Dados que coletamos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos coletar os seguintes tipos de dados:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li><strong>Dados de navegação:</strong> endereço IP, tipo de navegador, páginas visitadas, tempo de permanência e dados de cookies.</li>
              <li><strong>Dados fornecidos voluntariamente:</strong> nome e e-mail quando você entra em contato conosco ou se inscreve em nossa newsletter.</li>
              <li><strong>Dados de anúncios:</strong> nossos parceiros de publicidade podem coletar dados para exibição de anúncios relevantes, conforme suas próprias políticas de privacidade.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              3. Como usamos seus dados
            </h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Melhorar a experiência de navegação e o conteúdo do site.</li>
              <li>Enviar comunicações solicitadas (newsletter, respostas a contato).</li>
              <li>Exibir anúncios personalizados por meio de parceiros de publicidade.</li>
              <li>Analisar estatísticas de acesso para aprimorar nossos serviços.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              4. Cookies e tecnologias de rastreamento
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies e tecnologias similares para personalizar conteúdo, exibir anúncios e analisar o tráfego do site. Você pode gerenciar as preferências de cookies nas configurações do seu navegador. Ao continuar navegando, você consente com o uso de cookies conforme esta política.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              5. Compartilhamento de dados
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Não vendemos seus dados pessoais. Podemos compartilhar informações com:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Serviços de análise (ex.: Google Analytics) para entender o uso do site.</li>
              <li>Redes de publicidade (ex.: Google AdSense) para exibição de anúncios.</li>
              <li>Autoridades legais, quando exigido por lei.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              6. Seus direitos (LGPD)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Conforme a LGPD, você tem direito a:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Confirmar a existência de tratamento de seus dados.</li>
              <li>Acessar, corrigir ou solicitar a exclusão de seus dados pessoais.</li>
              <li>Revogar o consentimento para o uso de seus dados.</li>
              <li>Solicitar a portabilidade dos dados.</li>
              <li>Obter informações sobre o compartilhamento de seus dados.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Para exercer seus direitos, entre em contato conosco pela página de{" "}
              <a href="/contato" className="text-primary hover:underline">Contato</a>.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              7. Segurança dos dados
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, perda ou destruição. No entanto, nenhum sistema é 100% seguro, e não podemos garantir a segurança absoluta das informações.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              8. Alterações nesta política
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Recomendamos que você revise esta página regularmente. A data da última atualização será sempre indicada no topo desta página.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              9. Contato
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco pela página de{" "}
              <a href="/contato" className="text-primary hover:underline">Contato</a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default PoliticaPrivacidade;
