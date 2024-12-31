import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BookingModal } from './BookingModal'
import { loadCalendlyScript } from '@/lib/calendly'
import { createBooking } from '@/utils/actions/booking'
import { toast } from 'react-hot-toast'

// Mock dependencies
jest.mock('@/lib/calendly', () => ({
  loadCalendlyScript: jest.fn(),
}))

jest.mock('@/utils/actions/booking', () => ({
  createBooking: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('BookingModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    coachName: 'Test Coach',
    calendlyUrl: 'https://calendly.com/test-coach',
    eventTypeUrl: 'https://calendly.com/test-coach/30min',
    rate: 150,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock Calendly widget initialization
    window.Calendly = {
      initInlineWidget: jest.fn(),
    }
  })

  it('renders loading state initially', () => {
    render(<BookingModal {...mockProps} />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('loads Calendly script on open', async () => {
    render(<BookingModal {...mockProps} />)
    expect(loadCalendlyScript).toHaveBeenCalled()
  })

  it('initializes Calendly widget after script loads', async () => {
    ;(loadCalendlyScript as jest.Mock).mockResolvedValue(undefined)
    
    await act(async () => {
      render(<BookingModal {...mockProps} />)
    })

    await waitFor(() => {
      expect(window.Calendly.initInlineWidget).toHaveBeenCalledWith({
        url: mockProps.calendlyUrl,
        parentElement: expect.any(Element),
        prefill: expect.any(Object),
      })
    })
  })

  it('handles Calendly event scheduling', async () => {
    ;(createBooking as jest.Mock).mockResolvedValue({})
    
    await act(async () => {
      render(<BookingModal {...mockProps} />)
    })

    const mockEvent = {
      data: {
        event: 'calendly.event_scheduled',
        payload: {
          event: {
            uri: 'test-uri',
            start_time: '2024-01-01T10:00:00Z',
          },
          invitee: {
            email: 'test@example.com',
          },
        },
      },
    }

    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', mockEvent))
    })

    await waitFor(() => {
      expect(createBooking).toHaveBeenCalledWith({
        eventTypeUrl: mockProps.eventTypeUrl,
        scheduledTime: mockEvent.data.payload.event.start_time,
        inviteeEmail: mockEvent.data.payload.invitee.email,
        eventUri: mockEvent.data.payload.event.uri,
        coachName: mockProps.coachName,
      })
      expect(toast.success).toHaveBeenCalledWith('Meeting scheduled successfully!')
    })
  })

  it('handles booking errors', async () => {
    ;(createBooking as jest.Mock).mockRejectedValue(new Error('Booking failed'))
    
    await act(async () => {
      render(<BookingModal {...mockProps} />)
    })

    const mockEvent = {
      data: {
        event: 'calendly.event_scheduled',
        payload: {
          event: {
            uri: 'test-uri',
            start_time: '2024-01-01T10:00:00Z',
          },
          invitee: {
            email: 'test@example.com',
          },
        },
      },
    }

    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', mockEvent))
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to schedule meeting. Please try again.'
      )
    })
  })

  it('closes modal when close button is clicked', async () => {
    await act(async () => {
      render(<BookingModal {...mockProps} />)
    })
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    
    await act(async () => {
      fireEvent.click(closeButton)
    })
    
    expect(mockProps.onClose).toHaveBeenCalled()
  })
}) 