CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  stack TEXT,
  component_stack TEXT,
  url TEXT,
  user_agent TEXT,
  user_id UUID,
  session_id TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_logs_created_at ON public.error_logs (created_at DESC);
CREATE INDEX idx_error_logs_resolved ON public.error_logs (resolved);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert error logs"
  ON public.error_logs FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can read error logs"
  ON public.error_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update error logs"
  ON public.error_logs FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete error logs"
  ON public.error_logs FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));