import { userService } from '../../services/userService'

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
    
    console.log(`Checking registration token: ${token}`)
    
    // Find user by token
    const users = await userService.findAll()
    const user = users.find(u => u.registrationToken === token)
    
    if (!user) {
      console.warn(`Invalid registration token: ${token}`)
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
