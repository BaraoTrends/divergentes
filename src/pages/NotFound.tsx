import { Link, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  return (
    <Layout>
      <SEOHead
        title="Página não encontrada"
        description="A página que você procura não existe ou foi removida."
        path={location.pathname}
      />
      <div className="container py-16 md:py-24 text-center">
        <h1 className="font-heading text-6xl md:text-8xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-2">Página não encontrada</p>
        <p className="text-muted-foreground mb-8">
          A página que você procura não existe ou foi removida.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </Layout>
  );
};

export default NotFound;
