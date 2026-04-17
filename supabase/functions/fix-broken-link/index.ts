import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Candidate {
  slug: string;
  title: string;
  category?: string;
  excerpt?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const {
      brokenPath,
      anchorText,
      sourceTitle,
      candidates,
    }: {
      brokenPath: string;
      anchorText: string;
      sourceTitle: string;
      candidates: Candidate[];
    } = await req.json();

    if (!brokenPath || !candidates?.length) {
      return new Response(
        JSON.stringify({ error: "brokenPath e candidates são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit candidates to keep prompt small (top 80 by simple relevance pre-filter not done here, send all up to 80)
    const trimmed = candidates.slice(0, 80);

    const systemPrompt = `Você é um especialista em SEO e arquitetura de informação para um blog brasileiro sobre neurodivergências (TDAH, TEA, Dislexia, Altas Habilidades, TOC). Sua tarefa: dado um link interno quebrado, escolher o ARTIGO PUBLICADO mais semanticamente relevante para substituir, ou indicar "remover" se nenhum se encaixar bem.`;

    const userPrompt = `ARTIGO DE ORIGEM: "${sourceTitle}"

LINK QUEBRADO:
- Caminho original: ${brokenPath}
- Texto âncora visível: "${anchorText}"

ARTIGOS PUBLICADOS DISPONÍVEIS (escolha UM slug ou indique remoção):
${trimmed.map((c, i) => `${i + 1}. /${c.slug} — ${c.title}${c.category ? ` [${c.category}]` : ""}`).join("\n")}

REGRAS:
- Escolha o slug cujo TÍTULO e categoria estejam mais alinhados ao texto âncora e ao path quebrado.
- Se nenhum candidato for claramente relevante (confiança < 0.5), recomende "remove".
- "confidence" 0.0-1.0.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_link_fix",
              description: "Sugere correção para um link interno quebrado",
              parameters: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: ["replace", "remove"],
                    description: "replace: trocar pelo slug; remove: tirar o link mantendo texto",
                  },
                  slug: {
                    type: "string",
                    description: "Slug escolhido (sem barra inicial). Apenas se action=replace.",
                  },
                  confidence: { type: "number", minimum: 0, maximum: 1 },
                  reason: { type: "string", description: "Justificativa curta (máx 140 chars)" },
                },
                required: ["action", "confidence", "reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_link_fix" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições. Aguarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error", response.status, t);
      return new Response(JSON.stringify({ error: "Erro na IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Sem sugestão da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate slug exists in candidates
    if (parsed.action === "replace") {
      const cleaned = String(parsed.slug || "").replace(/^\/+/, "").replace(/^blog\//, "");
      const exists = trimmed.some((c) => c.slug === cleaned);
      if (!exists) {
        parsed.action = "remove";
        parsed.reason = `Slug sugerido inexistente. ${parsed.reason || ""}`.slice(0, 140);
        delete parsed.slug;
      } else {
        parsed.slug = cleaned;
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fix-broken-link error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
