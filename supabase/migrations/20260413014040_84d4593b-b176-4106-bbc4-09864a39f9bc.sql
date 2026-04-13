
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
ON public.site_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default settings
INSERT INTO public.site_settings (key, value, description, category) VALUES
  ('gtm_id', '', 'ID do Google Tag Manager (GTM-XXXXXXX)', 'integrations'),
  ('google_verification', '', 'Código de verificação do Google Search Console', 'integrations'),
  ('exoclick_verification', '', 'Código de verificação do ExoClick', 'integrations'),
  ('adsense_publisher_id', '', 'ID do Google AdSense (ca-pub-XXXXXXXXXX)', 'ads'),
  ('ads_header_enabled', 'true', 'Exibir anúncios no header', 'ads'),
  ('ads_footer_enabled', 'true', 'Exibir anúncios no footer', 'ads'),
  ('ads_sidebar_enabled', 'true', 'Exibir anúncios na sidebar dos posts', 'ads'),
  ('ads_between_posts_enabled', 'true', 'Exibir anúncios entre artigos no blog', 'ads'),
  ('site_name', 'Neuro Rotina', 'Nome do site', 'general'),
  ('site_description', 'Informação acessível e confiável sobre neurodivergências', 'Descrição do site', 'general'),
  ('contact_email', '', 'Email de contato', 'general');
