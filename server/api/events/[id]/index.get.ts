import { eventService } from '../../../services'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const id = getRouterParam(event, 'id')
    
    console.log(`[GET /api/events/${id}] Fetching event for user:`, session.user)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }
    
    // Get event from service (handles both CosmosDB and mock data based on APP_ENV)
    const eventData = await eventService.findById(id)
    
    if (!eventData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }
    
    console.log(`[GET /api/events/${id}] Returning event with updatedAt:`, eventData.updatedAt)
    
    return {
      success: true,
      event: eventData
    }
  } catch (error) {
    console.error('Error fetching event:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch event',
      data: { 
        success: false, 
        message: 'An error occurred while fetching event details'
      }
    })
  }
})
