import { NextResponse } from "next/server"
import { createLead } from "@/utils/actions/lead-actions"
import { leadSchema } from "@/utils/types/leads"
import { OrgIndustry } from "@prisma/client"
import { z } from "zod"
import { LEAD_PRIORITY, LEAD_SOURCE } from "@/utils/types/leads"

export const dynamic = 'force-dynamic';

// Extended schema for API validation
const apiSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  website: z.string().min(1, "Website is required"),
  fullName: z.string().min(2, "Full name is required"),
  jobTitle: z.string().min(2, "Job title is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  teamSize: z.enum(["5-20", "20-50", "50-100", "100+"]),
  multipleOffices: z.boolean(),
  userId: z.string().optional(),
  source: z.enum([LEAD_SOURCE.CONTACT_FORM_AUTH, LEAD_SOURCE.CONTACT_FORM_PUBLIC])
})

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Validate request data
    const validatedData = apiSchema.parse(data)
    
    // Create lead with validated data
    const lead = await createLead({
      companyName: validatedData.companyName,
      website: validatedData.website,
      industry: OrgIndustry.REAL_ESTATE_SALES,
      fullName: validatedData.fullName,
      jobTitle: validatedData.jobTitle,
      email: validatedData.email,
      phone: validatedData.phone,
      teamSize: validatedData.teamSize,
      multipleOffices: validatedData.multipleOffices,
      assignedToUlid: validatedData.userId,
      priority: validatedData.source === LEAD_SOURCE.CONTACT_FORM_AUTH ? LEAD_PRIORITY.HIGH : LEAD_PRIORITY.LOW,
      status: "NEW",
      notes: [{
        id: crypto.randomUUID(),
        content: `Lead created from ${validatedData.source === LEAD_SOURCE.CONTACT_FORM_AUTH ? "authenticated" : "public"} contact form`,
        createdAt: new Date().toISOString(),
        createdBy: "SYSTEM",
        type: "NOTE"
      }]
    })
    
    // Send different responses based on auth status
    if (validatedData.source === LEAD_SOURCE.CONTACT_FORM_PUBLIC) {
      // TODO: Send welcome email to non-authenticated users
      // await sendWelcomeEmail(validatedData.email)
    }
    
    return NextResponse.json({ data: lead }, { status: 201 })
  } catch (error) {
    console.error("[CONTACT_SALES_API_ERROR]", {
      error,
      timestamp: new Date().toISOString()
    })
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { message: "Invalid form data", details: error.flatten() } },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: { message: "Failed to create lead" } },
      { status: 500 }
    )
  }
} 