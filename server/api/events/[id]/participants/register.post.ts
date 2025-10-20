import { participantService, userService, eventService, invitationService } from '../../../../services'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    
    console.log(`Registering user to event ${eventId}`, { user: session.user })
    
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

    // Fetch event details to check registration mode
    const eventDetails = await eventService.findById(eventId)
    if (!eventDetails) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }

    const registrationMode = eventDetails.settings?.registrationMode || 'open'

    // Validate invitation code based on registration mode
    if (registrationMode === 'personal-code') {
      // Personal code is required
      if (!body.personalCode) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Personal invitation code is required for this event'
        })
      }

      const validation = await invitationService.validatePersonalCode(
        body.personalCode,
        eventId,
        body.userId
      )

      if (!validation.valid) {
        throw createError({
          statusCode: 403,
          statusMessage: validation.reason || 'Invalid invitation code'
        })
      }

      // Mark invitation as accepted
      if (validation.invitation) {
        await invitationService.update(validation.invitation.id, {
          status: 'accepted',
          respondedAt: new Date()
        })
      }
    } else if (registrationMode === 'generic-code') {
      // Generic code is required
      if (!body.genericCode) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invitation code is required for this event'
        })
      }

      const validation = await eventService.validateGenericCode(eventId, body.genericCode)

      if (!validation.valid) {
        throw createError({
          statusCode: 403,
          statusMessage: validation.reason || 'Invalid invitation code'
        })
      }
    }
    // For 'open' mode, no code validation is needed

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
    
    console.log(`User registered as participant successfully`, { 
      userId: user.id, 
      participantId: participant.id 
    })
    
    return {
      success: true,
      participant
    }
  } catch (error) {
    console.error('Error registering user:', error)
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
