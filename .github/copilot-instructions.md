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

**CRITICAL REQUIREMENT**: All data services in this application use a **hybrid architecture** that supports both mock data (for development/testing) and CosmosDB (for staging/production) based on the `APP_ENV` environment variable.

### Environment-Based Data Service Pattern

The application automatically switches between data sources based on environment:

- **Development/Copilot (`APP_ENV=development|copilot`)**: Uses in-memory mock data via MockDataManager
- **Staging (`APP_ENV=staging`)**: Uses Azure CosmosDB with staging connection string
- **Production (`APP_ENV=production`)**: Uses Azure CosmosDB with production connection string

### Base Service Architecture

#### 1. BaseService Implementation

All services extend from `services/baseService.ts` which provides:

```typescript
export abstract class BaseService<T extends { id: string }> {
  protected abstract readonly containerName: string
  protected abstract readonly partitionKey: string
  
  // Environment detection
  protected async isUsingCosmosDB(): Promise<boolean>
  
  // CosmosDB operations
  protected async executeCosmosQuery<TResult = T>(query: string, parameters?: SqlParameter[]): Promise<TResult[]>
  protected async cosmosUpsert(item: T): Promise<T>
  protected async cosmosDelete(id: string, partitionKeyValue?: string): Promise<boolean>
  protected async cosmosReadById(id: string, partitionKeyValue?: string): Promise<T | null>
  
  // Abstract methods that must be implemented
  abstract findAll(): Promise<T[]>
  abstract findById(id: string): Promise<T | null>
  abstract create(data: Omit<T, 'id'>): Promise<T>
  abstract update(id: string, data: Partial<T>): Promise<T>
  abstract delete(id: string): Promise<boolean>
  abstract exists(id: string): Promise<boolean>
}
```

#### 2. Service Implementation Template

**GitHub Copilot MUST follow this exact template when creating new data services:**

```typescript
// services/[entity]Service.ts
import { BaseService } from './baseService'
import { mockData } from '../tests/helpers/mock-manager'
import type { Entity } from '../types/[entity]'
import logger from '../utils/logger'

export class EntityService extends BaseService<Entity> {
  protected readonly containerName = '[entities]'
  protected readonly partitionKey = '/[partitionKey]'

  async findAll(): Promise<Entity[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Entity>('SELECT * FROM c')
      } else {
        return mockData.getEntities()
      }
    } catch (error) {
      logger.error('Failed to fetch all entities', { error })
      throw error
    }
  }

  async findById(id: string): Promise<Entity | null> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.cosmosReadById(id, id) // or appropriate partition key
      } else {
        return mockData.getEntityById(id) || null
      }
    } catch (error) {
      logger.error('Failed to fetch entity by id', { id, error })
      throw error
    }
  }

  async create(entityData: Omit<Entity, 'id'>): Promise<Entity> {
    try {
      const entity: Entity = {
        ...entityData,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (await this.isUsingCosmosDB()) {
        return await this.cosmosUpsert(entity)
      } else {
        mockData.addEntity(entity)
        return entity
      }
    } catch (error) {
      logger.error('Failed to create entity', { entityData, error })
      throw error
    }
  }

  async update(id: string, updates: Partial<Entity>): Promise<Entity> {
    try {
      if (await this.isUsingCosmosDB()) {
        const existingEntity = await this.findById(id)
        if (!existingEntity) {
          throw new Error(`Entity with id ${id} not found`)
        }

        const updatedEntity: Entity = {
          ...existingEntity,
          ...updates,
          id,
          updatedAt: new Date()
        }

        return await this.cosmosUpsert(updatedEntity)
      } else {
        const success = mockData.updateEntity(id, { ...updates, updatedAt: new Date() })
        if (!success) {
          throw new Error(`Entity with id ${id} not found`)
        }
        
        const updatedEntity = mockData.getEntityById(id)
        if (!updatedEntity) {
          throw new Error('Failed to retrieve updated entity')
        }
        return updatedEntity
      }
    } catch (error) {
      logger.error('Failed to update entity', { id, updates, error })
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.cosmosDelete(id, id) // or appropriate partition key
      } else {
        return mockData.removeEntity(id)
      }
    } catch (error) {
      logger.error('Failed to delete entity', { id, error })
      throw error
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const entity = await this.findById(id)
      return entity !== null
    } catch (error) {
      logger.error('Failed to check if entity exists', { id, error })
      throw error
    }
  }

  private generateId(): string {
    return `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const entityService = new EntityService()
```

#### 3. Available Data Services

The application provides the following pre-built services:

- **UserService** (`services/userService.ts`) - User management
- **EventService** (`services/eventService.ts`) - Event management  
- **ParticipantService** (`services/participantService.ts`) - Event participant management
- **TopicService** (`services/topicService.ts`) - Discussion topic management
- **AssignmentService** (`services/assignmentService.ts`) - Participant-topic assignments

#### 4. TypeScript Interface Requirements

All entities must include these base properties:

```typescript
// types/[entity].ts
export interface Entity {
  id: string
  createdAt: Date
  updatedAt: Date
  // entity-specific properties
}
```

#### 5. CosmosDB Configuration

**Container Design:**
- `users` - Partition key: `/email`
- `events` - Partition key: `/id`
- `participants` - Partition key: `/eventId`
- `topics` - Partition key: `/eventId`
- `assignments` - Partition key: `/eventId`

**Connection String:**
Uses `COSMODB_PRIMARY_CONNECTION_STRING` environment variable for both staging and production.

### Data Service Creation Guidelines for GitHub Copilot

When GitHub Copilot creates new data services, it MUST:

1. **Always extend BaseService** - Never create services that bypass the hybrid architecture
2. **Follow the service template** - Use the exact structure shown above
3. **Implement both CosmosDB and mock data paths** - Every method must handle both data sources
4. **Use proper partition keys** - Follow CosmosDB partitioning best practices
5. **Include proper error handling** - Use try/catch blocks with detailed logging
6. **Export singleton instances** - Use the pattern `export const entityService = new EntityService()`
7. **Add entity-specific methods** - Implement business logic methods that work with both data sources
8. **Include proper logging** - Use the Winston logger for all operations
9. **Use appropriate SQL queries** - Write efficient CosmosDB SQL queries for production
10. **Handle async operations** - All methods must be async and handle promises correctly

### Mandatory Service Features

Every service MUST include:

- **Environment detection** - Automatic switching between mock and CosmosDB
- **Proper container naming** - Use plural nouns for container names
- **Partition key strategy** - Define appropriate partition keys for CosmosDB
- **Error handling** - Comprehensive error handling with logging
- **Type safety** - Full TypeScript support with proper interfaces
- **ID generation** - Consistent ID generation strategies
- **CRUD operations** - Complete Create, Read, Update, Delete functionality
- **Custom query methods** - Entity-specific query methods for business logic

### CosmosDB Integration Requirements

When implementing CosmosDB operations:

1. **Use SQL API** - All queries must use CosmosDB SQL syntax
2. **Parameterize queries** - Always use parameter binding to prevent injection
3. **Handle partitioning** - Consider partition keys in all operations
4. **Optimize queries** - Write efficient queries with proper indexing
5. **Handle errors** - Properly handle CosmosDB-specific errors (404, etc.)
6. **Use transactions** - Implement proper transaction handling where needed

### MockData Integration Requirements

When implementing mock operations:

1. **Use MockDataManager** - Always use the centralized mock data manager
2. **Maintain consistency** - Ensure mock data matches CosmosDB schema
3. **Support filtering** - Implement proper filtering for mock operations
4. **Handle relationships** - Properly handle entity relationships in mock data
5. **Provide test data** - Include realistic test data for development

### Prohibited Patterns

GitHub Copilot MUST NOT create services that:

- **Bypass the BaseService** - All services must extend BaseService
- **Mix data sources inappropriately** - Never mix CosmosDB and mock data in single operations
- **Hardcode environment logic** - Use the isUsingCosmosDB() method for environment detection
- **Ignore error handling** - Every operation must have proper error handling
- **Skip logging** - All operations must include appropriate logging

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

### Admin Privileges

Users with `role === 'Admin'` have enhanced capabilities throughout the application:

#### Topic Management
- **Submit topics to any event**: Admins can create topics for any event without being registered as participants
- **Edit any topic**: Admins can modify any topic regardless of who proposed it
- **Delete any topic**: Admins can remove any topic from any event
- **Bypass topic limits**: Admins are not subject to the maximum topics per participant restriction
- **Change topic status**: Only admins can update topic status (proposed, approved, scheduled, etc.)

#### Event Management
- **Access any event**: Admins can view and manage all events regardless of participation status
- **Modify event settings**: Admins can update event configuration and settings

#### Administrative Detection
The system detects admin users using:
```typescript
const isAdmin = (session.user as { role?: string })?.role === 'Admin'
```

For admin-submitted topics without participant registration, the system generates virtual proposer IDs to maintain data integrity.

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
- **ALWAYS implement mobile-first responsive design principles**

### Mobile Compatibility Requirements (MANDATORY)

**CRITICAL**: All UI components and pages MUST be mobile-compatible and responsive. GitHub Copilot MUST follow these mobile-first guidelines:

#### 1. Responsive Design Patterns

- **Use Vuetify's breakpoint system**: `$vuetify.display.smAndDown`, `$vuetify.display.mdAndUp`
- **Mobile-first approach**: Design for mobile screens first, then enhance for larger screens
- **Responsive spacing**: Use `pa-2 pa-md-4` (small padding on mobile, larger on desktop)
- **Responsive typography**: Use conditional classes like `:class="$vuetify.display.smAndDown ? 'text-h3' : 'text-h2'"`
- **Touch-friendly targets**: Ensure all interactive elements are at least 44px in height

#### 2. Navigation Patterns

- **Mobile navigation drawer**: Use `temporary` mode on mobile, `rail` mode on desktop
- **Icon-only buttons on mobile**: Show text labels only on larger screens
- **Auto-close drawers**: Close navigation drawers after navigation on mobile
- **Touch-optimized spacing**: Provide adequate spacing between interactive elements

Example mobile navigation pattern:
```vue
<v-navigation-drawer 
  v-model="drawer" 
  :rail="$vuetify.display.mdAndUp"
  :expand-on-hover="$vuetify.display.mdAndUp"
  :temporary="$vuetify.display.smAndDown"
>
  <v-list nav>
    <v-list-item @click="$vuetify.display.smAndDown && (drawer = false)" />
  </v-list>
</v-navigation-drawer>
```

#### 3. Form Layout Requirements

- **Block buttons on mobile**: Use `:block="$vuetify.display.smAndDown"` for primary actions
- **Stacked button layouts**: Use `flex-column flex-sm-row` for button groups
- **Comfortable input density**: Use `density="comfortable"` for better touch interaction
- **Proper spacing**: Use responsive margin/padding classes

Example mobile-friendly form actions:
```vue
<v-card-actions class="flex-column flex-sm-row">
  <v-spacer />
  <v-btn 
    variant="outlined"
    :block="$vuetify.display.smAndDown"
    class="mb-2 mb-sm-0 mr-sm-2"
  >
    Cancel
  </v-btn>
  <v-btn 
    color="primary"
    :block="$vuetify.display.smAndDown"
  >
    Submit
  </v-btn>
</v-card-actions>
```

#### 4. Content Layout Standards

- **Responsive containers**: Use appropriate container classes with responsive padding
- **Flexible grids**: Use Vuetify's responsive grid system (`cols="12" md="8"`)
- **Adaptive content**: Adjust content size and spacing based on screen size
- **Mobile-optimized cards**: Reduce padding and margins on mobile devices

#### 5. Mandatory Mobile Testing

- **Mobile viewports enabled**: Playwright tests include mobile Chrome and Safari
- **Touch interaction testing**: Test tap, swipe, and scroll behaviors
- **Responsive layout verification**: Verify layouts work across all screen sizes
- **Accessibility compliance**: Ensure minimum touch target sizes (44px)

#### 6. Vuetify Configuration Requirements

The Vuetify plugin MUST be configured with mobile-optimized defaults:

```typescript
const vuetify = createVuetify({
  display: {
    mobileBreakpoint: 'sm',
    thresholds: {
      xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920,
    },
  },
  defaults: {
    VBtn: { class: 'text-none' }, // Better mobile readability
    VTextField: { variant: 'outlined', density: 'comfortable' },
    // ... other mobile-friendly defaults
  },
})
```

#### 7. Meta Tag Requirements

All pages MUST include proper mobile meta tags:

```typescript
meta: [
  { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
  { name: 'format-detection', content: 'telephone=no' },
  { name: 'mobile-web-app-capable', content: 'yes' },
  { name: 'apple-mobile-web-app-capable', content: 'yes' },
  { name: 'theme-color', content: '#1976d2' }
]
```

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
- **Always implement responsive breakpoints using Vuetify's display system**
- **Use mobile-first design patterns in all components**
- **Test components across all viewport sizes during development**

### Mobile Component Creation Guidelines

When GitHub Copilot creates new components, it MUST:

1. **Include responsive breakpoints** for all layout elements
2. **Use mobile-appropriate sizing** for text, buttons, and spacing
3. **Implement touch-friendly interactions** with proper target sizes
4. **Add responsive navigation patterns** where applicable
5. **Test mobile usability** during component development
6. **Follow accessibility guidelines** for mobile devices

Example responsive component template:
```vue
<template>
  <v-container :class="$vuetify.display.smAndDown ? 'pa-2' : 'pa-4'">
    <v-row>
      <v-col cols="12" :md="$vuetify.display.mdAndUp ? '8' : '12'">
        <v-card :elevation="$vuetify.display.smAndDown ? 1 : 2">
          <v-card-text :class="$vuetify.display.smAndDown ? 'pa-3' : 'pa-6'">
            <h2 :class="$vuetify.display.smAndDown ? 'text-h5' : 'text-h4'">
              Title
            </h2>
          </v-card-text>
          <v-card-actions class="flex-column flex-sm-row">
            <v-spacer />
            <v-btn 
              :block="$vuetify.display.smAndDown"
              color="primary"
            >
              Action
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
```

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

- Testing infrastructure uses `@nuxt/test-utils` with Playwright
- Mock services provide isolated testing environment
- **Mobile compatibility testing is mandatory** - tests run on both desktop and mobile viewports
- When adding tests, follow Nuxt testing best practices
- Test mock services independently of external dependencies
- **All new features must include mobile compatibility tests**

### Running Tests
**IMPORTANT**: When debugging tests, first focus on project Chromium for faster feedback. Append `--project=chromium` to the test command. Once the Chromium tests pass, run the full suite with all projects.
**IMPORTANT**: When running Playwright tests, use the `--reporter=line` option to avoid the HTML report server blocking the terminal:

```bash
# Run tests without HTML report blocking
APP_ENV=copilot npx playwright test --reporter=line

# Run specific test file
APP_ENV=copilot npx playwright test tests/example.spec.ts --reporter=line

# Run tests for specific project
APP_ENV=copilot npx playwright test --project=chromium --reporter=line
```

The default `html` reporter in `playwright.config.ts` will serve an HTML report at `http://localhost:9323` and block the terminal with "Press Ctrl+C to quit." Using `--reporter=line` provides clean console output without blocking.

### Mobile Testing Requirements

- **Playwright mobile configuration**: Tests automatically run on Pixel 5 and iPhone 12 viewports
- **Touch interaction testing**: Verify tap, swipe, and scroll behaviors work correctly
- **Responsive layout testing**: Confirm layouts adapt properly across screen sizes
- **Accessibility testing**: Ensure touch targets meet minimum size requirements (44px)
- **Performance testing**: Verify mobile performance and loading times

Example mobile test pattern:
```typescript
test('should work correctly on mobile', async ({ page }) => {
  await page.goto('/component-page')
  
  // Test mobile-specific interactions
  await page.tap('button')
  
  // Verify responsive layout
  const element = page.locator('.responsive-element')
  await expect(element).toBeVisible()
  
  // Check touch target sizes
  const buttonBox = await page.locator('button').boundingBox()
  expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
})
```

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

#### Step 2: Create Hybrid Service Implementation

```typescript
// services/[entity]Service.ts
import { BaseService } from './baseService'
import { mockData } from '../tests/helpers/mock-manager'
import type { Entity, CreateEntityInput, UpdateEntityInput } from '~/types/[entity]'
import logger from '../utils/logger'

export class EntityService extends BaseService<Entity> {
  protected readonly containerName = '[entities]'
  protected readonly partitionKey = '/[partitionKey]'

  async findAll(): Promise<Entity[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Entity>('SELECT * FROM c')
      } else {
        return mockData.getEntities()
      }
    } catch (error) {
      logger.error('Failed to fetch all entities', { error })
      throw error
    }
  }

  // Implement all required BaseService methods
  // ... (following the template exactly)
  
  // Entity-specific methods
  async findByCustomCriteria(criteria: any): Promise<Entity[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Entity>(
          'SELECT * FROM c WHERE c.customField = @criteria',
          [{ name: '@criteria', value: criteria }]
        )
      } else {
        return mockData.getEntities().filter(/* mock implementation */)
      }
    } catch (error) {
      logger.error('Failed to find entities by criteria', { criteria, error })
      throw error
    }
  }

  private generateId(): string {
    return `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export const entityService = new EntityService()
```

#### Step 3: Service Integration

1. **Import service in components/pages:**
   ```typescript
   import { entityService } from '~/services'
   ```

2. **Use service methods with proper error handling:**
   ```typescript
   try {
     // Service automatically detects environment and uses appropriate data source
     const entities = await entityService.findAll()
   } catch (error) {
     // Handle error
   }
   ```

3. **Implement loading states and user feedback**
4. **Service works in all environments** - development (mock), staging (CosmosDB), production (CosmosDB)

### Adding Authentication to API Routes

1. Create route in `server/api/`
2. Use `requireUserSession()` for authentication
3. Check user role from session for authorization
4. Use mock services for all data operations

### Working with Hybrid Services

**GitHub Copilot must follow these patterns when working with services:**

1. **Always use the service layer** - Never bypass the service architecture
2. **Import service instances** from the services index in components/pages
3. **Handle service errors** properly with try/catch blocks
4. **Use TypeScript types** for all service interactions
5. **Include proper loading states** in UI components
6. **Implement proper error handling** and user feedback
7. **Services automatically adapt** to the environment (mock or CosmosDB)

Example service usage pattern:
```vue
<script setup lang="ts">
import { entityService } from '~/services'
import type { Entity } from '~/types/entity'

const entities = ref<Entity[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    // Service automatically uses CosmosDB or mock data based on APP_ENV
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

Example API endpoint usage pattern:
```typescript
import { entityService } from '~/services'
import logger from '~/utils/logger'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    
    // Service layer handles environment detection automatically
    const entities = await entityService.findAll()
    
    return {
      success: true,
      entities
    }
  } catch (error) {
    logger.error('Failed to fetch entities', { error })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch entities'
    })
  }
})
```

## Important Notes

- The application is configured for compatibility date '2025-07-15'
- **GitHub Copilot must always set APP_ENV=copilot before running any npm commands**
- **GitHub Copilot must use the hybrid service architecture for all data operations**
- **ALL new data services created by GitHub Copilot MUST extend BaseService**
- **Services automatically use mock data when APP_ENV=copilot, and CosmosDB for staging/production**
- Vuetify components must be transpiled (configured in build.transpile)
- TypeScript strict mode is enabled
- All paths should use TypeScript path aliases when available
- The APP_ENV=copilot setting enables special configurations for AI-assisted development
- Legacy JSON data files in `/data` directory are maintained for fallback purposes
- Hybrid service architecture provides both development safety and production capability
- Service layer pattern ensures consistency and maintainability across the application
- Mock data is used for development/Copilot, CosmosDB for staging/production

## Critical Reminders for GitHub Copilot

1. **ALWAYS extend BaseService** - Never create services that bypass the hybrid architecture
2. **ALWAYS implement both data paths** - Every service method must handle mock and CosmosDB
3. **ALWAYS use environment detection** - Use isUsingCosmosDB() to determine data source
4. **ALWAYS export singleton instances** from service files
5. **ALWAYS prefix npm commands with APP_ENV=copilot**
6. **ALWAYS use TypeScript interfaces** for all entities with id, createdAt, updatedAt
7. **ALWAYS implement proper error handling** in service methods with logging
8. **ALWAYS use MockDataManager** for mock operations in development
