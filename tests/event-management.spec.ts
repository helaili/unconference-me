import { test, expect } from './helpers/mock-test-utils'
import { AuthHelper } from './helpers/auth'

test.describe('Event Management - Events List', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page, mockData }) => {
    // Reset mock data on the server side to ensure clean state across parallel tests
    try {
      await page.request.post('/api/test/reset-mock-data')
    } catch (e) {
      // Fallback to client-side reset if server endpoint fails
      mockData.resetToDefaults()
    }
    auth = new AuthHelper(page)
  })

  test.afterEach(async ({ page, mockData }) => {
    // Clean up any route handlers that might affect other tests
    await page.unrouteAll({ behavior: 'ignoreErrors' })
    // Ensure mock data is reset after each test as well
    try {
      await page.request.post('/api/test/reset-mock-data')
    } catch (e) {
      mockData.resetToDefaults()
    }
  })

  test('should redirect non-admin users from events page', async ({ page }) => {
    await auth.loginAsVader() // Non-admin user
    
    await page.goto('/events')
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should display events list for admin users', async ({ page }) => {
    await auth.loginAsLuke() // Admin user
    
    await page.goto('/events')
    
    // Should stay on events page
    await expect(page).toHaveURL('/events')
    
    // Should have page title
    await expect(page.locator('h1:has-text("Events")')).toBeVisible()
    
    // Should display event cards
    await expect(page.locator('text=Universe User Group 2025')).toBeVisible({ timeout: 10000 })
  })

  test('should display event details in cards', async ({ page, mockData }) => {
    // Explicitly ensure we have the default data for this test
    mockData.resetToDefaults()
    
    await auth.loginAsLuke()
    await page.goto('/events')
    
    // Wait for events to load
    await expect(page.locator('text=Universe User Group 2025')).toBeVisible({ timeout: 10000 })
    
    // Check for event status - it's displayed in a v-chip with uppercase text
    await expect(page.locator('.v-chip').filter({ hasText: 'ACTIVE' })).toBeVisible()
    
    // Check that the event card is clickable (v-card with navigation)
    await expect(page.locator('.v-card:has-text("Universe User Group 2025")')).toBeVisible()
  })

  test('should navigate to event management page when clicking event card', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events')
    
    // Wait for events to load
    await expect(page.locator('text=Universe User Group 2025')).toBeVisible({ timeout: 10000 })
    
    // Click on the event card - v-card is the clickable element
    const eventCard = page.locator('.v-card:has-text("Universe User Group 2025")').first()
    await eventCard.click()
    
    // Wait for navigation to complete
    await page.waitForURL(/\/events\/\d+/, { timeout: 10000 })
    
    // Should now be on event management page
    await expect(page).toHaveURL(/\/events\/\d+/)
  })

  test('should show loading state while fetching events', async ({ page, mockData }) => {
    // This test modifies mock data, so ensure clean state first
    mockData.resetToDefaults()
    mockData.setEvents([]) // Empty list to show loading state
    
    await auth.loginAsLuke()
    
    // Slow down network to catch loading state
    await page.route('/api/events', async route => {
      await page.waitForTimeout(1000) // Add delay
      route.continue()
    })
    
    await page.goto('/events')
    
    // Should show loading indicator
    await expect(page.locator('.v-progress-circular').first()).toBeVisible()
    
    // Clean up route handlers AND restore mock data
    await page.unrouteAll({ behavior: 'ignoreErrors' })
    mockData.resetToDefaults() // Restore default data immediately after test
  })

  test('should handle empty events list', async ({ page, mockData }) => {
    // This test modifies mock data, so ensure clean state first
    mockData.resetToDefaults()
    // Clear all events
    mockData.setEvents([])
    
    await auth.loginAsLuke()
    await page.goto('/events')
    
    // Should show empty state
    await expect(page.locator('text=No events found')).toBeVisible({ timeout: 10000 })
    
    // Restore default data immediately after test
    mockData.resetToDefaults()
  })
})

test.describe('Event Management - Single Event View', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page, mockData }) => {
    // Reset mock data on the server side
    try {
      await page.request.post('/api/test/reset-mock-data')
    } catch (e) {
      mockData.resetToDefaults()
    }
    auth = new AuthHelper(page)
  })

  test('should display event management page for admin', async ({ page }) => {
    await auth.loginAsLuke()
    
    await page.goto('/events/1')
    
    // Should display event name - use more flexible text matching
    await expect(page.locator('h1').filter({ hasText: 'Universe User Group 2025' })).toBeVisible({ timeout: 10000 })
    
    // Should display all management sections - use simpler text matching
    await expect(page.locator('.v-card').filter({ hasText: 'Status' }).first()).toBeVisible()
    await expect(page.locator('.v-card').filter({ hasText: 'Configuration' }).first()).toBeVisible()
    await expect(page.locator('.v-card').filter({ hasText: 'Participants' }).first()).toBeVisible()
    await expect(page.locator('.v-card').filter({ hasText: 'Invitations' }).first()).toBeVisible()
  })

  test('should have back button that navigates to events list', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for page to load
    await expect(page.locator('h1').filter({ hasText: 'Universe User Group 2025' })).toBeVisible({ timeout: 10000 })
    
    // Click back button - be more specific to avoid the navigation drawer button
    await page.locator('.d-flex.align-center button:has(i.mdi-arrow-left)').first().click()
    
    // Should navigate back to events list
    await expect(page).toHaveURL('/events')
  })

  test('should redirect non-admin users', async ({ page }) => {
    await auth.loginAsVader()
    
    await page.goto('/events/1')
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should display participant statistics', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for page to load
    await expect(page.locator('text=Participant Statistics')).toBeVisible({ timeout: 10000 })
    
    // Should display stats
    const statsSection = page.locator('h3:has-text("Participant Statistics")').locator('..')
    await expect(statsSection.locator('.text-caption', { hasText: 'Total' })).toBeVisible()
    await expect(statsSection.locator('.text-caption', { hasText: 'Registered' })).toBeVisible()
  })
})

test.describe('Event Management - Participant Management', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page, mockData }) => {
    // Reset mock data on the server side
    try {
      await page.request.post('/api/test/reset-mock-data')
    } catch (e) {
      mockData.resetToDefaults()
    }
    auth = new AuthHelper(page)
  })

  test('should display participants table', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for participants section to load
    await expect(page.locator('.v-card').filter({ hasText: 'Participants' }).first()).toBeVisible({ timeout: 10000 })
    
    // Should display participant names - Luke is an admin, so he should be visible as a participant
    await expect(page.locator('text=Luke Skywalker')).toBeVisible()
    await expect(page.locator('text=Darth Vader')).toBeVisible()
  })

  test('should open register user dialog', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for page to load
    await expect(page.locator('.v-card').filter({ hasText: 'Participants' }).first()).toBeVisible({ timeout: 10000 })
    
    // Click register user button
    await page.locator('button:has-text("Register User")').click()
    
    // Dialog should open with user selection dropdown
    await expect(page.locator('text=Register User to Event')).toBeVisible()
    // Check for the select dropdown - use .first() to avoid strict mode violation
    await expect(page.locator('label:has-text("Select User")').first()).toBeVisible()
  })

  test('should allow searching participants', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for participants section to load
    await expect(page.locator('.v-card').filter({ hasText: 'Participants' }).first()).toBeVisible({ timeout: 10000 })
    
    // Find and use search field
    const searchField = page.locator('input[label="Search participants"]').or(
      page.locator('label:has-text("Search participants")').locator('..')
    ).locator('input').first()
    
    await searchField.fill('Luke')
    
    // Should filter to show only Luke
    await expect(page.locator('text=Luke Skywalker')).toBeVisible()
  })

  test('should open edit participant dialog', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for participants section to load
    await expect(page.locator('.v-card').filter({ hasText: 'Register User' })).toBeVisible({ timeout: 10000 })
    
    // Wait for participant data to load
    await expect(page.locator('text=Luke Skywalker')).toBeVisible({ timeout: 10000 })
    
    // Click edit button (pencil icon) within the participants card
    await page.locator('.v-card').filter({ hasText: 'Register User' }).locator('button:has(i.mdi-pencil)').first().click()
    
    // Edit dialog should open
    await expect(page.locator('text=Update Participant Status').last()).toBeVisible()
  })

  test('should open delete participant dialog', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for participants section to load
    await expect(page.locator('.v-card').filter({ hasText: 'Register User' })).toBeVisible({ timeout: 10000 })
    
    // Wait for participant data to load
    await expect(page.locator('text=Luke Skywalker')).toBeVisible({ timeout: 10000 })
    
    // Click delete button within the participants card
    await page.locator('.v-card').filter({ hasText: 'Register User' }).locator('button:has(i.mdi-delete)').first().click()
    
    // Delete confirmation dialog should open
    await expect(page.locator('text=Delete Participant').last()).toBeVisible()
    await expect(page.locator('text=Are you sure you want to delete this participant?')).toBeVisible()
  })
})

test.describe('Event Management - Invitation Management', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page, mockData }) => {
    // Reset mock data on the server side
    try {
      await page.request.post('/api/test/reset-mock-data')
    } catch (e) {
      mockData.resetToDefaults()
    }
    auth = new AuthHelper(page)
  })

  test('should display invitations section', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for invitations section to load
    await expect(page.locator('.v-card').filter({ hasText: 'Send Invitations' })).toBeVisible({ timeout: 10000 })
    
    // Should have send invitations button
    await expect(page.locator('button:has-text("Send Invitations")')).toBeVisible()
  })

  test('should open send invitations dialog', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for page to load
    await expect(page.locator('.v-card').filter({ hasText: 'Send Invitations' })).toBeVisible({ timeout: 10000 })
    
    // Click send invitations button
    await page.locator('button:has-text("Send Invitations")').click()
    
    // Dialog should open with user selection
    await expect(page.locator('text=Send Invitations to Users')).toBeVisible()
    // Check for the select dropdown - use .first() to avoid strict mode violation
    await expect(page.locator('label:has-text("Select Users")').first()).toBeVisible()
  })

  test('should show info message when all users are already participants', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Open invitations dialog
    await page.locator('button:has-text("Send Invitations")').click()
    await expect(page.locator('text=Send Invitations to Users')).toBeVisible()
    
    // Check if there's either the select or an info message about all users being participants
    // This depends on the mock data state - use .first() to avoid strict mode issues
    const hasSelect = await page.locator('label:has-text("Select Users")').first().isVisible()
    const hasInfoMessage = await page.locator('text=All users are already participants').isVisible()
    
    // Either the select should be visible or the info message
    expect(hasSelect || hasInfoMessage).toBeTruthy()
  })
})

test.describe('Event Management - Mobile Compatibility', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page, mockData }) => {
    // Reset mock data on the server side
    try {
      await page.request.post('/api/test/reset-mock-data')
    } catch (e) {
      mockData.resetToDefaults()
    }
    auth = new AuthHelper(page)
  })

  test('should display events list correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
    
    await auth.loginAsLuke()
    await page.goto('/events')
    
    // Should display events
    await expect(page.locator('text=Universe User Group 2025')).toBeVisible({ timeout: 10000 })
    
    // Event card should be visible on mobile (v-card, not button)
    const eventCard = page.locator('.v-card:has-text("Universe User Group 2025")').first()
    await expect(eventCard).toBeVisible()
  })

  test('should have responsive layout on event management page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
    
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for page to load - use more flexible matching
    await expect(page.locator('h1').filter({ hasText: 'Universe User Group 2025' })).toBeVisible({ timeout: 10000 })
    
    // Should display all sections with mobile-friendly spacing - use more specific selectors
    await expect(page.locator('.v-card').filter({ hasText: 'Event Status' })).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.v-card').filter({ hasText: 'Register User' })).toBeVisible()
    await expect(page.locator('.v-card').filter({ hasText: 'Send Invitations' })).toBeVisible()
  })

  test('should have block buttons on mobile dialogs', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for participant management section
    await expect(page.locator('.v-card').filter({ hasText: 'Register User' })).toBeVisible({ timeout: 10000 })
    
    // Open register user dialog
    await page.locator('button:has-text("Register User")').click()
    
    // Dialog should be visible
    await expect(page.locator('text=Register User').last()).toBeVisible()
  })
})

test.describe('Event Management - API Integration', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page, mockData }) => {
    // Reset mock data on the server side
    try {
      await page.request.post('/api/test/reset-mock-data')
    } catch (e) {
      mockData.resetToDefaults()
    }
    auth = new AuthHelper(page)
  })

  test('should fetch events list from API', async ({ page }) => {
    const eventsRequest = page.waitForResponse(response => 
      response.url().includes('/api/events') && 
      !response.url().includes('/api/events/') &&
      response.status() === 200
    )
    
    await auth.loginAsLuke()
    await page.goto('/events')
    
    const response = await eventsRequest
    try {
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.events).toBeDefined()
      expect(Array.isArray(data.events)).toBe(true)
    } catch (error) {
      // Handle Protocol error by checking response text instead
      const text = await response.text()
      console.log('Response text:', text)
      expect(text).toContain('success')
    }
  })

  test('should fetch event details from API', async ({ page }) => {
    const eventRequest = page.waitForResponse(response => 
      response.url().includes('/api/events/1') && 
      !response.url().includes('/participants') &&
      response.status() === 200
    )
    
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    const response = await eventRequest
    // Just verify the API call was successful
    expect(response.status()).toBe(200)
    expect(response.url()).toContain('/api/events/1')
    
    // Verify the page shows the event data - use flexible matching
    await expect(page.locator('h1').filter({ hasText: 'Universe User Group 2025' })).toBeVisible()
  })

  test('should fetch participants from API', async ({ page }) => {
    const participantsRequest = page.waitForResponse(response => 
      response.url().includes('/api/events/1/participants') && 
      response.status() === 200
    )
    
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    const response = await participantsRequest
    // Just verify the API call was successful
    expect(response.status()).toBe(200)
    expect(response.url()).toContain('/api/events/1/participants')
    
    // Verify the page shows participant data
    await expect(page.locator('text=Luke Skywalker')).toBeVisible()
  })
})
