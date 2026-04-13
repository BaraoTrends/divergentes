import { useEffect } from "react";

const SITEMAP_URL = `https://wmdjjvjmwvsceqbcmksb.supabase.co/functions/v1/sitemap`;

const SitemapRedirect = () => {
  useEffect(() => {
    window.location.replace(SITEMAP_URL);
  }, []);
  return null;
};

export default SitemapRedirect;
