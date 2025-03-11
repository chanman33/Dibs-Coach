import { openai } from "./client";

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ImageProcessingOptions {
  maxTokens?: number;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
}

export async function processImageWithAI(
  file: File | null,
  description: string,
  options?: ImageProcessingOptions
): Promise<string | null> {
  if (!file) return null;
  
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Image size exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit`);
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    
    const response = await openai.chat.completions.create({
      model: options?.model || "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: options?.systemPrompt || 
            "You are a professional real estate photographer and property analyst. Describe the key visual elements and notable features of the property image in a concise, professional manner."
        },
        {
          role: "user",
          content: [
            { type: "text", text: description },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: options?.maxTokens || 150,
      temperature: options?.temperature || 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error(`[IMAGE_PROCESSING_ERROR]`, error);
    return null;
  }
}

// Helper function to analyze multiple images in parallel
export async function processImagesInParallel(
  images: { file: File | null; description: string }[],
  options?: ImageProcessingOptions
): Promise<(string | null)[]> {
  const results = await Promise.allSettled(
    images.map(({ file, description }) => 
      processImageWithAI(file, description, options)
    )
  );

  return results.map(result => 
    result.status === 'fulfilled' ? result.value : null
  );
} 