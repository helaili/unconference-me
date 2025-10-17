import { eventService, topicService } from '../../../../services'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    
    console.log('Fetching topics for event', { eventId, user: session.user })
    
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
    
    // Get query parameters for filtering
    const query = getQuery(event)
    const search = query.search as string | undefined
    const status = query.status as string | undefined
    const proposedBy = query.proposedBy as string | undefined
    
    // Use the topic service search method for better performance
    const topics = await topicService.searchTopics(eventId, {
      search,
      status,
      proposedBy
    })
    
    return {
      success: true,
      topics
    }
  } catch (error) {
    console.error('Error fetching topics:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch topics',
      data: { 
        success: false, 
        message: 'An error occurred while fetching topics'
      }
    })
  }
})
