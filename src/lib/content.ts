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
