import { assignmentService } from '../../../services/assignmentService'
import { participantService } from '../../../services/participantService'
import { topicService } from '../../../services/topicService'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const id = getRouterParam(event, 'id')
    
    console.log(`Fetching assignments for event ${id} for user: ${session.user.email}`)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }
    
    // Get assignments for this event
    const assignments = await assignmentService.findByEventId(id)
    
    // Enrich with participant and topic details
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const participant = await participantService.findById(assignment.participantId)
        const topic = await topicService.findById(assignment.topicId)
        
        return {
          ...assignment,
          participant: participant ? {
            id: participant.id,
            firstname: participant.firstname,
            lastname: participant.lastname,
            email: participant.email
          } : null,
          topic: topic ? {
            id: topic.id,
            title: topic.title,
            description: topic.description
          } : null
        }
      })
    )
    
    return {
      success: true,
      assignments: enrichedAssignments
    }
  } catch (error) {
    console.error('Error fetching assignments:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch assignments',
      data: { 
        success: false, 
        message: 'An error occurred while fetching assignments'
      }
    })
  }
})
