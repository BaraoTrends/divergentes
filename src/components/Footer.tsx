import { Link } from "react-router-dom";
import { categories } from "@/lib/content";
import logoImg from "@/assets/logo-neuro-rotina.png";
import AdSlot from "./AdSlot";

const Footer = () => {
  return (
    <footer className="border-t bg-card mt-16" role="contentinfo">
      {/* Footer ad */}
      <div className="container pt-8 hidden md:block">
        <AdSlot slotId="footer-banner" format="leaderboard" />
      </div>
      <div className="container pt-8 md:hidden">
        <AdSlot slotId="footer-mobile" format="mobile" />
      </div>
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
              <img src={logoImg} alt="Neuro Rotina" className="h-6 w-6" width={24} height={24} />
              Neuro Rotina
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Informação acessível e confiável sobre neurodivergências para o público brasileiro.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-heading font-bold text-foreground mb-3">Categorias</h4>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link to={`/${cat.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {cat.icon} {cat.shortName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional */}
          <div>
            <h4 className="font-heading font-bold text-foreground mb-3">Institucional</h4>
            <ul className="space-y-2">
              <li><Link to="/sobre" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sobre</Link></li>
              <li><Link to="/contato" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contato</Link></li>
              <li><Link to="/perguntas-frequentes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/glossario" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Glossário</Link></li>
            </ul>
          </div>

          {/* Content */}
          <div>
            <h4 className="font-heading font-bold text-foreground mb-3">Conteúdo</h4>
            <ul className="space-y-2">
              <li><Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Neuro Rotina. Conteúdo informativo — não substitui avaliação profissional.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
