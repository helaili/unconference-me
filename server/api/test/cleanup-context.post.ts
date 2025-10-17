import { testIsolatedMockData } from '../../../tests/helpers/test-isolated-mock-manager'

export default defineEventHandler(async (event) => {
  // Get context ID from header
  const contextId = getHeader(event, 'X-Test-Context-Id')
  
  if (contextId) {
    // Delete the isolated store for this test context
    testIsolatedMockData.deleteStore(contextId)
    
    return {
      success: true,
      message: 'Test context cleaned up',
      contextId
    }
  }
  
  return {
    success: false,
    message: 'No context ID provided'
  }
})
