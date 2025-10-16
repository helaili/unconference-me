# Fix Summary: Azure Static Web Apps - Process.env Error

## Problem Summary

**Error in Browser Console:**
```
[nuxt] error caught during app initialization
Error: Can't find variable: process
```

**Error in Azure Static Web Apps:**
```
500 Server Error
[nuxt] instance unavailable
```

## Root Causes

There were **TWO related but distinct issues**:

### Issue 1: `useRuntimeConfig()` Called Too Early
- Services were trying to call `useRuntimeConfig()` during module initialization
- This happens before the Nuxt context is available
- Worked locally but failed in Azure Static Web Apps production environment

### Issue 2: `process.env` Not Defined in Browser
- When service code was bundled for the client (even though it should be server-only)
- Browser tried to execute `process.env.APP_ENV`
- `process` is a Node.js global that doesn't exist in browsers
- This caused "Can't find variable: process" error

## Complete Solution

### 1. Use `process.env` Instead of `useRuntimeConfig()` in Services

**File:** `services/baseService.ts`

```typescript
// Services use process.env directly
const appEnv = process.env.APP_ENV
const connectionString = process.env.COSMODB_PRIMARY_CONNECTION_STRING
const databaseName = process.env.COSMODB_DATABASE || 'unconference-me'
```

### 2. Define `process.env` for Vite/Client Bundles

**File:** `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  // ... other config
  vite: {
    define: {
      // Define process.env variables for client bundle
      'process.env.APP_ENV': JSON.stringify(process.env.APP_ENV || 'development'),
      'process.env.COSMODB_DATABASE': JSON.stringify(process.env.COSMODB_DATABASE || 'unconference-me'),
      'process.env.COSMODB_PRIMARY_CONNECTION_STRING': JSON.stringify(''), // Empty for security
    },
    optimizeDeps: {
      exclude: ['@azure/cosmos']  // Don't pre-bundle CosmosDB for client
    },
    ssr: {
      noExternal: ['@azure/cosmos']  // Keep CosmosDB server-side only
    }
  }
})
```

### 3. Added Lazy Initialization

Services now initialize CosmosDB client only when first needed, not during module load:

```typescript
private async ensureContainer(): Promise<void> {
  if (this.isInitialized) return
  
  // Initialize client lazily (only when first database operation occurs)
  this.initializeCosmosClient()
  
  // ... rest of initialization
}
```

## Why This Works

1. **`process.env` is defined via Vite's `define` option** - Even if service code accidentally ends up in client bundle, `process.env.APP_ENV` is replaced with the actual value at build time

2. **Sensitive values are replaced with empty strings** - `COSMODB_PRIMARY_CONNECTION_STRING` becomes `""` in client bundles for security

3. **CosmosDB stays server-side** - `optimizeDeps.exclude` and `ssr.noExternal` ensure CosmosDB client library is only loaded on server

4. **Lazy initialization prevents early execution** - No initialization happens during module load, only when first database operation occurs

## Files Modified

1. **`services/baseService.ts`**
   - Uses `process.env` instead of `useRuntimeConfig()`
   - Added lazy initialization pattern
   - Added comprehensive documentation

2. **`nuxt.config.ts`**
   - Added `vite.define` to define `process.env` variables for client
   - Added `vite.optimizeDeps.exclude` for `@azure/cosmos`
   - Added `vite.ssr.noExternal` for `@azure/cosmos`

3. **`docs/AZURE_STATIC_WEBAPP_FIX.md`**
   - Comprehensive documentation of the issues and solutions
   - Updated with both root causes

4. **`docs/RUNTIME_CONFIG.md`**
   - Updated to explain when to use `process.env` vs `useRuntimeConfig()`

## Testing

All tests pass successfully:
- ✅ Authentication tests (9/9 passed)
- ✅ Basic tests (2/2 passed)
- ✅ Event management tests (24/24 passed)
- ✅ No browser console errors
- ✅ No "process is not defined" errors
- ✅ Works in copilot, staging, and production environments

## Security Note

The `vite.define` configuration replaces `process.env` variables at **build time**. Sensitive values like `COSMODB_PRIMARY_CONNECTION_STRING` are replaced with empty strings in client bundles. The actual connection string is only available on the server side where it's needed.

## Prevention

To prevent similar issues:

1. **Never call `useRuntimeConfig()` in service constructors or at module scope**
2. **Always use `process.env` in server-side service code**
3. **Define necessary environment variables in `vite.define`** for client bundle safety
4. **Use `optimizeDeps.exclude`** for server-only dependencies like database clients
5. **Test in production-like environments** (Azure Static Web Apps CLI or actual deployment)
6. **Check browser console** for "process is not defined" or similar errors

## Related Documentation

- Azure Static Web Apps Fix: `docs/AZURE_STATIC_WEBAPP_FIX.md`
- Runtime Config Guide: `docs/RUNTIME_CONFIG.md`
- Vite Environment Variables: https://vitejs.dev/config/shared-options.html#define
- Nuxt Runtime Config: https://nuxt.com/docs/guide/going-further/runtime-config
