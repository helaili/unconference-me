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
          message: 'Only admins and organizers can delete users'
        }
      })
    }
    
    const email = decodeURIComponent(getRouterParam(event, 'email') || '')
    
    console.log(`Admin/Organizer deleting user: ${email}`)
    
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
    
    console.log(`Admin/Organizer deleted user: ${email}`)
    
    return { 
      success: true,
      message: 'User deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
})
