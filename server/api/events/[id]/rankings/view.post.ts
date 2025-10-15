import logger from '../../../../../utils/logger'
import { eventService, topicRankingService, participantService } from '../../../../../services'

/**
 * Update the last viewed timestamp for a participant's ranking
 * This is used to track which topics are new/updated since the participant last viewed them
 */
export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    
    logger.info('Updating last viewed timestamp for event', { eventId, user: session.user })
    
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
    
    // Check if ranking already exists
    const existingRanking = await topicRankingService.findByParticipantAndEvent(participant.id, eventId)
    
    let ranking
    if (existingRanking) {
      // Update existing ranking
      ranking = await topicRankingService.update(existingRanking.id, {
        lastViewedAt: new Date()
      })
    } else {
      // Create new ranking with just the viewed timestamp
      ranking = await topicRankingService.create({
        participantId: participant.id,
        eventId,
        rankedTopicIds: [],
        lastViewedAt: new Date()
      })
    }
    
    return {
      success: true,
      ranking
    }
  } catch (error) {
    logger.error('Error updating last viewed timestamp:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update last viewed timestamp',
      data: { 
        success: false, 
        message: 'An error occurred while updating last viewed timestamp'
      }
    })
  }
})
