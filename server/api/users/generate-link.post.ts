import { z } from 'zod'
import { userService } from '../../services/userService'
import crypto from 'crypto'

const bodySchema = z.object({
  email: z.string().email()
})

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
          message: 'Only admins can generate registration links'
        }
      })
    }
    
    const body = await readValidatedBody(event, bodySchema.parse)
    
    console.log(`Admin generating registration link for: ${body.email}`)
    
    // Find user
    const user = await userService.findByEmail(body.email)
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
        data: { 
          success: false, 
          message: 'User not found'
        }
      })
    }
    
    // Generate new registration token
    const registrationToken = crypto.randomBytes(32).toString('hex')
    const registrationTokenExpiry = new Date()
    registrationTokenExpiry.setDate(registrationTokenExpiry.getDate() + 30) // 30 days expiry
    
    // Update user with new token
    await userService.update(user.email, {
      registrationToken,
      registrationTokenExpiry,
      updatedAt: new Date()
    })
    
    // Get the request headers to build the full URL
    const headers = getHeaders(event)
    const host = headers.host || 'localhost:3000'
    const protocol = headers['x-forwarded-proto'] || 'http'
    
    const registrationLink = `${protocol}://${host}/register?token=${registrationToken}`
    
    console.log(`Admin generated registration link for user: ${user.email}`)
    
    return { 
      success: true,
      token: registrationToken,
      link: registrationLink
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn('Generate link validation error:', error.message)
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: { 
          success: false, 
          message: 'Please check your input',
          errors: error.message
        }
      })
    }
    throw error
  }
})
