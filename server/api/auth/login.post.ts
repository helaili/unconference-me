import { z } from 'zod'
import type { User } from '../../../types/user'
import logger from '../../../utils/logger'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
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

  if (user && user.password === password) {
    // set the user session in the cookie
    const session = await setUserSession(event, {
      user: {
        name: `${user.firstname} ${user.lastname}`,
        email: user.email,
        role: user.role
      }
    })
    logger.debug(`User session set for user ${(session as any)?.user?.name} (${(session as any)?.user?.email}) with role ${(session as any)?.user?.role}`)
    return {}
  }

  throw createError({
    statusCode: 401,
    message: 'Invalid email or password'
  })
})
