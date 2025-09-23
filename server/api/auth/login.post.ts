import { z } from 'zod'
import logger from '../../../utils/logger'
import { promises as fs } from 'fs'
import { join } from 'path'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)
  const config = useRuntimeConfig()
  const usersFilePath = join(process.cwd(), config.usersFilePath)

  logger.info(`User file path: ${usersFilePath}`)
  
  // Read users from JSON file
  const usersData = await fs.readFile(usersFilePath, 'utf-8')
  const users = JSON.parse(usersData)

  // Find user by email
  const user = users.find((u: any) => u.Email.toLowerCase() === email.toLowerCase())

  if (user && user.Password === password) {
    // set the user session in the cookie
    const session = await setUserSession(event, {
      user: {
        name: `${user.Firstname} ${user.Lastname}`,
        email: user.Email,
        role: user.Role
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
