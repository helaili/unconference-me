import { z } from 'zod'
import { userService } from '../../services/userService'

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  try {
    const { email, password } = await readValidatedBody(event, bodySchema.parse)
    
    console.log(`Attempting login for email: ${email}`)
    
    // Validate user credentials (includes password verification)
    const user = await userService.validateCredentials(email, password)
    if (!user) {
      console.warn(`Login attempt failed for email: ${email}`)
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
        data: { 
          success: false, 
          message: 'Invalid email or password'
        }
      })
    }

    // set the user session in the cookie
    const session = await setUserSession(event, {
      user: {
        name: `${user.firstname} ${user.lastname}`,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role
      }
    })
    
    console.log(`Successful login for user ${user.email}`)
    // Cast session to a known shape so TypeScript recognizes the `user` property.
    const typedSession = session as { user?: { name: string; email: string; role: string } }
    console.log(`User session set for user ${typedSession.user?.name} (${typedSession.user?.email}) with role ${typedSession.user?.role}`)
    
    return { 
      success: true, 
      message: 'Login successful',
      user: {
        name: `${user.firstname} ${user.lastname}`,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn('Login validation error:', error.message)
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
