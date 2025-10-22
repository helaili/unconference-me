import { eventService } from '../../../../services/eventService'
import { participantService } from '../../../../services/participantService'
import { topicService } from '../../../../services/topicService'
import { topicRankingService } from '../../../../services/topicRankingService'
import { assignmentService } from '../../../../services/assignmentService'
import { assignmentAlgorithmService } from '../../../../services/assignmentAlgorithmService'
import { userService } from '../../../../services/userService'
import { organizerService } from '../../../../services/organizerService'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')

    console.log(`Generating assignments for event ${eventId}`)

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

    // Get organizers for this event
    const organizers = await organizerService.findByEventId(eventId)
    const organizerIds = new Set(organizers.map(o => o.id))

    // Get user information for participants (to check roles)
    const userIds = new Set(participants.map(p => p.userId).filter((id): id is string => !!id))
    const users = new Map<string, { role?: 'Admin' | 'Organizer' | 'Participant' }>()
    
    // Fetch user data for all participants with user accounts
    for (const userId of userIds) {
      const user = await userService.findById(userId)
      if (user) {
        users.set(userId, { role: user.role })
      }
    }

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
      rankings,
      users,
      organizerIds
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
