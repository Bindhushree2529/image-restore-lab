import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, operation = "enhance" } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing image with operation: ${operation}`);

    // Define prompts for different operations
    const operationPrompts: Record<string, string> = {
      enhance: "Enhance this image to maximum quality and clarity. Make it sharper, increase resolution, improve colors and contrast, reduce noise and blur. The goal is to make the image look professional and crystal clear.",
      colorize: "Colorize this black and white image. Add natural, realistic colors that match the scene and time period. Make it look like a naturally colored photograph with vibrant but realistic tones. Pay attention to skin tones, sky colors, and environmental details.",
      removebg: "Remove the background from this image completely. Keep only the main subject in perfect focus and make the background completely transparent or white. Maintain all details of the subject.",
      upscale: "Upscale this image to higher resolution with maximum quality. Add realistic details, improve texture definition, enhance sharpness and clarity. Make it look naturally high-resolution.",
      denoise: "Remove all noise, grain, and artifacts from this image. Make it clean and smooth while preserving important details, edges, and sharpness. The result should look naturally clean.",
      sharpen: "Sharpen this image significantly. Enhance edges, increase definition throughout, and improve overall clarity and crispness. Make details pop without creating artifacts.",
      brighten: "Brighten and improve the lighting of this image. Enhance brightness, contrast, and exposure to make it more vibrant, clear and well-lit. Maintain natural color balance.",
      removecrack: "Remove all cracks, scratches, tears, and damage from this image. Restore the image to perfect condition by intelligently filling in damaged areas. Preserve all original details while making the image look completely repaired and flawless."
    };

    const prompt = operationPrompts[operation] || operationPrompts.enhance;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to enhance image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const enhancedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!enhancedImageUrl) {
      throw new Error("No enhanced image returned from AI");
    }

    return new Response(
      JSON.stringify({ enhancedImageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error enhancing image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
