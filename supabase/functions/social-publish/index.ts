/**
 * social-publish edge function
 * ---------------------------------------------------------------
 * Disparada automaticamente pelo trigger SQL `articles_social_publish`
 * sempre que um artigo passa a ter `published = true`.
 *
 * Fluxo:
 *   articles (INSERT/UPDATE) → trigger pg_net → ESTA FUNÇÃO → Make.com
 *
 * O Make.com recebe o payload e distribui para as redes sociais:
 *   - X (Twitter)
 *   - Reddit
 *   - Pinterest
 *   - Facebook
 *   - Instagram
 *
 * --- COMO CONFIGURAR ---
 * 1. Crie um cenário no Make.com com gatilho "Custom Webhook".
 * 2. Copie a URL do webhook gerada pelo Make.
 * 3. Salve a URL no secret `MAKE_WEBHOOK_URL` do projeto Lovable Cloud.
 * 4. (Opcional) Ajuste `SITE_BASE_URL` se o domínio público mudar.
 *
 * --- COMO ADICIONAR NOVAS REDES ---
 * Toda a distribuição para redes adicionais é feita dentro do cenário
 * do Make.com — basta adicionar novos módulos lá. Esta função apenas
 * envia o payload genérico abaixo:
 *
 *   {
 *     "title":      "Título do post",
 *     "url":        "https://meusite.com/blog/slug",
 *     "excerpt":    "Resumo curto do post",
 *     "image":      "https://.../capa.jpg",
 *     "created_at": "2025-01-01T00:00:00Z"
 *   }
 */

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

interface IncomingPayload {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MAKE_WEBHOOK_URL = Deno.env.get("MAKE_WEBHOOK_URL");
    const SITE_BASE_URL = Deno.env.get("SITE_BASE_URL") ?? "https://neurorotina.com";

    if (!MAKE_WEBHOOK_URL) {
      console.error("[social-publish] MAKE_WEBHOOK_URL não configurada");
      return new Response(
        JSON.stringify({ error: "MAKE_WEBHOOK_URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as IncomingPayload;

    if (!body?.slug || !body?.title) {
      return new Response(
        JSON.stringify({ error: "Payload inválido: title e slug são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = {
      title: body.title,
      url: `${SITE_BASE_URL.replace(/\/$/, "")}/blog/${body.slug}`,
      excerpt: body.excerpt ?? "",
      image: body.cover_image_url ?? "",
      created_at: body.created_at,
    };

    console.log("[social-publish] Enviando para Make.com:", payload);

    const makeRes = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await makeRes.text();

    if (!makeRes.ok) {
      console.error("[social-publish] Make.com retornou erro:", makeRes.status, text);
      return new Response(
        JSON.stringify({ error: "Make webhook failed", status: makeRes.status, body: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("[social-publish] Sucesso:", makeRes.status);
    return new Response(
      JSON.stringify({ ok: true, article_id: body.id, make_status: makeRes.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[social-publish] Erro inesperado:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
