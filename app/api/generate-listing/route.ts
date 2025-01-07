import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import OpenAI from "openai"

// Remove debugging console logs in production
const isDev = process.env.NODE_ENV === 'development'

// Initialize OpenAI client with error handling
const getOpenAIClient = () => {
  // Hardcode the key temporarily to debug
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  if (isDev) {
    // Debug environment variables
    console.log('Direct Key Check:', {
      NODE_ENV: process.env.NODE_ENV,
      API_KEY_PREFIX: apiKey.substring(0, 20) + '...',
      API_KEY_LENGTH: apiKey.length
    })
  }

  // Create new configuration with direct key
  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: false,
  })

  return client
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

function generateListingPrompt(data: ListingFormData, imageAnalyses: (string | null)[]): string {
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

export async function POST(req: Request) {
  // Define userId at the function scope level
  let userId: string | null = null;
  
  try {
    // Assign userId from auth check
    const { userId: authUserId } = await auth()
    userId = authUserId
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Parse and validate form data
    let formData: FormData
    try {
      formData = await req.formData()
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid form data format" }),
        { status: 400 }
      )
    }

    // Validate form data
    let validatedData: ListingFormData
    try {
      validatedData = validateFormData(formData)
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid form data' }),
        { status: 400 }
      )
    }

    // 2. Initialize OpenAI client
    let openai: OpenAI
    try {
      openai = getOpenAIClient()
    } catch (error) {
      console.error("[OPENAI_INIT_ERROR]", error)
      return new NextResponse(
        "OpenAI configuration error",
        { status: 500 }
      )
    }

    // 3. Process images with size limits
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
    const processImageSafely = async (file: File | null, description: string) => {
      if (!file) return null
      if (file.size > MAX_IMAGE_SIZE) {
        throw new Error(`Image size exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit`)
      }
      return processImage(file, description, openai)
    }

    // 4. Process all data in parallel with proper error handling
    const [frontAnalysis, kitchenAnalysis, mainRoomAnalysis] = await Promise.allSettled([
      processImageSafely(formData.get("frontImage") as File, "Analyze the curb appeal and exterior features of this property. Focus on architectural style, condition, and standout elements."),
      processImageSafely(formData.get("kitchenImage") as File, "Analyze this kitchen's features, finishes, and overall appeal. Note any upgrades, appliances, and design elements."),
      processImageSafely(formData.get("mainRoomImage") as File, "Analyze this main living space. Focus on layout, natural light, features, and overall atmosphere.")
    ])

    // Combine successful image analyses
    const imageAnalyses = [frontAnalysis, kitchenAnalysis, mainRoomAnalysis]
      .filter((result): result is PromiseFulfilledResult<string | null> => 
        result.status === 'fulfilled')
      .map(result => result.value)

    // 6. Generate listing with retry logic
    const generateListing = async (retries = 3): Promise<string> => {
      try {
        const formDataObj: ListingFormData = {
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

        const prompt = generateListingPrompt(formDataObj, imageAnalyses)

        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an experienced real estate copywriter who creates compelling and professional property listings."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        })

        return response.choices[0].message.content || ''
      } catch (error) {
        if (retries > 0 && error instanceof Error && error.message.includes('rate_limit')) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          return generateListing(retries - 1)
        }
        throw error
      }
    }

    const listing = await generateListing()

    // 7. Return response with proper headers
    return NextResponse.json(
      { listing },
      { 
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        }
      }
    )

  } catch (error) {
    console.error("[LISTING_ERROR]", {
      error,
      timestamp: new Date().toISOString(),
      userId // Now accessible in catch block
    })
    
    if (error instanceof OpenAI.APIError) {
      return new NextResponse(
        JSON.stringify({ 
          error: "AI service temporarily unavailable",
          details: isDev ? error.message : undefined 
        }),
        { 
          status: error.status || 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    return new NextResponse(
      JSON.stringify({ 
        error: "An error occurred while generating the listing",
        details: isDev ? (error instanceof Error ? error.message : String(error)) : undefined
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
} 