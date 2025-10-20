import { invitationService } from '../../../../services'

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

    const invitations = await invitationService.findByEventId(eventId)

    return {
      success: true,
      invitations
    }
  } catch (error) {
    console.error('Error fetching event invitations:', error)
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
