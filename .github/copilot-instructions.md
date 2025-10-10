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
├── services/           # Data services with mock implementations
│   ├── mockService.ts  # Base mock service class
│   └── [entity]Service.ts # Entity-specific services
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

## Data Services Architecture

**CRITICAL REQUIREMENT**: All data services in this application MUST use the mock service pattern. This is a mandatory architectural requirement that applies to:

- All existing data services
- All new data services created by GitHub Copilot
- All data access layers and database interactions
- All entity management and CRUD operations

### Mock Service Pattern Requirements

#### 1. Mandatory Mock Service Usage

**ALL new data services created by GitHub Copilot MUST:**

- Extend the base `MockService` class
- Implement mock data storage and operations
- Never directly connect to external databases during development
- Use in-memory data structures for data persistence
- Provide realistic sample data for testing and development

#### 2. Base MockService Implementation

All services must extend from `services/mockService.ts` which provides:

```typescript
export abstract class MockService<T> {
  protected data: T[] = []
  protected nextId = 1

  // Standard CRUD operations
  async findAll(): Promise<T[]>
  async findById(id: string): Promise<T | null>
  async create(data: Omit<T, 'id'>): Promise<T>
  async update(id: string, data: Partial<T>): Promise<T>
  async delete(id: string): Promise<boolean>
  async exists(id: string): Promise<boolean>
}
```

#### 3. Service Implementation Template

**GitHub Copilot MUST follow this exact template when creating new data services:**

```typescript
// services/[entity]Service.ts
import { MockService } from './mockService'
import type { Entity, CreateEntityInput, UpdateEntityInput } from '~/types/[entity]'

export class EntityService extends MockService<Entity> {
  constructor() {
    super('[entities]') // collection name
    this.initializeMockData()
  }

  private initializeMockData() {
    // Add realistic mock data here
    this.data = [
      // Sample entities
    ]
  }

  // Entity-specific methods
  async customMethod(): Promise<Entity[]> {
    // Implementation using this.data
  }
}

// Export singleton instance
export const entityService = new EntityService()
```

#### 4. TypeScript Interface Requirements

All services must define proper interfaces:

```typescript
// types/[entity].ts
export interface Entity {
  id: string
  createdAt: Date
  updatedAt: Date
  // entity-specific properties
}

export interface CreateEntityInput {
  // required properties for creation
}

export interface UpdateEntityInput {
  // optional properties for updates
}
```

### Data Service Creation Guidelines for GitHub Copilot

When GitHub Copilot creates new data services, it MUST:

1. **Always create mock implementations** - Never create direct database connections
2. **Follow the service template** - Use the exact structure shown above
3. **Include realistic mock data** - Add sample data that represents real-world usage
4. **Implement proper TypeScript types** - Define interfaces for all entities
5. **Export singleton instances** - Use the pattern `export const entityService = new EntityService()`
6. **Add entity-specific methods** - Implement business logic methods as needed
7. **Include proper error handling** - Use try/catch blocks and proper error responses
8. **Add logging** - Use the Winston logger for all operations

### Prohibited Patterns

GitHub Copilot MUST NOT create services that:

- Implement database-specific query languages
- Use file system persistence for data storage
- Implement real authentication providers (use mock authentication)

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
- `USE_MOCK_SERVICES` - Force mock service usage ("true"/"false", always "true" for Copilot)

### Database Configuration

The application uses Azure CosmosDB with the following setup:

#### Environment-Specific Instances
- **Staging**: Used for development, testing, and Copilot operations
- **Production**: Used for live production environment

#### Copilot Database Configuration

**IMPORTANT**: GitHub Copilot should ALWAYS use mock services:

- When `APP_ENV=copilot`, the application automatically uses mock service implementations
- Mock services provide safe, isolated data operations for AI-assisted development
- Never connect to production or staging databases during Copilot operations
- All data operations must use in-memory mock implementations

#### Database Collections (for reference only)
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
2. Uses mock service implementations exclusively
3. Uses development-friendly settings and logging levels
4. Provides safe, isolated environment for testing and development

### Runtime Configuration

Runtime config is defined in `nuxt.config.ts` with proper defaults for development and production environments.

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Use Vue 3 Composition API (`<script setup>`)
- Use Vuetify components for UI consistency
- Maintain proper component organization (components/, pages/, layouts/)

### Data Service Guidelines (MANDATORY)

**GitHub Copilot MUST follow these guidelines when creating any data service:**

#### 1. Service Creation Process

1. **Create TypeScript interfaces first** in `types/[entity].ts`
2. **Create service class** in `services/[entity]Service.ts`
3. **Extend MockService base class** with proper generic type
4. **Initialize mock data** in constructor
5. **Implement entity-specific methods** using mock data
6. **Export singleton instance** for application use

#### 2. Mock Data Requirements

All services must include realistic mock data:

```typescript
private initializeMockData() {
  this.data = [
    {
      id: '1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      // realistic entity properties
    },
    // More sample data...
  ]
}
```

#### 3. Business Logic Implementation

Implement entity-specific methods using array operations:

```typescript
async findByStatus(status: string): Promise<Entity[]> {
  return this.data.filter(item => item.status === status)
}

async search(query: string): Promise<Entity[]> {
  return this.data.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase())
  )
}
```

#### 4. Error Handling

Include proper error handling in all methods:

```typescript
async findById(id: string): Promise<Entity | null> {
  try {
    const item = this.data.find(item => item.id === id)
    return item || null
  } catch (error) {
    this.logger.error('Error finding entity by ID', { id, error })
    throw new Error('Failed to find entity')
  }
}
```

### Component Patterns

- Use `definePageMeta()` for page-level configuration
- Apply proper layouts using the `layout` meta property
- Use `useUserSession()` composable for authentication state
- Use `useRuntimeConfig()` for accessing configuration
- Import service instances directly: `import { entityService } from '~/services/entityService'`

### Middleware

- The `authenticated` middleware is automatically applied to non-public pages
- Use `requiresAdmin: true` in page meta for admin-only pages
- Public pages: index, login, register

### Logging

- Use the Winston logger from `./utils/logger` for all logging
- Available log levels: error, warn, info, debug
- Logger configuration should be centralized in `utils/logger.ts`

## Build & Development Commands

**Note**: All commands below must be prefixed with `APP_ENV=copilot` when executed by GitHub Copilot. This ensures the use of mock services exclusively.

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000) - Copilot mode with mock services
APP_ENV=copilot npm run dev

# Build for production - Copilot mode with mock services
APP_ENV=copilot npm run build

# Preview production build - Copilot mode with mock services
APP_ENV=copilot npm run preview

# Generate static site - Copilot mode with mock services
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
5. **Always use mock services for all data operations**

Example of correct Copilot command execution:
```bash
APP_ENV=copilot npm run dev  # Uses mock services exclusively
```

Example of incorrect command execution (do not use):
```bash
npm run dev  # Missing APP_ENV=copilot prefix, service implementation unclear
```

## Testing

- Testing infrastructure uses `@nuxt/test-utils`
- Mock services provide isolated testing environment
- No existing tests are currently in the repository
- When adding tests, follow Nuxt testing best practices
- Test mock services independently of external dependencies

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
5. Import and use appropriate mock services for data operations

### Adding a New Component

1. Create a `.vue` file in `components/`
2. Components are auto-imported by Nuxt
3. Use PascalCase for component names
4. Import mock services as needed for data operations

### Adding a New Data Service (MANDATORY PROCESS)

**GitHub Copilot MUST follow this exact process when creating any new data service:**

#### Step 1: Create TypeScript Interfaces

```typescript
// types/[entity].ts
export interface Entity {
  id: string
  createdAt: Date
  updatedAt: Date
  // entity-specific properties
}

export interface CreateEntityInput {
  // required properties for creation
}

export interface UpdateEntityInput {
  // optional properties for updates
}
```

#### Step 2: Create Mock Service Implementation

```typescript
// services/[entity]Service.ts
import { MockService } from './mockService'
import type { Entity, CreateEntityInput, UpdateEntityInput } from '~/types/[entity]'

export class EntityService extends MockService<Entity> {
  constructor() {
    super('[entities]')
    this.initializeMockData()
  }

  private initializeMockData() {
    // Add realistic sample data
    this.data = [
      // Sample entities with realistic data
    ]
  }

  // Entity-specific methods using mock data
  async findByCustomCriteria(criteria: any): Promise<Entity[]> {
    return this.data.filter(/* implementation */)
  }
}

export const entityService = new EntityService()
```

#### Step 3: Service Integration

1. **Import service in components/pages:**
   ```typescript
   import { entityService } from '~/services/entityService'
   ```

2. **Use service methods with proper error handling:**
   ```typescript
   try {
     const entities = await entityService.findAll()
   } catch (error) {
     // Handle error
   }
   ```

3. **Implement loading states and user feedback**

### Adding Authentication to API Routes

1. Create route in `server/api/`
2. Use `requireUserSession()` for authentication
3. Check user role from session for authorization
4. Use mock services for all data operations

### Working with Mock Services

**GitHub Copilot must follow these patterns when working with services:**

1. **Always use mock services** - Never create database connections
2. **Import service instances** directly in components/pages
3. **Handle service errors** properly with try/catch blocks
4. **Use TypeScript types** for all service interactions
5. **Include proper loading states** in UI components
6. **Implement proper error handling** and user feedback

Example service usage pattern:
```vue
<script setup lang="ts">
import { entityService } from '~/services/entityService'
import type { Entity } from '~/types/entity'

const entities = ref<Entity[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    entities.value = await entityService.findAll()
  } catch (err) {
    error.value = 'Failed to load entities'
    console.error(err)
  } finally {
    loading.value = false
  }
})
</script>
```

## Important Notes

- The application is configured for compatibility date '2025-07-15'
- **GitHub Copilot must always set APP_ENV=copilot before running any npm commands**
- **GitHub Copilot must EXCLUSIVELY use mock services for all data operations**
- **ALL new data services created by GitHub Copilot MUST extend MockService**
- **NO direct database connections are allowed during Copilot operations**
- Vuetify components must be transpiled (configured in build.transpile)
- TypeScript strict mode is enabled
- All paths should use TypeScript path aliases when available
- The APP_ENV=copilot setting enables special configurations for AI-assisted development
- Legacy JSON data files in `/data` directory are maintained for fallback purposes
- Mock services provide safe, isolated environment for development and testing
- Service layer pattern ensures consistency and maintainability across the application

## Critical Reminders for GitHub Copilot

1. **NEVER create direct database connections** - Always use mock services
2. **ALWAYS extend MockService base class** for new data services
3. **ALWAYS include realistic mock data** in service constructors
4. **ALWAYS export singleton instances** from service files
5. **ALWAYS prefix npm commands with APP_ENV=copilot**
6. **ALWAYS use TypeScript interfaces** for all entities
7. **ALWAYS implement proper error handling** in service methods
8. **NEVER access production or staging databases** during development
