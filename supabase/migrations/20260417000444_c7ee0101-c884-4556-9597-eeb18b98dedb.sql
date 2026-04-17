CREATE TABLE public.social_publish_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID,
  article_title TEXT NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,
  make_status INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_social_publish_logs_triggered_at ON public.social_publish_logs (triggered_at DESC);
CREATE INDEX idx_social_publish_logs_status ON public.social_publish_logs (status);

ALTER TABLE public.social_publish_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read social publish logs"
  ON public.social_publish_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete social publish logs"
  ON public.social_publish_logs
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));