import { Card } from "@/components/ui/card"
import { ContactSalesForm } from "./contact-sales-form"

export default function ContactSalesPage() {
  return (
    <div className="py-12 px-4 max-w-3xl mx-auto">
      <section className="text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight dark:text-white text-gray-900">
          Contact Our Partnership Team
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Tell us about your brokerage and we'll create a custom solution for your team
        </p>
      </section>
      
      <Card className="p-6">
        <ContactSalesForm />
      </Card>
    </div>
  )
} 