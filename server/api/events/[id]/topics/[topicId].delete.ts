import logger from '../../../../../utils/logger'
import { mockData } from '../../../../../tests/helpers/mock-manager'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    const topicId = getRouterParam(event, 'topicId')
    
    logger.info(`Deleting topic ${topicId} for event ${eventId} by user: ${session.user?.email}`)
    
    if (!eventId || !topicId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID and Topic ID are required'
      })
    }
    
    // Get the topic
    const topic = mockData.getTopicById(topicId)
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
    
    // Find participant ID based on user email
    const participants = mockData.getParticipantsByEventId(eventId)
    const participant = participants.find(p => p.email === session.user?.email)
    
    // Check authorization: user can delete their own topics, admin can delete any
    const isAdmin = session.user?.role === 'Admin'
    const isOwner = participant && topic.proposedBy === participant.id
    
    if (!isAdmin && !isOwner) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to delete this topic'
      })
    }
    
    // Perform soft delete (mark as rejected)
    const success = mockData.softDeleteTopic(topicId)
    
    if (!success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete topic'
      })
    }
    
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
