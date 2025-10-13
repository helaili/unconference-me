import { z } from 'zod'
import logger from '../../../utils/logger'
import { mockData } from '../../../tests/helpers/mock-manager'

const bodySchema = z.object({
  email: z.string().email(),
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  password: z.string().min(8),
  invitationToken: z.string().optional(),
  eventId: z.string().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, bodySchema.parse)
    
    logger.debug(`Registration attempt for email: ${body.email}`)
    
    // Check if user already exists
    const existingUser = mockData.getUserByEmail(body.email)
    if (existingUser && existingUser.password) {
      logger.warn(`Registration attempt with existing email: ${body.email}`)
      throw createError({
        statusCode: 409,
        statusMessage: 'User already exists',
        data: { 
          success: false, 
          message: 'An account with this email already exists'
        }
      })
    }

    // Validate invitation token if provided
    if (body.invitationToken) {
      const validatedUser = mockData.validateInvitationToken(body.invitationToken)
      if (!validatedUser) {
        logger.warn(`Invalid or expired invitation token: ${body.invitationToken}`)
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid invitation token',
          data: { 
            success: false, 
            message: 'The invitation link is invalid or has expired'
          }
        })
      }

      // Check if token matches the email
      if (validatedUser.email.toLowerCase() !== body.email.toLowerCase()) {
        logger.warn(`Email mismatch for invitation token`)
        throw createError({
          statusCode: 400,
          statusMessage: 'Email mismatch',
          data: { 
            success: false, 
            message: 'This invitation link is for a different email address'
          }
        })
      }
    }

    // Create new user or update existing participant
    const userId = existingUser?.id || `user-${Date.now()}`
    const newUser = {
      id: userId,
      email: body.email,
      firstname: body.firstname,
      lastname: body.lastname,
      password: body.password,
      role: body.invitationToken ? 'Participant' as const : 'User' as const,
      registeredAt: new Date(),
      lastLoginAt: new Date(),
      invitationToken: undefined,
      invitationTokenExpiry: undefined
    }

    if (existingUser) {
      mockData.updateUser(body.email, newUser)
    } else {
      mockData.addUser(newUser)
    }

    // If there's a participant record, link it to the user
    if (body.eventId) {
      const participants = mockData.getParticipantsByEventId(body.eventId)
      const participant = participants.find(p => p.email.toLowerCase() === body.email.toLowerCase())
      if (participant) {
        mockData.updateParticipant(participant.id, { userId, status: 'confirmed' })
      }
    }

    // Set user session
    await setUserSession(event, {
      user: {
        id: userId,
        name: `${body.firstname} ${body.lastname}`,
        email: body.email,
        role: newUser.role
      }
    })
    
    logger.info(`Successful registration for user ${body.email}`)
    
    return { 
      success: true, 
      message: 'Registration successful',
      user: {
        id: userId,
        name: `${body.firstname} ${body.lastname}`,
        email: body.email,
        role: newUser.role
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Registration validation error:', error.message)
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: { 
          success: false, 
          message: 'Please check your input',
          errors: error.errors
        }
      })
    }
    throw error
  }
})
