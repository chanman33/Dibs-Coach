import CalAvailabilityPage from '@/components/cal/CalAvailabilityPage'

export default function CalAvailabilityTestPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Cal.com Availability Testing</h1>
      <p className="text-muted-foreground mb-6">
        Test both database availability schedules and Cal.com managed user availability
      </p>
      <CalAvailabilityPage />
    </div>
  )
} 