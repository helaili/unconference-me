import { participantService } from '../../../../services'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    const participantId = getRouterParam(event, 'participantId')
    
    console.log(`Updating participant ${participantId} for event ${eventId}`, { user: session.user })
    
    if (!eventId || !participantId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID and Participant ID are required'
      })
    }

    // Parse request body
    const body = await readBody(event)
    
    // Update participant
    const participant = await participantService.update(participantId, body)
    
    console.log(`Participant updated successfully`, { participantId })
    
    return {
      success: true,
      participant
    }
  } catch (error) {
    console.error('Error updating participant:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update participant',
      data: { 
        success: false, 
        message: 'An error occurred while updating the participant'
      }
    })
  }
})
