import { participantService } from '../../../../services'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    const userEmail = (session.user as any).email as string
    if (!userEmail) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User email not found in session'
      })
    }

    // Get the current user's participant record for this event
    const participant = await participantService.findByEventIdAndEmail(eventId, userEmail)
    
    return {
      success: true,
      participant
    }
  } catch (error) {
    console.error('Error fetching current participant:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch participant',
      data: { 
        success: false, 
        message: 'An error occurred while fetching participant'
      }
    })
  }
})
