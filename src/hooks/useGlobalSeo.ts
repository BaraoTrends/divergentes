import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useMemo } from "react";

export interface GlobalSeo {
  titleSeparator: string;
  canonicalBase: string;
  defaultOgImage: string;
  ogLocale: string;
  ogType: string;
  twitterCard: string;
  twitterHandle: string;
  robotsDefault: string;
  orgName: string;
  orgLogo: string;
  facebookAppId: string;
  googleVerification: string;
  bingVerification: string;
}

export const useGlobalSeo = (): GlobalSeo | null => {
  const { data: settings } = useSiteSettings("seo");

  return useMemo(() => {
    if (!settings || settings.length === 0) return null;
    const get = (key: string) => settings.find((s) => s.key === key)?.value ?? "";
    return {
      titleSeparator: get("seo_title_separator") || "|",
      canonicalBase: get("seo_canonical_url") || "https://neurorotina.com",
      defaultOgImage: get("seo_default_og_image"),
      ogLocale: get("seo_og_locale") || "pt_BR",
      ogType: get("seo_og_type") || "website",
      twitterCard: get("seo_twitter_card") || "summary_large_image",
      twitterHandle: get("seo_twitter_handle"),
      robotsDefault: get("seo_robots_default") || "index, follow",
      orgName: get("seo_org_name") || "Neurodivergências",
      orgLogo: get("seo_org_logo"),
      facebookAppId: get("seo_facebook_app_id"),
      googleVerification: get("seo_google_verification") || get("google_verification"),
      bingVerification: get("seo_bing_verification"),
    };
  }, [settings]);
};
