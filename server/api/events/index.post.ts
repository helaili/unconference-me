import { z } from 'zod'
import { eventService } from '../../services'
import { isAdmin } from '../../utils/access-control'

// Validation schema for creating an event
const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(200, 'Event name must be 200 characters or less'),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().datetime(), // ISO 8601 string
  endDate: z.string().datetime(), // ISO 8601 string
  numberOfRounds: z.number().int().positive().min(1).default(3),
  discussionsPerRound: z.number().int().positive().min(1).default(5),
  idealGroupSize: z.number().int().positive().min(2).default(8),
  minGroupSize: z.number().int().positive().min(2).default(5),
  maxGroupSize: z.number().int().positive().min(2).default(10),
  status: z.enum(['draft', 'published', 'active', 'completed', 'cancelled']).default('draft'),
  settings: z.object({
    enableTopicRanking: z.boolean().default(true),
    minTopicsToRank: z.number().int().positive().default(6),
    enableAutoAssignment: z.boolean().default(false),
    maxTopicsPerParticipant: z.number().int().positive().default(3),
    requireApproval: z.boolean().default(false),
    maxParticipants: z.number().int().positive().optional(),
    customSettings: z.record(z.string(), z.any()).optional()
  }).optional()
})

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    
    // Only admins can create events
    if (!isAdmin(session)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only administrators can create events'
      })
    }
    
    const body = await readBody(event)
    
    console.log('Creating new event', { user: session.user })
    
    // Validate request body
    const validatedData = createEventSchema.parse(body)
    
    // Validate date range
    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)
    
    if (endDate <= startDate) {
      throw createError({
        statusCode: 400,
        statusMessage: 'End date must be after start date'
      })
    }
    
    // Validate group sizes
    if (validatedData.minGroupSize > validatedData.idealGroupSize) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Minimum group size cannot be larger than ideal group size'
      })
    }
    
    if (validatedData.idealGroupSize > validatedData.maxGroupSize) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ideal group size cannot be larger than maximum group size'
      })
    }
    
    // Create the event with default settings if not provided
    const defaultSettings = {
      enableTopicRanking: true,
      minTopicsToRank: 6,
      enableAutoAssignment: false,
      maxTopicsPerParticipant: 3,
      requireApproval: false
    }
    
    const newEvent = await eventService.create({
      name: validatedData.name,
      description: validatedData.description,
      location: validatedData.location,
      startDate,
      endDate,
      numberOfRounds: validatedData.numberOfRounds,
      discussionsPerRound: validatedData.discussionsPerRound,
      idealGroupSize: validatedData.idealGroupSize,
      minGroupSize: validatedData.minGroupSize,
      maxGroupSize: validatedData.maxGroupSize,
      status: validatedData.status,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: validatedData.settings || defaultSettings
    })
    
    console.log(`Event created successfully: ${newEvent.id}`)
    
    return {
      success: true,
      event: newEvent,
      message: 'Event created successfully'
    }
  } catch (error) {
    console.error('Error creating event:', error)
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: { 
          success: false, 
          message: 'Invalid event data',
          errors: error.issues
        }
      })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create event',
      data: { 
        success: false, 
        message: 'An error occurred while creating the event'
      }
    })
  }
})
