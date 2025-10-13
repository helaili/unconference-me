import logger from '~/utils/logger'
import { userService } from '~/services/userService'

export default defineOAuthGitHubEventHandler({
    config: {
      emailRequired: true
    },
    async onSuccess(event, { user: githubUser }) {
      logger.debug(`GitHub OAuth success: ${githubUser.login}`)
      
      const query = getQuery(event)
      const token = query.token as string
      const firstname = query.firstname as string
      const lastname = query.lastname as string
      const email = query.email as string || githubUser.email
      
      try {
        // Check if user exists by GitHub ID
        const users = await userService.findAll()
        let user = users.find(u => u.githubId === githubUser.id)
        
        // If no user by GitHub ID, check by email
        if (!user && email) {
          user = await userService.findByEmail(email)
        }
        
        // If token is provided, validate and map to user
        if (token && !user) {
          const userByToken = users.find(u => u.registrationToken === token)
          if (userByToken) {
            // Validate token expiry
            if (userByToken.registrationTokenExpiry && userByToken.registrationTokenExpiry < new Date()) {
              logger.warn(`Expired registration token during GitHub OAuth: ${token}`)
              return sendRedirect(event, '/register?error=token_expired')
            }
            user = userByToken
          }
        }
        
        if (user) {
          // Update existing user with GitHub info
          user = await userService.update(user.email, {
            githubId: githubUser.id,
            githubUsername: githubUser.login,
            firstname: firstname || user.firstname,
            lastname: lastname || user.lastname,
            role: user.role || 'Participant',
            registrationToken: undefined, // Clear token after successful mapping
            registrationTokenExpiry: undefined,
            updatedAt: new Date()
          })
        } else {
          // Create new user
          user = await userService.create({
            email: email,
            firstname: firstname || githubUser.name?.split(' ')[0] || githubUser.login,
            lastname: lastname || githubUser.name?.split(' ')[1] || '',
            githubId: githubUser.id,
            githubUsername: githubUser.login,
            role: 'Participant',
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
        
        logger.info(`GitHub OAuth successful for user: ${user.email}`)
        
        await setUserSession(event, {
          user: {
            name: `${user.firstname} ${user.lastname}`,
            email: user.email,
            role: user.role,
            githubId: githubUser.id
          }
        })
        
        return sendRedirect(event, '/dashboard')
      } catch (error) {
        logger.error('Error processing GitHub OAuth:', error)
        return sendRedirect(event, '/register?error=auth_failed')
      }
    },
    // Optional, will return a json error and 401 status code by default
    onError(event, error) {
      logger.error('GitHub OAuth error:', error)
      return sendRedirect(event, '/')
    },
  })