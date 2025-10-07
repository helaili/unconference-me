import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import type { NuxtPage } from '@nuxt/schema'
import logger from './utils/logger'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  build: {
    transpile: ['vuetify'],
  },
  nitro: {
    azure: {
      config: {
        platform: {
          apiRuntime: 'node:20'
        }
      }
    }
  },
  hooks: {
    'pages:extend' (pages: NuxtPage[]) {
      function setMiddleware (pages: NuxtPage[]) {
        const publicPages = ['index', 'login', 'register']
        const adminPages = ['admin', 'settings'] // Add admin-only pages here
        
        for (const page of pages) {
          if (page.name && !publicPages.includes(page.name)) {
            logger.debug(`Setting authentication middleware for page: ${page.name}`)
            if (!page.meta) {
              page.meta = {}
            }
            page.meta.middleware = ['authenticated']
            
            // Add admin requirement for admin pages
            if (adminPages.includes(page.name)) {
              logger.debug(`Setting admin requirement for page: ${page.name}`)
              page.meta.requiresAdmin = true
            }
          }
          if (page.children) {
            setMiddleware(page.children)
          }
        }
      }
      setMiddleware(pages)
    }
  },
  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error  -- config.plugins is defined
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
    '@nuxt/eslint', 
    '@nuxt/test-utils',
    'nuxt-auth-utils',
    //...
  ],
  runtimeConfig: {
    oauth: {
      github: {
        clientId: process.env.GITHUBAPP_CLIENT_ID,
        clientSecret: process.env.GITHUBAPP_CLIENT_SECRET,
        apiURL: process.env.GITHUB_API_URL ? process.env.GITHUB_API_URL : 'https://api.github.com',
        authorizationURL: process.env.AUTH_GITHUB_URL ? process.env.AUTH_GITHUB_URL : 'https://github.com/login/oauth/authorize',
        tokenURL: process.env.GITHUB_TOKEN_URL ? process.env.GITHUB_TOKEN_URL : 'https://github.com/login/oauth/access_token',
      }
    },
    topicsFilePath: process.env.NUXT_TOPICS_FILE_PATH,
    usersFilePath: process.env.NUXT_USERS_FILE_PATH,
    public: {
      devMode: process.env.APP_ENV === 'development',
      defaultUserName: process.env.DEFAULT_USER_NAME, 
      defaultUserPassword: process.env.DEFAULT_USER_PASSWORD,
      authUrl: process.env.NUXT_AUTH_GITHUB === 'true' ?  '/auth/github' : '/login'
    }
  },
  vite: {
    server: {
      allowedHosts: ['.localhost', 'unconference-me.ngrok.dev']
    },
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
})
