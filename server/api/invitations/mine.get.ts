import logger from '../../../utils/logger'
import { invitationService, eventService } from '../../../services'
import type { User } from '../../../types/user'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const userId = (session.user as User).id
    
    logger.info(`Fetching invitations for user ${userId}`)
    
    // Get pending invitations for this user
    const invitations = await invitationService.findPendingByUserId(userId)
    
    // Enrich with event details
    const enrichedInvitations = await Promise.all(
      invitations.map(async (invitation) => {
        const eventData = await eventService.findById(invitation.eventId)
        return {
          ...invitation,
          event: eventData
        }
      })
    )
    
    return {
      success: true,
      invitations: enrichedInvitations
    }
  } catch (error) {
    logger.error('Error fetching user invitations:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch invitations',
      data: { 
        success: false, 
        message: 'An error occurred while fetching invitations'
      }
    })
  }
})
