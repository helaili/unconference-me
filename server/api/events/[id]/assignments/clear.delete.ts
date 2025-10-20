import { assignmentService } from '../../../../services/assignmentService'
import { eventService } from '../../../../services/eventService'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')

    console.log(`Clearing assignments for event ${eventId} by user: ${session.user.email}`)

    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    // Check if user is admin or organizer
    const isAdmin = (session.user as { role?: string })?.role === 'Admin'
    if (!isAdmin) {
      // TODO: Check if user is organizer for this event
      throw createError({
        statusCode: 403,
        statusMessage: 'Only administrators and organizers can clear assignments'
      })
    }

    // Get and delete all assignments for this event
    const assignments = await assignmentService.findByEventId(eventId)
    let deletedCount = 0

    for (const assignment of assignments) {
      const deleted = await assignmentService.delete(assignment.id)
      if (deleted) {
        deletedCount++
      }
    }

    console.log(`Deleted ${deletedCount} assignments for event ${eventId}`)

    // Clear statistics from event settings
    const eventData = await eventService.findById(eventId)
    if (eventData && eventData.settings) {
      const updatedSettings = {
        ...eventData.settings,
        lastAssignmentStatistics: undefined
      }
      await eventService.update(eventId, {
        settings: updatedSettings
      })
    }

    return {
      success: true,
      deletedCount,
      message: `Successfully cleared ${deletedCount} assignments`
    }
  } catch (error) {
    console.error('Error clearing assignments:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to clear assignments',
      data: {
        success: false,
        message: 'An error occurred while clearing assignments'
      }
    })
  }
})
