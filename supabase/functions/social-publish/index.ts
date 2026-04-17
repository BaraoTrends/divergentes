/**
 * social-publish edge function
 * ---------------------------------------------------------------
 * Disparada automaticamente pelo trigger SQL `articles_social_publish`
 * sempre que um artigo passa a ter `published = true`.
 *
 * Fluxo:
 *   articles (INSERT/UPDATE) → trigger pg_net → ESTA FUNÇÃO → Make.com
 *                                                          ↘ social_publish_logs
 *
 * O Make.com recebe o payload e distribui para as redes sociais:
 *   X (Twitter), Reddit, Pinterest, Facebook, Instagram.
 *
 * --- COMO CONFIGURAR ---
 * 1. Crie um cenário no Make.com com gatilho "Custom Webhook".
 * 2. Copie a URL do webhook gerada pelo Make.
 * 3. Salve a URL no secret `MAKE_WEBHOOK_URL` do Lovable Cloud.
 * 4. (Opcional) Ajuste `SITE_BASE_URL` se o domínio público mudar.
 *
 * --- COMO ADICIONAR NOVAS REDES ---
 * Toda a distribuição é feita dentro do cenário do Make.com — basta
 * adicionar novos módulos lá. Esta função apenas envia o payload genérico.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

interface IncomingPayload {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  created_at: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function logResult(args: {
  article_id: string | null;
  article_title: string;
  status: "success" | "error";
  error_message?: string | null;
  make_status?: number | null;
}) {
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    await admin.from("social_publish_logs").insert({
      article_id: args.article_id,
      article_title: args.article_title,
      status: args.status,
      error_message: args.error_message ?? null,
      make_status: args.make_status ?? null,
    });
  } catch (e) {
    console.error("[social-publish] Falha ao gravar log:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let body: IncomingPayload | null = null;

  try {
    body = (await req.json()) as IncomingPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const articleTitle = body?.title ?? "(sem título)";
  const articleId = body?.id ?? null;

  try {
    const MAKE_WEBHOOK_URL = Deno.env.get("MAKE_WEBHOOK_URL");
    const SITE_BASE_URL = Deno.env.get("SITE_BASE_URL") ?? "https://neurorotina.com";

    if (!MAKE_WEBHOOK_URL) {
      const msg = "MAKE_WEBHOOK_URL não configurada";
      console.error("[social-publish]", msg);
      await logResult({ article_id: articleId, article_title: articleTitle, status: "error", error_message: msg });
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!body?.slug || !body?.title) {
      const msg = "Payload inválido: title e slug são obrigatórios";
      await logResult({ article_id: articleId, article_title: articleTitle, status: "error", error_message: msg });
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      const msg = `Make.com retornou ${makeRes.status}: ${text.slice(0, 500)}`;
      console.error("[social-publish]", msg);
      await logResult({
        article_id: articleId,
        article_title: articleTitle,
        status: "error",
        error_message: msg,
        make_status: makeRes.status,
      });
      return new Response(JSON.stringify({ error: "Make webhook failed", status: makeRes.status, body: text }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await logResult({
      article_id: articleId,
      article_title: articleTitle,
      status: "success",
      make_status: makeRes.status,
    });

    console.log("[social-publish] Sucesso:", makeRes.status);
    return new Response(JSON.stringify({ ok: true, article_id: articleId, make_status: makeRes.status }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[social-publish] Erro inesperado:", msg);
    await logResult({ article_id: articleId, article_title: articleTitle, status: "error", error_message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
