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

export const blogPosts: BlogPost[] = [
  {
    slug: "tdah-em-adultos-sinais-e-diagnostico",
    title: "TDAH em Adultos: Sinais, Diagnóstico e Como Buscar Ajuda",
    excerpt: "Muitos adultos convivem com o TDAH sem saber. Conheça os sinais mais comuns, como é feito o diagnóstico e os caminhos para uma vida mais equilibrada.",
    category: "tdah",
    author: "Equipe Neurodivergências",
    datePublished: "2025-01-15",
    dateModified: "2025-03-10",
    readingTime: 8,
    image: "/placeholder.svg",
    content: `
## O que é TDAH em adultos?

O Transtorno de Déficit de Atenção e Hiperatividade (TDAH) não é exclusivo da infância. Estima-se que **cerca de 4% da população adulta mundial** conviva com o transtorno, muitas vezes sem diagnóstico formal.

Durante muito tempo, acreditou-se que o TDAH "desaparecia" na vida adulta. Hoje, a ciência mostra que, embora os sintomas possam se manifestar de forma diferente, o transtorno persiste em grande parte dos casos.

## Sinais mais comuns em adultos

Os sintomas do TDAH em adultos costumam ser mais sutis do que em crianças. Alguns dos sinais mais frequentes incluem:

### Desatenção
- Dificuldade em manter o foco em tarefas longas ou repetitivas
- Esquecimentos frequentes (compromissos, chaves, prazos)
- Tendência a iniciar vários projetos sem concluí-los
- Dificuldade em organizar tarefas e gerenciar o tempo

### Hiperatividade (mais internalizada)
- Inquietação mental constante
- Dificuldade em relaxar ou "desligar"
- Falar excessivamente em situações sociais
- Sensação de estar sempre "ligado"

### Impulsividade
- Tomar decisões precipitadas
- Interromper conversas com frequência
- Dificuldade em esperar a vez
- Gastos impulsivos

## Como é feito o diagnóstico?

O diagnóstico de TDAH em adultos é **clínico**, ou seja, baseado na avaliação de um profissional especializado — geralmente um psiquiatra ou neurologista com experiência em TDAH.

O processo normalmente inclui:

1. **Entrevista clínica detalhada** — histórico de sintomas desde a infância
2. **Questionários padronizados** — como o ASRS (Adult ADHD Self-Report Scale)
3. **Avaliação de comorbidades** — ansiedade, depressão, transtornos do sono
4. **Histórico escolar e profissional** — padrões de dificuldade ao longo da vida

> **Importante:** Não existe um exame de sangue ou imagem que diagnostique o TDAH. Desconfie de profissionais que prometem diagnóstico rápido sem avaliação completa.

## Tratamento

O tratamento do TDAH em adultos geralmente combina:

- **Medicação** — estimulantes (metilfenidato, lisdexanfetamina) ou não-estimulantes (atomoxetina)
- **Terapia cognitivo-comportamental (TCC)** — estratégias práticas para organização e gestão emocional
- **Mudanças no estilo de vida** — exercício físico regular, higiene do sono, alimentação equilibrada
- **Coaching para TDAH** — apoio na criação de rotinas e sistemas de organização

## Quando buscar ajuda?

Se você se identificou com vários dos sinais descritos acima e eles causam **prejuízo significativo** na sua vida pessoal, profissional ou nos relacionamentos, considere procurar um profissional especializado.

O TDAH é um transtorno real, com base neurobiológica, e o tratamento adequado pode transformar significativamente a qualidade de vida.

---

*Este artigo tem caráter informativo e não substitui avaliação médica profissional.*
    `,
  },
  {
    slug: "tdah-em-criancas-como-identificar",
    title: "TDAH em Crianças: Como Identificar os Primeiros Sinais",
    excerpt: "Identificar o TDAH na infância é fundamental para garantir o suporte adequado. Saiba quais são os sinais de alerta e quando procurar avaliação profissional.",
    category: "tdah",
    author: "Equipe Neurodivergências",
    datePublished: "2025-02-01",
    dateModified: "2025-03-15",
    readingTime: 7,
    image: "/placeholder.svg",
    content: `
## TDAH na infância: mais do que "falta de limites"

O TDAH é um dos transtornos do neurodesenvolvimento mais comuns na infância, afetando entre **5% e 8% das crianças** em idade escolar. Apesar disso, ainda é cercado de mitos e preconceitos.

É fundamental entender que o TDAH **não é resultado de má educação**, falta de limites ou excesso de telas. Trata-se de uma condição neurobiológica que afeta o funcionamento de áreas do cérebro responsáveis pela atenção, planejamento e controle de impulsos.

## Tipos de TDAH

O TDAH pode se manifestar de três formas principais:

### Predominantemente desatento
- Parece "sonhar acordado"
- Perde objetos com frequência
- Tem dificuldade em seguir instruções
- Esquece atividades do dia a dia
- Evita tarefas que exigem esforço mental prolongado

### Predominantemente hiperativo-impulsivo
- Não consegue ficar sentado por muito tempo
- Corre ou escala em situações inadequadas
- Fala excessivamente
- Tem dificuldade em esperar a vez
- Interrompe os outros frequentemente

### Combinado
Apresenta sintomas significativos tanto de desatenção quanto de hiperatividade-impulsividade.

## Sinais de alerta por faixa etária

### Pré-escola (3 a 5 anos)
- Agitação motora intensa, além do esperado para a idade
- Dificuldade em brincar em silêncio
- Acidentes frequentes por impulsividade
- Mudança rápida de uma atividade para outra

### Idade escolar (6 a 12 anos)
- Dificuldade em acompanhar as aulas
- Caderno desorganizado, tarefas incompletas
- Problemas de relacionamento com colegas
- Baixo desempenho escolar apesar de inteligência adequada
- "Parece que não escuta quando falam com ele"

## Quando procurar avaliação?

Nem toda criança agitada tem TDAH. Os sinais devem:

- Estar presentes em **mais de um ambiente** (casa e escola, por exemplo)
- Persistir por **pelo menos 6 meses**
- Causar **prejuízo funcional** significativo
- **Não ser melhor explicados** por outro transtorno ou situação

## O papel da escola e da família

A escola é frequentemente o primeiro ambiente onde os sinais se tornam mais evidentes. Professores atentos podem ser aliados importantes na identificação precoce.

Para a família, é essencial:

- **Não culpar a criança** pelos sintomas
- **Buscar informação de qualidade** sobre o transtorno
- **Manter diálogo aberto** com a escola
- **Procurar avaliação profissional** sem demora

## Tratamento na infância

O tratamento do TDAH em crianças pode incluir:

- **Intervenção comportamental** — estratégias de manejo em casa e na escola
- **Terapia** — TCC adaptada para crianças
- **Medicação** — quando indicada pelo médico, após avaliação criteriosa
- **Adaptações escolares** — direito garantido por lei no Brasil

> **Lembre-se:** O diagnóstico precoce e o suporte adequado fazem toda a diferença na trajetória de uma criança com TDAH.

---

*Este artigo tem caráter informativo e não substitui avaliação médica profissional.*
    `,
  },
];

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
