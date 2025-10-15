import { mockData } from '../../../tests/helpers/mock-manager'

export default defineEventHandler(async (event) => {
  // This endpoint allows tests to reset mock data on the server side
  mockData.resetToDefaults()
  
  return {
    success: true,
    message: 'Mock data reset to defaults'
  }
})