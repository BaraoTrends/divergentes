import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { render as renderSvgToPng } from "https://deno.land/x/resvg_wasm@0.2.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORIES: Record<string, { shortName: string; icon: string; color: string }> = {
  tdah: { shortName: "TDAH", icon: "⚡", color: "#D97706" },
  tea: { shortName: "TEA", icon: "🧩", color: "#3B82F6" },
  dislexia: { shortName: "Dislexia", icon: "📖", color: "#8B5CF6" },
  "altas-habilidades": { shortName: "Altas Habilidades", icon: "🌟", color: "#10B981" },
  toc: { shortName: "TOC", icon: "🔄", color: "#EC4899" },
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateOgSvg(title: string, category: string, siteName: string): string {
  const cat = CATEGORIES[category] || { shortName: "Geral", icon: "🧠", color: "#78716C" };

  const words = title.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    if ((currentLine + " " + word).trim().length > 36 && currentLine) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = (currentLine + " " + word).trim();
    }
  }
  if (currentLine) lines.push(currentLine.trim());
  const titleLines = lines.slice(0, 4);

  const titleY = titleLines.length <= 2 ? 240 : 200;
  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="80" y="${titleY + i * 56}" font-family="Georgia, 'Times New Roman', serif" font-size="44" font-weight="bold" fill="#1C1917">${escapeXml(line)}</text>`
    )
    .join("\n");

  const badgeY = titleY + titleLines.length * 56 + 24;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FAF5EF"/>
      <stop offset="100%" stop-color="#F0E7DB"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="${cat.color}"/>
      <stop offset="100%" stop-color="${cat.color}" stop-opacity="0.7"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="8" height="630" fill="url(#accent)"/>
  <rect x="80" y="120" width="80" height="4" rx="2" fill="${cat.color}"/>
  <rect x="80" y="${badgeY}" width="${cat.shortName.length * 14 + 56}" height="36" rx="18" fill="${cat.color}" opacity="0.12"/>
  <text x="100" y="${badgeY + 24}" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="600" fill="${cat.color}">${cat.icon} ${escapeXml(cat.shortName)}</text>
  ${titleSvg}
  <line x1="80" y1="540" x2="1120" y2="540" stroke="#D6D3D1" stroke-width="1"/>
  <text x="80" y="580" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#78716C">&#x1F9E0; ${escapeXml(siteName)}</text>
  <text x="1120" y="580" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#A8A29E" text-anchor="end"><text x="1120" y="580" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#A8A29E" text-anchor="end"><text x="1120" y="580" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#A8A29E" text-anchor="end">neurorotina.com</text></text></text>
  <circle cx="1140" cy="80" r="40" fill="${cat.color}" opacity="0.08"/>
  <circle cx="1100" cy="120" r="20" fill="${cat.color}" opacity="0.05"/>
</svg>`;
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response(JSON.stringify({ error: "slug parameter required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if cached PNG exists
    const cachePath = `og/${slug}.png`;
    const { data: existingFile } = await supabase.storage
      .from("article-images")
      .list("og", { search: `${slug}.png`, limit: 1 });

    if (existingFile && existingFile.length > 0) {
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/article-images/${cachePath}`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: publicUrl, "Cache-Control": "public, max-age=86400" },
      });
    }

    // Get article data
    const { data: article } = await supabase
      .from("articles")
      .select("title, category, image_url")
      .eq("slug", slug)
      .maybeSingle();

    if (!article) {
      return new Response(JSON.stringify({ error: "Article not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If article already has a cover image, redirect to it
    if (article.image_url) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: article.image_url, "Cache-Control": "public, max-age=86400" },
      });
    }

    // Generate SVG
    const svg = generateOgSvg(article.title, article.category, "Neuro Rotina");

    // Convert SVG → PNG via resvg-wasm
    const pngData: Uint8Array = await renderSvgToPng(svg);

    // Cache PNG in storage
    await supabase.storage
      .from("article-images")
      .upload(cachePath, pngData, {
        contentType: "image/png",
        upsert: true,
      });

    return new Response(pngData, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch (e) {
    console.error("og-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
