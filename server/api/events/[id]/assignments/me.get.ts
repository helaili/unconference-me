import { assignmentService } from '../../../../services/assignmentService'
import { participantService } from '../../../../services/participantService'
import { topicService } from '../../../../services/topicService'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')

    console.log(`Fetching assignments for current user in event ${eventId}`)

    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    // Get participant for current user
    const participants = await participantService.findByEventId(eventId)
    const participant = participants.find(p => p.email === session.user.email)

    if (!participant) {
      // User is not a participant, return empty assignments
      return {
        success: true,
        assignments: [],
        message: 'You are not registered as a participant for this event'
      }
    }

    // Get assignments for this participant
    const assignments = await assignmentService.findByParticipantId(participant.id)

    // Filter assignments for this event only
    const eventAssignments = assignments.filter(a => a.eventId === eventId)

    // Enrich assignments with topic details
    const enrichedAssignments = await Promise.all(
      eventAssignments.map(async (assignment) => {
        const topic = await topicService.findById(assignment.topicId)
        return {
          ...assignment,
          topic: topic ? {
            id: topic.id,
            title: topic.title,
            description: topic.description
          } : null
        }
      })
    )

    // Sort by round and group
    enrichedAssignments.sort((a, b) => {
      if (a.roundNumber !== b.roundNumber) {
        return a.roundNumber - b.roundNumber
      }
      return a.groupNumber - b.groupNumber
    })

    return {
      success: true,
      assignments: enrichedAssignments,
      participantId: participant.id
    }
  } catch (error) {
    console.error('Error fetching user assignments:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch user assignments',
      data: {
        success: false,
        message: 'An error occurred while fetching assignments'
      }
    })
  }
})
