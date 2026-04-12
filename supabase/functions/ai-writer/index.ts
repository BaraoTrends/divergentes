import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { action, topic, content, language, model: modelKey } = await req.json();

    const MODEL_MAP: Record<string, string> = {
      fast: "google/gemini-3-flash-preview",
      balanced: "google/gemini-2.5-flash",
      precise: "google/gemini-2.5-pro",
      gpt: "openai/gpt-5",
    };
    const selectedModel = MODEL_MAP[modelKey] || MODEL_MAP.fast;

    if (!action || typeof action !== "string") {
      return new Response(JSON.stringify({ error: "action is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = language || "pt-BR";

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "generate_article":
        if (!topic) {
          return new Response(JSON.stringify({ error: "topic is required for generate_article" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        systemPrompt = `Você é um redator especialista em neurodivergências (TDAH, TEA, Dislexia, Altas Habilidades, TOC) para o público brasileiro. Escreva artigos informativos, acessíveis, baseados em evidências científicas. Use linguagem clara e empática. Formate o conteúdo em HTML semântico com tags como <h2>, <h3>, <p>, <ul>, <li>, <ol>, <blockquote>, <strong>, <em>. NÃO use <h1> (o título é separado). Idioma: ${lang}.`;
        userPrompt = `Escreva um artigo completo sobre: "${topic}". 

Inclua:
- Introdução contextualizada
- Seções com subtítulos (h2, h3)
- Listas quando apropriado
- Citações em blockquote quando relevante
- Conclusão com orientação prática
- Nota informativa ao final

Retorne APENAS o conteúdo HTML do artigo (sem título h1, sem metadados).`;
        break;

      case "generate_excerpt":
        if (!content) {
          return new Response(JSON.stringify({ error: "content is required for generate_excerpt" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        systemPrompt = `Você é um redator brasileiro. Gere um resumo conciso e atrativo para SEO. Idioma: ${lang}.`;
        userPrompt = `Com base no seguinte conteúdo de artigo, gere um resumo de 1-2 frases (máximo 160 caracteres) para usar como descrição/excerpt do artigo:\n\n${content}\n\nRetorne APENAS o texto do resumo, sem aspas.`;
        break;

      case "improve_text":
        if (!content) {
          return new Response(JSON.stringify({ error: "content is required for improve_text" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        systemPrompt = `Você é um editor profissional brasileiro especializado em textos sobre neurodivergências. Melhore o texto mantendo o significado original, tornando-o mais claro, fluido e acessível. Mantenha o formato HTML. Idioma: ${lang}.`;
        userPrompt = `Melhore o seguinte texto, corrigindo erros, melhorando a clareza e a fluidez. Mantenha a formatação HTML:\n\n${content}\n\nRetorne APENAS o texto melhorado em HTML.`;
        break;

      case "expand_text":
        if (!content) {
          return new Response(JSON.stringify({ error: "content is required for expand_text" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        systemPrompt = `Você é um redator especialista em neurodivergências para o público brasileiro. Expanda o texto com mais detalhes, exemplos e informações relevantes. Use HTML semântico. Idioma: ${lang}.`;
        userPrompt = `Expanda e enriqueça o seguinte texto com mais informações, exemplos práticos e detalhes relevantes. Mantenha a formatação HTML:\n\n${content}\n\nRetorne APENAS o texto expandido em HTML.`;
        break;

      case "generate_title":
        if (!content && !topic) {
          return new Response(JSON.stringify({ error: "content or topic is required for generate_title" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        systemPrompt = `Você é um redator SEO brasileiro. Gere títulos atraentes e informativos. Idioma: ${lang}.`;
        userPrompt = `Gere 3 opções de título para um artigo sobre: "${topic || "o conteúdo a seguir"}"\n\n${content ? `Conteúdo:\n${content}` : ""}\n\nRetorne APENAS os 3 títulos, um por linha, numerados (1. 2. 3.). Sem explicações adicionais.`;
        break;

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos nas configurações." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao conectar com o serviço de IA." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-writer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
