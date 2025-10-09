import { z } from 'zod'
import type { User } from '../../../types/user'
import logger from '../../../utils/logger'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  try {
    const { email, password } = await readValidatedBody(event, bodySchema.parse)
    const users: User[] = [
      {
        firstname: "Luke",
        lastname: "Skywalker",
        email: "luke@rebels.com",
        password: "changeme",
        role: "Admin"
      }, 
      {
        firstname: "Darth",
        lastname: "Vador",
        email: "darth@empire.com",
        password: "changeme",
        role: "User"
      }
    ]
    
    // Find user by email
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
      logger.warn(`Login attempt with unknown email: ${email}`)
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
        data: { 
          success: false, 
          message: 'Invalid email or password',
          field: 'email'
        }
      })
    }

    if (user.password !== password) {
      logger.warn(`Login attempt with wrong password for user: ${email}`)
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
        data: { 
          success: false, 
          message: 'Invalid email or password',
          field: 'password'
        }
      })
    }

    // set the user session in the cookie
    const session = await setUserSession(event, {
      user: {
        name: `${user.firstname} ${user.lastname}`,
        email: user.email,
        role: user.role
      }
    })
    
    logger.info(`Successful login for user ${user.email}`)
    // Cast session to a known shape so TypeScript recognizes the `user` property.
    const typedSession = session as { user?: { name: string; email: string; role: string } }
    logger.debug(`User session set for user ${typedSession.user?.name} (${typedSession.user?.email}) with role ${typedSession.user?.role}`)
    
    return { 
      success: true, 
      message: 'Login successful',
      user: {
        name: `${user.firstname} ${user.lastname}`,
        email: user.email,
        role: user.role
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Login validation error:', error.message)
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
