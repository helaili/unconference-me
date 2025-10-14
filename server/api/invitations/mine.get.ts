import logger from '../../../utils/logger'
import { invitationService, eventService } from '../../../services'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const userEmail = (session.user as { email?: string })?.email
    
    if (!userEmail) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User email not found in session'
      })
    }
    
    logger.info(`Fetching invitations for user ${userEmail}`)
    
    // Get pending invitations for this user (email is used as userId)
    const invitations = await invitationService.findPendingByUserId(userEmail)
    
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
