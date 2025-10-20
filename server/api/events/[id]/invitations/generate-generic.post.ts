import { eventService } from '../../../../services'

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

    // Generate and update generic invitation code
    const updatedEvent = await eventService.updateGenericInvitationCode(eventId)

    return {
      success: true,
      event: updatedEvent,
      genericInvitationCode: updatedEvent.settings?.genericInvitationCode,
      message: 'Generic invitation code generated successfully'
    }
  } catch (error) {
    console.error('Error generating generic invitation code:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate generic invitation code',
      data: { success: false }
    })
  }
})
