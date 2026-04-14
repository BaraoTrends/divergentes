
CREATE OR REPLACE FUNCTION public.sanitize_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Lowercase
  NEW.slug := lower(NEW.slug);
  -- Normalize: remove accents using NFD decomposition approach via translate
  NEW.slug := translate(
    NEW.slug,
    'àáâãäåæèéêëìíîïðñòóôõöøùúûüýþÿ',
    'aaaaaaaeeeeiiiidnooooooouuuuyby'
  );
  -- Handle ç separately since translate maps char-by-char
  NEW.slug := replace(NEW.slug, 'ç', 'c');
  -- Remove any character that is not a-z, 0-9, space, or hyphen
  NEW.slug := regexp_replace(NEW.slug, '[^a-z0-9 \-]', '', 'g');
  -- Replace spaces with hyphens
  NEW.slug := regexp_replace(NEW.slug, '\s+', '-', 'g');
  -- Collapse multiple hyphens
  NEW.slug := regexp_replace(NEW.slug, '-+', '-', 'g');
  -- Trim leading/trailing hyphens
  NEW.slug := trim(BOTH '-' FROM NEW.slug);
  RETURN NEW;
END;
$$;
