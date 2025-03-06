"use client"

import { Card } from "@/components/ui/card"
import { ContactSalesForm } from "@/components/contact-sales/contact-sales-form"
import { useRouter } from "next/navigation"

interface ContactSalesLayoutProps {
  title?: string;
  description?: string;
  redirectPath?: string;
}

export function ContactSalesLayout({ 
  title = "Contact Our Partnership Team",
  description = "Tell us about your brokerage and we'll create a custom solution for your team",
  redirectPath
}: ContactSalesLayoutProps) {
  const router = useRouter()

  const handleSuccess = () => {
    if (redirectPath) {
      router.push(redirectPath)
    }
  }

  return (
    <div className="py-12 px-4 max-w-3xl mx-auto">
      <section className="text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight dark:text-white text-gray-900">
          {title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {description}
        </p>
      </section>
      
      <Card className="p-6">
        <ContactSalesForm onSuccess={handleSuccess} />
      </Card>
    </div>
  )
} 