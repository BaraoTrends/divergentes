CREATE TABLE public.seo_audit_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  result JSONB,
  error_message TEXT,
  progress_total INT DEFAULT 0,
  progress_done INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.seo_audit_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit jobs"
ON public.seo_audit_jobs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit jobs"
ON public.seo_audit_jobs FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND user_id = auth.uid());

CREATE POLICY "Service role manages audit jobs"
ON public.seo_audit_jobs FOR ALL
TO service_role
USING (true) WITH CHECK (true);

CREATE INDEX idx_seo_audit_jobs_user_created ON public.seo_audit_jobs(user_id, created_at DESC);

CREATE TRIGGER trg_seo_audit_jobs_updated
BEFORE UPDATE ON public.seo_audit_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();