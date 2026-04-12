export interface Category {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  colorClass: string;
  bgClass: string;
  icon: string;
}

export const categories: Category[] = [
  {
    slug: "tdah",
    name: "Transtorno de Déficit de Atenção e Hiperatividade",
    shortName: "TDAH",
    description: "Entenda o TDAH: sintomas, diagnóstico, tratamento e como conviver com o transtorno no dia a dia.",
    colorClass: "text-cat-tdah",
    bgClass: "bg-cat-tdah",
    icon: "⚡",
  },
  {
    slug: "tea",
    name: "Transtorno do Espectro Autista",
    shortName: "TEA",
    description: "Informações sobre o espectro autista: características, diagnóstico, intervenções e inclusão.",
    colorClass: "text-cat-tea",
    bgClass: "bg-cat-tea",
    icon: "🧩",
  },
  {
    slug: "dislexia",
    name: "Dislexia",
    shortName: "Dislexia",
    description: "Saiba mais sobre dislexia: sinais, avaliação, estratégias de aprendizagem e apoio escolar.",
    colorClass: "text-cat-dislexia",
    bgClass: "bg-cat-dislexia",
    icon: "📖",
  },
  {
    slug: "altas-habilidades",
    name: "Altas Habilidades / Superdotação",
    shortName: "Altas Habilidades",
    description: "Descubra as características das altas habilidades, identificação precoce e enriquecimento educacional.",
    colorClass: "text-cat-ah",
    bgClass: "bg-cat-ah",
    icon: "🌟",
  },
  {
    slug: "toc",
    name: "Transtorno Obsessivo-Compulsivo",
    shortName: "TOC",
    description: "Compreenda o TOC: obsessões, compulsões, tratamento e qualidade de vida.",
    colorClass: "text-cat-toc",
    bgClass: "bg-cat-toc",
    icon: "🔄",
  },
];

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  datePublished: string;
  dateModified: string;
  readingTime: number;
  image: string;
  content: string;
}

export const blogPosts: BlogPost[] = [];

export const faqItems = [
  {
    question: "O que são neurodivergências?",
    answer: "Neurodivergência é um termo que reconhece que os cérebros humanos funcionam de maneiras diferentes. Condições como TDAH, autismo (TEA), dislexia, altas habilidades e TOC são exemplos de variações neurológicas que fazem parte da diversidade humana natural. O conceito foi cunhado pela socióloga Judy Singer nos anos 1990.",
  },
  {
    question: "Neurodivergência é uma doença?",
    answer: "Não. O paradigma da neurodiversidade entende essas condições como variações naturais do funcionamento cerebral, não como doenças a serem curadas. No entanto, muitas pessoas neurodivergentes podem precisar de suporte, adaptações e, em alguns casos, tratamento para lidar com desafios específicos do dia a dia.",
  },
  {
    question: "Como saber se eu sou neurodivergente?",
    answer: "A identificação de uma neurodivergência requer avaliação profissional — geralmente realizada por psicólogos, neuropsicólogos, psiquiatras ou neurologistas. Questionários online podem servir como triagem inicial, mas nunca substituem uma avaliação clínica completa.",
  },
  {
    question: "TDAH tem cura?",
    answer: "O TDAH não tem cura, pois não é uma doença, mas sim uma condição neurobiológica. No entanto, com tratamento adequado — que pode incluir medicação, terapia e mudanças no estilo de vida — é possível ter uma vida plena e produtiva. Muitos adultos com TDAH desenvolvem estratégias eficazes para lidar com os desafios do transtorno.",
  },
  {
    question: "Qual a diferença entre autismo leve e severo?",
    answer: "A classificação atual (DSM-5) utiliza níveis de suporte (1, 2 e 3) em vez de termos como 'leve' ou 'severo'. O nível 1 indica necessidade de pouco suporte, o nível 2 de suporte substancial, e o nível 3 de suporte muito substancial. É importante lembrar que o autismo é um espectro, e cada pessoa autista é única.",
  },
  {
    question: "Dislexia afeta a inteligência?",
    answer: "Não. A dislexia é uma dificuldade específica de aprendizagem que afeta a leitura e a escrita, mas não está relacionada à inteligência. Pessoas disléxicas frequentemente possuem inteligência igual ou superior à média e podem se destacar em áreas como pensamento visual, criatividade e resolução de problemas.",
  },
  {
    question: "Quais são os direitos de pessoas neurodivergentes no Brasil?",
    answer: "No Brasil, pessoas neurodivergentes são amparadas por diversas leis: a Lei Berenice Piana (12.764/2012) para autismo, a Lei 14.254/2021 para TDAH e dislexia no contexto escolar, e a Lei Brasileira de Inclusão (13.146/2015). Esses marcos legais garantem direitos como adaptações escolares, atendimento prioritário e inclusão no mercado de trabalho.",
  },
  {
    question: "Altas habilidades é a mesma coisa que ser gênio?",
    answer: "Não exatamente. Altas habilidades/superdotação se refere a pessoas que demonstram potencial elevado em uma ou mais áreas: intelectual, acadêmica, criativa, artística ou de liderança. Isso não significa que a pessoa seja 'gênio' em tudo — ela pode ter habilidades excepcionais em áreas específicas e desafios em outras.",
  },
  {
    question: "TOC é só mania de limpeza?",
    answer: "Não. O Transtorno Obsessivo-Compulsivo (TOC) é muito mais complexo do que manias de limpeza. Ele envolve pensamentos intrusivos e recorrentes (obsessões) que causam ansiedade intensa, levando a comportamentos repetitivos (compulsões) para aliviar essa angústia. O TOC pode se manifestar de diversas formas, incluindo verificação, contagem, simetria, pensamentos de contaminação e outros.",
  },
  {
    question: "É possível ser neurodivergente e não saber?",
    answer: "Sim, e isso é muito comum, especialmente entre adultos e mulheres. Muitas pessoas desenvolvem estratégias de compensação ao longo da vida que mascaram os sintomas, um fenômeno chamado 'masking' ou 'camuflagem'. Isso é particularmente frequente no autismo em mulheres e no TDAH do tipo desatento.",
  },
];

export const glossaryTerms = [
  { term: "Neurodiversidade", definition: "Conceito que reconhece a variação natural no funcionamento neurológico humano como parte da biodiversidade. Cunhado pela socióloga Judy Singer nos anos 1990." },
  { term: "Neurodivergente", definition: "Pessoa cujo funcionamento neurológico difere significativamente do padrão considerado típico. Inclui pessoas com TDAH, autismo, dislexia, entre outras condições." },
  { term: "Neurotípico", definition: "Pessoa cujo funcionamento neurológico se enquadra nos padrões considerados típicos pela sociedade." },
  { term: "Comorbidade", definition: "Ocorrência simultânea de duas ou mais condições em uma mesma pessoa. É muito comum entre neurodivergências — por exemplo, TDAH e ansiedade." },
  { term: "Hiperfoco", definition: "Estado de concentração intensa e prolongada em uma atividade de interesse, comum em pessoas com TDAH e autismo." },
  { term: "Stimming", definition: "Comportamentos repetitivos de autoestimulação (como balançar, girar objetos, morder lábios) usados para autorregulação sensorial, especialmente comum no autismo." },
  { term: "Masking (camuflagem)", definition: "Estratégia consciente ou inconsciente de esconder características neurodivergentes para se adequar às expectativas sociais. Comum no autismo e TDAH." },
  { term: "Disfunção executiva", definition: "Dificuldade em funções cerebrais responsáveis por planejamento, organização, início de tarefas, memória de trabalho e controle de impulsos." },
  { term: "Sensibilidade sensorial", definition: "Reação intensa a estímulos sensoriais (sons, luzes, texturas, cheiros) que pode ser hiper (excessiva) ou hipo (reduzida)." },
  { term: "Meltdown", definition: "Resposta intensa a uma sobrecarga sensorial ou emocional, caracterizada por perda temporária de controle. Diferente de uma birra, pois não é voluntário." },
  { term: "Shutdown", definition: "Resposta de 'desligamento' a uma sobrecarga, onde a pessoa pode ficar retraída, sem conseguir falar ou reagir. É uma forma de autoproteção neurológica." },
  { term: "TEA", definition: "Transtorno do Espectro Autista — condição do neurodesenvolvimento que afeta comunicação social, comportamento e processamento sensorial." },
  { term: "TDAH", definition: "Transtorno de Déficit de Atenção e Hiperatividade — condição neurobiológica que afeta atenção, controle de impulsos e, em alguns casos, nível de atividade." },
  { term: "DSM-5", definition: "Manual Diagnóstico e Estatístico de Transtornos Mentais, 5ª edição — referência internacional para classificação e diagnóstico de transtornos mentais." },
  { term: "Neuroplasticidade", definition: "Capacidade do cérebro de se reorganizar e formar novas conexões neurais ao longo da vida, base para muitas intervenções terapêuticas." },
];
