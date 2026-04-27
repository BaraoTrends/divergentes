-- Restrict EXECUTE on SECURITY DEFINER functions to prevent anonymous access
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sanitize_slug() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.trigger_social_publish() FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION public.get_views_timeline(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_views_by_category(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_views_by_device(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_top_articles(integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_top_referrers(integer, integer) FROM PUBLIC, anon;

-- has_role is needed by RLS policies for authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Analytics functions only for authenticated (RLS still requires admin role inside)
GRANT EXECUTE ON FUNCTION public.get_views_timeline(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_views_by_category(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_views_by_device(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_articles(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_referrers(integer, integer) TO authenticated;

-- Add admin-only guard inside analytics functions (defense in depth)
CREATE OR REPLACE FUNCTION public.get_views_timeline(days_back integer DEFAULT 30)
 RETURNS TABLE(day date, views bigint, unique_sessions bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
  SELECT
    DATE(v.created_at) AS day,
    COUNT(*)::BIGINT AS views,
    COUNT(DISTINCT v.session_id)::BIGINT AS unique_sessions
  FROM public.article_views v
  WHERE v.created_at >= now() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(v.created_at)
  ORDER BY day ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_views_by_category(days_back integer DEFAULT 30)
 RETURNS TABLE(category text, views bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
  SELECT a.category, COUNT(v.id)::BIGINT AS views
  FROM public.articles a
  INNER JOIN public.article_views v ON v.article_id = a.id
  WHERE v.created_at >= now() - (days_back || ' days')::INTERVAL
  GROUP BY a.category
  ORDER BY views DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_views_by_device(days_back integer DEFAULT 30)
 RETURNS TABLE(device text, views bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
  SELECT COALESCE(v.device, 'unknown') AS device, COUNT(*)::BIGINT AS views
  FROM public.article_views v
  WHERE v.created_at >= now() - (days_back || ' days')::INTERVAL
  GROUP BY COALESCE(v.device, 'unknown')
  ORDER BY views DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_top_articles(days_back integer DEFAULT 30, result_limit integer DEFAULT 10)
 RETURNS TABLE(article_id uuid, title text, slug text, category text, views bigint, unique_sessions bigint, avg_read_time numeric, avg_scroll_depth numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.slug,
    a.category,
    COUNT(v.id)::BIGINT AS views,
    COUNT(DISTINCT v.session_id)::BIGINT AS unique_sessions,
    COALESCE(ROUND(AVG(NULLIF(v.read_time_seconds, 0))::NUMERIC, 0), 0) AS avg_read_time,
    COALESCE(ROUND(AVG(NULLIF(v.scroll_depth, 0))::NUMERIC, 0), 0) AS avg_scroll_depth
  FROM public.articles a
  INNER JOIN public.article_views v ON v.article_id = a.id
  WHERE v.created_at >= now() - (days_back || ' days')::INTERVAL
  GROUP BY a.id, a.title, a.slug, a.category
  ORDER BY views DESC
  LIMIT result_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_top_referrers(days_back integer DEFAULT 30, result_limit integer DEFAULT 10)
 RETURNS TABLE(referrer text, views bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
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
END;
$function$;

-- Re-revoke after CREATE OR REPLACE (which resets privileges)
REVOKE EXECUTE ON FUNCTION public.get_views_timeline(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_views_by_category(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_views_by_device(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_top_articles(integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_top_referrers(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_views_timeline(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_views_by_category(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_views_by_device(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_articles(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_referrers(integer, integer) TO authenticated;