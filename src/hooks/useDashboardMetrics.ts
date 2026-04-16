import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TopArticle {
  article_id: string;
  title: string;
  slug: string;
  category: string;
  views: number;
  unique_sessions: number;
  avg_read_time: number;
  avg_scroll_depth: number;
}

export interface CategoryViews {
  category: string;
  views: number;
}

export interface ViewsTimelinePoint {
  day: string;
  views: number;
  unique_sessions: number;
}

export function useTopArticles(daysBack = 30, limit = 10) {
  return useQuery({
    queryKey: ["metrics", "top-articles", daysBack, limit],
    queryFn: async (): Promise<TopArticle[]> => {
      const { data, error } = await supabase.rpc("get_top_articles", {
        days_back: daysBack,
        result_limit: limit,
      });
      if (error) throw error;
      return (data || []) as TopArticle[];
    },
  });
}

export function useViewsByCategory(daysBack = 30) {
  return useQuery({
    queryKey: ["metrics", "by-category", daysBack],
    queryFn: async (): Promise<CategoryViews[]> => {
      const { data, error } = await supabase.rpc("get_views_by_category", {
        days_back: daysBack,
      });
      if (error) throw error;
      return (data || []) as CategoryViews[];
    },
  });
}

export interface DeviceViews {
  device: string;
  views: number;
}

export interface ReferrerViews {
  referrer: string;
  views: number;
}

export function useViewsByDevice(daysBack = 30) {
  return useQuery({
    queryKey: ["metrics", "by-device", daysBack],
    queryFn: async (): Promise<DeviceViews[]> => {
      const { data, error } = await supabase.rpc("get_views_by_device" as any, {
        days_back: daysBack,
      });
      if (error) throw error;
      return (data || []) as DeviceViews[];
    },
  });
}

export function useTopReferrers(daysBack = 30, limit = 10) {
  return useQuery({
    queryKey: ["metrics", "top-referrers", daysBack, limit],
    queryFn: async (): Promise<ReferrerViews[]> => {
      const { data, error } = await supabase.rpc("get_top_referrers" as any, {
        days_back: daysBack,
        result_limit: limit,
      });
      if (error) throw error;
      return (data || []) as ReferrerViews[];
    },
  });
}

export function useViewsTimeline(daysBack = 30) {
  return useQuery({
    queryKey: ["metrics", "timeline", daysBack],
    queryFn: async (): Promise<ViewsTimelinePoint[]> => {
      const { data, error } = await supabase.rpc("get_views_timeline", {
        days_back: daysBack,
      });
      if (error) throw error;
      return (data || []) as ViewsTimelinePoint[];
    },
  });
}
