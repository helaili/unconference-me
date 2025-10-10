import type { Participant } from '../../../../types/participant'
import logger from '../../../../utils/logger'

// Mock data - in production, fetch from CosmosDB
const mockParticipants: Participant[] = [
  {
    id: 'participant-1',
    eventId: '1',
    userId: 'user-1',
    email: 'john.doe@example.com',
    firstname: 'John',
    lastname: 'Doe',
    status: 'confirmed',
    registrationDate: new Date('2025-09-01T00:00:00Z'),
    createdAt: new Date('2025-09-01T00:00:00Z'),
    updatedAt: new Date('2025-09-01T00:00:00Z')
  },
  {
    id: 'participant-2',
    eventId: '1',
    userId: 'user-2',
    email: 'jane.smith@example.com',
    firstname: 'Jane',
    lastname: 'Smith',
    status: 'checked-in',
    registrationDate: new Date('2025-09-02T00:00:00Z'),
    createdAt: new Date('2025-09-02T00:00:00Z'),
    updatedAt: new Date('2025-10-01T00:00:00Z')
  },
  {
    id: 'participant-3',
    eventId: '1',
    userId: 'user-3',
    email: 'bob.johnson@example.com',
    firstname: 'Bob',
    lastname: 'Johnson',
    status: 'registered',
    registrationDate: new Date('2025-09-05T00:00:00Z'),
    createdAt: new Date('2025-09-05T00:00:00Z'),
    updatedAt: new Date('2025-09-05T00:00:00Z')
  }
]

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const id = getRouterParam(event, 'id')
    
    logger.info(`Fetching participants for event ${id} for user: ${session.user?.email}`)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }
    
    // In production, fetch from CosmosDB
    const participants = mockParticipants.filter(p => p.eventId === id)
    
    return {
      success: true,
      participants,
      stats: {
        total: participants.length,
        registered: participants.filter(p => p.status === 'registered').length,
        confirmed: participants.filter(p => p.status === 'confirmed').length,
        checkedIn: participants.filter(p => p.status === 'checked-in').length,
        cancelled: participants.filter(p => p.status === 'cancelled').length
      }
    }
  } catch (error) {
    logger.error('Error fetching participants:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch participants',
      data: { 
        success: false, 
        message: 'An error occurred while fetching participants'
      }
    })
  }
})
