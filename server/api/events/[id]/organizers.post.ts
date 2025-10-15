import { z } from 'zod'
import logger from '../../../../utils/logger'
import { organizerService, userService } from '../../../../services'
import { canManageEvent } from '../../../../utils/access-control'

// Validation schema for adding an organizer
const addOrganizerSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email('Valid email is required'),
  role: z.enum(['owner', 'admin', 'moderator']).default('moderator'),
  permissions: z.object({
    canEditEvent: z.boolean().optional(),
    canDeleteEvent: z.boolean().optional(),
    canApproveParticipants: z.boolean().optional(),
    canRemoveParticipants: z.boolean().optional(),
    canApproveTopics: z.boolean().optional(),
    canRejectTopics: z.boolean().optional(),
    canScheduleTopics: z.boolean().optional(),
    canManageAssignments: z.boolean().optional(),
    canRunAutoAssignment: z.boolean().optional(),
    canViewReports: z.boolean().optional(),
    canExportData: z.boolean().optional()
  }).optional()
})

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const eventId = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    logger.info('Adding organizer to event', { eventId, user: session.user })
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }
    
    // Check if user has permission to manage this event
    if (!await canManageEvent(eventId, session)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to add organizers to this event'
      })
    }
    
    // Validate request body
    const validatedData = addOrganizerSchema.parse(body)
    
    // Get user information if user exists
    let user = null
    try {
      user = await userService.findByEmail(validatedData.email)
    } catch (err) {
      logger.info('User not found, will create organizer with email only', { email: validatedData.email })
    }
    
    // Check if organizer already exists for this event
    const existingOrganizers = await organizerService.findByEventId(eventId)
    const existing = existingOrganizers.find(o => 
      o.email === validatedData.email || (user && o.userId === user.id)
    )
    
    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: 'This user is already an organizer for this event'
      })
    }
    
    // Default permissions based on role
    const defaultPermissions = {
      owner: {
        canEditEvent: true,
        canDeleteEvent: true,
        canApproveParticipants: true,
        canRemoveParticipants: true,
        canApproveTopics: true,
        canRejectTopics: true,
        canScheduleTopics: true,
        canManageAssignments: true,
        canRunAutoAssignment: true,
        canViewReports: true,
        canExportData: true
      },
      admin: {
        canEditEvent: true,
        canDeleteEvent: false,
        canApproveParticipants: true,
        canRemoveParticipants: true,
        canApproveTopics: true,
        canRejectTopics: true,
        canScheduleTopics: true,
        canManageAssignments: true,
        canRunAutoAssignment: true,
        canViewReports: true,
        canExportData: true
      },
      moderator: {
        canEditEvent: false,
        canDeleteEvent: false,
        canApproveParticipants: true,
        canRemoveParticipants: false,
        canApproveTopics: true,
        canRejectTopics: false,
        canScheduleTopics: true,
        canManageAssignments: false,
        canRunAutoAssignment: false,
        canViewReports: true,
        canExportData: false
      }
    }
    
    const permissions = validatedData.permissions || defaultPermissions[validatedData.role]
    
    // Create new organizer
    const newOrganizer = await organizerService.create({
      eventId,
      userId: user?.id,
      email: validatedData.email,
      firstname: user?.firstname || '',
      lastname: user?.lastname || '',
      role: validatedData.role,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions
    })
    
    logger.info(`Organizer added successfully: ${newOrganizer.id}`)
    
    return {
      success: true,
      organizer: newOrganizer,
      message: 'Organizer added successfully'
    }
  } catch (error) {
    logger.error('Error adding organizer:', error)
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: { 
          success: false, 
          message: 'Invalid organizer data',
          errors: error.issues
        }
      })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to add organizer',
      data: { 
        success: false, 
        message: 'An error occurred while adding the organizer'
      }
    })
  }
})
