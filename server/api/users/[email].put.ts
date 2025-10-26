import { userService } from '~/server/services'
import { isAdminOrOrganizer } from '~/server/utils/access-control'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    
    // Check if user is admin or organizer
    if (!isAdminOrOrganizer(session)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: { 
          success: false, 
          message: 'Only admins and organizers can update users'
        }
      })
    }
    
    const email = getRouterParam(event, 'email')
    if (!email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required'
      })
    }

    const body = await readBody(event)
    const { firstname, lastname, role } = body

    if (!firstname || !lastname) {
      throw createError({
        statusCode: 400,
        statusMessage: 'First name and last name are required'
      })
    }

    // Check if user exists
    const existingUser = await userService.findByEmail(decodeURIComponent(email))
    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Update user (email cannot be changed as it's the ID)
    const updatedUser = await userService.update(decodeURIComponent(email), {
      firstname,
      lastname,
      role: role || 'Participant'
    })

    console.log(`User updated: ${email}`)

    return {
      success: true,
      user: updatedUser
    }
  } catch (error: any) {
    console.error('Failed to update user', { error })
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to update user'
    })
  }
})
