import { participantService } from '../../../../services'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    const participantId = getRouterParam(event, 'participantId')
    
    console.log(`Deleting participant ${participantId} from event ${eventId}`, { user: session.user })
    
    if (!eventId || !participantId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID and Participant ID are required'
      })
    }

    // Delete participant
    const success = await participantService.delete(participantId)
    
    if (!success) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Participant not found'
      })
    }
    
    console.log(`Participant deleted successfully`, { participantId })
    
    return {
      success: true
    }
  } catch (error) {
    console.error('Error deleting participant:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete participant',
      data: { 
        success: false, 
        message: 'An error occurred while deleting the participant'
      }
    })
  }
})
