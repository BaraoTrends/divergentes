
-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true);

-- Anyone can view article images
CREATE POLICY "Article images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

-- Authenticated admins can upload images
CREATE POLICY "Admins can upload article images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-images'
  AND public.has_role(auth.uid(), 'admin')
);

-- Admins can update their uploads
CREATE POLICY "Admins can update article images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'article-images'
  AND public.has_role(auth.uid(), 'admin')
);

-- Admins can delete images
CREATE POLICY "Admins can delete article images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-images'
  AND public.has_role(auth.uid(), 'admin')
);
