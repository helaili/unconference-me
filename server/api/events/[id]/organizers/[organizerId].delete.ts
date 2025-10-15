import logger from '../../../../../utils/logger'
import { organizerService } from '../../../../../services'
import { canManageEvent } from '../../../../../utils/access-control'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    const organizerId = getRouterParam(event, 'organizerId')
    
    logger.info('Removing organizer from event', { eventId, organizerId, user: session.user })
    
    if (!eventId || !organizerId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID and Organizer ID are required'
      })
    }
    
    // Check if user has permission to manage this event
    if (!await canManageEvent(eventId, session)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to remove organizers from this event'
      })
    }
    
    // Get the organizer to verify it exists and belongs to this event
    const organizer = await organizerService.findById(organizerId)
    if (!organizer) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Organizer not found'
      })
    }
    
    if (organizer.eventId !== eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Organizer does not belong to this event'
      })
    }
    
    // Delete the organizer
    await organizerService.delete(organizerId)
    
    logger.info(`Organizer removed successfully: ${organizerId}`)
    
    return {
      success: true,
      message: 'Organizer removed successfully'
    }
  } catch (error) {
    logger.error('Error removing organizer:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to remove organizer',
      data: { 
        success: false, 
        message: 'An error occurred while removing the organizer'
      }
    })
  }
})
