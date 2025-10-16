# Runtime Configuration Migration

This document describes the migration from `process.env` to Nuxt's `useRuntimeConfig()` for better type safety and configuration management.

## Overview

We've migrated from direct `process.env` access to using Nuxt's runtime configuration system (`useRuntimeConfig()`). This provides:

- **Type safety**: TypeScript definitions for all configuration values
- **Better defaults**: Centralized default values in `nuxt.config.ts`
- **Server/client separation**: Clear distinction between server-only and public config
- **Environment validation**: Configuration is validated at build time

## Configuration Structure

### Server-Side Only Config

These values are only available on the server side and are NOT exposed to the client:

```typescript
// In nuxt.config.ts
runtimeConfig: {
  appEnv: process.env.APP_ENV || 'development',
  logLevel: process.env.UNCONFERENCE_ME_LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  cosmosdb: {
    connectionString: process.env.COSMODB_PRIMARY_CONNECTION_STRING,
    database: process.env.COSMODB_DATABASE || 'unconference-me'
  },
  // ... other server-only config
}
```

### Public Config

These values are available on both server and client:

```typescript
// In nuxt.config.ts
runtimeConfig: {
  public: {
    devMode: process.env.APP_ENV === 'development',
    authUrl: process.env.NUXT_AUTH_GITHUB === 'true' ? '/auth/github' : '/login',
    eventName: "Universe User Group 2025",
    eventLocation: "Convene 100 Stockton, Union Square, San Francisco",
    eventDate: "Monday, October 27th, 2025",
  }
}
```

## Usage in Code

### In Services (Server-Side)

```typescript
import { useRuntimeConfig } from '#imports'

export class MyService extends BaseService<MyEntity> {
  someMethod() {
    const config = useRuntimeConfig()
    
    // Access server-only config
    const appEnv = config.appEnv
    const dbConnection = config.cosmosdb.connectionString
    
    // Access public config
    const eventName = config.public.eventName
  }
}
```

### In Components/Pages (Client or Server)

```vue
<script setup lang="ts">
const config = useRuntimeConfig()

// Only public config is available on the client
const eventName = config.public.eventName
const devMode = config.public.devMode
</script>
```

### In API Routes (Server-Side)

```typescript
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Access any runtime config (server-side)
  const appEnv = config.appEnv
  const eventName = config.public.eventName
  
  return { eventName, appEnv }
})
```

## Type Definitions

All runtime config types are defined in `types/env.d.ts`:

```typescript
declare module '@nuxt/schema' {
  interface RuntimeConfig {
    // Server-side only
    cosmosdb: {
      connectionString?: string
      database: string
    }
    appEnv: string
    logLevel: string
    
    // Public (client & server)
    public: {
      eventDate: string
      eventLocation: string
      eventName: string
      devMode: boolean
      authUrl: string
    }
  }
}
```

## Migration Guide

### Before (using process.env)

```typescript
const appEnv = process.env.APP_ENV
const connectionString = process.env.COSMODB_PRIMARY_CONNECTION_STRING
const databaseName = process.env.COSMODB_DATABASE || 'unconference-me'
```

### After (using runtimeConfig)

```typescript
const config = useRuntimeConfig()
const appEnv = config.appEnv
const connectionString = config.cosmosdb.connectionString
const databaseName = config.cosmosdb.database
```

## Special Cases

### Logger Utility

The logger (`utils/logger.ts`) still uses `process.env` directly because it's initialized at build time before runtime config is available. This is documented in the file and is the correct approach.

### Nuxt Config File

The `nuxt.config.ts` file uses `process.env` to populate the runtime config. This is expected and correct.

### Build Scripts

Scripts in the `scripts/` directory may still use `process.env` directly as they run outside the Nuxt runtime context.

## Environment Variables

The following environment variables are used:

### Application
- `APP_ENV` - Application environment (development/staging/production/copilot)
- `UNCONFERENCE_ME_LOG_LEVEL` - Custom log level override
- `NODE_ENV` - Node environment (development/production)

### CosmosDB
- `COSMODB_PRIMARY_CONNECTION_STRING` - CosmosDB connection string
- `COSMODB_DATABASE` - CosmosDB database name (default: unconference-me)

### Authentication
- `NUXT_SESSION_PASSWORD` - Session encryption password
- `NUXT_AUTH_GITHUB` - Enable GitHub OAuth (true/false)
- `GITHUBAPP_CLIENT_ID` - GitHub OAuth client ID
- `GITHUBAPP_CLIENT_SECRET` - GitHub OAuth client secret
- `GITHUB_API_URL` - GitHub API URL
- `AUTH_GITHUB_URL` - GitHub authorization URL
- `GITHUB_TOKEN_URL` - GitHub token URL

## Benefits

1. **Type Safety**: TypeScript ensures config values are used correctly
2. **Centralized**: All configuration is defined in one place
3. **Security**: Server-only config is never exposed to the client
4. **Defaults**: Default values are clearly defined
5. **Validation**: Invalid configuration is caught at build time
6. **Auto-completion**: IDEs provide auto-completion for config values

## Testing

Runtime config works seamlessly with the existing test suite. Tests automatically use the configuration defined in `nuxt.config.ts` with environment-specific overrides from `APP_ENV` and other environment variables.

```bash
# Run tests with copilot environment
APP_ENV=copilot npx playwright test --reporter=line --project=chromium
```
