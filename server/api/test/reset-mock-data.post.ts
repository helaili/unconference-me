import { mockData } from '../../../tests/helpers/mock-manager'
import { testIsolatedMockData } from '../../../tests/helpers/test-isolated-mock-manager'

export default defineEventHandler(async (event) => {
  // Get context ID from header for test isolation
  const contextId = getHeader(event, 'X-Test-Context-Id')
  
  if (contextId) {
    // Reset isolated store for this test context
    const store = testIsolatedMockData.getStore(contextId)
    store.resetToDefaults()
    
    return {
      success: true,
      message: 'Mock data reset to defaults for test context',
      contextId
    }
  } else {
    // Fallback to shared store (backward compatibility)
    mockData.resetToDefaults()
    
    return {
      success: true,
      message: 'Mock data reset to defaults'
    }
  }
})