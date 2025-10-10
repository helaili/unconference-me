import logger from '../../../../../utils/logger'
import { mockData } from '../../../../../tests/helpers/mock-manager'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    
    logger.info(`Fetching topics for event ${eventId} by user: ${session.user?.email}`)
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }
    
    // Get event to verify it exists
    const eventData = mockData.getEventById(eventId)
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
    
    // Get topics for this event
    let topics = mockData.getTopicsByEventId(eventId)
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase()
      topics = topics.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower) ||
        t.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }
    
    if (status) {
      topics = topics.filter(t => t.status === status)
    }
    
    if (proposedBy) {
      topics = topics.filter(t => t.proposedBy === proposedBy)
    }
    
    return {
      success: true,
      topics
    }
  } catch (error) {
    logger.error('Error fetching topics:', error)
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
