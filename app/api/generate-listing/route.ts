import { NextResponse } from "next/server"
import { openai, checkRateLimit, processImageWithAI, withRetry } from "@/lib/openai/openai"
import { z } from "zod"
import { withApiAuth } from "@/utils/middleware/withApiAuth"
import { ApiResponse } from "@/utils/types/api"
import type { OpenAI } from "openai"

// Remove debugging console logs in production
const isDev = process.env.NODE_ENV === 'development'

// Input validation schema
const listingSchema = z.object({
  address: z.string().min(1, "Address is required"),
  propertyType: z.string().min(1, "Property type is required"),
  bedrooms: z.string().min(1, "Number of bedrooms is required"),
  bathrooms: z.string().min(1, "Number of bathrooms is required"),
  squareFootage: z.string().min(1, "Square footage is required"),
  price: z.string().min(1, "Price is required"),
  keyFeatures: z.string().min(1, "Key features are required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  tone: z.string().min(1, "Tone is required"),
})

// Response type
interface GenerateListingResponse {
  listing: string;
}

// Add type safety for form data
interface ListingFormData {
  address: string
  propertyType: string
  bedrooms: string
  bathrooms: string
  squareFootage: string
  price: string
  keyFeatures: string
  targetAudience: string
  tone: string
  frontImage?: File
  kitchenImage?: File
  mainRoomImage?: File
}

async function processImage(file: File | null, description: string, openai: OpenAI) {
  if (!file || !(file instanceof File)) {
    return null
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional real estate photographer and property analyst. Describe the key visual elements and notable features of the property image in a concise, professional manner."
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
      max_tokens: 150,
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error(`Error processing image: ${error}`)
    return null
  }
}

function formatPrice(price: string): string {
  const numPrice = parseInt(price)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(numPrice)
}

function generateListingPrompt(
  data: z.infer<typeof listingSchema>,
  imageAnalyses: (string | null)[]
): string {
  const formattedPrice = formatPrice(data.price)
  const validAnalyses = imageAnalyses.filter((analysis): analysis is string => analysis !== null)
  
  return `Create a compelling real estate listing with the following details:

Property Details:
- Address: ${data.address}
- Type: ${data.propertyType}
- Bedrooms: ${data.bedrooms}
- Bathrooms: ${data.bathrooms}
- Square Footage: ${data.squareFootage}
- Price: ${formattedPrice}
- Key Features: ${data.keyFeatures}

Target Audience: ${data.targetAudience}
Desired Tone: ${data.tone}

Image Analyses:
${validAnalyses.map((analysis, index) => `Image ${index + 1}: ${analysis}`).join('\n')}

Guidelines:
1. Write in a ${data.tone} tone
2. Target the listing towards ${data.targetAudience}
3. Highlight the key features and unique selling points
4. Include the price and square footage naturally in the description
5. Create an attention-grabbing headline
6. Organize the content with clear sections
7. End with a compelling call to action

Format the listing with:
- An engaging headline
- A captivating opening paragraph
- Key features and amenities
- Location highlights
- A strong closing statement`
}

// 1. Add more specific type validation
const validateFormData = (formData: FormData): ListingFormData => {
  const required = ['address', 'propertyType', 'bedrooms', 'bathrooms', 
    'squareFootage', 'price', 'keyFeatures', 'targetAudience', 'tone'] as const
  
  const errors: string[] = []
  
  for (const field of required) {
    const value = formData.get(field)
    if (!value) {
      errors.push(`Missing required field: ${field}`)
    }
    
    // Numeric validation for relevant fields
    if (['bedrooms', 'bathrooms', 'squareFootage', 'price'].includes(field)) {
      const num = Number(value)
      if (isNaN(num) || num <= 0) {
        errors.push(`Invalid ${field}: must be a positive number`)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(', '))
  }

  return {
    address: formData.get('address') as string,
    propertyType: formData.get('propertyType') as string,
    bedrooms: formData.get('bedrooms') as string,
    bathrooms: formData.get('bathrooms') as string,
    squareFootage: formData.get('squareFootage') as string,
    price: formData.get('price') as string,
    keyFeatures: formData.get('keyFeatures') as string,
    targetAudience: formData.get('targetAudience') as string,
    tone: formData.get('tone') as string,
  }
}

export const runtime = 'edge'
export const preferredRegion = 'cle1'
export const maxDuration = 30

export const POST = withApiAuth<GenerateListingResponse>(async (req, { userUlid }) => {
  try {
    // Rate limit check
    if (!checkRateLimit()) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests'
        }
      }, { status: 429 })
    }

    // Parse and validate form data
    const formData = await req.formData()
    const result = listingSchema.safeParse(Object.fromEntries(formData))
    
    if (!result.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid form data',
          details: result.error.format()
        }
      }, { status: 400 })
    }

    // Process images in parallel
    const [frontAnalysis, kitchenAnalysis, mainRoomAnalysis] = await Promise.allSettled([
      processImageWithAI(
        formData.get("frontImage") as File,
        "Analyze the curb appeal and exterior features of this property. Focus on architectural style, condition, and standout elements."
      ),
      processImageWithAI(
        formData.get("kitchenImage") as File,
        "Analyze this kitchen's features, finishes, and overall appeal. Note any upgrades, appliances, and design elements."
      ),
      processImageWithAI(
        formData.get("mainRoomImage") as File,
        "Analyze this main living space. Focus on layout, natural light, features, and overall atmosphere."
      )
    ])

    // Combine successful image analyses
    const imageAnalyses = [frontAnalysis, kitchenAnalysis, mainRoomAnalysis]
      .filter((result): result is PromiseFulfilledResult<string | null> => 
        result.status === 'fulfilled')
      .map(result => result.value)

    // Generate listing with retry logic
    const listing = await withRetry(
      async () => {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an expert real estate copywriter skilled in creating compelling property listings."
            },
            {
              role: "user",
              content: generateListingPrompt(result.data, imageAnalyses)
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        })

        return completion.choices[0].message.content || "Failed to generate listing"
      },
      {
        retries: 3,
        onError: (error, attempt) => {
          console.error("[LISTING_GENERATION_ERROR]", { 
            userUlid,
            attempt,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    )

    return NextResponse.json<ApiResponse<GenerateListingResponse>>({
      data: { listing },
      error: null
    })

  } catch (error) {
    console.error("[GENERATE_LISTING_ERROR]", {
      userUlid,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'GENERATION_FAILED',
        message: 'Failed to generate listing',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
})

export const config = {
  api: {
    bodyParser: false,
  },
} 