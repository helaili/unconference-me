import logger from '../../../../../utils/logger'
import { topicService, participantService } from '../../../../../services'
import { canDeleteTopic } from '../../../../../utils/access-control'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    const topicId = getRouterParam(event, 'topicId')
    
    logger.info('Deleting topic for event', { topicId, eventId, user: session.user })
    
    if (!eventId || !topicId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID and Topic ID are required'
      })
    }
    
    // Get the topic
    const topic = await topicService.findById(topicId)
    if (!topic) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Topic not found'
      })
    }
    
    // Verify topic belongs to the event
    if (topic.eventId !== eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Topic does not belong to this event'
      })
    }
    
    // Find participant ID based on user identifier
    const participants = await participantService.findByEventId(eventId)
    const userIdentifier = (session.user as { email?: string; id?: string })?.email || (session.user as { email?: string; id?: string })?.id
    const participant = participants.find(p => p.email === userIdentifier || p.userId === userIdentifier)
    
    // Check authorization: admins, organizers, and topic owners can delete
    if (!await canDeleteTopic(eventId, topic.proposedBy, session, participant?.id)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to delete this topic'
      })
    }
    
    // Perform soft delete by updating status to rejected
    await topicService.update(topicId, { status: 'rejected' })
    
    logger.info(`Topic soft deleted successfully: ${topicId}`)
    
    return {
      success: true,
      message: 'Topic deleted successfully'
    }
  } catch (error) {
    logger.error('Error deleting topic:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete topic',
      data: { 
        success: false, 
        message: 'An error occurred while deleting the topic'
      }
    })
  }
})
