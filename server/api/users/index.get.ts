import logger from '../../../utils/logger'
import { userService } from '../../../services/userService'

export default defineEventHandler(async (event) => {
  try {
    // Check if user is admin
    const session = await requireUserSession(event)
    const userRole = (session.user as { role?: string })?.role
    
    if (userRole !== 'Admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: { 
          success: false, 
          message: 'Only admins can access user management'
        }
      })
    }
    
    logger.debug('Fetching all users')
    
    const users = await userService.findAll()
    
    // Remove passwords from response
    const sanitizedUsers = users.map(u => ({
      ...u,
      password: u.password ? '****' : undefined
    }))
    
    return { 
      success: true,
      users: sanitizedUsers
    }
  } catch (error) {
    logger.error('Error fetching users:', error)
    throw error
  }
})
