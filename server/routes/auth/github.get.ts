import logger from '~/utils/logger'
import { mockData } from '~/tests/helpers/mock-manager'

export default defineOAuthGitHubEventHandler({
    config: {
      emailRequired: true
    },
    async onSuccess(event, { user, tokens }) {
      logger.debug(`GitHub OAuth success: ${user.login}`)
      
      // Get the email from GitHub user data
      const githubEmail = user.email
      
      // Check if there's a pending invitation in the session
      const session = await getUserSession(event)
      const invitationEmail = session.invitationEmail as string | undefined
      
      let appUser = null
      
      // First, try to find user by GitHub ID
      appUser = mockData.getUserByGithubId(user.id)
      
      // If not found, try to find by invitation email
      if (!appUser && invitationEmail) {
        appUser = mockData.getUserByEmail(invitationEmail)
        if (appUser) {
          // Link GitHub account to existing user
          mockData.updateUser(invitationEmail, {
            githubId: user.id,
            githubUsername: user.login,
            lastLoginAt: new Date()
          })
          logger.info(`Linked GitHub account ${user.login} to user ${invitationEmail}`)
        }
      }
      
      // If still not found, try to find by GitHub email
      if (!appUser && githubEmail) {
        appUser = mockData.getUserByEmail(githubEmail)
        if (appUser) {
          // Link GitHub account
          mockData.updateUser(githubEmail, {
            githubId: user.id,
            githubUsername: user.login,
            lastLoginAt: new Date()
          })
          logger.info(`Linked GitHub account ${user.login} to user ${githubEmail}`)
        }
      }
      
      // If user not found, create a new one
      if (!appUser) {
        const newUser = {
          id: `user-github-${user.id}`,
          email: githubEmail || invitationEmail || `${user.login}@github.local`,
          firstname: user.name?.split(' ')[0] || user.login,
          lastname: user.name?.split(' ').slice(1).join(' ') || '',
          role: invitationEmail ? 'Participant' as const : 'User' as const,
          githubId: user.id,
          githubUsername: user.login,
          registeredAt: new Date(),
          lastLoginAt: new Date()
        }
        mockData.addUser(newUser)
        appUser = newUser
        logger.info(`Created new user from GitHub: ${appUser.email}`)
      } else {
        // Update last login
        mockData.updateUser(appUser.email, { lastLoginAt: new Date() })
      }
      
      await setUserSession(event, {
        user: {
          id: appUser.id,
          name: `${appUser.firstname} ${appUser.lastname}`,
          email: appUser.email,
          role: appUser.role,
          githubId: user.id
        }
      })
      
      return sendRedirect(event, '/dashboard')
    },
    // Optional, will return a json error and 401 status code by default
    onError(event, error) {
      logger.error('GitHub OAuth error:', error)
      return sendRedirect(event, '/')
    },
  })