import logger from '../../../utils/logger'
import { mockData } from '../../../tests/helpers/mock-manager'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication and admin role
    const session = await requireUserSession(event)
    const sessionUser = session.user as { role?: string }
    
    if (sessionUser.role !== 'Admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: { 
          success: false, 
          message: 'Only administrators can view user list'
        }
      })
    }

    logger.debug('Fetching all users for admin')
    
    // Get all users
    const users = mockData.getUsers()
    
    // Remove sensitive information
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role,
      githubId: user.githubId,
      githubUsername: user.githubUsername,
      registeredAt: user.registeredAt,
      lastLoginAt: user.lastLoginAt,
      hasInvitation: !!user.invitationToken,
      invitationExpiry: user.invitationTokenExpiry
    }))
    
    return {
      success: true,
      users: sanitizedUsers,
      total: sanitizedUsers.length
    }
  } catch (error) {
    logger.error('Error fetching users:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch users',
      data: { 
        success: false, 
        message: 'An error occurred while fetching users'
      }
    })
  }
})
