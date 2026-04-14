
CREATE OR REPLACE FUNCTION public.sanitize_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Lowercase
  NEW.slug := lower(NEW.slug);
  -- Remove accents via unaccent extension
  NEW.slug := translate(
    NEW.slug,
    'àáâãäåèéêëìíîïòóôõöùúûüýÿñçćčšžđ',
    'aaaaaaeeeeiiiioooooouuuuyyncccszdj'
  );
  -- Remove any character that is not a-z, 0-9, space, or hyphen
  NEW.slug := regexp_replace(NEW.slug, '[^a-z0-9\s\-]', '', 'g');
  -- Replace spaces with hyphens
  NEW.slug := regexp_replace(NEW.slug, '\s+', '-', 'g');
  -- Collapse multiple hyphens
  NEW.slug := regexp_replace(NEW.slug, '-+', '-', 'g');
  -- Trim leading/trailing hyphens
  NEW.slug := trim(BOTH '-' FROM NEW.slug);
  RETURN NEW;
END;
$$;

CREATE TRIGGER sanitize_article_slug
BEFORE INSERT OR UPDATE OF slug ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_slug();
