import logger from '../../../../utils/logger'
import { invitationService, userService } from '../../../../services'
import type { User } from '../../../../types/user'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    
    // Extract user ID from session
    const invitedBy = (session.user as User).id
    
    logger.info(`Sending invitations for event ${eventId}`, { user: session.user })
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    // Parse request body
    const body = await readBody(event)
    
    if (!body.userIds || !Array.isArray(body.userIds) || body.userIds.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID list is required'
      })
    }

    // Create invitations for each user
    const invitations = []
    for (const userId of body.userIds) {
      // Verify user exists
      const user = await userService.findById(userId)
      if (!user) {
        logger.warn(`User ${userId} not found, skipping invitation`)
        continue
      }

      // Create invitation
      const invitation = await invitationService.create({
        eventId,
        userId,
        status: 'pending',
        invitedBy,
        invitedAt: new Date()
      })
      
      invitations.push(invitation)
      
      // In a production environment, this would also:
      // 1. Send actual emails with event details
      // 2. Include acceptance/decline links
      // 3. Handle email delivery failures
    }
    
    logger.info(`Created ${invitations.length} invitations for event ${eventId}`, {
      eventId,
      invitationCount: invitations.length
    })
    
    return {
      success: true,
      message: `Invitations sent to ${invitations.length} user(s)`,
      sent: invitations.length
    }
  } catch (error) {
    logger.error('Error sending invitations:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send invitations',
      data: { 
        success: false, 
        message: 'An error occurred while sending invitations'
      }
    })
  }
})
