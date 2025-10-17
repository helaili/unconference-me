import { invitationService, participantService } from '../../../services'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const userEmail = (session.user as { email?: string })?.email
    const invitationId = getRouterParam(event, 'id')
    
    if (!userEmail) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User email not found in session'
      })
    }
    
    console.log(`User ${userEmail} responding to invitation ${invitationId}`)
    
    if (!invitationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invitation ID is required'
      })
    }

    // Parse request body
    const body = await readBody(event)
    
    if (!body.response || !['accept', 'decline'].includes(body.response)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Response must be "accept" or "decline"'
      })
    }

    // Get invitation and verify ownership
    const invitation = await invitationService.findById(invitationId)
    if (!invitation) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Invitation not found'
      })
    }

    if (invitation.userId !== userEmail) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Not authorized to respond to this invitation'
      })
    }

    if (invitation.status !== 'pending') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invitation has already been responded to'
      })
    }

    // Update invitation
    const newStatus = body.response === 'accept' ? 'accepted' : 'declined'
    await invitationService.update(invitationId, {
      status: newStatus,
      respondedAt: new Date(),
      responseComment: body.comment || undefined
    })

    // Update participant status
    const participants = await participantService.findByEventId(invitation.eventId)
    const participant = participants.find(p => p.userId === userEmail)
    
    if (participant) {
      if (body.response === 'accept') {
        await participantService.update(participant.id, {
          status: 'registered'
        })
      } else {
        // Decline - could either delete or mark as cancelled
        await participantService.update(participant.id, {
          status: 'cancelled'
        })
      }
    }
    
    console.log(`Invitation ${invitationId} ${newStatus} by user ${userEmail}`)
    
    return {
      success: true,
      message: `Invitation ${newStatus}`,
      invitation: await invitationService.findById(invitationId)
    }
  } catch (error) {
    console.error('Error responding to invitation:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to respond to invitation',
      data: { 
        success: false, 
        message: 'An error occurred while responding to the invitation'
      }
    })
  }
})
