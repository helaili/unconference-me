import logger from '../../../../../utils/logger'
import { participantService } from '../../../../../services'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    
    logger.info(`Creating participant for event ${eventId}`, { user: session.user })
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    // Parse request body
    const body = await readBody(event)
    
    if (!body.email || !body.firstname || !body.lastname) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, firstname, and lastname are required'
      })
    }

    // Create participant
    const participant = await participantService.create({
      eventId,
      email: body.email,
      firstname: body.firstname,
      lastname: body.lastname,
      status: body.status || 'registered',
      registrationDate: new Date()
    })
    
    logger.info(`Participant created successfully`, { participantId: participant.id })
    
    return {
      success: true,
      participant
    }
  } catch (error) {
    logger.error('Error creating participant:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create participant',
      data: { 
        success: false, 
        message: 'An error occurred while creating the participant'
      }
    })
  }
})
