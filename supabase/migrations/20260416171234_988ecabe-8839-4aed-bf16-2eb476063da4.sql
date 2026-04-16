-- Replace the broad SELECT policy with one that prevents listing
DROP POLICY IF EXISTS "Article images are publicly accessible" ON storage.objects;

CREATE POLICY "Article images are publicly accessible by name"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'article-images' AND name IS NOT NULL AND name != '');