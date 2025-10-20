import { z } from 'zod'
import { invitationService, userService } from '../../../../services'

const bodySchema = z.object({
  userIds: z.array(z.string()).min(1)
})

export default defineEventHandler(async (event) => {
  try {
    // Require authentication with admin role
    const session = await requireUserSession(event)
    const isAdmin = (session.user as { role?: string })?.role === 'Admin'
    
    if (!isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const eventId = getRouterParam(event, 'id')
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    const body = await readValidatedBody(event, bodySchema.parse)
    const { userIds } = body

    const invitations = []
    const currentUserId = (session.user as { id?: string })?.id || session.user.email

    for (const userId of userIds) {
      // Verify user exists
      const user = await userService.findById(userId)
      if (!user) {
        console.warn(`User ${userId} not found, skipping invitation`)
        continue
      }

      // Create invitation with personal code
      const invitation = await invitationService.createWithPersonalCode(
        eventId,
        userId,
        currentUserId
      )
      
      invitations.push(invitation)
    }

    return {
      success: true,
      invitations,
      message: `Generated ${invitations.length} personal invitation code(s)`
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: { success: false, message: 'Invalid request data' }
      })
    }
    console.error('Error generating personal invitation codes:', error)
    throw error
  }
})
