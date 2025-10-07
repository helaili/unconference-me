import logger from '~/utils/logger'

export default defineOAuthGitHubEventHandler({
    config: {
      emailRequired: true
    },
    async onSuccess(event, { user }) {
      logger.debug(`GitHub OAuth success: ${user.login}`)
      await setUserSession(event, {
        user: {
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