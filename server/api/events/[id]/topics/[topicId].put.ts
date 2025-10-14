import { z } from 'zod'
import type { Topic } from '../../../../../types/topic'
import logger from '../../../../../utils/logger'
import { topicService, participantService } from '../../../../../services'
import { canEditTopic, canChangeTopicStatus } from '../../../../../utils/access-control'

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
    
    logger.info('Updating topic for event', { topicId, eventId, user: session.user })
    
    if (!eventId || !topicId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID and Topic ID are required'
      })
    }
    
    // Validate request body
    const validatedData = updateTopicSchema.parse(body)
    
    // Get the topic
    const topic = await topicService.findById(topicId)
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
    
    // Find participant ID based on user identifier
    const participants = await participantService.findByEventId(eventId)
    const userIdentifier = (session.user as { email?: string; id?: string })?.email || (session.user as { email?: string; id?: string })?.id
    const participant = participants.find(p => p.email === userIdentifier || p.userId === userIdentifier)
    
    // Check authorization: admins, organizers, and topic owners can edit
    if (!await canEditTopic(eventId, topic.proposedBy, session, participant?.id)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to edit this topic'
      })
    }
    
    // Check if user can change status (only admins and organizers)
    if (validatedData.status && !await canChangeTopicStatus(eventId, session)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only administrators and organizers can change topic status'
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
    
    const updatedTopic = await topicService.update(topicId, updates)
    
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
          errors: error.issues
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
