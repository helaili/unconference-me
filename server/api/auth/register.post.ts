import { z } from 'zod'
import logger from '../../../utils/logger'
import { userService } from '../../../services/userService'

const bodySchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  token: z.string().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, bodySchema.parse)
    const { firstname, lastname, email, password, token } = body
    
    logger.debug(`Registration attempt for email: ${email}`)
    
    // Check if user already exists
    const existingUser = await userService.findByEmail(email)
    
    if (existingUser && existingUser.password) {
      logger.warn(`Registration attempt with existing email: ${email}`)
      throw createError({
        statusCode: 400,
        statusMessage: 'User already exists',
        data: { 
          success: false, 
          message: 'An account with this email already exists'
        }
      })
    }

    // If token is provided, validate it
    if (token && existingUser) {
      if (existingUser.registrationToken !== token) {
        logger.warn(`Invalid registration token for email: ${email}`)
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid token',
          data: { 
            success: false, 
            message: 'Invalid registration token'
          }
        })
      }
      
      // Check token expiry
      if (existingUser.registrationTokenExpiry && existingUser.registrationTokenExpiry < new Date()) {
        logger.warn(`Expired registration token for email: ${email}`)
        throw createError({
          statusCode: 400,
          statusMessage: 'Token expired',
          data: { 
            success: false, 
            message: 'Registration token has expired. Please request a new one.'
          }
        })
      }
    }

    // Create or update user
    let user
    if (existingUser) {
      // Update existing user (from admin-created entry)
      user = await userService.update(email, {
        firstname,
        lastname,
        password,
        role: 'Participant',
        registrationToken: undefined, // Clear the token after successful registration
        registrationTokenExpiry: undefined,
        updatedAt: new Date()
      })
    } else {
      // Create new user
      user = await userService.create({
        email,
        firstname,
        lastname,
        password,
        role: 'Participant',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    
    logger.info(`Successful registration for user ${email}`)
    
    return { 
      success: true, 
      message: 'Registration successful',
      user: {
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Registration validation error:', error.message)
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
