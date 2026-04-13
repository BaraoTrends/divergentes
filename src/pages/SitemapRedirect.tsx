import { useEffect, useState } from "react";

const SITEMAP_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sitemap`;

const SitemapRedirect = () => {
  const [error, setError] = useState(false);

  useEffect(() => {
    let isActive = true;

    const renderSitemap = async () => {
      try {
        const response = await fetch(SITEMAP_URL, {
          headers: {
            Accept: "application/xml, text/xml;q=0.9, */*;q=0.8",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load sitemap: ${response.status}`);
        }

        const xml = await response.text();

        if (!isActive) return;

        document.open("text/xml", "replace");
        document.write(xml);
        document.close();
      } catch (err) {
        console.error("Failed to render sitemap", err);
        if (isActive) setError(true);
      }
    };

    renderSitemap();

    return () => {
      isActive = false;
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Não foi possível carregar o sitemap agora.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
      Carregando sitemap...
    </div>
  );
};

export default SitemapRedirect;
