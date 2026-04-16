-- Drop the overly permissive public SELECT policy on site_settings
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;

-- Create a restricted public policy that only exposes non-sensitive categories
CREATE POLICY "Public can read general settings"
ON public.site_settings
FOR SELECT
TO public
USING (category IN ('general', 'seo'));

-- Fix indexing_health_history missing SELECT policy
CREATE POLICY "Admins can read health history"
ON public.indexing_health_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));