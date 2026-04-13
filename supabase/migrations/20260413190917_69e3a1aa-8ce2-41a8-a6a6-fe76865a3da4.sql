
CREATE TABLE public.article_internal_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  target_article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  anchor_text TEXT NOT NULL,
  auto_generated BOOLEAN NOT NULL DEFAULT true,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT no_self_link CHECK (source_article_id != target_article_id),
  UNIQUE (source_article_id, target_article_id)
);

ALTER TABLE public.article_internal_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage internal links"
ON public.article_internal_links
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read approved links"
ON public.article_internal_links
FOR SELECT
TO public
USING (approved = true);

CREATE TRIGGER update_article_internal_links_updated_at
BEFORE UPDATE ON public.article_internal_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
