import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import type { NuxtPage } from '@nuxt/schema'
import logger from './utils/logger'


logger.info('Loading nuxt.config.ts')
logger.info(`App Environment: ${process.env.APP_ENV || 'not set'}`)
logger.info(`Using GitHub Auth: ${process.env.NUXT_AUTH_GITHUB === 'true'}`)


export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: [
    '~/assets/css/mobile.css'
  ],
  app: {
    head: {
      title: 'Unconference Me',
      titleTemplate: '%s - Unconference Me',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Manage your unconference events' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'theme-color', content: '#1976d2' }
      ]
    }
  },
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
        const adminPages = ['admin', 'settings', 'users', 'events'] // Add admin-only pages here
        
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
    // Add session configuration for better Safari compatibility
    // Note: SessionConfig requires a 'password' field; source it from env in prod and provide a dev fallback.
    session: {
      // secret used to encrypt/sign sessions; ensure this is set in production via SESSION_PASSWORD
      password: process.env.NUXT_SESSION_PASSWORD || 'dev-session-password-change-me',
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // More permissive than 'strict'
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        domain: process.env.NODE_ENV === 'development' ? 'localhost' : undefined
      }
    },
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
      authUrl: process.env.NUXT_AUTH_GITHUB === 'true' ?  '/auth/github' : '/login',
      eventName: "Universe User Group 2025", 
      eventLocation: "Convene 100 Stockton, Union Square, San Francisco",
      eventDate: "Monday, October 27th, 2025",
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
