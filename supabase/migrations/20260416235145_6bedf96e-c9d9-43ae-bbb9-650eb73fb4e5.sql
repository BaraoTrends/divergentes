-- Enable pg_net for HTTP calls from the database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function: when an article becomes published, call social-publish edge function
CREATE OR REPLACE FUNCTION public.trigger_social_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  edge_url TEXT := 'https://wmdjjvjmwvsceqbcmksb.supabase.co/functions/v1/social-publish';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZGpqdmptd3ZzY2VxYmNta3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Nzc3OTIsImV4cCI6MjA5MTU1Mzc5Mn0.cgul6I97ZoaOO4Bv3iVaH2EaWdsRRREgqmPmngRxCUw';
  should_fire BOOLEAN := false;
BEGIN
  -- Fire when:
  --  - INSERT and published = true (article created already published)
  --  - UPDATE and published changed from false to true
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
        'created_at', NEW.created_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS articles_social_publish ON public.articles;

CREATE TRIGGER articles_social_publish
AFTER INSERT OR UPDATE OF published ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_social_publish();