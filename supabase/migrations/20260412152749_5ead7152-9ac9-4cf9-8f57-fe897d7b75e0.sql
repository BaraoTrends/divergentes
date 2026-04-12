
-- Create articles table
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  author_id UUID NOT NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  read_time INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Published articles are viewable by everyone
CREATE POLICY "Published articles are viewable by everyone"
ON public.articles FOR SELECT
USING (published = true);

-- Admins can view all articles (including drafts)
CREATE POLICY "Admins can view all articles"
ON public.articles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can create articles
CREATE POLICY "Admins can create articles"
ON public.articles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update articles
CREATE POLICY "Admins can update articles"
ON public.articles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete articles
CREATE POLICY "Admins can delete articles"
ON public.articles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Index for slug lookups
CREATE INDEX idx_articles_slug ON public.articles (slug);

-- Index for category filtering
CREATE INDEX idx_articles_category ON public.articles (category);

-- Index for published articles ordered by date
CREATE INDEX idx_articles_published ON public.articles (published, created_at DESC);

-- Timestamp trigger
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for articles
ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;
