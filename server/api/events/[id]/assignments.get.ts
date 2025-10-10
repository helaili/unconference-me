import type { ParticipantAssignment } from '../../../../types/participant'
import logger from '../../../../utils/logger'

// Mock data - in production, fetch from CosmosDB
const mockAssignments: ParticipantAssignment[] = [
  {
    id: 'assignment-1',
    participantId: 'participant-1',
    topicId: 'topic-1',
    eventId: '1',
    roundNumber: 1,
    groupNumber: 1,
    assignmentMethod: 'manual',
    status: 'confirmed',
    createdAt: new Date('2025-10-01T00:00:00Z'),
    updatedAt: new Date('2025-10-01T00:00:00Z')
  },
  {
    id: 'assignment-2',
    participantId: 'participant-2',
    topicId: 'topic-1',
    eventId: '1',
    roundNumber: 1,
    groupNumber: 1,
    assignmentMethod: 'automatic',
    status: 'assigned',
    createdAt: new Date('2025-10-01T00:00:00Z'),
    updatedAt: new Date('2025-10-01T00:00:00Z')
  },
  {
    id: 'assignment-3',
    participantId: 'participant-3',
    topicId: 'topic-2',
    eventId: '1',
    roundNumber: 1,
    groupNumber: 2,
    assignmentMethod: 'manual',
    status: 'confirmed',
    createdAt: new Date('2025-10-01T00:00:00Z'),
    updatedAt: new Date('2025-10-01T00:00:00Z')
  }
]

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const id = getRouterParam(event, 'id')
    
    logger.info(`Fetching assignments for event ${id} for user: ${session.user?.email}`)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }
    
    // In production, fetch from CosmosDB
    const assignments = mockAssignments.filter(a => a.eventId === id)
    
    return {
      success: true,
      assignments
    }
  } catch (error) {
    logger.error('Error fetching assignments:', error)
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
