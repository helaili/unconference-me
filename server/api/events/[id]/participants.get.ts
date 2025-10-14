import logger from '../../../../utils/logger'
import { participantService } from '../../../../services'

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
    
    // Get participants using service layer (automatically uses CosmosDB or mock data based on environment)
    const participants = await participantService.findByEventId(id)
    
    // Calculate stats
    const stats = {
      total: participants.length,
      registered: participants.filter(p => p.status === 'registered').length,
      confirmed: participants.filter(p => p.status === 'confirmed').length,
      checkedIn: participants.filter(p => p.status === 'checked-in').length,
      cancelled: participants.filter(p => p.status === 'cancelled').length
    }
    
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
