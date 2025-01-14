import { getCalendlyConfig, getAvailableSlots, createScheduledEvent } from './calendly-api'
import { BookingData } from '@/utils/types/calendly'

// Mock fetch globally
global.fetch = jest.fn()

describe('Calendly API Client', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    process.env.CALENDLY_API_TOKEN = 'mock-token'
  })

  describe('getCalendlyConfig', () => {
    it('should return correct config with auth header', async () => {
      const config = await getCalendlyConfig()
      expect(config.headers).toEqual({
        Authorization: 'Bearer mock-token',
        'Content-Type': 'application/json',
      })
    })
  })

  describe('getAvailableSlots', () => {
    const mockResponse = {
      collection: [
        {
          start_time: '2024-01-01T10:00:00Z',
          end_time: '2024-01-01T11:00:00Z',
        },
      ],
    }

    beforeEach(() => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    })

    it('should fetch available slots successfully', async () => {
      const coachCalendlyUrl = 'https://calendly.com/coach'
      const startTime = '2024-01-01T00:00:00Z'
      const endTime = '2024-01-02T00:00:00Z'

      const result = await getAvailableSlots(coachCalendlyUrl, startTime, endTime)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/scheduled_events/available_times'),
        expect.any(Object)
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('Error message'),
      })

      await expect(
        getAvailableSlots('url', 'start', 'end')
      ).rejects.toThrow('Failed to fetch available slots')
    })

    it('should handle network errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(
        getAvailableSlots('url', 'start', 'end')
      ).rejects.toThrow('Network error')
    })
  })

  describe('createScheduledEvent', () => {
    const mockResponse = {
      resource: {
        uri: 'event-uri',
        name: 'Test Event',
      },
    }

    const mockBookingData: BookingData = {
      eventTypeUrl: 'https://calendly.com/coach/30min',
      scheduledTime: '2024-01-01T10:00:00Z',
      inviteeEmail: 'test@example.com',
      userId: 'user-123',
      eventUri: 'event-uri',
      coachName: 'Test Coach',
    }

    beforeEach(() => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    })

    it('should create scheduled event successfully', async () => {
      const result = await createScheduledEvent(mockBookingData)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/scheduled_events'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: expect.any(String),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('Error message'),
      })

      await expect(createScheduledEvent(mockBookingData)).rejects.toThrow(
        'Failed to schedule event'
      )
    })

    it('should handle network errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(createScheduledEvent(mockBookingData)).rejects.toThrow(
        'Network error'
      )
    })
  })
}) 