
-- Table to track indexing status of each article over time
CREATE TABLE public.indexing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  verdict TEXT NOT NULL DEFAULT 'UNKNOWN',
  coverage_state TEXT,
  last_crawl_time TIMESTAMPTZ,
  previous_verdict TEXT,
  changed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(article_id)
);

-- Table for indexing alerts (deindexed, errors, etc.)
CREATE TABLE public.indexing_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'deindexed',
  message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies: only admins can access
ALTER TABLE public.indexing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indexing_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage indexing_status"
  ON public.indexing_status FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage indexing_alerts"
  ON public.indexing_alerts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
