import { z } from 'zod'
import logger from '../../../../utils/logger'
import { mockData } from '../../../../tests/helpers/mock-manager'

const bodySchema = z.object({
  userId: z.string(),
  role: z.enum(['owner', 'admin', 'moderator']),
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
    // Require authentication and admin/owner role
    const session = await requireUserSession(event)
    const sessionUser = session.user as { role?: string; id?: string }
    
    if (sessionUser.role !== 'Admin' && sessionUser.role !== 'Organizer') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: { 
          success: false, 
          message: 'Only administrators and organizers can assign organizer roles'
        }
      })
    }

    const eventId = getRouterParam(event, 'id')
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID required'
      })
    }

    const body = await readValidatedBody(event, bodySchema.parse)
    
    logger.debug(`Assigning organizer role for event ${eventId}`)
    
    // Get user
    const user = mockData.getUserById(body.userId)
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
        data: { 
          success: false, 
          message: 'User not found'
        }
      })
    }

    // Check if organizer already exists
    const existingOrganizer = mockData.getOrganizerByUserId(body.userId, eventId)
    if (existingOrganizer) {
      // Update existing organizer
      mockData.updateOrganizer(existingOrganizer.id, {
        role: body.role,
        permissions: body.permissions,
        status: 'active'
      })
      
      const updated = mockData.getOrganizerById(existingOrganizer.id)
      
      return {
        success: true,
        message: 'Organizer role updated successfully',
        organizer: updated
      }
    }

    // Create new organizer
    const newOrganizer = {
      id: crypto.randomUUID(),
      eventId,
      userId: body.userId,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      role: body.role,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: body.permissions
    }
    
    mockData.addOrganizer(newOrganizer)
    
    // Update user role if needed
    if (user.role !== 'Admin' && user.role !== 'Organizer') {
      mockData.updateUser(user.email, { role: 'Organizer' })
    }
    
    logger.info(`Created organizer for user ${user.email} in event ${eventId}`)
    
    return {
      success: true,
      message: 'Organizer role assigned successfully',
      organizer: newOrganizer
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Organizer assignment validation error:', error.message)
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: { 
          success: false, 
          message: 'Invalid request data',
          errors: error.errors
        }
      })
    }
    throw error
  }
})
