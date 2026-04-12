// Category cover images
import tdahImg from "@/assets/categories/tdah.jpg";
import teaImg from "@/assets/categories/tea.jpg";
import dislexiaImg from "@/assets/categories/dislexia.jpg";
import altasHabilidadesImg from "@/assets/categories/altas-habilidades.jpg";
import tocImg from "@/assets/categories/toc.jpg";

// Blog article cover images
import tdahAdultosImg from "@/assets/blog/tdah-em-adultos.jpg";
import tdahCriancasImg from "@/assets/blog/tdah-em-criancas.jpg";

export const categoryImages: Record<string, string> = {
  tdah: tdahImg,
  tea: teaImg,
  dislexia: dislexiaImg,
  "altas-habilidades": altasHabilidadesImg,
  toc: tocImg,
};

export const blogImages: Record<string, string> = {
  "tdah-em-adultos-sinais-e-diagnostico": tdahAdultosImg,
  "tdah-em-criancas-como-identificar": tdahCriancasImg,
};
