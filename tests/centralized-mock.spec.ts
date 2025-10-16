import { test, expect, MockScenarios } from './helpers/mock-test-utils'
import { AuthHelper } from './helpers/auth'

test.describe('Centralized Mock Management Demo', () => {
  test('should demonstrate basic mock data management', async ({ mockData }) => {
    // Reset to defaults
    mockData.resetToDefaults()
    
    // Verify default users exist
    const users = mockData.getTestUsers()
    expect(users.length).toBe(4) // luke, darth, organizer, unregistered
    expect(users.find(u => u.email === 'luke@rebels.com')).toBeDefined()
    expect(users.find(u => u.email === 'darth@empire.com')).toBeDefined()
    expect(users.find(u => u.email === 'unregistered@example.com')).toBeDefined()
    
    // Add a test user
    const newUser = mockData.addTestUser({
      id: 'test@example.com',
      email: 'test@example.com',
      firstname: 'Test',
      lastname: 'User',
      role: 'Participant',
    })
    
    // Verify user was added
    expect(mockData.getTestUsers().length).toBe(5)
    expect(mockData.manager.getUserByEmail('test@example.com')).toEqual(newUser)
  })

  test('should demonstrate event and participant management', async ({ mockData }) => {
    // Start with default scenario
    const scenario = MockScenarios.setupUnconferenceEvent()
    
    expect(scenario.event).toBeDefined()
    expect(scenario.participants.length).toBe(5)
    expect(scenario.assignments.length).toBe(4)
    
    // Add a new participant to the event
    const newParticipant = mockData.addTestParticipant({
      id: 'new-participant',
      eventId: '1',
      email: 'new@example.com',
      firstname: 'New',
      lastname: 'Participant'
    })
    
    // Verify participant was added
    const participants = mockData.getTestParticipants('1')
    expect(participants.length).toBe(6)
    expect(participants.find(p => p.id === 'new-participant')).toEqual(newParticipant)
  })

  test('should demonstrate snapshot functionality for test isolation', async ({ mockData }) => {
    // Create initial state
    mockData.resetToDefaults()
    const initialSnapshot = mockData.createTestSnapshot()
    
    // Modify state
    mockData.addTestUser({
      id: 'modified@example.com',
      email: 'modified@example.com',
      firstname: 'Modified',
      lastname: 'User'
    })
    
    expect(mockData.getTestUsers().length).toBe(5)
    
    // Restore original state
    mockData.restoreTestSnapshot(initialSnapshot)
    
    expect(mockData.getTestUsers().length).toBe(4)
    expect(mockData.manager.getUserByEmail('modified@example.com')).toBeUndefined()
  })

  test('should work with existing auth helper', async ({ page, mockData }) => {
    // Ensure default data is available
    mockData.resetToDefaults()
    
    const auth = new AuthHelper(page)
    
    // Login as Luke (admin user)
    await auth.loginAsLuke()
    
    // Should be on dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Admin Dashboard')).toBeVisible()
  })

  test('should demonstrate adding custom users', async ({ page, mockData }) => {
    // Start with defaults and add additional custom users
    mockData.resetToDefaults()
    
    const customAdmin = mockData.addTestUser({
      id: 'custom.admin@test.com',
      email: 'custom.admin@test.com',
      firstname: 'Custom',
      lastname: 'Admin',
      password: 'testpassword123',
      role: 'Admin'
    })
    
    // Verify the custom user was added
    expect(mockData.getTestUsers().length).toBe(5) // 4 defaults + 1 custom
    expect(mockData.manager.getUserByEmail('custom.admin@test.com')).toEqual(customAdmin)
    
    // We can still login with default users
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Admin Dashboard')).toBeVisible()
  })

  test('should demonstrate large event scenario', async ({ page, mockData }) => {
    // Setup large event with many participants
    MockScenarios.setupLargeEvent(25)
    
    // Verify we have the expected number of participants
    const participants = mockData.getTestParticipants('1')
    expect(participants.length).toBe(25)
    
    // Get stats using the mock manager
    const stats = mockData.manager.getParticipantStats('1')
    expect(stats.total).toBe(25)
    // The total should include all statuses (registered + confirmed + checked-in)
    expect(stats.registered + stats.confirmed + stats.checkedIn).toBe(25)
    
    // Login and navigate to dashboard
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()
    
    // The dashboard should display the participant statistics
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Participant Statistics')).toBeVisible()
  })
})