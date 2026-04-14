
UPDATE public.articles
SET
  title = 'Método Multissensorial Dislexia: O que é e por que Ajuda',
  slug = 'metodo-multissensorial-dislexia-o-que-e-e-por-que-ajuda',
  excerpt = 'Descubra o método multissensorial dislexia: como essa técnica envolve todos os sentidos para revolucionar a alfabetização e o aprendizado.',
  content = regexp_replace(
    content,
    '<p>Você já sentiu aquela frustração de ler a mesma frase cinco vezes e, ainda assim, as palavras parecerem dançar na frente dos seus olhos sem fazer sentido\? Para quem convive com a dislexia, essa é uma realidade rotineira, e não tem nada a ver com falta de esforço\. É aqui que entra o <strong>Método Multissensorial</strong>, uma abordagem que está longe de ser apenas uma "técnica de estudo" e se aproxima muito mais de uma ponte de comunicação com o cérebro neurodivergente\.</p>',
    '<p>Você já sentiu aquela frustração de ler a mesma frase cinco vezes e, ainda assim, as palavras parecerem dançar na frente dos seus olhos? Para quem convive com a dislexia, essa é uma realidade rotineira. É aqui que entra o <strong>método multissensorial dislexia</strong> — uma abordagem que vai muito além de uma simples "técnica de estudo" e funciona como uma verdadeira ponte de comunicação com o cérebro neurodivergente.</p>',
    'i'
  ),
  updated_at = now()
WHERE id = '054062b0-80a8-45fa-b702-0e0199818545';

-- Also update headings and body to include the exact keyword phrase
UPDATE public.articles
SET
  content = replace(
    content,
    '<h2>Por que o método multissensorial ajuda na dislexia?</h2>',
    '<h2>Por que o método multissensorial dislexia é tão eficaz?</h2>'
  )
WHERE id = '054062b0-80a8-45fa-b702-0e0199818545';

-- Add keyword density in the conclusion area
UPDATE public.articles
SET
  content = replace(
    content,
    '<h2>O que é o método multissensorial na prática?</h2>',
    '<h2>O que é o método multissensorial dislexia na prática?</h2>'
  )
WHERE id = '054062b0-80a8-45fa-b702-0e0199818545';
