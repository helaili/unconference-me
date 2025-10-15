import { z } from 'zod'
import logger from '../../../../../utils/logger'
import { eventService, participantService, topicService } from '../../../../../services'
import { isAdmin } from '../../../../../utils/access-control'

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
    
    logger.info('Creating topic for event', { eventId, user: session.user })
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }
    
    // Validate request body
    const validatedData = createTopicSchema.parse(body)
    
    // Get event to verify it exists
    const eventData = await eventService.findById(eventId)
    if (!eventData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }
    
    // Check if user is admin
    const userIsAdmin = isAdmin(session)
    
    // Find participant based on user or allow admin to submit without being a participant
    const participants = await participantService.findByEventId(eventId)
    const userIdentifier = (session.user as { email?: string; id?: string })?.email || (session.user as { email?: string; id?: string })?.id
    const participant = participants.find(p => p.email === userIdentifier || p.userId === userIdentifier)
    
    // For non-admin users, require participant registration
    if (!userIsAdmin && !participant) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You must be registered as a participant for this event to submit topics'
      })
    }
    
    // For admins without participant registration, create a virtual participant identifier
    let proposerId: string
    if (userIsAdmin && !participant) {
      // Use the user's email or a generated admin identifier as the proposer
      proposerId = userIdentifier || `admin-${Date.now()}`
    } else {
      proposerId = participant!.id
    }
    
    // Check if user has reached the maximum number of topics (non-admin only)
    if (!userIsAdmin) {
      const maxTopics = eventData.settings?.maxTopicsPerParticipant || 3
      const userTopics = await topicService.findByProposer(proposerId)
      const userTopicCount = userTopics.filter(t => t.eventId === eventId).length
      
      if (userTopicCount >= maxTopics) {
        throw createError({
          statusCode: 400,
          statusMessage: `You have reached the maximum number of topics (${maxTopics}) for this event`
        })
      }
    }
    
    // Create new topic using the service
    const newTopic = await topicService.create({
      eventId,
      title: validatedData.title,
      description: validatedData.description,
      proposedBy: proposerId,
      status: 'proposed',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: validatedData.tags ? { tags: validatedData.tags } : undefined
    })
    
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
          errors: error.issues
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
