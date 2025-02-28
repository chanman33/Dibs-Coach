'use server'

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { ApiResponse } from '@/utils/types/api'
import { 
  ListingSchema,
  createListingSchema,
  updateListingSchema,
  ListingQuerySchema,
  type Listing,
  type CreateListing,
  type UpdateListing,
  type ListingQuery
} from '@/utils/types/listing'

// Create a new listing
export const createListing = withServerAction<Listing, CreateListing>(
  async (data, { userUlid }) => {
    try {
      // Validate input data
      const validatedData = await createListingSchema.parseAsync(data)
      const supabase = await createAuthClient()

      // Create listing
      const { data: listing, error } = await supabase
        .from('Listing')
        .insert({
          ...validatedData,
          userUlid,
          status: validatedData.status || 'DRAFT'
        })
        .select()
        .single()

      if (error) {
        console.error('[CREATE_LISTING_ERROR]', { userUlid, error })
        return {
          data: null,
          error: {
            code: 'CREATE_ERROR',
            message: 'Failed to create listing'
          }
        }
      }

      return {
        data: listing,
        error: null
      }
    } catch (error) {
      console.error('[CREATE_LISTING_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

// Update an existing listing
export const updateListing = withServerAction<Listing, { listingUlid: string } & UpdateListing>(
  async (data, { userUlid }) => {
    try {
      const { listingUlid, ...updateData } = data
      
      // Validate update data
      const validatedData = await updateListingSchema.parseAsync(updateData)
      const supabase = await createAuthClient()

      // Update listing
      const { data: listing, error } = await supabase
        .from('Listing')
        .update(validatedData)
        .eq('ulid', listingUlid)
        .eq('userUlid', userUlid) // Ensure user owns the listing
        .select()
        .single()

      if (error) {
        console.error('[UPDATE_LISTING_ERROR]', { userUlid, listingUlid, error })
        return {
          data: null,
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update listing'
          }
        }
      }

      return {
        data: listing,
        error: null
      }
    } catch (error) {
      console.error('[UPDATE_LISTING_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

// Delete a listing
export const deleteListing = withServerAction<void, { listingUlid: string }>(
  async (data, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Delete listing
      const { error } = await supabase
        .from('Listing')
        .delete()
        .eq('ulid', data.listingUlid)
        .eq('userUlid', userUlid) // Ensure user owns the listing

      if (error) {
        console.error('[DELETE_LISTING_ERROR]', { userUlid, listingUlid: data.listingUlid, error })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to delete listing'
          }
        }
      }

      return {
        data: null,
        error: null
      }
    } catch (error) {
      console.error('[DELETE_LISTING_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

// Fetch listings with pagination and filters
export const fetchListings = withServerAction<{ listings: Listing[], total: number }, ListingQuery>(
  async (query, { userUlid }) => {
    try {
      // Validate query parameters
      const validatedQuery = await ListingQuerySchema.parseAsync(query)
      const supabase = await createAuthClient()

      // Build query
      let listingQuery = supabase
        .from('Listing')
        .select('*', { count: 'exact' })

      // Apply filters
      if (validatedQuery.status) {
        listingQuery = listingQuery.eq('status', validatedQuery.status)
      }
      if (validatedQuery.propertyType) {
        listingQuery = listingQuery.eq('propertyType', validatedQuery.propertyType)
      }
      if (validatedQuery.minPrice) {
        listingQuery = listingQuery.gte('price', validatedQuery.minPrice)
      }
      if (validatedQuery.maxPrice) {
        listingQuery = listingQuery.lte('price', validatedQuery.maxPrice)
      }
      if (validatedQuery.bedrooms) {
        listingQuery = listingQuery.eq('bedrooms', validatedQuery.bedrooms)
      }
      if (validatedQuery.bathrooms) {
        listingQuery = listingQuery.eq('bathrooms', validatedQuery.bathrooms)
      }
      if (validatedQuery.city) {
        listingQuery = listingQuery.ilike('city', `%${validatedQuery.city}%`)
      }
      if (validatedQuery.state) {
        listingQuery = listingQuery.ilike('state', `%${validatedQuery.state}%`)
      }

      // Apply pagination and sorting
      listingQuery = listingQuery
        .order(validatedQuery.sortBy, { ascending: validatedQuery.sortOrder === 'asc' })
        .range(
          validatedQuery.offset,
          validatedQuery.offset + validatedQuery.limit - 1
        )

      // Execute query
      const { data: listings, error, count } = await listingQuery

      if (error) {
        console.error('[FETCH_LISTINGS_ERROR]', { userUlid, error })
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch listings'
          }
        }
      }

      return {
        data: {
          listings: listings || [],
          total: count || 0
        },
        error: null
      }
    } catch (error) {
      console.error('[FETCH_LISTINGS_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

// Fetch single listing
export const fetchListing = withServerAction<Listing, { listingUlid: string }>(
  async (data, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Fetch listing
      const { data: listing, error } = await supabase
        .from('Listing')
        .select('*')
        .eq('ulid', data.listingUlid)
        .single()

      if (error) {
        console.error('[FETCH_LISTING_ERROR]', { userUlid, listingUlid: data.listingUlid, error })
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch listing'
          }
        }
      }

      return {
        data: listing,
        error: null
      }
    } catch (error) {
      console.error('[FETCH_LISTING_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
) 