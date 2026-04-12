/**
 * Cloudflare Worker para Dynamic Rendering (Prerendering para bots)
 * 
 * Este worker intercepta requisições de bots/crawlers e redireciona 
 * para a edge function de prerender, retornando HTML completo com 
 * conteúdo, meta tags e JSON-LD.
 * 
 * COMO CONFIGURAR:
 * 
 * 1. Acesse https://dash.cloudflare.com
 * 2. Vá em Workers & Pages → Create Worker
 * 3. Cole este código
 * 4. Configure a rota para seu domínio (neurodivergencias.com.br/*)
 * 5. Defina as variáveis de ambiente:
 *    - ORIGIN_URL: URL do seu site (ex: https://neurodivergencias.com.br)
 *    - PRERENDER_URL: URL da edge function de prerender
 *      (ex: https://wmdjjvjmwvsceqbcmksb.supabase.co/functions/v1/prerender)
 * 
 * COMO FUNCIONA:
 * - Detecta User-Agents de bots (Googlebot, Bingbot, etc.)
 * - Para bots: serve HTML pré-renderizado com conteúdo completo
 * - Para usuários: serve o SPA normalmente
 */

const BOT_AGENTS = [
  'googlebot',
  'google-inspectiontool',
  'chrome-lighthouse',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'baiduspider',
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'rogerbot',
  'linkedinbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'pinterest',
  'pinterestbot',
  'slackbot',
  'vkshare',
  'w3c_validator',
  'whatsapp',
  'flipboard',
  'tumblr',
  'bitlybot',
  'skypeuripreview',
  'nuzzel',
  'discordbot',
  'google page speed',
  'screaming frog',
  'yahoo! slurp',
  'semrushbot',
  'ahrefsbot',
  'dotbot',
  'petalbot',
  'mj12bot',
  'applebot',
  'seznambot',
  'ia_archiver',
  'telegrambot',
];

function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_AGENTS.some(bot => ua.includes(bot));
}

// Extensões de arquivo que nunca devem ser prerenderizadas
const STATIC_EXTENSIONS = /\.(js|css|xml|json|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|pdf|mp4|webm|ogg|mp3|wav|zip|gz|tar|map)$/i;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Não prerender arquivos estáticos
    if (STATIC_EXTENSIONS.test(url.pathname)) {
      return fetch(request);
    }
    
    // Não prerender rotas de admin
    if (url.pathname.startsWith('/admin')) {
      return fetch(request);
    }
    
    const userAgent = request.headers.get('User-Agent') || '';
    
    // Se é um bot, servir versão prerenderizada
    if (isBot(userAgent)) {
      try {
        const prerenderUrl = `${env.PRERENDER_URL || 'https://wmdjjvjmwvsceqbcmksb.supabase.co/functions/v1/prerender'}?path=${encodeURIComponent(url.pathname)}`;
        
        const prerenderResponse = await fetch(prerenderUrl, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html',
          },
          cf: {
            cacheTtl: 86400, // Cache por 24h no edge
            cacheEverything: true,
          },
        });
        
        if (prerenderResponse.ok) {
          const html = await prerenderResponse.text();
          return new Response(html, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=3600, s-maxage=86400',
              'X-Prerendered': 'true',
              'X-Robots-Tag': 'index, follow',
            },
          });
        }
      } catch (e) {
        console.error('Prerender error:', e);
      }
    }
    
    // Para usuários normais, servir o SPA
    return fetch(request);
  },
};
