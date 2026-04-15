import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables are not configured");
    }

    const { prompt, style, purpose } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build an enhanced prompt based on purpose with diversity mechanisms
    let enhancedPrompt = prompt;
    const styleHints = style || "";

    // Visual style variety pool — pick one randomly per request to avoid repetitive outputs
    const visualStyles = [
      "watercolor painting with soft blended edges and muted tones",
      "modern flat vector illustration with bold geometric shapes",
      "realistic digital photography style, shallow depth of field",
      "paper cut-out / collage art style with layered textures",
      "minimalist line art with a single accent color",
      "impressionist oil painting with visible brushstrokes",
      "isometric 3D illustration with pastel colors",
      "retro risograph print style with halftone dots and limited palette",
      "editorial magazine illustration, sophisticated and elegant",
      "chalk pastel on textured paper, warm and organic feel",
    ];

    const compositions = [
      "bird's-eye view composition",
      "close-up detail shot",
      "wide panoramic scene",
      "centered symmetrical composition",
      "off-center subject with negative space",
      "split composition showing contrast",
      "macro perspective focusing on hands or objects",
      "environmental wide shot with context",
    ];

    const palettes = [
      "warm earth tones (terracotta, olive, sand)",
      "cool ocean palette (teal, navy, seafoam)",
      "sunset gradient (coral, amber, plum)",
      "forest palette (emerald, moss, cream)",
      "monochromatic blue with white accents",
      "muted pastels (lavender, blush, sage)",
      "high contrast black and white with one pop color",
      "golden hour warm light palette",
    ];

    const randomPick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    if (purpose === "cover") {
      const chosenStyle = styleHints || randomPick(visualStyles);
      const chosenComposition = randomPick(compositions);
      const chosenPalette = randomPick(palettes);
      enhancedPrompt = `Create a unique, visually distinctive blog cover image. 
Art style: ${chosenStyle}. 
Composition: ${chosenComposition}. 
Color palette: ${chosenPalette}. 
Subject: ${prompt}. 
Context: This is for a Brazilian health/neurodiversity blog. 
IMPORTANT: Do NOT depict generic classroom scenes with teacher and student. Instead, use metaphorical or abstract representations of the subject. Be creative and original. 
No text, no letters, no words in the image. Wide landscape format (16:9 aspect ratio).`;
    } else if (purpose === "inline") {
      const chosenStyle = styleHints || randomPick(visualStyles);
      enhancedPrompt = `Create an illustration for a blog article. Art style: ${chosenStyle}. Subject: ${prompt}. Use a unique visual approach — avoid cliché classroom scenes. Be creative with metaphors and abstract concepts. Clean, no text overlay.`;
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

    // Upload the base64 image to storage using Supabase client
    const base64Content = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Content), (c) => c.charCodeAt(0));
    const fileName = `ai/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("article-images")
      .upload(fileName, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError.message);
      // Fall back to returning base64
      return new Response(
        JSON.stringify({ image_url: imageData, source: "base64" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("article-images")
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ image_url: publicUrlData.publicUrl, source: "storage" }),
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
