import { Link, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleCard from "@/components/ArticleCard";
import NewsletterCTA from "@/components/NewsletterCTA";
import { Button } from "@/components/ui/button";
import { categories, blogPosts as staticPosts } from "@/lib/content";
import type { BlogPost } from "@/lib/content";
import { categoryImages } from "@/lib/images";
import { generateBreadcrumbSchema } from "@/lib/seo";
import { CATEGORY_KEYWORDS, SITE_KEYWORDS } from "@/lib/keywords";
import { useArticles } from "@/hooks/useArticles";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const hubContent: Record<string, { intro: string; sections: { title: string; content: string }[] }> = {
  tdah: {
    intro: "O Transtorno de Déficit de Atenção e Hiperatividade (TDAH) é uma condição neurobiológica que afeta cerca de 5% das crianças e 4% dos adultos no mundo. Caracteriza-se por padrões persistentes de desatenção, hiperatividade e/ou impulsividade que impactam o funcionamento diário.",
    sections: [
      { title: "O que é TDAH?", content: "O TDAH é um transtorno do neurodesenvolvimento com base genética e neurobiológica. Afeta o funcionamento de neurotransmissores como dopamina e noradrenalina, que são essenciais para atenção, motivação e controle de impulsos. Não é resultado de má educação, preguiça ou falta de inteligência." },
      { title: "Sintomas principais", content: "Os sintomas do TDAH se dividem em três grupos: desatenção (dificuldade em manter foco, esquecimentos frequentes, desorganização), hiperatividade (inquietação, dificuldade em ficar parado, fala excessiva) e impulsividade (agir sem pensar, interromper conversas, dificuldade em esperar). A apresentação varia: pode ser predominantemente desatenta, hiperativa-impulsiva ou combinada." },
      { title: "Diagnóstico", content: "O diagnóstico é clínico, feito por profissionais especializados (psiquiatras, neurologistas, neuropsicólogos). Envolve entrevista detalhada, questionários padronizados, avaliação do histórico desde a infância e exclusão de outras condições. Não existe exame laboratorial que diagnostique TDAH." },
      { title: "Tratamento", content: "O tratamento é multimodal: pode incluir medicação (estimulantes como metilfenidato ou não-estimulantes como atomoxetina), terapia cognitivo-comportamental (TCC), coaching para TDAH, e mudanças no estilo de vida como exercícios físicos e organização de rotinas." },
    ],
  },
  tea: {
    intro: "O Transtorno do Espectro Autista (TEA) é uma condição do neurodesenvolvimento que afeta a comunicação social, o comportamento e o processamento sensorial. O termo 'espectro' reflete a grande diversidade de manifestações.",
    sections: [
      { title: "O que é o TEA?", content: "O autismo é uma condição neurológica que acompanha a pessoa ao longo da vida. Afeta como ela percebe o mundo, se comunica e interage socialmente. Não é uma doença — é uma forma diferente de funcionamento cerebral que faz parte da diversidade humana." },
      { title: "Características", content: "Diferenças na comunicação social, padrões de comportamento repetitivos, interesses intensos e focados, e particularidades no processamento sensorial (hiper ou hipossensibilidade a sons, luzes, texturas)." },
      { title: "Níveis de suporte", content: "O DSM-5 classifica o autismo em três níveis: Nível 1 (pouco suporte), Nível 2 (suporte substancial) e Nível 3 (suporte muito substancial). Esses níveis podem variar ao longo da vida." },
      { title: "Diagnóstico e intervenções", content: "O diagnóstico pode ser feito em qualquer idade. As intervenções podem incluir terapia ocupacional, fonoaudiologia, TCC adaptada e apoio educacional especializado." },
    ],
  },
  dislexia: {
    intro: "A dislexia é um transtorno específico de aprendizagem que afeta a leitura, escrita e soletração. Tem origem neurobiológica e não está relacionada à inteligência.",
    sections: [
      { title: "O que é dislexia?", content: "A dislexia afeta a precisão e/ou fluência na leitura e habilidades de decodificação. Afeta cerca de 10% da população e frequentemente tem componente hereditário." },
      { title: "Sinais comuns", content: "Na pré-escola: dificuldade com rimas. Na idade escolar: leitura lenta, troca de letras. Na vida adulta: leitura lenta, evitar ler em público." },
      { title: "Avaliação", content: "Feita por equipe multidisciplinar (neuropsicólogo, fonoaudiólogo, psicopedagogo) com testes de leitura, escrita e processamento fonológico." },
      { title: "Estratégias de apoio", content: "Métodos multissensoriais, tecnologias assistivas, adaptações escolares e fortalecimento da autoestima." },
    ],
  },
  "altas-habilidades": {
    intro: "Altas Habilidades/Superdotação (AH/SD) se refere a pessoas que demonstram potencial elevado em áreas como intelectual, acadêmica, criativa, artística ou de liderança.",
    sections: [
      { title: "O que são Altas Habilidades?", content: "Pessoas que apresentam habilidades significativamente acima da média em áreas específicas. Podem ter grande curiosidade intelectual, pensamento criativo e aprendizagem rápida." },
      { title: "Mitos comuns", content: "Pessoas com AH/SD podem ter dificuldades escolares e problemas emocionais. A 'dupla excepcionalidade' (AH/SD + outra condição) é mais comum do que se imagina." },
      { title: "Identificação", content: "Envolve avaliação multidimensional: testes de inteligência, avaliação de criatividade, observação comportamental e portfólio de produções." },
      { title: "Enriquecimento educacional", content: "Enriquecimento curricular, aceleração de série, programas extracurriculares, mentoria e desenvolvimento socioemocional." },
    ],
  },
  toc: {
    intro: "O Transtorno Obsessivo-Compulsivo (TOC) é caracterizado por pensamentos intrusivos recorrentes (obsessões) e comportamentos repetitivos (compulsões). Afeta cerca de 2% da população.",
    sections: [
      { title: "O que é TOC?", content: "O TOC envolve obsessões (pensamentos indesejados que causam ansiedade) e compulsões (comportamentos repetitivos para reduzir essa ansiedade). Vai muito além de 'manias de limpeza'." },
      { title: "Tipos de manifestação", content: "Contaminação, verificação, simetria e ordem, pensamentos intrusivos e acumulação, entre outros." },
      { title: "Diagnóstico", content: "Clínico, feito por psiquiatra ou psicólogo. As obsessões e compulsões devem consumir tempo significativo ou causar prejuízo funcional." },
      { title: "Tratamento", content: "TCC com Exposição e Prevenção de Resposta (TCC-EPR) e medicação (ISRS). A combinação geralmente oferece os melhores resultados." },
    ],
  },
};

const POSTS_PER_PAGE = 6;

const CategoryHub = () => {
  const location = useLocation();
  const [page, setPage] = useState(1);
  const slug = location.pathname.replace("/", "");
  const category = categories.find((c) => c.slug === slug);
  const content = slug ? hubContent[slug] : undefined;
  const { data: dbArticles = [] } = useArticles({ publishedOnly: true });
  const dbRelated: BlogPost[] = dbArticles
    .filter((a) => a.category === slug)
    .map((a) => ({
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
  const dbSlugs = new Set(dbRelated.map((p) => p.slug));
  const staticRelated = staticPosts.filter((p) => p.category === slug && !dbSlugs.has(p.slug));
  const relatedPosts = [...dbRelated, ...staticRelated];
  const totalPages = Math.ceil(relatedPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = relatedPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  if (!category || !content) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold">Categoria não encontrada</h1>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">Voltar ao início</Link>
        </div>
      </Layout>
    );
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Início", url: "/" },
    { name: category.shortName, url: `/${category.slug}` },
  ]);

  return (
    <Layout>
      <SEOHead
        title={category.shortName}
        description={category.description}
        path={`/${category.slug}`}
        keywords={CATEGORY_KEYWORDS[category.slug] || SITE_KEYWORDS}
        schemas={[breadcrumbSchema]}
      />
      {categoryImages[slug] && (
        <div className="w-full h-48 md:h-64 overflow-hidden">
          <img
            src={categoryImages[slug]}
            alt={category.name}
            width={1200}
            height={672}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="container py-8 md:py-12">
        <Breadcrumbs items={[{ label: category.shortName }]} />

        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{category.icon}</span>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">{category.shortName}</h1>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">{content.intro}</p>

          <div className="space-y-8">
            {content.sections.map((section, i) => (
              <section key={i}>
                <h2 className="font-heading text-xl font-bold text-foreground mb-3">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              </section>
            ))}
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Artigos sobre {category.shortName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedPosts.map((post) => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Paginação" className="mt-8 flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            )}
          </div>
        )}

        <div className="mt-12 max-w-2xl">
          <NewsletterCTA />
        </div>
      </div>
    </Layout>
  );
};

export default CategoryHub;
