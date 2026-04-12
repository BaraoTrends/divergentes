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
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const { prompt, style, purpose } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build an enhanced prompt based on purpose
    let enhancedPrompt = prompt;
    const styleHints = style || "professional, modern, clean";

    if (purpose === "cover") {
      enhancedPrompt = `Create a professional blog article cover image. Style: ${styleHints}. Subject: ${prompt}. The image should be visually striking, suitable for a health/neurodiversity blog. No text in the image. Wide landscape format.`;
    } else if (purpose === "inline") {
      enhancedPrompt = `Create an illustration for a blog article. Style: ${styleHints}. Subject: ${prompt}. Clean, informative, no text overlay.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: enhancedPrompt }],
        modalities: ["image", "text"],
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
          JSON.stringify({ error: "Créditos de IA esgotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar imagem." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem foi gerada. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upload the base64 image to storage
    const base64Content = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Content), (c) => c.charCodeAt(0));
    const fileName = `ai/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;

    const uploadResp = await fetch(
      `${SUPABASE_URL}/storage/v1/object/article-images/${fileName}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "image/png",
          "x-upsert": "true",
        },
        body: binaryData,
      }
    );

    if (!uploadResp.ok) {
      const uploadErr = await uploadResp.text();
      console.error("Storage upload error:", uploadErr);
      // Fall back to returning base64
      return new Response(
        JSON.stringify({ image_url: imageData, source: "base64" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/article-images/${fileName}`;

    return new Response(
      JSON.stringify({ image_url: publicUrl, source: "storage" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-image-gen error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
