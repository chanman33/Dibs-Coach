import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle } from 'lucide-react'

// Common result interface used by both test components
export interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: any
}

// Format minutes to time string (e.g., 540 to "09:00")
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// Format time (e.g., "09:00" to "9:00 AM")
export const formatTime = (time: string | undefined | null) => {
  if (!time || typeof time !== 'string') return 'N/A'
  try {
    const [hours, minutes] = time.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) return 'Invalid time'
    const period = hours >= 12 ? 'PM' : 'AM'
    const hour12 = hours % 12 || 12
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
  } catch (error) {
    return 'Invalid time'
  }
}

// Shared result alert component
export const ResultAlert = ({ result }: { result: TestResult | null }) => {
  if (!result) return null
  
  return (
    <Alert className={`mb-4 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
      <div className="flex items-center gap-2">
        {result.success ? 
          <CheckCircle className="h-4 w-4 text-green-600" /> : 
          <XCircle className="h-4 w-4 text-red-600" />
        }
        <AlertTitle>{result.message}</AlertTitle>
      </div>
      {result.error && (
        <AlertDescription className="mt-2 text-sm">
          <div className="bg-white/50 p-2 rounded border border-red-100 overflow-auto max-h-32">
            {typeof result.error === 'object' ? JSON.stringify(result.error, null, 2) : result.error}
          </div>
        </AlertDescription>
      )}
    </Alert>
  )
}

// Helper function to create a base schedule (empty slots for testing)
export function createBaseSchedule() {
  return {
    SUNDAY: [],
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: [],
    SATURDAY: []
  }
} 