import logger from '../../../utils/logger'
import { mockData } from '../../../tests/helpers/mock-manager'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const email = query.email as string
    
    if (!email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email parameter is required'
      })
    }
    
    logger.debug(`Looking up user by email: ${email}`)
    
    // Get user by email
    const user = mockData.getUserByEmail(email)
    
    if (!user) {
      return {
        success: false,
        user: null
      }
    }
    
    // Return sanitized user data (no password)
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        githubId: user.githubId,
        githubUsername: user.githubUsername
      }
    }
  } catch (error) {
    logger.error('Error looking up user:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to lookup user',
      data: { 
        success: false, 
        message: 'An error occurred while looking up user'
      }
    })
  }
})
