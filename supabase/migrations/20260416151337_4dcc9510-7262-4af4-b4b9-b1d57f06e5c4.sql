
CREATE TABLE public.indexing_health_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  score integer NOT NULL,
  total_articles integer NOT NULL DEFAULT 0,
  critical_count integer NOT NULL DEFAULT 0,
  warning_count integer NOT NULL DEFAULT 0,
  tip_count integer NOT NULL DEFAULT 0,
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (recorded_at)
);

ALTER TABLE public.indexing_health_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage health history"
  ON public.indexing_health_history
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
