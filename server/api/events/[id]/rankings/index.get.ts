import logger from '../../../../../utils/logger'
import { eventService, topicRankingService, participantService } from '../../../../../services'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    
    logger.info('Fetching topic ranking for event', { eventId, user: session.user })
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }
    
    // Get event to verify it exists
    const eventData = await eventService.findById(eventId)
    if (!eventData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }
    
    // Get participant for current user
    const participants = await participantService.findByEventId(eventId)
    const participant = participants.find(p => p.email === session.user.email)
    
    if (!participant) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Participant not found for this event'
      })
    }
    
    // Get ranking for this participant
    const ranking = await topicRankingService.findByParticipantAndEvent(participant.id, eventId)
    
    return {
      success: true,
      ranking
    }
  } catch (error) {
    logger.error('Error fetching topic ranking:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch topic ranking',
      data: { 
        success: false, 
        message: 'An error occurred while fetching topic ranking'
      }
    })
  }
})
