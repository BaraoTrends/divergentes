import { useSiteSettings } from "./useSiteSettings";

const slotToSettingKey: Record<string, string> = {
  "header-banner": "ads_header_enabled",
  "header-mobile": "ads_header_enabled",
  "footer-banner": "ads_footer_enabled",
  "footer-mobile": "ads_footer_enabled",
  "sidebar-top": "ads_sidebar_enabled",
  "sidebar-bottom": "ads_sidebar_enabled",
  "blog-between-articles": "ads_between_posts_enabled",
  "blog-between-articles-mobile": "ads_between_posts_enabled",
};

export const useIsAdEnabled = (slotId: string): boolean => {
  const { data: settings } = useSiteSettings();
  const settingKey = slotToSettingKey[slotId];
  if (!settingKey) return true; // unknown slots default to visible
  const setting = settings?.find((s) => s.key === settingKey);
  return setting?.value === "true";
};
