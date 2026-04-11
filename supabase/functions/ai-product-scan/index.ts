import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrls, cadImageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if ((!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) && !cadImageUrl) {
      throw new Error("Please provide product images or a CAD image");
    }

    // Build image content for product images
    const productImageContent = (imageUrls || []).slice(0, 5).map((url: string) => ({
      type: "image_url" as const,
      image_url: { url },
    }));

    // Build image content for CAD image
    const cadImageContent = cadImageUrl ? [{
      type: "image_url" as const,
      image_url: { url: cadImageUrl },
    }] : [];

    const allImages = [...productImageContent, ...cadImageContent];

    const hasCadImage = !!cadImageUrl;
    const hasProductImages = productImageContent.length > 0;

    let userPrompt = "";

    if (hasProductImages && hasCadImage) {
      userPrompt = `Analyze these jewellery product images and the CAD specification image.

From the PRODUCT IMAGES (the jewellery photos), generate:
1. A compelling product name (e.g. "Radiant Temple Gold Necklace")
2. A URL-friendly slug ending with "-krt" (e.g. "radiant-temple-gold-necklace-krt")
3. A short description (1 line, ~100 chars, for product cards)
4. A detailed full description (2-3 paragraphs, highlighting craftsmanship, design, occasion, metal details)

From the CAD IMAGE (the technical specification image with metal weights table), extract:
5. Metal weights in grams for each purity listed (look for values like 14K, 18K, 22K, 9K, Sterling Silver 925, etc. and their corresponding weights in grams)
6. Total carat weight (ct weight) of diamonds/stones if shown
7. Which metal purities are available (only include metals that have weight data in the CAD image)

The CAD image typically shows a table with columns like "14K", "18K", "22K" etc. and rows with weight values in grams. Extract the NET WEIGHT or METAL WEIGHT row values for each purity.

Focus on: jewellery type, design style, visible stones or patterns.`;
    } else if (hasCadImage) {
      userPrompt = `Analyze this CAD specification image for a jewellery product.

From the CAD IMAGE (the technical specification image with metal weights table), extract:
1. Metal weights in grams for each purity listed (look for values like 14K, 18K, 22K, 9K, Sterling Silver 925, etc.)
2. Total carat weight (ct weight) of diamonds/stones if shown
3. Which metal purities are available

The CAD image typically shows a table with columns like "14K", "18K", "22K" etc. and rows with weight values in grams. Extract the NET WEIGHT or METAL WEIGHT row values for each purity.`;
    } else {
      userPrompt = `Analyze these jewellery product images and generate:
1. A compelling product name (e.g. "Radiant Temple Gold Necklace")
2. A URL-friendly slug ending with "-krt" (e.g. "radiant-temple-gold-necklace-krt")
3. A short description (1 line, ~100 chars, for product cards)
4. A detailed full description (2-3 paragraphs, highlighting craftsmanship, design, occasion, metal details)

Focus on: jewellery type (ring, necklace, bangle, earring, etc.), design style (temple, modern, traditional, antique), any visible stones or patterns.`;
    }

    const toolParameters: Record<string, any> = {
      name: { type: "string", description: "Product name" },
      slug: { type: "string", description: "URL slug ending with -krt" },
      short_description: { type: "string", description: "Short 1-line description" },
      description: { type: "string", description: "Full detailed description (2-3 paragraphs)" },
    };

    const requiredFields = ["name", "slug", "short_description", "description"];

    if (hasCadImage) {
      toolParameters.metal_weights = {
        type: "array",
        description: "Array of metal purities with their weights extracted from CAD image",
        items: {
          type: "object",
          properties: {
            metal_slug: {
              type: "string",
              description: "Metal purity slug. Use exactly these values: 'gold_9k', 'gold_14k', 'gold_18k', 'gold_22k', 'gold_24k', 'sterling_silver_925', 'platinum_950'. Map 9K/9kt to gold_9k, 14K/14kt to gold_14k, 18K/18kt to gold_18k, 22K/22kt to gold_22k, 24K/24kt to gold_24k, Sterling Silver/925 to sterling_silver_925, Platinum/950 to platinum_950."
            },
            weight_grams: {
              type: "number",
              description: "Weight in grams for this metal purity"
            },
          },
          required: ["metal_slug", "weight_grams"],
        },
      };
      toolParameters.total_carat_weight = {
        type: "number",
        description: "Total diamond/stone carat weight if visible in CAD image. 0 if not found.",
      };
      requiredFields.push("metal_weights", "total_carat_weight");
    }

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
Analyze the product images and/or CAD specification images and generate accurate product details.
You MUST respond using the provided tool/function.
When extracting metal weights from CAD images, be very precise with the numbers. Look for weight tables showing different karat purities.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              ...allImages,
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_product_details",
              description: "Generate product listing details from jewellery images and/or CAD specifications",
              parameters: {
                type: "object",
                properties: toolParameters,
                required: requiredFields,
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
