
CREATE TABLE public.keyword_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  page text,
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  ctr numeric(5,4) NOT NULL DEFAULT 0,
  position numeric(6,2) NOT NULL DEFAULT 0,
  date date NOT NULL,
  country text,
  device text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(query, page, date, country, device)
);

ALTER TABLE public.keyword_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage keyword_rankings"
  ON public.keyword_rankings
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_keyword_rankings_query ON public.keyword_rankings(query);
CREATE INDEX idx_keyword_rankings_date ON public.keyword_rankings(date DESC);
CREATE INDEX idx_keyword_rankings_page ON public.keyword_rankings(page);
