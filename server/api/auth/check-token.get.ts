import { userService } from '../../services/userService'
import { getMockDataStore } from '../../utils/mock-data-context'

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
    
    // Find user by token - use context-aware mock data if in test mode
    const isUsingMockData = process.env.APP_ENV === 'copilot' || process.env.APP_ENV === 'development' || process.env.APP_ENV === 'test'
    
    let user
    if (isUsingMockData) {
      // Get the appropriate mock data store based on test context
      const store = getMockDataStore(event)
      const users = store.getUsers()
      user = users.find(u => u.registrationToken === token)
    } else {
      // Use the service for CosmosDB
      const users = await userService.findAll()
      user = users.find(u => u.registrationToken === token)
    }
    
    if (!user) {
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
      console.warn(`Expired registration token: ${token}`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Token expired',
        data: { 
          success: false, 
          message: 'Registration token has expired'
        }
      })
    }
    
    console.log(`Valid registration token found for user: ${user.email}`)
    
    return { 
      success: true,
      user: {
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname
      }
    }
  } catch (error) {
    console.error('Error checking registration token:', error)
    throw error
  }
})
