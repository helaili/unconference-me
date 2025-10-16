import { userService } from '~/services'
import logger from '~/utils/logger'

export default defineEventHandler(async (event) => {
  try {
    await requireUserSession(event)
    
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

    logger.info(`User updated: ${email}`)

    return {
      success: true,
      user: updatedUser
    }
  } catch (error: any) {
    logger.error('Failed to update user', { error })
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to update user'
    })
  }
})
