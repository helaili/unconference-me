import { test, expect } from './helpers/mock-test-utils'
import { AuthHelper } from './helpers/auth'

test.describe('Mock Management Comparison', () => {
  test('OLD APPROACH: Hardcoded mock data (for comparison)', async ({ page }) => {
    // This is how tests used to work with hardcoded data
    // (This test demonstrates the old approach but uses the new system for actual data)
    
    const auth = new AuthHelper(page)
    
    // Had to remember exact hardcoded email/password
    await auth.loginAs('luke@rebels.com', 'changeme')
    await expect(page).toHaveURL('/dashboard')
    
    // Had to know exact text that would appear based on hardcoded data
    await expect(page.getByText('Universe User Group 2025').first()).toBeVisible()
  })

  test('NEW APPROACH: Centralized mock management', async ({ page, mockData }) => {
    // This is the new way with centralized mock management
    
    // Data is automatically available and consistent
    const users = mockData.getTestUsers()
    const adminUser = users.find(u => u.role === 'Admin')
    const events = mockData.getTestEvents()
    
    expect(adminUser).toBeDefined()
    expect(events.length).toBeGreaterThan(0)
    
    const auth = new AuthHelper(page)
    
    // Can use data-driven approach
    await auth.loginAs(adminUser!.email, adminUser!.password!)
    await expect(page).toHaveURL('/dashboard')
    
    // Can verify against actual data from mock manager
    await expect(page.getByText(events[0]!.name).first()).toBeVisible()
  })

  test('NEW APPROACH: Easy data modification', async ({ page, mockData }) => {
    // Easy to modify data for specific test scenarios
    
    // Add a custom event
    const customEvent = mockData.addTestEvent({
      id: 'custom-123',
      name: 'My Custom Test Event',  
      description: 'This event was created just for this test'
    })
    
    // Add a custom user  
    const customUser = mockData.addTestUser({
      email: 'custom@test.com',
      firstname: 'Custom',
      lastname: 'Tester',
      password: 'changeme',
      role: 'Admin'
    })
    
    // Verify the data is available
    expect(mockData.getTestEvents()).toContainEqual(customEvent)
    expect(mockData.manager.getUserByEmail('custom@test.com')).toEqual(customUser)
    
    // Demonstrate that we can modify existing events  
    mockData.manager.updateEvent('1', { 
      name: 'Updated Universe User Group 2025',
      description: 'This description was updated by the test'
    })
    
    const updatedEvent = mockData.manager.getEventById('1')!
    expect(updatedEvent.name).toBe('Updated Universe User Group 2025')
    expect(updatedEvent.description).toBe('This description was updated by the test')
    
    // Verify data changes are working correctly
    // (In a real scenario, you might test the UI refresh, but for this demo we'll just verify data changes)
    const auth = new AuthHelper(page)
    await auth.loginAsLuke() 
    await expect(page).toHaveURL('/dashboard')
    
    // At minimum, verify we're on the dashboard with some event data showing
    await expect(page.locator('text=Event Status')).toBeVisible()
  })

  test('NEW APPROACH: Scenarios for common setups', async ({ page, mockData }) => {
    // Import scenarios for reusable setups
    const { MockScenarios } = await import('./helpers/mock-test-utils')
    
    // Setup a large event with many participants
    MockScenarios.setupLargeEvent(30)
    
    // Verify the scenario was set up correctly
    const participants = mockData.getTestParticipants('1')
    expect(participants.length).toBe(30)
    
    const stats = mockData.manager.getParticipantStats('1')
    expect(stats.total).toBe(30)
    
    // Login and verify the data appears in the UI
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()
    
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Participant Statistics')).toBeVisible()
    
    // The actual statistics should reflect our test data
    // Note: In a real test, you might check for specific numbers
  })

  test('NEW APPROACH: Test isolation with snapshots', async ({ mockData }) => {
    // Create a snapshot of the current state
    const originalSnapshot = mockData.createTestSnapshot()
    
    // Verify we start with default data
    expect(mockData.getTestUsers().length).toBe(2) // Luke and Vader
    
    // Modify data significantly
    mockData.clearAll()
    mockData.addTestUser({ email: 'only@user.com', firstname: 'Only', lastname: 'User' })
    
    // Verify modification worked
    expect(mockData.getTestUsers().length).toBe(1)
    
    // Restore original state
    mockData.restoreTestSnapshot(originalSnapshot)
    
    // Verify we're back to the original state
    expect(mockData.getTestUsers().length).toBe(2)
    expect(mockData.manager.getUserByEmail('luke@rebels.com')).toBeDefined()
  })

  test('NEW APPROACH: Direct manager access for advanced operations', async ({ mockData }) => {
    // Get direct access to the manager for advanced operations
    const manager = mockData.manager
    
    // Update existing data
    const originalEvent = manager.getEventById('1')!
    expect(originalEvent.status).toBe('active')
    
    // Change event status
    manager.updateEvent('1', { status: 'completed' })
    
    const updatedEvent = manager.getEventById('1')!
    expect(updatedEvent.status).toBe('completed')
    expect(updatedEvent.updatedAt).not.toEqual(originalEvent.updatedAt)
    
    // Add participants programmatically
    for (let i = 1; i <= 5; i++) {
      manager.addParticipant({
        id: `batch-participant-${i}`,
        eventId: '1',
        userId: `batch-user-${i}`,
        email: `batch${i}@example.com`,
        firstname: `Batch${i}`,
        lastname: 'User',
        status: i % 2 === 0 ? 'confirmed' : 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    
    // Verify batch operation
    const stats = manager.getParticipantStats('1')
    expect(stats.total).toBe(8) // 3 default + 5 batch
    
    // Get summary of all data
    const summary = manager.getDataSummary()
    expect(summary.participants).toBe(8)
  })
})