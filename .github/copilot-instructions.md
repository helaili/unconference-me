# Copilot Instructions for Unconference-Me

## Project Overview

This is a Nuxt.js web application for managing unconference events. The application allows attendees to register, view event details, and participate in unconference discussions.

## Technology Stack

- **Framework**: Nuxt 4.x (Vue 3.x based)
- **UI Library**: Vuetify 3.x with Material Design Icons (@mdi/font)
- **Build Tool**: Vite 7.x
- **Language**: TypeScript
- **Authentication**: nuxt-auth-utils with GitHub OAuth support
- **Validation**: Zod
- **Logging**: Winston
- **Linting**: ESLint with @nuxt/eslint

## Project Structure

```
.
├── components/          # Vue components
│   ├── AppTitle.vue
│   ├── LoginForm.vue
│   └── UnconferenceHeader.vue
├── pages/              # Nuxt pages (auto-routed)
│   ├── index.vue       # Public landing page
│   ├── login.vue       # Login page
│   ├── dashboard.vue   # User dashboard (authenticated)
│   └── adminSettings.vue # Admin settings (requires admin role)
├── layouts/            # Layout components
│   └── public.vue      # Public layout with navigation
├── middleware/         # Route middleware
│   └── authenticated.ts # Authentication guard
├── server/             # Server-side API routes
│   └── api/auth/
│       └── login.post.ts
├── plugins/            # Nuxt plugins
│   └── vuetify.ts      # Vuetify configuration
├── types/              # TypeScript type definitions
│   └── env.d.ts
├── utils/              # Utility functions
│   └── logger.ts
├── data/               # Application data files
│   └── users.json
└── public/             # Static assets
```

## Authentication & Authorization

The application uses a custom authentication system for test environments and GitHub OAuth in production, with the following features:

- **Authentication Middleware**: Applied to all pages except index, login, and register
- **Role-Based Access**: Admin pages (admin, settings) require Admin role
- **GitHub OAuth**: Optional GitHub OAuth integration via environment variables
- **Session Management**: Uses nuxt-auth-utils for session handling

### Authentication Flow

1. Public pages (index, login, register) are accessible to everyone
2. All other pages require authentication (`authenticated` middleware)
3. Admin pages check for `role === 'Admin'` in user session
4. Unauthenticated users are redirected to `/login`
5. Non-admin users attempting to access admin pages are redirected to `/dashboard`

## Configuration

### Environment Variables

The application uses the following environment variables:

- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `GITHUB_API_URL` - GitHub API URL (defaults to https://api.github.com)
- `AUTH_GITHUB_URL` - GitHub authorization URL (defaults to https://github.com/login/oauth/authorize)
- `GITHUB_TOKEN_URL` - GitHub token URL (defaults to https://github.com/login/oauth/access_token)
- `NUXT_TOPICS_FILE_PATH` - Path to topics file
- `NUXT_USERS_FILE_PATH` - Path to users file
- `APP_ENV` - Application environment (development/production)
- `DEFAULT_USER_NAME` - Default username for development
- `DEFAULT_USER_PASSWORD` - Default password for development
- `NUXT_AUTH_GITHUB` - Enable GitHub OAuth ("true"/"false")

### Runtime Configuration

Runtime config is defined in `nuxt.config.ts` with proper defaults for development and production environments.

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Use Vue 3 Composition API (`<script setup>`)
- Use Vuetify components for UI consistency
- Maintain proper component organization (components/, pages/, layouts/)

### Component Patterns

- Use `definePageMeta()` for page-level configuration
- Apply proper layouts using the `layout` meta property
- Use `useUserSession()` composable for authentication state
- Use `useRuntimeConfig()` for accessing configuration

### Middleware

- The `authenticated` middleware is automatically applied to non-public pages
- Use `requiresAdmin: true` in page meta for admin-only pages
- Public pages: index, login, register

### Logging

- Use the Winston logger from `./utils/logger` for all logging
- Available log levels: error, warn, info, debug
- Logger configuration should be centralized in `utils/logger.ts`

## Build & Development Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Generate static site
npm run generate
```

## Testing

- Testing infrastructure uses `@nuxt/test-utils`
- No existing tests are currently in the repository
- When adding tests, follow Nuxt testing best practices

## Key Implementation Details

### Page Routing

Nuxt automatically creates routes from the `pages/` directory:
- `/` → `pages/index.vue`
- `/login` → `pages/login.vue`
- `/dashboard` → `pages/dashboard.vue`
- `/adminSettings` → `pages/adminSettings.vue`

### Authentication Hooks

The `pages:extend` hook in `nuxt.config.ts` automatically applies:
1. Authentication middleware to protected pages
2. Admin requirements to admin pages

### Vuetify Integration

Vuetify is integrated via:
1. A custom Nuxt module in `nuxt.config.ts` that adds the Vite plugin
2. A plugin in `plugins/vuetify.ts` that initializes Vuetify
3. Material Design Icons (@mdi/font) for iconography

## Common Tasks

### Adding a New Page

1. Create a `.vue` file in `pages/`
2. Add to publicPages array in `nuxt.config.ts` if it should be public
3. Add to adminPages array if it requires admin role
4. Define layout using `definePageMeta({ layout: 'public' })` if needed

### Adding a New Component

1. Create a `.vue` file in `components/`
2. Components are auto-imported by Nuxt
3. Use PascalCase for component names

### Adding Authentication to API Routes

1. Create route in `server/api/`
2. Use `requireUserSession()` for authentication
3. Check user role from session for authorization

## Important Notes

- The application is configured for compatibility date '2025-07-15'
- Vuetify components must be transpiled (configured in build.transpile)
- TypeScript strict mode is enabled
- All paths should use TypeScript path aliases when available
