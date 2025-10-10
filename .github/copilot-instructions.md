# Copilot Instructions for Unconference-Me

## Project Overview

This is a Nuxt.js web application for managing unconference events. The application allows attendees to register, view event details, and participate in unconference discussions. The application uses Azure CosmosDB as its primary database with separate staging and production instances.

## Technology Stack

- **Framework**: Nuxt 4.x (Vue 3.x based)
- **UI Library**: Vuetify 3.x with Material Design Icons (@mdi/font)
- **Build Tool**: Vite 7.x
- **Language**: TypeScript
- **Database**: Azure CosmosDB (staging and production instances)
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
├── data/               # Application data files (legacy/fallback)
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

#### Authentication
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `GITHUB_API_URL` - GitHub API URL (defaults to https://api.github.com)
- `AUTH_GITHUB_URL` - GitHub authorization URL (defaults to https://github.com/login/oauth/authorize)
- `GITHUB_TOKEN_URL` - GitHub token URL (defaults to https://github.com/login/oauth/access_token)
- `NUXT_AUTH_GITHUB` - Enable GitHub OAuth ("true"/"false")

#### Database Configuration
- `COSMOS_DB_ENDPOINT_STAGING` - Azure CosmosDB endpoint URL for staging environment
- `COSMOS_DB_KEY_STAGING` - Azure CosmosDB primary key for staging environment
- `COSMOS_DB_DATABASE_NAME_STAGING` - CosmosDB database name for staging (e.g., "unconference-staging")
- `COSMOS_DB_ENDPOINT_PRODUCTION` - Azure CosmosDB endpoint URL for production environment
- `COSMOS_DB_KEY_PRODUCTION` - Azure CosmosDB primary key for production environment
- `COSMOS_DB_DATABASE_NAME_PRODUCTION` - CosmosDB database name for production (e.g., "unconference-production")

#### Application Configuration
- `NUXT_TOPICS_FILE_PATH` - Path to topics file (legacy/fallback)
- `NUXT_USERS_FILE_PATH` - Path to users file (legacy/fallback)
- `APP_ENV` - Application environment (development/production/copilot)
- `DEFAULT_USER_NAME` - Default username for development
- `DEFAULT_USER_PASSWORD` - Default password for development

### Database Configuration

The application uses Azure CosmosDB with the following setup:

#### Environment-Specific Instances
- **Staging**: Used for development, testing, and Copilot operations
- **Production**: Used for live production environment

#### Copilot Database Configuration

**IMPORTANT**: GitHub Copilot should ALWAYS use the staging CosmosDB instance by default:

- When `APP_ENV=copilot`, the application automatically connects to the staging CosmosDB instance
- Staging instance configuration takes precedence for all Copilot operations
- Never connect to production database during development or testing

#### Database Collections
The CosmosDB database typically includes the following collections:
- `users` - User profiles and authentication data
- `events` - Unconference event details
- `sessions` - Event sessions and topics
- `registrations` - User event registrations
- `feedback` - Session feedback and ratings

### Copilot Environment Configuration

**IMPORTANT**: When running any npm commands as GitHub Copilot, ALWAYS set the APP_ENV environment variable to "copilot":

```bash
APP_ENV=copilot npm run [command]
```

This ensures the application:
1. Runs in Copilot mode with appropriate configurations for AI-assisted development
2. Connects to the staging CosmosDB instance by default
3. Uses development-friendly settings and logging levels

### Runtime Configuration

Runtime config is defined in `nuxt.config.ts` with proper defaults for development and production environments.

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Use Vue 3 Composition API (`<script setup>`)
- Use Vuetify components for UI consistency
- Maintain proper component organization (components/, pages/, layouts/)

### Database Guidelines

- Always use the CosmosDB staging instance for development and testing
- Use proper TypeScript interfaces for CosmosDB document types
- Implement proper error handling for database operations
- Use transactions where appropriate for data consistency
- Follow CosmosDB best practices for partition keys and indexing

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

**Note**: All commands below must be prefixed with `APP_ENV=copilot` when executed by GitHub Copilot. This ensures connection to the staging CosmosDB instance.

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000) - Copilot mode with staging DB
APP_ENV=copilot npm run dev

# Build for production - Copilot mode with staging DB
APP_ENV=copilot npm run build

# Preview production build - Copilot mode with staging DB
APP_ENV=copilot npm run preview

# Generate static site - Copilot mode with staging DB
APP_ENV=copilot npm run generate

# Linting - Copilot mode
APP_ENV=copilot npm run lint

# Type checking - Copilot mode
APP_ENV=copilot npm run typecheck
```

### Copilot-Specific Command Guidelines

When GitHub Copilot suggests or runs npm commands, it must:

1. Always prefix commands with `APP_ENV=copilot`
2. Use this environment setting for all development, build, and testing operations
3. Never run npm commands without the APP_ENV=copilot prefix
4. Apply this rule to both direct npm commands and package.json scripts
5. **Always use staging CosmosDB instance for all database operations**

Example of correct Copilot command execution:
```bash
APP_ENV=copilot npm run dev  # Connects to staging CosmosDB
```

Example of incorrect command execution (do not use):
```bash
npm run dev  # Missing APP_ENV=copilot prefix, database connection unclear
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
4. Use CosmosDB staging instance for all database operations during development

### Working with CosmosDB

1. Always connect to staging instance when `APP_ENV=copilot`
2. Use proper TypeScript interfaces for document schemas
3. Implement proper error handling and logging
4. Follow CosmosDB partition key strategies
5. Use appropriate consistency levels for operations

## Important Notes

- The application is configured for compatibility date '2025-07-15'
- **GitHub Copilot must always set APP_ENV=copilot before running any npm commands**
- **GitHub Copilot must always use the staging CosmosDB instance for all database operations**
- Vuetify components must be transpiled (configured in build.transpile)
- TypeScript strict mode is enabled
- All paths should use TypeScript path aliases when available
- The APP_ENV=copilot setting enables special configurations for AI-assisted development
- Legacy JSON data files in `/data` directory are maintained for fallback purposes
- CosmosDB staging instance provides safe environment for development and testing
