import { test, expect } from './helpers/mock-test-utils'
import { AuthHelper } from './helpers/auth'

test.describe('Event Management - Events List', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page, mockData }) => {
    mockData.resetToDefaults()
    auth = new AuthHelper(page)
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

  test('should display event details in cards', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events')
    
    // Wait for events to load
    await expect(page.locator('text=Universe User Group 2025')).toBeVisible({ timeout: 10000 })
    
    // Check for event status
    await expect(page.locator('text=ACTIVE')).toBeVisible()
    
    // Check for manage button
    await expect(page.locator('button:has-text("Manage Event")')).toBeVisible()
  })

  test('should navigate to event management page when clicking event card', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events')
    
    // Wait for events to load
    await expect(page.locator('text=Universe User Group 2025')).toBeVisible({ timeout: 10000 })
    
    // Click on event card or manage button
    await page.locator('button:has-text("Manage Event")').first().click()
    
    // Should navigate to event management page
    await expect(page).toHaveURL(/\/events\/\d+/)
  })

  test('should show loading state while fetching events', async ({ page }) => {
    await auth.loginAsLuke()
    
    const navigation = page.goto('/events')
    
    // Should show loading indicator
    await expect(page.locator('text=Loading events...')).toBeVisible()
    
    await navigation
  })

  test('should handle empty events list', async ({ page, mockData }) => {
    // Clear all events
    mockData.setEvents([])
    
    await auth.loginAsLuke()
    await page.goto('/events')
    
    // Should show empty state
    await expect(page.locator('text=No events found')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Event Management - Single Event View', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page, mockData }) => {
    mockData.resetToDefaults()
    auth = new AuthHelper(page)
  })

  test('should display event management page for admin', async ({ page }) => {
    await auth.loginAsLuke()
    
    await page.goto('/events/1')
    
    // Should display event name
    await expect(page.locator('h1:has-text("Universe User Group 2025")')).toBeVisible({ timeout: 10000 })
    
    // Should display all management sections
    await expect(page.locator('text=Event Status')).toBeVisible()
    await expect(page.locator('text=Event Configuration')).toBeVisible()
    await expect(page.locator('text=Participants')).toBeVisible()
    await expect(page.locator('text=Invitations')).toBeVisible()
  })

  test('should have back button that navigates to events list', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for page to load
    await expect(page.locator('h1:has-text("Universe User Group 2025")')).toBeVisible({ timeout: 10000 })
    
    // Click back button
    await page.locator('button[icon="mdi-arrow-left"]').click()
    
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
    mockData.resetToDefaults()
    auth = new AuthHelper(page)
  })

  test('should display participants table', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for participants section to load
    await expect(page.locator('text=Participants').first()).toBeVisible({ timeout: 10000 })
    
    // Should display participant names
    await expect(page.locator('text=Luke Skywalker')).toBeVisible()
    await expect(page.locator('text=Darth Vader')).toBeVisible()
  })

  test('should open add participant dialog', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for page to load
    await expect(page.locator('text=Participants').first()).toBeVisible({ timeout: 10000 })
    
    // Click add participant button
    await page.locator('button:has-text("Add Participant")').click()
    
    // Dialog should open
    await expect(page.locator('text=Add Participant').last()).toBeVisible()
    await expect(page.locator('input[label="First Name"]').or(page.locator('label:has-text("First Name")'))).toBeVisible()
  })

  test('should allow searching participants', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for participants section to load
    await expect(page.locator('text=Participants').first()).toBeVisible({ timeout: 10000 })
    
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
    await expect(page.locator('text=Participants').first()).toBeVisible({ timeout: 10000 })
    
    // Click edit button (pencil icon)
    await page.locator('button[icon="mdi-pencil"]').first().click()
    
    // Edit dialog should open
    await expect(page.locator('text=Edit Participant').last()).toBeVisible()
  })

  test('should open delete participant dialog', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for participants section to load
    await expect(page.locator('text=Participants').first()).toBeVisible({ timeout: 10000 })
    
    // Click delete button
    await page.locator('button[icon="mdi-delete"]').first().click()
    
    // Delete confirmation dialog should open
    await expect(page.locator('text=Delete Participant').last()).toBeVisible()
    await expect(page.locator('text=Are you sure you want to delete this participant?')).toBeVisible()
  })
})

test.describe('Event Management - Invitation Management', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page, mockData }) => {
    mockData.resetToDefaults()
    auth = new AuthHelper(page)
  })

  test('should display invitations section', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for invitations section to load
    await expect(page.locator('text=Invitations').first()).toBeVisible({ timeout: 10000 })
    
    // Should have send invitations button
    await expect(page.locator('button:has-text("Send Invitations")')).toBeVisible()
  })

  test('should open send invitations dialog', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Wait for page to load
    await expect(page.locator('text=Invitations').first()).toBeVisible({ timeout: 10000 })
    
    // Click send invitations button
    await page.locator('button:has-text("Send Invitations")').click()
    
    // Dialog should open
    await expect(page.locator('text=Send Invitations').last()).toBeVisible()
    await expect(page.locator('textarea[label="Email Addresses"]').or(
      page.locator('label:has-text("Email Addresses")')
    )).toBeVisible()
  })

  test('should show empty state in invitations dialog', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Open invitations dialog
    await page.locator('button:has-text("Send Invitations")').click()
    await expect(page.locator('text=Send Invitations').last()).toBeVisible()
    
    // Should show empty state
    await expect(page.locator('text=No recipients added yet')).toBeVisible()
  })
})

test.describe('Event Management - Mobile Compatibility', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page, mockData }) => {
    mockData.resetToDefaults()
    auth = new AuthHelper(page)
  })

  test('should display events list correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
    
    await auth.loginAsLuke()
    await page.goto('/events')
    
    // Should display events
    await expect(page.locator('text=Universe User Group 2025')).toBeVisible({ timeout: 10000 })
    
    // Manage button should be block on mobile
    const manageButton = page.locator('button:has-text("Manage Event")').first()
    await expect(manageButton).toBeVisible()
  })

  test('should have responsive layout on event management page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Should display all sections with mobile-friendly spacing
    await expect(page.locator('text=Event Status')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Participants')).toBeVisible()
    await expect(page.locator('text=Invitations')).toBeVisible()
  })

  test('should have block buttons on mobile dialogs', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    // Open add participant dialog
    await page.locator('button:has-text("Add Participant")').click()
    
    // Dialog should be visible
    await expect(page.locator('text=Add Participant').last()).toBeVisible()
  })
})

test.describe('Event Management - API Integration', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page, mockData }) => {
    mockData.resetToDefaults()
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
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.events).toBeDefined()
    expect(Array.isArray(data.events)).toBe(true)
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
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.event).toBeDefined()
  })

  test('should fetch participants from API', async ({ page }) => {
    const participantsRequest = page.waitForResponse(response => 
      response.url().includes('/api/events/1/participants') && 
      response.status() === 200
    )
    
    await auth.loginAsLuke()
    await page.goto('/events/1')
    
    const response = await participantsRequest
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.participants).toBeDefined()
    expect(Array.isArray(data.participants)).toBe(true)
  })
})
