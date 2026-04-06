import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrls } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw new Error("Please provide at least one image URL");
    }

    // Send up to 5 images for analysis
    const imagesToAnalyze = imageUrls.slice(0, 5);

    const imageContent = imagesToAnalyze.map((url: string) => ({
      type: "image_url" as const,
      image_url: { url },
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a jewellery product listing expert for KRT Jewels, an Indian jewellery brand. 
Analyze the product images and generate accurate product details.
You MUST respond using the provided tool/function.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze these jewellery product images and generate:
1. A compelling product name (e.g. "Radiant Temple Gold Necklace")
2. A URL-friendly slug ending with "-krt" (e.g. "radiant-temple-gold-necklace-krt")
3. A short description (1 line, ~100 chars, for product cards)
4. A detailed full description (2-3 paragraphs, highlighting craftsmanship, design, occasion, metal details)

Focus on: jewellery type (ring, necklace, bangle, earring, etc.), design style (temple, modern, traditional, antique), any visible stones or patterns.`
              },
              ...imageContent,
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_product_details",
              description: "Generate product listing details from jewellery images",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Product name" },
                  slug: { type: "string", description: "URL slug ending with -krt" },
                  short_description: { type: "string", description: "Short 1-line description" },
                  description: { type: "string", description: "Full detailed description (2-3 paragraphs)" },
                },
                required: ["name", "slug", "short_description", "description"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_product_details" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured output");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-product-scan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
