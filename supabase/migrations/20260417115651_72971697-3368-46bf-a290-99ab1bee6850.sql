CREATE OR REPLACE FUNCTION public.trigger_social_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  edge_url TEXT := 'https://wmdjjvjmwvsceqbcmksb.supabase.co/functions/v1/social-publish';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZGpqdmptd3ZzY2VxYmNta3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Nzc3OTIsImV4cCI6MjA5MTU1Mzc5Mn0.cgul6I97ZoaOO4Bv3iVaH2EaWdsRRREgqmPmngRxCUw';
  should_fire BOOLEAN := false;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.published = true THEN
    should_fire := true;
  ELSIF TG_OP = 'UPDATE' AND NEW.published = true AND COALESCE(OLD.published, false) = false THEN
    should_fire := true;
  END IF;

  IF should_fire THEN
    PERFORM net.http_post(
      url := edge_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      body := jsonb_build_object(
        'id', NEW.id,
        'title', NEW.title,
        'slug', NEW.slug,
        'excerpt', NEW.excerpt,
        'cover_image_url', NEW.image_url,
        'created_at', NEW.created_at,
        'tags', COALESCE(NEW.tags, ARRAY[]::text[])
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;