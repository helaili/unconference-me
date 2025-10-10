import logger from '../../../../utils/logger'
import { mockData } from '../../../../tests/helpers/mock-manager'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const id = getRouterParam(event, 'id')
    
    logger.info(`Fetching event ${id} for user: ${session.user}`)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }
    
    // Get event from mock manager
    // In production, this would fetch from CosmosDB
    const eventData = mockData.getEventById(id)
    
    if (!eventData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }
    
    return {
      success: true,
      event: eventData
    }
  } catch (error) {
    logger.error('Error fetching event:', error)
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
