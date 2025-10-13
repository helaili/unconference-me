import logger from '../../../utils/logger'
import { userService } from '../../../services/userService'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const token = query.token as string
    
    if (!token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Token required',
        data: { 
          success: false, 
          message: 'Registration token is required'
        }
      })
    }
    
    logger.debug(`Checking registration token: ${token}`)
    
    // Find user by token
    const users = await userService.findAll()
    const user = users.find(u => u.registrationToken === token)
    
    if (!user) {
      logger.warn(`Invalid registration token: ${token}`)
      throw createError({
        statusCode: 404,
        statusMessage: 'Invalid token',
        data: { 
          success: false, 
          message: 'Invalid registration token'
        }
      })
    }
    
    // Check token expiry
    if (user.registrationTokenExpiry && user.registrationTokenExpiry < new Date()) {
      logger.warn(`Expired registration token: ${token}`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Token expired',
        data: { 
          success: false, 
          message: 'Registration token has expired'
        }
      })
    }
    
    logger.info(`Valid registration token found for user: ${user.email}`)
    
    return { 
      success: true,
      user: {
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname
      }
    }
  } catch (error) {
    logger.error('Error checking registration token:', error)
    throw error
  }
})
