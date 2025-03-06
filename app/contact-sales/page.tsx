import { ContactSalesLayout } from "@/components/contact-sales/contact-sales-layout"
import PageWrapper from "@/components/wrapper/page-wrapper"

export default function PublicContactSalesPage() {
  return (
    <PageWrapper>
      <ContactSalesLayout 
        title="Contact Our Sales Team"
        description="Tell us about your business and we'll help you find the perfect solution"
      />
    </PageWrapper>
  )
}
