import { z } from 'zod'
import logger from '../../../utils/logger'
import { userService } from '../../../services/userService'
import crypto from 'crypto'

const bodySchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['Admin', 'Organizer', 'Participant']).default('Participant')
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
          message: 'Only admins can add users'
        }
      })
    }
    
    const body = await readValidatedBody(event, bodySchema.parse)
    
    logger.debug(`Admin adding user: ${body.email}`)
    
    // Check if user already exists
    const existingUser = await userService.findByEmail(body.email)
    if (existingUser) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User already exists',
        data: { 
          success: false, 
          message: 'A user with this email already exists'
        }
      })
    }
    
    // Generate registration token
    const registrationToken = crypto.randomBytes(32).toString('hex')
    const registrationTokenExpiry = new Date()
    registrationTokenExpiry.setDate(registrationTokenExpiry.getDate() + 30) // 30 days expiry
    
    // Create user with token
    const user = await userService.create({
      ...body,
      registrationToken,
      registrationTokenExpiry,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    logger.info(`Admin created user: ${user.email}`)
    
    return { 
      success: true,
      message: 'User created successfully',
      user: {
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('User creation validation error:', error.message)
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
