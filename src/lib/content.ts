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
  {
    slug: "tea-sinais-na-infancia",
    title: "Autismo na Infância: Sinais Precoces e a Importância do Diagnóstico",
    excerpt: "Reconhecer os sinais do TEA nos primeiros anos de vida permite intervenções mais eficazes. Saiba o que observar e quando buscar avaliação.",
    category: "tea",
    author: "Equipe Neurodivergências",
    datePublished: "2025-02-15",
    dateModified: "2025-03-20",
    readingTime: 9,
    image: "/placeholder.svg",
    content: `
## O que é o Transtorno do Espectro Autista?

O Transtorno do Espectro Autista (TEA) é uma condição do neurodesenvolvimento que afeta a comunicação social, o comportamento e o processamento sensorial. O termo **"espectro"** reflete a enorme diversidade de manifestações — cada pessoa autista é única.

O diagnóstico precoce é fundamental: quanto antes as intervenções começarem, melhores são os resultados no desenvolvimento da criança.

## Sinais precoces (0 a 2 anos)

Alguns sinais podem ser observados ainda nos primeiros meses de vida:

- **Pouco contato visual** — o bebê evita ou sustenta pouco o olhar
- **Não responde ao nome** — parece não ouvir quando chamado
- **Ausência de sorriso social** — não sorri em resposta ao sorriso dos cuidadores
- **Atraso na fala** — não balbucia aos 12 meses, não fala palavras simples aos 16 meses
- **Não aponta ou gesticula** — não usa gestos para se comunicar
- **Preferência por brincar sozinho** — pouco interesse em interação com outras crianças

## Sinais na idade pré-escolar (3 a 5 anos)

### Comunicação social
- Dificuldade em manter conversas recíprocas
- Uso de linguagem de forma peculiar (ecolalia, inversão pronominal)
- Dificuldade em entender expressões faciais e linguagem corporal
- Pouco interesse em brincadeiras de faz-de-conta

### Comportamento
- Movimentos repetitivos (flapping, girar, balançar)
- Interesse intenso e restrito em temas específicos
- Resistência a mudanças na rotina
- Sensibilidade a estímulos sensoriais (sons, texturas, luzes)

## Como é feito o diagnóstico?

O diagnóstico do TEA é **clínico e multidisciplinar**, envolvendo:

1. **Avaliação pediátrica** — triagem inicial com instrumentos como M-CHAT
2. **Avaliação neuropsicológica** — testes cognitivos e de desenvolvimento
3. **Avaliação fonoaudiológica** — comunicação e linguagem
4. **Observação comportamental** — usando instrumentos como o ADOS-2

> **Importante:** O diagnóstico pode ser feito em qualquer idade, mas a identificação precoce (antes dos 3 anos) permite intervenções mais eficazes.

## Intervenções baseadas em evidências

- **Análise do Comportamento Aplicada (ABA)** — intervenção comportamental estruturada
- **Terapia ocupacional** — desenvolvimento de habilidades motoras e sensoriais
- **Fonoaudiologia** — comunicação verbal e não-verbal
- **Intervenção mediada pelos pais** — os cuidadores como agentes terapêuticos
- **Apoio escolar especializado** — adaptações e inclusão

## O papel da família

A família é o pilar central no desenvolvimento da criança autista:

- **Buscar informação de qualidade** e evitar mitos
- **Celebrar as conquistas** e respeitar o ritmo da criança
- **Criar um ambiente previsível** e sensorialmente adequado
- **Cuidar da própria saúde emocional** — pais também precisam de suporte

---

*Este artigo tem caráter informativo e não substitui avaliação médica profissional.*
    `,
  },
  {
    slug: "dislexia-na-escola-como-ajudar",
    title: "Dislexia na Escola: Como Identificar e Apoiar o Aluno",
    excerpt: "A dislexia pode ser confundida com preguiça ou falta de inteligência. Entenda como reconhecer os sinais na escola e quais estratégias ajudam.",
    category: "dislexia",
    author: "Equipe Neurodivergências",
    datePublished: "2025-03-01",
    dateModified: "2025-03-25",
    readingTime: 7,
    image: "/placeholder.svg",
    content: `
## Dislexia: muito além da troca de letras

A dislexia é um transtorno específico de aprendizagem de **origem neurobiológica**, que afeta a precisão e fluência na leitura e as habilidades de decodificação. Afeta cerca de **10% da população** e não tem relação com inteligência.

Muitas crianças disléxicas passam anos na escola sem diagnóstico, sendo rotuladas como "preguiçosas" ou "pouco inteligentes" — o que causa enorme sofrimento emocional.

## Sinais de alerta na escola

### Educação infantil e alfabetização
- Dificuldade em aprender o alfabeto e associar letras a sons
- Problemas com rimas e jogos fonológicos
- Atraso no desenvolvimento da fala
- Dificuldade em memorizar sequências (dias da semana, meses)

### Ensino fundamental
- Leitura lenta, silabada e com muitos erros
- Troca, omissão ou inversão de letras (b/d, p/q)
- Dificuldade em compreender o que leu
- Escrita com muitos erros ortográficos
- Evita ler em voz alta
- Discrepância entre inteligência verbal e desempenho em leitura/escrita

### Ensino médio e além
- Leitura lenta mesmo após anos de prática
- Dificuldade com idiomas estrangeiros
- Preferência por conteúdo visual ou auditivo
- Cansaço excessivo após atividades de leitura

## O que a escola pode fazer?

### Adaptações em sala de aula
- **Mais tempo** para provas e atividades de leitura
- **Avaliações orais** como alternativa ou complemento
- **Material impresso** com fonte maior e espaçamento adequado
- **Uso de tecnologia assistiva** (leitores de tela, audiobooks)
- **Sentar o aluno próximo ao professor** para melhor acompanhamento

### Estratégias pedagógicas
- **Método multissensorial** — associar visão, audição e tato no aprendizado
- **Instrução fônica explícita** — ensinar sistematicamente a relação letra-som
- **Mapas mentais e organizadores gráficos** — apoiar a compreensão
- **Feedback positivo** — valorizar o esforço, não apenas o resultado

## Direitos do aluno disléxico

No Brasil, a **Lei 14.254/2021** garante acompanhamento integral para alunos com dislexia, TDAH e outros transtornos de aprendizagem. Isso inclui:

- Identificação precoce pela escola
- Encaminhamento para diagnóstico
- Adaptações pedagógicas e de avaliação
- Formação continuada dos professores

> **Lembre-se:** Com o suporte adequado, alunos disléxicos podem alcançar todo o seu potencial. Muitas pessoas disléxicas se destacam em áreas como artes, ciências e empreendedorismo.

---

*Este artigo tem caráter informativo e não substitui avaliação profissional.*
    `,
  },
  {
    slug: "altas-habilidades-como-identificar",
    title: "Altas Habilidades: Como Identificar e Apoiar Crianças Superdotadas",
    excerpt: "Crianças com altas habilidades nem sempre são as 'melhores alunos'. Conheça os sinais, mitos e como oferecer o enriquecimento adequado.",
    category: "altas-habilidades",
    author: "Equipe Neurodivergências",
    datePublished: "2025-03-10",
    dateModified: "2025-04-01",
    readingTime: 8,
    image: "/placeholder.svg",
    content: `
## O que são Altas Habilidades/Superdotação?

Altas Habilidades/Superdotação (AH/SD) é um termo usado para descrever pessoas que demonstram **potencial elevado** em uma ou mais áreas: intelectual, acadêmica, criativa, artística, psicomotora ou de liderança.

No Brasil, estima-se que entre **3,5% e 5%** da população escolar tenha altas habilidades — o que representa milhões de crianças e adolescentes que, muitas vezes, não são identificados.

## Derrubando mitos

### Mito 1: "Superdotado é gênio em tudo"
**Realidade:** Pessoas com AH/SD podem ter habilidades excepcionais em áreas específicas e dificuldades em outras. É possível ter altas habilidades em matemática e dificuldade em escrita.

### Mito 2: "Não precisa de apoio, já é inteligente"
**Realidade:** Sem estímulo adequado, crianças com AH/SD podem desenvolver problemas emocionais, comportamentais e até evasão escolar por tédio.

### Mito 3: "É sempre o melhor aluno da classe"
**Realidade:** Muitas crianças com AH/SD têm desempenho escolar mediano ou até baixo, especialmente quando o currículo não as desafia. Isso é chamado de **underachievement**.

### Mito 4: "É uma condição só intelectual"
**Realidade:** As AH/SD podem se manifestar em criatividade, artes, esportes, liderança e outras áreas além da acadêmica.

## Sinais de altas habilidades

- **Curiosidade intensa** e questionamentos profundos desde cedo
- **Vocabulário avançado** para a idade
- **Aprendizagem rápida** com pouca repetição
- **Memória excepcional** para temas de interesse
- **Pensamento abstrato** e capacidade de fazer conexões incomuns
- **Perfeccionismo** e autocrítica elevada
- **Sensibilidade emocional** intensa
- **Preferência por companhia de crianças mais velhas ou adultos**
- **Senso de humor sofisticado**
- **Interesse profundo** em temas específicos (dinossauros, astronomia, história)

## Dupla excepcionalidade

Um conceito importante é a **dupla excepcionalidade**: quando uma pessoa tem altas habilidades **e** outra condição, como TDAH, TEA, dislexia ou ansiedade.

Nesses casos, uma condição pode mascarar a outra:
- As altas habilidades compensam as dificuldades, atrasando o diagnóstico
- As dificuldades mascaram as altas habilidades, impedindo o enriquecimento

## Como apoiar

1. **Identificação profissional** — avaliação com psicólogo especializado
2. **Enriquecimento curricular** — atividades mais complexas e aprofundadas
3. **Aceleração de série** — quando adequada ao desenvolvimento socioemocional
4. **Programas de mentoria** — contato com profissionais das áreas de interesse
5. **Apoio socioemocional** — acolhimento das questões emocionais

> **No Brasil**, o MEC reconhece alunos com AH/SD como público-alvo da Educação Especial, garantindo atendimento educacional especializado (AEE).

---

*Este artigo tem caráter informativo e não substitui avaliação profissional.*
    `,
  },
  {
    slug: "toc-alem-das-manias",
    title: "TOC: Muito Além das Manias — Entendendo o Transtorno Obsessivo-Compulsivo",
    excerpt: "O TOC é muito mais do que mania de limpeza. Conheça as diferentes formas do transtorno, como ele afeta a vida e quais tratamentos funcionam.",
    category: "toc",
    author: "Equipe Neurodivergências",
    datePublished: "2025-03-20",
    dateModified: "2025-04-05",
    readingTime: 8,
    image: "/placeholder.svg",
    content: `
## O que é o TOC?

O Transtorno Obsessivo-Compulsivo (TOC) é uma condição de saúde mental caracterizada por **obsessões** (pensamentos, imagens ou impulsos intrusivos e indesejados) e **compulsões** (comportamentos repetitivos realizados para aliviar a ansiedade causada pelas obsessões).

O TOC afeta cerca de **2% da população mundial** e pode se manifestar em qualquer idade, embora frequentemente comece na infância ou adolescência.

## Obsessões: mais do que preocupações

As obsessões do TOC são diferentes de preocupações comuns. São pensamentos:

- **Intrusivos** — surgem sem que a pessoa queira
- **Repetitivos** — voltam constantemente, mesmo quando a pessoa tenta ignorá-los
- **Perturbadores** — causam angústia, medo ou nojo intensos
- **Ego-distônicos** — a pessoa reconhece que são irracionais, mas não consegue controlá-los

## Tipos comuns de TOC

### Contaminação
- Medo excessivo de germes, sujeira ou substâncias tóxicas
- Lavagem excessiva das mãos ou limpeza compulsiva
- Evitar tocar objetos ou pessoas

### Verificação
- Checar repetidamente se a porta está trancada, o fogão desligado
- Reler textos várias vezes por medo de erros
- Verificar constantemente se não atropelou alguém ao dirigir

### Simetria e ordem
- Necessidade de que objetos estejam perfeitamente alinhados
- Angústia quando algo está "fora do lugar"
- Rituais de contagem ou organização

### Pensamentos intrusivos
- Pensamentos violentos ou sexuais indesejados
- Medo de fazer algo terrível impulsivamente
- Dúvida constante sobre a própria moralidade

### Acumulação
- Dificuldade em descartar objetos, mesmo sem valor
- Medo de que algo ruim aconteça se jogar algo fora

## O ciclo do TOC

O TOC funciona em um ciclo vicioso:

1. **Obsessão** — surge um pensamento intrusivo
2. **Ansiedade** — o pensamento causa angústia intensa
3. **Compulsão** — a pessoa realiza um ritual para aliviar a ansiedade
4. **Alívio temporário** — a ansiedade diminui momentaneamente
5. **Retorno** — a obsessão volta, e o ciclo recomeça

O problema é que as compulsões **reforçam** as obsessões, tornando o ciclo cada vez mais forte.

## Tratamento baseado em evidências

### Terapia Cognitivo-Comportamental (TCC)
A **Exposição e Prevenção de Resposta (EPR)** é o tratamento psicológico mais eficaz para o TOC. Consiste em:

- Exposição gradual às situações que provocam obsessões
- Prevenção da realização das compulsões
- Aprendizagem de que a ansiedade diminui naturalmente sem o ritual

### Medicação
- **Inibidores Seletivos de Recaptação de Serotonina (ISRS)** — fluoxetina, sertralina, fluvoxamina
- Geralmente em doses mais altas do que para depressão
- A combinação de TCC-EPR + medicação costuma oferecer os melhores resultados

## Quando buscar ajuda?

Procure um profissional se as obsessões e compulsões:

- Ocupam **mais de 1 hora por dia**
- Causam **sofrimento significativo**
- Interferem no **trabalho, estudos ou relacionamentos**
- Limitam **atividades que antes eram normais**

> **O TOC é tratável.** Com o tratamento adequado, a maioria das pessoas apresenta melhora significativa na qualidade de vida.

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
