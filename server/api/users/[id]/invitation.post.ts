import { z } from 'zod'
import logger from '../../../../utils/logger'
import { mockData } from '../../../../tests/helpers/mock-manager'

const bodySchema = z.object({
  eventId: z.string().optional()
})

export default defineEventHandler(async (event) => {
  try {
    // Require authentication and admin role
    const session = await requireUserSession(event)
    const sessionUser = session.user as { role?: string }
    
    if (sessionUser.role !== 'Admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: { 
          success: false, 
          message: 'Only administrators can generate invitation links'
        }
      })
    }

    const userId = getRouterParam(event, 'id')
    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID required'
      })
    }

    const body = await readValidatedBody(event, bodySchema.parse)
    
    logger.debug(`Generating invitation token for user: ${userId}`)
    
    const user = mockData.getUserById(userId)
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
        data: { 
          success: false, 
          message: 'User not found'
        }
      })
    }

    // Generate new invitation token
    const token = mockData.generateInvitationToken(user.email, body.eventId)
    if (!token) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to generate token',
        data: { 
          success: false, 
          message: 'Failed to generate invitation token'
        }
      })
    }

    const updatedUser = mockData.getUserById(userId)
    
    // Generate invitation URL
    const config = useRuntimeConfig()
    const baseUrl = config.public.siteUrl || 'http://localhost:3000'
    const invitationUrl = `${baseUrl}/register?token=${token}&email=${encodeURIComponent(user.email)}`
    
    logger.info(`Generated invitation token for user ${user.email}`)
    
    return { 
      success: true, 
      message: 'Invitation link generated successfully',
      invitationUrl,
      token,
      expiresAt: updatedUser?.invitationTokenExpiry
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invitation generation validation error:', error.message)
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: { 
          success: false, 
          message: 'Invalid request data',
          errors: error.errors
        }
      })
    }
    throw error
  }
})
