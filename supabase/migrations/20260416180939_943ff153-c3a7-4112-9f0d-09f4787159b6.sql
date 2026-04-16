-- Tabela de visualizações de artigos
CREATE TABLE public.article_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  referrer TEXT,
  device TEXT,
  user_agent TEXT,
  read_time_seconds INTEGER DEFAULT 0,
  scroll_depth INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_article_views_article_id ON public.article_views(article_id);
CREATE INDEX idx_article_views_created_at ON public.article_views(created_at DESC);
CREATE INDEX idx_article_views_session ON public.article_views(session_id, article_id);

ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode inserir visualizações (tracking público)
CREATE POLICY "Anyone can record views"
ON public.article_views
FOR INSERT
TO public
WITH CHECK (true);

-- Apenas admins podem ler visualizações brutas
CREATE POLICY "Admins can read views"
ON public.article_views
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Função: top artigos por visualizações no período
CREATE OR REPLACE FUNCTION public.get_top_articles(days_back INTEGER DEFAULT 30, result_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  article_id UUID,
  title TEXT,
  slug TEXT,
  category TEXT,
  views BIGINT,
  unique_sessions BIGINT,
  avg_read_time NUMERIC,
  avg_scroll_depth NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Função: visualizações por categoria
CREATE OR REPLACE FUNCTION public.get_views_by_category(days_back INTEGER DEFAULT 30)
RETURNS TABLE (category TEXT, views BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.category, COUNT(v.id)::BIGINT AS views
  FROM public.articles a
  INNER JOIN public.article_views v ON v.article_id = a.id
  WHERE v.created_at >= now() - (days_back || ' days')::INTERVAL
  GROUP BY a.category
  ORDER BY views DESC;
$$;

-- Função: timeline de visualizações
CREATE OR REPLACE FUNCTION public.get_views_timeline(days_back INTEGER DEFAULT 30)
RETURNS TABLE (day DATE, views BIGINT, unique_sessions BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    DATE(v.created_at) AS day,
    COUNT(*)::BIGINT AS views,
    COUNT(DISTINCT v.session_id)::BIGINT AS unique_sessions
  FROM public.article_views v
  WHERE v.created_at >= now() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(v.created_at)
  ORDER BY day ASC;
$$;