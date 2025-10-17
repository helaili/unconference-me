# Test-Isolated Mock Data Architecture

## Problem

When running Playwright tests in parallel (with multiple workers), all tests share the same Nuxt dev server instance. This means they also share the same mock data singleton, causing race conditions:

1. Test A adds a user to mock data
2. Test B resets mock data (in `beforeEach`)
3. Test A tries to find its user → **404 Not Found**

## Solution

Implement **test-scoped mock data isolation** using unique context IDs:

### Architecture

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Test A    │ │   Test B    │ │   Test C    │
│ Context: A1 │ │ Context: B2 │ │ Context: C3 │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │
       └───────────────┴───────────────┘
                       │
                ┌──────▼──────┐
                │ Nuxt Server │
                └──────┬──────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
    ┌────▼────┐              ┌───────▼───────┐
    │ Store A1│              │   Store B2    │
    │ Users   │              │   Users       │
    │ Events  │              │   Events      │
    │ ...     │              │   ...         │
    └─────────┘              └───────────────┘
```

### Key Components

1. **TestIsolatedMockDataManager** (`tests/helpers/test-isolated-mock-manager.ts`)
   - Manages multiple isolated data stores
   - Each store identified by unique `contextId`
   - Provides store lifecycle management (create, get, delete)

2. **Isolated Test Utils** (`tests/helpers/isolated-test-utils.ts`)
   - Playwright fixture that generates unique context IDs
   - Automatically injects `X-Test-Context-Id` header into all API requests
   - Handles setup and cleanup

3. **Mock Data Context Helper** (`server/utils/mock-data-context.ts`)
   - Utility to get the correct mock data store based on request headers
   - Falls back to shared store for non-test requests

### Usage

#### In Tests

```typescript
import { test, expect } from './helpers/isolated-test-utils'

test('should add a user', async ({ page, mockData }) => {
  // mockData automatically uses isolated store for this test
  // No need to worry about other tests interfering
  
  const uniqueEmail = `user-${Date.now()}@example.com`
  
  await page.request.post('/api/test/add-user', {
    data: { email: uniqueEmail, /* ... */ }
  })
  
  // This user is only visible in this test's context
  await page.goto('/users')
  await expect(page.locator(`text=${uniqueEmail}`)).toBeVisible()
})
```

#### In API Endpoints

```typescript
import { getMockDataStore } from '../../utils/mock-data-context'

export default defineEventHandler(async (event) => {
  // Get the appropriate mock data store for this request
  const store = getMockDataStore(event)
  
  // Use the store
  const users = store.getUsers()
  const user = users.find(u => u.email === 'test@example.com')
  
  return { user }
})
```

### Benefits

1. **True Test Isolation**: Each test has its own data store
2. **Parallel Execution**: Tests can run concurrently without conflicts
3. **No Race Conditions**: No more mysterious test failures
4. **Automatic Cleanup**: Context stores are deleted after tests complete
5. **Backward Compatible**: Falls back to shared store for non-test requests

### Migration Guide

#### For Existing Tests

1. Change import:
   ```typescript
   // OLD
   import { test, expect } from './helpers/mock-test-utils'
   
   // NEW
   import { test, expect } from './helpers/isolated-test-utils'
   ```

2. Remove manual resets (no longer needed):
   ```typescript
   // OLD
   test.beforeEach(async ({ page, mockData }) => {
     await page.request.post('/api/test/reset-mock-data')
     mockData.resetToDefaults()
     // ...
   })
   
   // NEW
   test.beforeEach(async ({ page }) => {
     // mockData is automatically reset and isolated
     // ...
   })
   ```

3. Use unique identifiers (still recommended):
   ```typescript
   // Still use unique emails/IDs to avoid conflicts within the same test
   const uniqueEmail = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
   ```

#### For API Endpoints

Update endpoints that directly access mock data:

```typescript
// OLD
import { mockData } from '../../../tests/helpers/mock-manager'

export default defineEventHandler(async (event) => {
  const users = mockData.getUsers()
  // ...
})

// NEW
import { getMockDataStore } from '../../utils/mock-data-context'

export default defineEventHandler(async (event) => {
  const store = getMockDataStore(event)
  const users = store.getUsers()
  // ...
})
```

### Testing the Solution

Run tests in parallel to verify isolation:

```bash
APP_ENV=copilot npx playwright test tests/registration.spec.ts tests/user-management.spec.ts --workers=8
```

All tests should pass consistently without race conditions.
