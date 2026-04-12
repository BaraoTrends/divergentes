import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search, Moon, Sun } from "lucide-react";
import { categories } from "@/lib/content";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo-neuro-rotina.png";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm border-b" : "bg-background border-b"
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logoImg} alt="Neuro Rotina" className="h-10 sm:h-12 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Navegação principal">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/${cat.slug}`}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                location.pathname.startsWith(`/${cat.slug}`) ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              }`}
            >
              {cat.shortName}
            </Link>
          ))}
          <Link
            to="/blog"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
              location.pathname.startsWith("/blog") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            }`}
          >
            Blog
          </Link>
          <Link
            to="/perguntas-frequentes"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
              location.pathname === "/perguntas-frequentes" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            }`}
          >
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleDark} aria-label={isDark ? "Modo claro" : "Modo escuro"}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Menu">
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {isOpen && (
        <nav className="lg:hidden border-t bg-background" aria-label="Navegação mobile">
          <div className="container py-4 space-y-1">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/${cat.slug}`}
                className="block px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.shortName}
              </Link>
            ))}
            <Link to="/blog" className="block px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              📝 Blog
            </Link>
            <Link to="/perguntas-frequentes" className="block px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              ❓ Perguntas Frequentes
            </Link>
            <Link to="/glossario" className="block px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              📚 Glossário
            </Link>
            <Link to="/sobre" className="block px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              ℹ️ Sobre
            </Link>
            <Link to="/contato" className="block px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              ✉️ Contato
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
