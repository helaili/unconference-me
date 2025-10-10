import { z } from 'zod'
import type { Topic } from '../../../../../types/topic'
import logger from '../../../../../utils/logger'
import { mockData } from '../../../../../tests/helpers/mock-manager'

// Validation schema for updating a topic
const updateTopicSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').optional(),
  description: z.string().optional(),
  status: z.enum(['proposed', 'approved', 'scheduled', 'completed', 'rejected']).optional(),
  tags: z.array(z.string()).optional()
})

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    const topicId = getRouterParam(event, 'topicId')
    const body = await readBody(event)
    
    logger.info(`Updating topic ${topicId} for event ${eventId} by user: ${session.user?.email}`)
    
    if (!eventId || !topicId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID and Topic ID are required'
      })
    }
    
    // Validate request body
    const validatedData = updateTopicSchema.parse(body)
    
    // Get the topic
    const topic = mockData.getTopicById(topicId)
    if (!topic) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Topic not found'
      })
    }
    
    // Verify topic belongs to the event
    if (topic.eventId !== eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Topic does not belong to this event'
      })
    }
    
    // Find participant ID based on user email
    const participants = mockData.getParticipantsByEventId(eventId)
    const participant = participants.find(p => p.email === session.user?.email)
    
    // Check authorization: user can edit their own topics, admin can edit any
    const isAdmin = session.user?.role === 'Admin'
    const isOwner = participant && topic.proposedBy === participant.id
    
    if (!isAdmin && !isOwner) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to edit this topic'
      })
    }
    
    // Non-admins cannot change status
    if (!isAdmin && validatedData.status) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only administrators can change topic status'
      })
    }
    
    // Update the topic
    const updates: Partial<Topic> = {}
    if (validatedData.title !== undefined) updates.title = validatedData.title
    if (validatedData.description !== undefined) updates.description = validatedData.description
    if (validatedData.status !== undefined) updates.status = validatedData.status
    if (validatedData.tags !== undefined) {
      updates.metadata = { ...topic.metadata, tags: validatedData.tags }
    }
    
    const success = mockData.updateTopic(topicId, updates)
    
    if (!success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update topic'
      })
    }
    
    const updatedTopic = mockData.getTopicById(topicId)
    
    logger.info(`Topic updated successfully: ${topicId}`)
    
    return {
      success: true,
      topic: updatedTopic,
      message: 'Topic updated successfully'
    }
  } catch (error) {
    logger.error('Error updating topic:', error)
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
      statusMessage: 'Failed to update topic',
      data: { 
        success: false, 
        message: 'An error occurred while updating the topic'
      }
    })
  }
})
