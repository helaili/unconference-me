import type { H3Event } from 'h3'
import { mockData } from '../../tests/helpers/mock-manager'
import { testIsolatedMockData } from '../../tests/helpers/test-isolated-mock-manager'

/**
 * Get the appropriate mock data store based on the request context
 * 
 * This helper checks for the X-Test-Context-Id header and returns the isolated
 * mock data store for that test context. If no context ID is present, it returns
 * the shared mock data store (for backward compatibility).
 * 
 * Usage in services:
 * ```typescript
 * import { getMockDataStore } from '../utils/mock-data-context'
 * 
 * async findAll(event?: H3Event): Promise<User[]> {
 *   if (await this.isUsingCosmosDB()) {
 *     // CosmosDB logic
 *   } else {
 *     const store = getMockDataStore(event)
 *     return store.getUsers()
 *   }
 * }
 * ```
 */
export function getMockDataStore(event?: H3Event) {
  if (!event) {
    // No event context, use shared store
    return mockData
  }

  try {
    // Try to get context ID from header first
    let contextId = getHeader(event, 'X-Test-Context-Id')
    
    // If not in header, try query parameter (fallback for navigation requests)
    if (!contextId) {
      const query = getQuery(event)
      contextId = query['test-context-id'] as string
    }
    
    if (contextId) {
      // Use isolated store for this test context
      return testIsolatedMockData.getStore(contextId)
    }
  } catch (error) {
    // If we can't get the context ID, fall back to shared store
    console.warn('Could not get test context ID from request, using shared mock data')
  }

  // Default to shared store
  return mockData
}

/**
 * Async storage for storing the current H3Event context
 * This allows services to access the event without passing it through every method
 */
import { AsyncLocalStorage } from 'node:async_hooks'

export const eventContext = new AsyncLocalStorage<H3Event>()

/**
 * Wrap an event handler to store the event in async local storage
 */
export function withEventContext<T>(handler: (event: H3Event) => T | Promise<T>) {
  return (event: H3Event) => {
    return eventContext.run(event, () => handler(event))
  }
}

/**
 * Get the current event from async local storage
 */
export function getCurrentEvent(): H3Event | undefined {
  return eventContext.getStore()
}

/**
 * Get mock data store using the current event context
 */
export function getMockDataStoreFromContext() {
  const event = getCurrentEvent()
  return getMockDataStore(event)
}
