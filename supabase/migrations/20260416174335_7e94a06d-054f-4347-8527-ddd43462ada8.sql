-- Remove articles from realtime publication to prevent draft leaks
ALTER PUBLICATION supabase_realtime DROP TABLE public.articles;