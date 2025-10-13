import logger from '../../../../utils/logger'
import { mockData } from '../../../../tests/helpers/mock-manager'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    const id = getRouterParam(event, 'id')
    
    logger.info(`Fetching organizers for event ${id}`)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }
    
    // Get organizers from mock manager
    const organizers = mockData.getOrganizersByEventId(id)
    
    // Remove sensitive information
    const sanitizedOrganizers = organizers.map(org => ({
      id: org.id,
      eventId: org.eventId,
      userId: org.userId,
      email: org.email,
      firstname: org.firstname,
      lastname: org.lastname,
      role: org.role,
      status: org.status,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      permissions: org.permissions
    }))
    
    return {
      success: true,
      organizers: sanitizedOrganizers,
      total: sanitizedOrganizers.length
    }
  } catch (error) {
    logger.error('Error fetching organizers:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch organizers',
      data: { 
        success: false, 
        message: 'An error occurred while fetching organizers'
      }
    })
  }
})
