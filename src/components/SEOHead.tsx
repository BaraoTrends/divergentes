import { Helmet } from "react-helmet-async";
import { SITE_URL, SITE_NAME, type SEOData } from "@/lib/seo";
import { useGlobalSeo } from "@/hooks/useGlobalSeo";

interface Props extends SEOData {
  schemas?: object[];
  noindex?: boolean;
  keywords?: string[];
}

const SEOHead = ({ title, description, path, image, type = "website", schemas = [], noindex = false, keywords = [], article }: Props) => {
  const seo = useGlobalSeo();

  const separator = seo?.titleSeparator || "|";
  const siteName = seo?.orgName || SITE_NAME;
  const baseUrl = seo?.canonicalBase || SITE_URL;

  const rawTitle = path === "/" ? `${siteName} — ${title}` : `${title} ${separator} ${siteName}`;
  const fullTitle = rawTitle.length > 60 ? title : rawTitle;
  const canonical = `${baseUrl}${path}`;
  const ogImage = image || seo?.defaultOgImage || `${baseUrl}/og-default.jpg`;
  const descTrimmed = description.length > 160 ? description.slice(0, 157) + "..." : description;
  const robots = noindex ? "noindex, nofollow" : (seo?.robotsDefault || "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
  const twitterCard = seo?.twitterCard || "summary_large_image";
  const ogLocale = seo?.ogLocale || "pt_BR";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={descTrimmed} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={robots} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(", ")} />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={descTrimmed} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={ogLocale} />

      {type === "article" && article && (
        <>
          <meta property="article:published_time" content={article.datePublished} />
          <meta property="article:modified_time" content={article.dateModified} />
          <meta property="article:author" content={article.author} />
          <meta property="article:section" content={article.category} />
        </>
      )}
      {type === "article" && keywords.length > 0 && keywords.map((kw, i) => (
        <meta key={`tag-${i}`} property="article:tag" content={kw} />
      ))}

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={descTrimmed} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={title} />
      {seo?.twitterHandle && <meta name="twitter:site" content={seo.twitterHandle} />}
      {seo?.facebookAppId && <meta property="fb:app_id" content={seo.facebookAppId} />}
      {seo?.googleVerification && <meta name="google-site-verification" content={seo.googleVerification} />}
      {seo?.bingVerification && <meta name="msvalidate.01" content={seo.bingVerification} />}

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
