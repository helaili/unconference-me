import { z } from 'zod'
import logger from '../../../../../utils/logger'
import { mockData } from '../../../../../tests/helpers/mock-manager'

// Validation schema for creating a topic
const createTopicSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional()
})

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    logger.info(`Creating topic for event ${eventId} by user: ${session.user?.email}`)
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }
    
    // Validate request body
    const validatedData = createTopicSchema.parse(body)
    
    // Get event to verify it exists and check settings
    const eventData = mockData.getEventById(eventId)
    if (!eventData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }
    
    // Find participant ID based on user email
    const participants = mockData.getParticipantsByEventId(eventId)
    const participant = participants.find(p => p.email === session.user?.email)
    
    if (!participant) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You must be registered as a participant for this event to submit topics'
      })
    }
    
    // Check if user has reached the maximum number of topics (non-admin only)
    const isAdmin = session.user?.role === 'Admin'
    if (!isAdmin) {
      const maxTopics = eventData.settings?.maxTopicsPerParticipant || 3
      const userTopicCount = mockData.countTopicsByProposer(eventId, participant.id)
      
      if (userTopicCount >= maxTopics) {
        throw createError({
          statusCode: 400,
          statusMessage: `You have reached the maximum number of topics (${maxTopics}) for this event`
        })
      }
    }
    
    // Create new topic
    const newTopic = {
      id: `topic-${Date.now()}`,
      eventId,
      title: validatedData.title,
      description: validatedData.description,
      proposedBy: participant.id,
      status: 'proposed' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: validatedData.tags ? { tags: validatedData.tags } : undefined
    }
    
    mockData.addTopic(newTopic)
    
    logger.info(`Topic created successfully: ${newTopic.id}`)
    
    return {
      success: true,
      topic: newTopic,
      message: 'Topic submitted successfully'
    }
  } catch (error) {
    logger.error('Error creating topic:', error)
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: { 
          success: false, 
          message: 'Invalid topic data',
          errors: error.errors
        }
      })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create topic',
      data: { 
        success: false, 
        message: 'An error occurred while creating the topic'
      }
    })
  }
})
