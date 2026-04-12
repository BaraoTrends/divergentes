import { Helmet } from "react-helmet-async";
import { SITE_URL, SITE_NAME, type SEOData } from "@/lib/seo";

interface Props extends SEOData {
  schemas?: object[];
  noindex?: boolean;
}

const SEOHead = ({ title, description, path, image, type = "website", schemas = [], noindex = false }: Props) => {
  const fullTitle = path === "/" ? `${SITE_NAME} — ${title}` : `${title} | ${SITE_NAME}`;
  const canonical = `${SITE_URL}${path}`;
  const ogImage = image || `${SITE_URL}/og-default.jpg`;
  const descTrimmed = description.length > 160 ? description.slice(0, 157) + "..." : description;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={descTrimmed} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={descTrimmed} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="pt_BR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={descTrimmed} />
      <meta name="twitter:image" content={ogImage} />

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
