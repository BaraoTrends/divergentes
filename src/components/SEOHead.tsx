import { Helmet } from "react-helmet-async";
import { SITE_URL, SITE_NAME, type SEOData } from "@/lib/seo";

interface Props extends SEOData {
  schemas?: object[];
}

const SEOHead = ({ title, description, path, image, type = "website", schemas = [] }: Props) => {
  const fullTitle = path === "/" ? `${SITE_NAME} — ${title}` : `${title} | ${SITE_NAME}`;
  const canonical = `${SITE_URL}${path}`;
  const ogImage = image || `${SITE_URL}/og-default.jpg`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content="index, follow" />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="pt_BR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
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
