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
          message: 'Only admins can delete users'
        }
      })
    }
    
    const email = decodeURIComponent(getRouterParam(event, 'email') || '')
    
    logger.debug(`Admin deleting user: ${email}`)
    
    const success = await userService.delete(email)
    
    if (!success) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
        data: { 
          success: false, 
          message: 'User not found'
        }
      })
    }
    
    logger.info(`Admin deleted user: ${email}`)
    
    return { 
      success: true,
      message: 'User deleted successfully'
    }
  } catch (error) {
    logger.error('Error deleting user:', error)
    throw error
  }
})
