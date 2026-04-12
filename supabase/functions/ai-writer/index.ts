import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SEO_AND_HUMAN_RULES = `
REGRAS OBRIGATÓRIAS DE ESCRITA (aplique SEMPRE):

1. PERPLEXIDADE ALTA (estilo humano):
- Varie o comprimento das frases: alterne entre frases curtas e incisivas e frases mais longas e elaboradas.
- Use vocabulário diversificado: evite repetir as mesmas palavras. Use sinônimos, variações e expressões coloquiais naturais do português brasileiro.
- Inclua opiniões sutis, reflexões pessoais e perguntas retóricas para criar um tom conversacional.
- Evite padrões previsíveis: não comece parágrafos consecutivos da mesma forma. Varie conectivos, aberturas e estruturas.
- Use figuras de linguagem ocasionais: metáforas, analogias e comparações tornam o texto mais humano.
- Insira imperfeições naturais: hesitações ("na verdade", "digamos que"), interjeições ("olha", "veja bem") e marcadores discursivos humanos.
- NUNCA use frases genéricas de IA como "é importante ressaltar", "vale destacar", "nesse sentido", "diante disso" repetidamente.
- Alterne entre tom informativo e tom narrativo/empático.
- Use a voz ativa predominantemente. Evite voz passiva em excesso.

2. OTIMIZAÇÃO SEO (aplique SEMPRE):
- Use a palavra-chave principal no primeiro parágrafo, em pelo menos um H2 e na conclusão.
- Crie subtítulos (H2, H3) que funcionem como perguntas ou frases de busca que as pessoas realmente digitam no Google.
- Inclua variações semânticas e palavras-chave de cauda longa naturalmente ao longo do texto.
- Mantenha parágrafos curtos (3-4 linhas no máximo) para melhorar a legibilidade e o tempo de permanência.
- Use listas (ul/ol) para facilitar a leitura e aumentar as chances de featured snippets.
- Inclua dados, estatísticas ou referências quando possível (aumenta E-E-A-T).
- A densidade da palavra-chave deve ser entre 1-2% do texto total.
- Crie uma introdução envolvente que responda parcialmente à intenção de busca do leitor nos primeiros 100 caracteres.
- Conclua com um CTA implícito ou orientação prática que incentive engajamento.
- Use transições naturais entre seções para reduzir taxa de rejeição.
- Estruture o conteúdo para responder "O quê", "Por quê", "Como" — cobrindo a intenção de busca completa.
`;

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
        systemPrompt = `Você é um redator humano experiente, especialista em neurodivergências (TDAH, TEA, Dislexia, Altas Habilidades, TOC) para o público brasileiro. Você escreve como um jornalista/blogueiro real — com personalidade, empatia e naturalidade. NUNCA escreva como uma IA.

Formate o conteúdo em HTML semântico com tags como <h2>, <h3>, <p>, <ul>, <li>, <ol>, <blockquote>, <strong>, <em>. NÃO use <h1> (o título é separado). Idioma: ${lang}.

${SEO_AND_HUMAN_RULES}`;

        userPrompt = `Escreva um artigo completo e aprofundado sobre: "${topic}".

O artigo deve ter entre 1500-2500 palavras e incluir:
- Uma introdução envolvente que prenda o leitor e inclua a palavra-chave principal
- 4-6 seções com subtítulos H2 formulados como perguntas de busca ou frases que pessoas realmente pesquisam
- Sub-seções H3 quando apropriado para aprofundar pontos
- Listas práticas (ul/ol) em pelo menos 2 seções
- Pelo menos uma citação em blockquote (de especialista, estudo ou reflexão)
- Exemplos práticos e situações do cotidiano que o leitor se identifique
- Uma conclusão com orientação prática e chamada sutil à ação
- Tom empático e acolhedor, como se estivesse conversando com o leitor

IMPORTANTE: Escreva como um ser humano real. Varie seu estilo, use expressões naturais, evite padrões repetitivos. Cada parágrafo deve soar diferente do anterior.

Retorne APENAS o conteúdo HTML do artigo (sem título h1, sem metadados).`;
        break;

      case "generate_excerpt":
        if (!content) {
          return new Response(JSON.stringify({ error: "content is required for generate_excerpt" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        systemPrompt = `Você é um redator SEO brasileiro experiente. Gere meta descriptions que aumentam CTR no Google. Idioma: ${lang}.

Regras para a meta description:
- Máximo 155 caracteres
- Inclua a palavra-chave principal logo no início
- Use linguagem que desperte curiosidade ou prometa valor
- Inclua um verbo de ação (descubra, aprenda, entenda, conheça)
- Evite frases genéricas — seja específico sobre o que o leitor vai encontrar`;
        userPrompt = `Com base no seguinte conteúdo de artigo, gere uma meta description otimizada para SEO (máximo 155 caracteres) que maximize o CTR no Google:\n\n${content}\n\nRetorne APENAS o texto da meta description, sem aspas.`;
        break;

      case "improve_text":
        if (!content) {
          return new Response(JSON.stringify({ error: "content is required for improve_text" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        systemPrompt = `Você é um editor profissional brasileiro, especializado em textos sobre neurodivergências. Sua tarefa é tornar o texto mais humano, natural e otimizado para SEO. Idioma: ${lang}.

${SEO_AND_HUMAN_RULES}

Ao melhorar o texto:
- Elimine qualquer padrão que pareça gerado por IA (frases formulaicas, conectivos repetitivos)
- Adicione variação de estilo entre parágrafos
- Melhore a estrutura SEO dos subtítulos se necessário
- Garanta que o texto flua como uma conversa natural
- Mantenha a formatação HTML`;
        userPrompt = `Melhore o seguinte texto, tornando-o mais humano, natural e otimizado para SEO. Elimine qualquer vestígio de escrita artificial. Mantenha a formatação HTML:\n\n${content}\n\nRetorne APENAS o texto melhorado em HTML.`;
        break;

      case "expand_text":
        if (!content) {
          return new Response(JSON.stringify({ error: "content is required for expand_text" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        systemPrompt = `Você é um redator humano experiente em neurodivergências para o público brasileiro. Expanda o texto mantendo um estilo autêntico e humano. Idioma: ${lang}.

${SEO_AND_HUMAN_RULES}

Ao expandir:
- Adicione exemplos práticos do dia a dia
- Inclua dados ou referências quando relevante
- Crie novas sub-seções com subtítulos SEO-friendly
- Mantenha a variação de tom e estilo
- Use HTML semântico`;
        userPrompt = `Expanda e enriqueça o seguinte texto com mais informações, exemplos práticos e detalhes relevantes. Adicione sub-seções com subtítulos otimizados para SEO. Mantenha o estilo humano e natural. Formatação HTML:\n\n${content}\n\nRetorne APENAS o texto expandido em HTML.`;
        break;

      case "generate_title":
        if (!content && !topic) {
          return new Response(JSON.stringify({ error: "content or topic is required for generate_title" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        systemPrompt = `Você é um especialista em SEO e copywriting brasileiro. Gere títulos que rankeiam no Google E que as pessoas querem clicar. Idioma: ${lang}.

Regras para títulos:
- Máximo 60 caracteres (para não ser cortado no Google)
- Inclua a palavra-chave principal o mais à esquerda possível
- Use números quando fizer sentido (ex: "7 Sinais de...")
- Desperte curiosidade ou prometa valor claro
- Evite clickbait — seja honesto e específico
- Varie os formatos: pergunta, lista, guia, declaração`;
        userPrompt = `Gere 5 opções de título SEO para um artigo sobre: "${topic || "o conteúdo a seguir"}"\n\n${content ? `Conteúdo:\n${content}` : ""}\n\nRetorne APENAS os 5 títulos, um por linha, numerados (1. 2. 3. 4. 5.). Cada um com no máximo 60 caracteres. Sem explicações.`;
        break;

      case "suggest_keywords":
        if (!topic) {
          return new Response(JSON.stringify({ error: "topic (focus keyword) is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        systemPrompt = `Você é um especialista em SEO brasileiro. Retorne APENAS um JSON válido, sem markdown, sem explicações.`;
        userPrompt = `Para a palavra-chave foco "${topic}", gere exatamente este JSON (sem code fences):
{"keywords":[{"term":"palavra","type":"related|long_tail|semantic","volume":"alto|médio|baixo"}]}

Regras:
- 8-12 palavras-chave no total
- Inclua: 3-4 variações semânticas (type: "semantic"), 3-4 cauda longa (type: "long_tail"), 2-3 relacionadas (type: "related")
- Todas em português brasileiro
- Relevantes para o nicho de neurodivergências/saúde mental quando aplicável
- "volume" é uma estimativa relativa de busca

Retorne APENAS o JSON.`;
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
        temperature: 0.85,
        top_p: 0.92,
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
