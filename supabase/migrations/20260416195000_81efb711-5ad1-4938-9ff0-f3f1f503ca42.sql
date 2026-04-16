
CREATE OR REPLACE FUNCTION public.get_views_by_device(days_back integer DEFAULT 30)
RETURNS TABLE(device text, views bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(v.device, 'unknown') AS device, COUNT(*)::BIGINT AS views
  FROM public.article_views v
  WHERE v.created_at >= now() - (days_back || ' days')::INTERVAL
  GROUP BY COALESCE(v.device, 'unknown')
  ORDER BY views DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_top_referrers(days_back integer DEFAULT 30, result_limit integer DEFAULT 10)
RETURNS TABLE(referrer text, views bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    CASE
      WHEN v.referrer IS NULL OR v.referrer = '' THEN '(direto)'
      ELSE regexp_replace(v.referrer, '^https?://([^/]+).*$', '\1')
    END AS referrer,
    COUNT(*)::BIGINT AS views
  FROM public.article_views v
  WHERE v.created_at >= now() - (days_back || ' days')::INTERVAL
  GROUP BY 1
  ORDER BY views DESC
  LIMIT result_limit;
$$;
