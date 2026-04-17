INSERT INTO public.site_settings (key, value, description, category)
VALUES ('social_hashtag_limit', '5', 'Quantidade máxima de hashtags enviadas no payload de autopublicação social (categoria + tags). 0 = sem limite.', 'integrations')
ON CONFLICT (key) DO NOTHING;