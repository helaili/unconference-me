import logger from '../../../utils/logger'
import { mockData } from '../../../tests/helpers/mock-manager'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    
    logger.info(`Fetching events list for user: ${session.user?.email}`)
    
    // Get events from mock manager
    // In production, this would fetch from CosmosDB based on user's permissions
    const events = mockData.getEvents()
    
    return {
      success: true,
      events
    }
  } catch (error) {
    logger.error('Error fetching events:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch events',
      data: { 
        success: false, 
        message: 'An error occurred while fetching events'
      }
    })
  }
})
