import { mockData } from '../../../tests/helpers/mock-manager'
import { testIsolatedMockData } from '../../../tests/helpers/test-isolated-mock-manager'
import type { User } from '../../../types/user'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const user: User = body
  
  // Get context ID from header for test isolation
  const contextId = getHeader(event, 'X-Test-Context-Id')
  
  if (contextId) {
    // Use isolated store for this test context
    const store = testIsolatedMockData.getStore(contextId)
    store.addUser(user)
  } else {
    // Fallback to shared store (backward compatibility)
    mockData.addUser(user)
  }
  
  return {
    success: true,
    message: 'User added to mock data',
    user,
    contextId
  }
})