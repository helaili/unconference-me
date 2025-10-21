import { eventService } from '../../../../services/eventService'
import { participantService } from '../../../../services/participantService'
import { topicService } from '../../../../services/topicService'
import { topicRankingService } from '../../../../services/topicRankingService'
import { assignmentService } from '../../../../services/assignmentService'
import { assignmentAlgorithmService } from '../../../../services/assignmentAlgorithmService'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')

    console.log(`Generating assignments for event ${eventId} by user: ${session.user.email}`)

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
        statusMessage: 'Only administrators and organizers can generate assignments'
      })
    }

    // Get event
    const eventData = await eventService.findById(eventId)
    if (!eventData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }

    // Check if auto-assignment is enabled
    if (!eventData.settings?.enableAutoAssignment) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Automatic assignment is not enabled for this event'
      })
    }

    // Get participants
    const participants = await participantService.findByEventId(eventId)

    // Get topics
    const topics = await topicService.findByEventId(eventId)

    // Get rankings
    const rankings = await topicRankingService.findByEventId(eventId)

    // Clear existing assignments for this event
    const existingAssignments = await assignmentService.findByEventId(eventId)
    for (const assignment of existingAssignments) {
      await assignmentService.delete(assignment.id)
    }

    // Generate new assignments
    const result = assignmentAlgorithmService.generateAssignments({
      event: eventData,
      participants,
      topics,
      rankings
    })

    // Save assignments
    const savedAssignments = await assignmentService.bulkCreate(result.assignments)

    console.log(`Generated ${savedAssignments.length} assignments for event ${eventId}`)
    console.log('Statistics:', result.statistics)

    if (result.warnings.length > 0) {
      console.warn('Assignment warnings:', result.warnings)
    }

    // Save statistics to event settings for persistence
    const updatedSettings = {
      ...eventData.settings,
      lastAssignmentStatistics: {
        ...result.statistics,
        generatedAt: new Date()
      }
    }
    
    await eventService.update(eventId, {
      settings: updatedSettings
    })

    return {
      success: true,
      assignments: savedAssignments,
      statistics: result.statistics,
      warnings: result.warnings
    }
  } catch (error) {
    console.error('Error generating assignments:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate assignments',
      data: {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred while generating assignments'
      }
    })
  }
})
