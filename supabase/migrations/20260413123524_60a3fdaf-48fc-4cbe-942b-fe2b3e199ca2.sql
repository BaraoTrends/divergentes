UPDATE public.articles
SET content = REPLACE(
  content,
  'https://images.unsplash.com/photo-1587654711464-3e3b39551009',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80'
)
WHERE id = 'ea385376-8db4-419a-b807-d01c2fe2df80';