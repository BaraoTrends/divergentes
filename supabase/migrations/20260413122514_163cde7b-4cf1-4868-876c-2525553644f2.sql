UPDATE articles 
SET content = REPLACE(
  content, 
  'https://images.unsplash.com/photo-1516627145497-ae6968895b74', 
  'https://images.unsplash.com/photo-1544776193-352d25ca82cd'
)
WHERE id = 'ea385376-8db4-419a-b807-d01c2fe2df80';