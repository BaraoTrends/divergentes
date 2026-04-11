import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleCard from "@/components/ArticleCard";
import NewsletterCTA from "@/components/NewsletterCTA";
import { categories, blogPosts } from "@/lib/content";
import { generateBreadcrumbSchema } from "@/lib/seo";

// Hub content per category
const hubContent: Record<string, { intro: string; sections: { title: string; content: string }[] }> = {
  tdah: {
    intro: "O Transtorno de Déficit de Atenção e Hiperatividade (TDAH) é uma condição neurobiológica que afeta cerca de 5% das crianças e 4% dos adultos no mundo. Caracteriza-se por padrões persistentes de desatenção, hiperatividade e/ou impulsividade que impactam o funcionamento diário.",
    sections: [
      {
        title: "O que é TDAH?",
        content: "O TDAH é um transtorno do neurodesenvolvimento com base genética e neurobiológica. Afeta o funcionamento de neurotransmissores como dopamina e noradrenalina, que são essenciais para atenção, motivação e controle de impulsos. Não é resultado de má educação, preguiça ou falta de inteligência.",
      },
      {
        title: "Sintomas principais",
        content: "Os sintomas do TDAH se dividem em três grupos: desatenção (dificuldade em manter foco, esquecimentos frequentes, desorganização), hiperatividade (inquietação, dificuldade em ficar parado, fala excessiva) e impulsividade (agir sem pensar, interromper conversas, dificuldade em esperar). A apresentação varia: pode ser predominantemente desatenta, hiperativa-impulsiva ou combinada.",
      },
      {
        title: "Diagnóstico",
        content: "O diagnóstico é clínico, feito por profissionais especializados (psiquiatras, neurologistas, neuropsicólogos). Envolve entrevista detalhada, questionários padronizados, avaliação do histórico desde a infância e exclusão de outras condições. Não existe exame laboratorial que diagnostique TDAH.",
      },
      {
        title: "Tratamento",
        content: "O tratamento é multimodal: pode incluir medicação (estimulantes como metilfenidato ou não-estimulantes como atomoxetina), terapia cognitivo-comportamental (TCC), coaching para TDAH, e mudanças no estilo de vida como exercícios físicos e organização de rotinas. O tratamento deve ser personalizado para cada pessoa.",
      },
    ],
  },
  tea: {
    intro: "O Transtorno do Espectro Autista (TEA) é uma condição do neurodesenvolvimento que afeta a comunicação social, o comportamento e o processamento sensorial. O termo 'espectro' reflete a grande diversidade de manifestações — cada pessoa autista é única.",
    sections: [
      {
        title: "O que é o TEA?",
        content: "O autismo é uma condição neurológica que acompanha a pessoa ao longo da vida. Afeta como ela percebe o mundo, se comunica e interage socialmente. Não é uma doença e não tem cura — é uma forma diferente de funcionamento cerebral que faz parte da diversidade humana.",
      },
      {
        title: "Características",
        content: "As principais características incluem: diferenças na comunicação social (dificuldade em entender linguagem não-verbal, metáforas ou sarcasmo), padrões de comportamento repetitivos, interesses intensos e focados, e particularidades no processamento sensorial (hiper ou hipossensibilidade a sons, luzes, texturas).",
      },
      {
        title: "Níveis de suporte",
        content: "O DSM-5 classifica o autismo em três níveis de suporte: Nível 1 (necessita pouco suporte), Nível 2 (necessita suporte substancial) e Nível 3 (necessita suporte muito substancial). É importante entender que esses níveis podem variar ao longo da vida e conforme o contexto.",
      },
      {
        title: "Diagnóstico e intervenções",
        content: "O diagnóstico pode ser feito em qualquer idade, embora a identificação precoce permita intervenções mais eficazes. As intervenções podem incluir terapia ocupacional, fonoaudiologia, TCC adaptada, e apoio educacional especializado.",
      },
    ],
  },
  dislexia: {
    intro: "A dislexia é um transtorno específico de aprendizagem que afeta a leitura, escrita e soletração. Tem origem neurobiológica e não está relacionada à inteligência. Com o suporte adequado, pessoas disléxicas podem ter excelente desempenho acadêmico e profissional.",
    sections: [
      {
        title: "O que é dislexia?",
        content: "A dislexia é uma dificuldade específica de aprendizagem de origem neurobiológica que afeta a precisão e/ou fluência na leitura e habilidades de decodificação. Afeta cerca de 10% da população e frequentemente tem componente hereditário.",
      },
      {
        title: "Sinais comuns",
        content: "Os sinais variam por idade: na pré-escola (dificuldade com rimas, aprender letras), na idade escolar (leitura lenta, troca de letras, dificuldade ortográfica) e na vida adulta (leitura lenta, evitar ler em público, dificuldade com línguas estrangeiras).",
      },
      {
        title: "Avaliação",
        content: "A avaliação é feita por equipe multidisciplinar (neuropsicólogo, fonoaudiólogo, psicopedagogo) e inclui testes de leitura, escrita, processamento fonológico e avaliação cognitiva. O diagnóstico diferencial é importante para distinguir de outras condições.",
      },
      {
        title: "Estratégias de apoio",
        content: "Incluem: métodos multissensoriais de alfabetização, uso de tecnologias assistivas, adaptações escolares (tempo extra em provas, uso de computador), fortalecimento da autoestima e trabalho com as habilidades fortes da pessoa.",
      },
    ],
  },
  "altas-habilidades": {
    intro: "Altas Habilidades/Superdotação (AH/SD) se refere a pessoas que demonstram potencial elevado em uma ou mais áreas: intelectual, acadêmica, criativa, artística, psicomotora ou de liderança. Estima-se que 3,5% a 5% da população apresente AH/SD.",
    sections: [
      {
        title: "O que são Altas Habilidades?",
        content: "AH/SD não significa ser 'gênio' em tudo. São pessoas que apresentam habilidades significativamente acima da média em áreas específicas. Podem ter grande curiosidade intelectual, pensamento criativo, aprendizagem rápida e senso de justiça aguçado.",
      },
      {
        title: "Mitos comuns",
        content: "Contrariando mitos populares: pessoas com AH/SD podem ter dificuldades escolares, problemas emocionais e sociais. Nem sempre tiram notas altas. A chamada 'dupla excepcionalidade' (AH/SD + outra condição como TDAH ou dislexia) é mais comum do que se imagina.",
      },
      {
        title: "Identificação",
        content: "A identificação envolve avaliação multidimensional: testes de inteligência, avaliação de criatividade, observação comportamental e portfólio de produções. Deve considerar o contexto cultural e socioeconômico da pessoa.",
      },
      {
        title: "Enriquecimento educacional",
        content: "As estratégias incluem: enriquecimento curricular (aprofundamento de conteúdos), aceleração de série (quando adequado), programas extracurriculares, mentoria com especialistas e desenvolvimento socioemocional.",
      },
    ],
  },
  toc: {
    intro: "O Transtorno Obsessivo-Compulsivo (TOC) é uma condição de saúde mental caracterizada por pensamentos intrusivos recorrentes (obsessões) e comportamentos repetitivos (compulsões). Afeta cerca de 2% da população e pode causar grande sofrimento.",
    sections: [
      {
        title: "O que é TOC?",
        content: "O TOC vai muito além de 'manias de limpeza'. É um transtorno que envolve obsessões (pensamentos, imagens ou impulsos indesejados e recorrentes que causam ansiedade intensa) e compulsões (comportamentos repetitivos realizados para reduzir essa ansiedade).",
      },
      {
        title: "Tipos de manifestação",
        content: "O TOC pode se manifestar de diversas formas: contaminação (medo de germes, lavagem excessiva), verificação (checar portas, fogão repetidamente), simetria e ordem, pensamentos intrusivos (de conteúdo agressivo, sexual ou religioso) e acumulação, entre outros.",
      },
      {
        title: "Diagnóstico",
        content: "O diagnóstico é clínico, feito por psiquiatra ou psicólogo. As obsessões e compulsões devem consumir tempo significativo (pelo menos 1 hora por dia) ou causar sofrimento/prejuízo funcional. Escalas como a Y-BOCS ajudam a avaliar a gravidade.",
      },
      {
        title: "Tratamento",
        content: "Os tratamentos mais eficazes são: Terapia Cognitivo-Comportamental com Exposição e Prevenção de Resposta (TCC-EPR) e medicação (inibidores seletivos de recaptação de serotonina — ISRS). A combinação dos dois geralmente oferece os melhores resultados.",
      },
    ],
  },
};

const CategoryHub = () => {
  const { slug } = useParams<{ slug: string }>();
  const category = categories.find((c) => c.slug === slug);
  const content = slug ? hubContent[slug] : undefined;
  const relatedPosts = blogPosts.filter((p) => p.category === slug);

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

  const breadcrumbItems = [{ label: category.shortName }];
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Início", url: "/" },
    { name: category.shortName, url: `/${category.slug}` },
  ]);

  return (
    <Layout>
      <SEOHead
        title={`${category.shortName} — ${category.name}`}
        description={category.description}
        path={`/${category.slug}`}
        schemas={[breadcrumbSchema]}
      />
      <div className="container py-8 md:py-12">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{category.icon}</span>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
              {category.shortName}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            {content.intro}
          </p>

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
            <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
              Artigos sobre {category.shortName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedPosts.map((post) => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>
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
