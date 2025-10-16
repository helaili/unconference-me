# Azure Static Web Apps - Nuxt Instance Unavailable Fix

## Problem

When deploying to Azure Static Web Apps, the topics page (and potentially other pages) failed with:

```
500 Server Error
[nuxt] instance unavailable
```

This error occurred even though:
- The same pages worked perfectly on a local development machine
- All other pages in the application worked fine in production

## Root Cause

The error was caused by attempting to call `useRuntimeConfig()` during **service initialization** (at module load time), before the Nuxt context was available.

### Why It Happened

1. **Services are singleton instances** - They're created once when the module is first imported
2. **Module initialization happens early** - Before any request context exists
3. **`useRuntimeConfig()` requires Nuxt context** - It can only be called during request handling
4. **Azure Static Web Apps timing** - The production environment is more strict about context availability than local dev

### Why It Worked Locally

The local development server (`nuxt dev`) has a more lenient initialization order and keeps the Nuxt context available during module loading. This masked the issue during development.

## The Fix

The fix involved two parts:

### Part 1: Remove `useRuntimeConfig()` from Services (❌ Broken in Production)

```typescript
export abstract class BaseService<T extends { id: string }> {
  constructor() {
    this.initializeCosmosClient()  // Called at module initialization
  }

  private initializeCosmosClient(): void {
    const config = useRuntimeConfig()  // ❌ ERROR: No Nuxt context available
    const appEnv = config.appEnv
    // ... rest of initialization
  }
}
```

### Part 2: Define `process.env` for Vite/Browser Bundle (✅ Critical Fix)

The error "Can't find variable: process" occurred because when service code was bundled for the client (even though it should only run server-side), the browser tried to execute `process.env.APP_ENV` but `process` doesn't exist in browsers.

**Solution in `nuxt.config.ts`:**

```typescript
vite: {
  define: {
    // Make process.env available when services are accidentally bundled for client
    'process.env.APP_ENV': JSON.stringify(process.env.APP_ENV || 'development'),
    'process.env.COSMODB_DATABASE': JSON.stringify(process.env.COSMODB_DATABASE || 'unconference-me'),
    'process.env.COSMODB_PRIMARY_CONNECTION_STRING': JSON.stringify(''), // Empty for security
  },
  optimizeDeps: {
    exclude: ['@azure/cosmos']  // Don't pre-bundle CosmosDB client
  },
  ssr: {
    noExternal: ['@azure/cosmos']  // Keep CosmosDB server-side only
  }
}
```

### Final Service Code (✅ Works Everywhere)

```typescript
export abstract class BaseService<T extends { id: string }> {
  private clientInitialized = false

  private initializeCosmosClient(): void {
    if (this.clientInitialized) return
    
    const appEnv = process.env.APP_ENV  // ✅ Now works in both Node.js and browser
    
    if (appEnv === 'staging' || appEnv === 'production') {
      const connectionString = process.env.COSMODB_PRIMARY_CONNECTION_STRING
      this.client = new CosmosClient(connectionString)
      this.clientInitialized = true
    }
  }

  private async ensureContainer(): Promise<void> {
    // Lazy initialization - only when actually needed
    this.initializeCosmosClient()
    // ... rest of method
  }
}
```

## Key Changes

1. **Removed `useRuntimeConfig()` from services** - Use `process.env` directly
2. **Added Vite `define` configuration** - Makes `process.env` available in browser bundles
3. **Added lazy initialization** - Client is initialized on first use, not at module load
4. **Added initialization guard** - `clientInitialized` flag prevents double initialization
5. **Excluded CosmosDB from client bundle** - Using `optimizeDeps.exclude` and `ssr.noExternal`

## When to Use What

### Use `useRuntimeConfig()` ✅

- **API Routes/Event Handlers** - During request handling
- **Components** - In `<script setup>` or component methods
- **Pages** - In page components
- **Middleware** - During navigation
- **Composables** - When called from valid Nuxt context

### Use `process.env` ✅

- **Service Classes** - Singleton instances loaded at module initialization
- **Utilities** - Loaded before Nuxt context (like logger)
- **Build-time Configuration** - In `nuxt.config.ts`
- **Scripts** - Running outside Nuxt (population scripts, migrations)

## Testing

This fix has been verified to work in:

- ✅ Local development (`APP_ENV=copilot` or `development`)
- ✅ Local staging mode (`APP_ENV=staging`)
- ✅ All Playwright tests pass
- ✅ No ESLint errors
- ✅ TypeScript compilation successful

## Related Files

- `services/baseService.ts` - The main fix
- `docs/RUNTIME_CONFIG.md` - Updated documentation
- All service classes inheriting from `BaseService` - Automatically fixed

## Prevention

To prevent similar issues in the future:

1. **Never call `useRuntimeConfig()` in constructors** of singleton services
2. **Never call `useRuntimeConfig()` at module scope** (outside functions)
3. **Use lazy initialization** for resources that depend on environment config
4. **Test with production builds** or Azure Static Web Apps CLI before deployment
5. **Check for `[nuxt] instance unavailable` errors** in production logs

## Azure Static Web Apps Specific Notes

Azure Static Web Apps uses a specific build and runtime environment:

- Node.js runtime is isolated per function
- Module initialization timing is strict
- Nuxt context availability is more restrictive than dev mode
- Always test with `swa start` or actual deployment before releasing

## Rollout

This fix should be deployed to:
- [x] Staging environment - Test thoroughly
- [ ] Production environment - After staging validation

## References

- [Nuxt Runtime Config Documentation](https://nuxt.com/docs/guide/going-further/runtime-config)
- [Azure Static Web Apps Node.js API](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-functions)
- [Nuxt Composables Context](https://nuxt.com/docs/guide/going-further/internals#the-nuxt-interface)
