import logger from '../../../../utils/logger'
import { mockData } from '../../../../tests/helpers/mock-manager'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const id = getRouterParam(event, 'id')
    
    logger.info(`Fetching participants for event ${id} for user: ${session.user}`)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }
    
    // Get participants from mock manager
    // In production, this would fetch from CosmosDB
    const participants = mockData.getParticipantsByEventId(id)
    const stats = mockData.getParticipantStats(id)
    
    return {
      success: true,
      participants,
      stats
    }
  } catch (error) {
    logger.error('Error fetching participants:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch participants',
      data: { 
        success: false, 
        message: 'An error occurred while fetching participants'
      }
    })
  }
})
