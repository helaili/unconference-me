import { userService } from '../../services/userService'
import { isAdminOrOrganizer } from '../../utils/access-control'

export default defineEventHandler(async (event) => {
  try {
    // Check if user is admin or organizer
    const session = await requireUserSession(event)
    
    if (!isAdminOrOrganizer(session)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: { 
          success: false, 
          message: 'Only admins and organizers can access user management'
        }
      })
    }
    
    console.log('Fetching all users')
    
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
    console.error('Error fetching users:', error)
    throw error
  }
})
