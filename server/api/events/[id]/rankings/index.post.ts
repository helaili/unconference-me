import { eventService, topicRankingService, participantService } from '../../../../services'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    
    console.log('Saving topic ranking for event', { eventId, user: session.user })
    
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
    
    // Parse request body
    const body = await readBody(event)
    const { rankedTopicIds } = body
    
    if (!Array.isArray(rankedTopicIds)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'rankedTopicIds must be an array'
      })
    }
    
    // Check if ranking already exists
    const existingRanking = await topicRankingService.findByParticipantAndEvent(participant.id, eventId)
    
    let ranking
    if (existingRanking) {
      // Update existing ranking
      ranking = await topicRankingService.update(existingRanking.id, {
        rankedTopicIds,
        lastRankedAt: new Date(),
        lastViewedAt: new Date()
      })
    } else {
      // Create new ranking
      ranking = await topicRankingService.create({
        participantId: participant.id,
        eventId,
        rankedTopicIds,
        lastViewedAt: new Date(),
        lastRankedAt: new Date()
      })
    }
    
    return {
      success: true,
      ranking
    }
  } catch (error) {
    console.error('Error saving topic ranking:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save topic ranking',
      data: { 
        success: false, 
        message: 'An error occurred while saving topic ranking'
      }
    })
  }
})
