import logger from '../../../../../utils/logger'
import { participantService, userService } from '../../../../../services'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    
    logger.info(`Registering user to event ${eventId}`, { user: session.user })
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    // Parse request body
    const body = await readBody(event)
    
    if (!body.userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Fetch user details
    const user = await userService.findById(body.userId)
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Create participant from user
    const participant = await participantService.create({
      eventId,
      userId: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      status: 'registered',
      registrationDate: new Date()
    })
    
    logger.info(`User registered as participant successfully`, { 
      userId: user.id, 
      participantId: participant.id 
    })
    
    return {
      success: true,
      participant
    }
  } catch (error) {
    logger.error('Error registering user:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to register user',
      data: { 
        success: false, 
        message: 'An error occurred while registering the user'
      }
    })
  }
})
