import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  category: string;
}

export const useSiteSettings = (category?: string) => {
  return useQuery({
    queryKey: ["site-settings", category],
    queryFn: async () => {
      let query = supabase.from("site_settings").select("*");
      if (category) query = query.eq("category", category);
      const { data, error } = await query.order("key");
      if (error) throw error;
      return data as SiteSetting[];
    },
  });
};

export const useUpdateSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("site_settings")
        .update({ value })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-settings"] }),
  });
};

export const useBulkUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: { key: string; value: string }[]) => {
      for (const s of settings) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: s.value })
          .eq("key", s.key);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-settings"] }),
  });
};

/** Helper to get a single setting value */
export const useSettingValue = (key: string) => {
  const { data } = useSiteSettings();
  return data?.find((s) => s.key === key)?.value ?? "";
};
