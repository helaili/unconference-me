import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Test context with isolation
 */
export interface TestContext {
  contextId: string
  mockData: {
    contextId: string
    resetToDefaults: () => Promise<void>
    cleanup: () => Promise<void>
  }
}

/**
 * Extended test with test isolation support
 */
export const test = base.extend<TestContext>({
  // Generate a unique context ID for each test
  contextId: async ({ }, use, testInfo) => {
    const contextId = `test-${testInfo.workerIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    await use(contextId)
  },

  // Set up route interception early for all pages
  page: async ({ page: basePage, contextId }, use) => {
    // Intercept all API requests to add the context ID header
    // This must be set up BEFORE any navigation happens
    await basePage.route('**/api/**', async (route) => {
      const headers = {
        ...route.request().headers(),
        'X-Test-Context-Id': contextId
      }
      
      await route.continue({ headers })
    })
    
    await use(basePage)
  },

  // Provide a mock data manager that's isolated per test
  mockData: async ({ page, contextId }, use) => {
    const mockData = {
      contextId,
      
      // Reset mock data for this test context
      async resetToDefaults() {
        await page.request.post('/api/test/reset-mock-data', {
          headers: {
            'X-Test-Context-Id': contextId
          }
        })
      },
      
      // Cleanup after test
      async cleanup() {
        await page.request.post('/api/test/cleanup-context', {
          headers: {
            'X-Test-Context-Id': contextId
          }
        })
      }
    }

    // Reset at the start of each test
    await mockData.resetToDefaults()

    await use(mockData)

    // Cleanup after test
    await mockData.cleanup()
  }
})

export { expect }
