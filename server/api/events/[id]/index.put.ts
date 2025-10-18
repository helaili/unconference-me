import { z } from 'zod'
import { eventSchema } from '../../../../types/schemas'
import { eventService } from '../../../services'
import { canManageEvent } from '../../../utils/access-control'

// Validation schema for update (all fields optional except required metadata)
const updateEventSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  numberOfRounds: z.number().int().positive().optional(),
  discussionsPerRound: z.number().int().positive().optional(),
  idealGroupSize: z.number().int().positive().optional(),
  minGroupSize: z.number().int().positive().optional(),
  maxGroupSize: z.number().int().positive().optional(),
  status: z.enum(['draft', 'published', 'active', 'completed', 'cancelled']).optional(),
  settings: z.object({
    enableTopicRanking: z.boolean().optional(),
    minTopicsToRank: z.number().int().positive().optional(),
    enableAutoAssignment: z.boolean().optional(),
    maxTopicsPerParticipant: z.number().int().positive().optional(),
    requireApproval: z.boolean().optional(),
    maxParticipants: z.number().int().positive().optional(),
    customSettings: z.record(z.string(), z.any()).optional()
  }).optional()
})

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }
    
    // Check if event exists
    const existingEvent = await eventService.findById(id)
    if (!existingEvent) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }
    
    // Check if user has permission to edit this event (admin or organizer)
    if (!await canManageEvent(id, session)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to edit this event'
      })
    }
    
    // Parse and validate request body
    const body = await readValidatedBody(event, updateEventSchema.parse)
    
    console.log(`[PUT /api/events/${id}] Received update request`)
    console.log(`[PUT /api/events/${id}] User: ${session.user?.email}`)
    console.log(`[PUT /api/events/${id}] Body:`, JSON.stringify(body, null, 2))
    
    // Validate group sizes if provided
    const minSize = body.minGroupSize ?? existingEvent.minGroupSize
    const idealSize = body.idealGroupSize ?? existingEvent.idealGroupSize
    const maxSize = body.maxGroupSize ?? existingEvent.maxGroupSize
    
    if (minSize > idealSize) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Minimum group size cannot be larger than ideal group size'
      })
    }
    
    if (idealSize > maxSize) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ideal group size cannot be larger than maximum group size'
      })
    }
    
    // Update the event
    const updatedEvent = await eventService.update(id, {
      ...body,
      updatedAt: new Date()
    })
    
    console.log(`Event updated successfully: ${id}`)
    
    return {
      success: true,
      event: updatedEvent,
      message: 'Event updated successfully'
    }
  } catch (error) {
    console.error('Error updating event:', error)
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: { 
          success: false, 
          message: 'Invalid event data',
          errors: error.errors
        }
      })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update event',
      data: { 
        success: false, 
        message: 'An error occurred while updating event'
      }
    })
  }
})
