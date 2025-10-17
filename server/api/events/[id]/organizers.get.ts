import { organizerService } from '../../../services'
import { canManageEvent } from '../../../utils/access-control'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    
    console.log('Fetching organizers for event', { eventId, user: session.user })
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }
    
    // Check if user has permission to view organizers
    if (!await canManageEvent(eventId, session)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to view organizers for this event'
      })
    }
    
    // Get organizers for the event
    const organizers = await organizerService.findByEventId(eventId)
    
    return {
      success: true,
      organizers
    }
  } catch (error) {
    console.error('Error fetching organizers:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch organizers',
      data: { 
        success: false, 
        message: 'An error occurred while fetching organizers'
      }
    })
  }
})
