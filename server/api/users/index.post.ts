import { z } from 'zod'
import logger from '../../../utils/logger'
import { mockData } from '../../../tests/helpers/mock-manager'

const bodySchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  email: z.string().email()
})

export default defineEventHandler(async (event) => {
  try {
    // Require authentication and admin role
    const session = await requireUserSession(event)
    const sessionUser = session.user as { role?: string }
    
    if (sessionUser.role !== 'Admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: { 
          success: false, 
          message: 'Only administrators can add users'
        }
      })
    }

    const body = await readValidatedBody(event, bodySchema.parse)
    
    logger.debug(`Adding user: ${body.email}`)
    
    // Check if user already exists
    const existingUser = mockData.getUserByEmail(body.email)
    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'User already exists',
        data: { 
          success: false, 
          message: 'A user with this email already exists'
        }
      })
    }

    // Create new user
    const newUser = {
      id: crypto.randomUUID(),
      email: body.email,
      firstname: body.firstname,
      lastname: body.lastname,
      role: 'Participant' as const,
      registeredAt: new Date(),
      updatedAt: new Date()
    }
    
    mockData.addUser(newUser)
    
    logger.info(`User added: ${body.email}`)
    
    return {
      success: true,
      message: 'User added successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        role: newUser.role
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('User addition validation error:', error.message)
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: { 
          success: false, 
          message: 'Invalid request data',
          errors: error.errors
        }
      })
    }
    throw error
  }
})
