import { mockData } from '../../../tests/helpers/mock-manager'
import type { User } from '../../../types/user'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const user: User = body
  
  mockData.addUser(user)
  
  return {
    success: true,
    message: 'User added to mock data',
    user
  }
})