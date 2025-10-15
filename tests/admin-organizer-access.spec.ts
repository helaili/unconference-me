import { test, expect } from '@playwright/test'
import { mockData } from './helpers/mock-manager'

test.describe('Admin and Organizer Access Control', () => {
  test.beforeEach(async ({ page }) => {
    // Reset mock data before each test
    mockData.resetToDefaults()
    // Navigate to home page to ensure we start fresh
    await page.goto('/', { waitUntil: 'networkidle' })
  })

  test.describe('Admin Event Management', () => {
    test('admin can create a new event', async ({ page }) => {
      // Login as admin (Luke)
      await page.goto('/login')
      await page.fill('input[type="email"]', 'luke@rebels.com')
      await page.fill('input[type="password"]', 'changeme')
      await page.click('button[type="submit"]')
      
      // Wait for redirect
      await page.waitForURL('/dashboard')
      
      // Test the API directly
      const response = await page.request.post('/api/events', {
        data: {
          name: 'New Test Event',
          description: 'Testing admin event creation',
          location: 'Virtual',
          startDate: new Date('2025-12-01T09:00:00Z').toISOString(),
          endDate: new Date('2025-12-01T17:00:00Z').toISOString(),
          numberOfRounds: 3,
          discussionsPerRound: 5,
          idealGroupSize: 8,
          minGroupSize: 5,
          maxGroupSize: 10,
          status: 'draft'
        }
      })
      
      expect(response.ok()).toBeTruthy()
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.event.name).toBe('New Test Event')
    })

    test('non-admin cannot create a new event', async ({ page }) => {
      // Login as regular user (Darth)
      await page.goto('/login')
      await page.fill('input[type="email"]', 'darth@empire.com')
      await page.fill('input[type="password"]', 'changeme')
      await page.click('button[type="submit"]')
      
      // Wait for redirect
      await page.waitForURL('/dashboard')
      
      const response = await page.request.post('/api/events', {
        data: {
          name: 'Unauthorized Event',
          startDate: new Date('2025-12-01T09:00:00Z').toISOString(),
          endDate: new Date('2025-12-01T17:00:00Z').toISOString()
        }
      })
      
      expect(response.status()).toBe(403)
    })

    test('admin can update any event', async ({ page }) => {
      // Login as admin (Luke)
      await page.goto('/login')
      await page.fill('input[type="email"]', 'luke@rebels.com')
      await page.fill('input[type="password"]', 'changeme')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard')
      
      const response = await page.request.put('/api/events/1', {
        data: {
          name: 'Updated Event Name',
          description: 'Admin updated this event'
        }
      })
      
      expect(response.ok()).toBeTruthy()
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.event.name).toBe('Updated Event Name')
    })

    test('admin can cancel an event', async ({ page }) => {
      // Login as admin (Luke)
      await page.goto('/login')
      await page.fill('input[type="email"]', 'luke@rebels.com')
      await page.fill('input[type="password"]', 'changeme')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard')
      
      const response = await page.request.put('/api/events/1', {
        data: {
          status: 'cancelled'
        }
      })
      
      expect(response.ok()).toBeTruthy()
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.event.status).toBe('cancelled')
    })
  })

  test.describe('Admin Topic Management', () => {
    test('admin can create topic without being a participant', async ({ page }) => {
      // Login as admin (Luke)
      await page.goto('/login')
      await page.fill('input[type="email"]', 'luke@rebels.com')
      await page.fill('input[type="password"]', 'changeme')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard')
      
      const response = await page.request.post('/api/events/1/topics', {
        data: {
          title: 'Admin Topic',
          description: 'Topic created by admin without being a participant'
        }
      })
      
      expect(response.ok()).toBeTruthy()
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.topic.title).toBe('Admin Topic')
    })

    test('admin can edit any topic', async ({ page }) => {
      // Login as admin (Luke)
      await page.goto('/login')
      await page.fill('input[type="email"]', 'luke@rebels.com')
      await page.fill('input[type="password"]', 'changeme')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard')
      
      // Edit a topic created by another user
      const response = await page.request.put('/api/events/1/topics/topic-1', {
        data: {
          title: 'Admin Edited Title',
          status: 'approved'
        }
      })
      
      expect(response.ok()).toBeTruthy()
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.topic.title).toBe('Admin Edited Title')
    })

    test('admin can delete any topic', async ({ page }) => {
      // Login as admin (Luke)
      await page.goto('/login')
      await page.fill('input[type="email"]', 'luke@rebels.com')
      await page.fill('input[type="password"]', 'changeme')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard')
      
      // Delete a topic created by another user
      const response = await page.request.delete('/api/events/1/topics/topic-1')
      
      expect(response.ok()).toBeTruthy()
      const result = await response.json()
      expect(result.success).toBe(true)
    })

    test('admin can change topic status', async ({ page }) => {
      // Login as admin (Luke)
      await page.goto('/login')
      await page.fill('input[type="email"]', 'luke@rebels.com')
      await page.fill('input[type="password"]', 'changeme')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard')
      
      const response = await page.request.put('/api/events/1/topics/topic-4', {
        data: {
          status: 'approved'
        }
      })
      
      expect(response.ok()).toBeTruthy()
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.topic.status).toBe('approved')
    })

    test('non-admin cannot change topic status', async ({ page }) => {
      // First, add the regular user as a participant
      mockData.addParticipant({
        id: 'participant-darth',
        eventId: '1',
        userId: 'darth@empire.com',
        email: 'darth@empire.com',
        firstname: 'Darth',
        lastname: 'Vador',
        status: 'confirmed',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // Create a topic for the user
      mockData.addTopic({
        id: 'topic-darth',
        eventId: '1',
        title: 'Darth Topic',
        proposedBy: 'participant-darth',
        status: 'proposed',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // Login as regular user (Darth)
      await page.goto('/login')
      await page.fill('input[type="email"]', 'darth@empire.com')
      await page.fill('input[type="password"]', 'changeme')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard')
      
      const response = await page.request.put('/api/events/1/topics/topic-darth', {
        data: {
          status: 'approved'
        }
      })
      
      expect(response.status()).toBe(403)
    })
  })

  test.describe('Organizer Access', () => {
    test('organizer can update their event', async ({ page }) => {
      // Add an organizer user
      mockData.addUser({
        id: 'organizer@example.com',
        email: 'organizer@example.com',
        firstname: 'Event',
        lastname: 'Organizer',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LebleWI/qLW4Sf3u2', // "changeme"
        role: 'Organizer',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // The organizer is already in the default organizers list for event '1'
      
      // Login as organizer
      await page.goto('/login')
      await page.fill('input[type="email"]', 'organizer@example.com')
      await page.fill('input[type="password"]', 'changeme')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard')
      
      const response = await page.request.put('/api/events/1', {
        data: {
          name: 'Organizer Updated Event'
        }
      })
      
      expect(response.ok()).toBeTruthy()
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.event.name).toBe('Organizer Updated Event')
    })

    test('organizer can manage topics for their event', async ({ page }) => {
      // Add an organizer user
      mockData.addUser({
        id: 'organizer@example.com',
        email: 'organizer@example.com',
        firstname: 'Event',
        lastname: 'Organizer',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LebleWI/qLW4Sf3u2', // "changeme"
        role: 'Organizer',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // Login as organizer
      await page.goto('/login')
      await page.fill('input[type="email"]', 'organizer@example.com')
      await page.fill('input[type="password"]', 'changeme')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard')
      
      // Edit any topic in their event
      const response = await page.request.put('/api/events/1/topics/topic-1', {
        data: {
          title: 'Organizer Edited Title',
          status: 'approved'
        }
      })
      
      expect(response.ok()).toBeTruthy()
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.topic.title).toBe('Organizer Edited Title')
    })

    test('organizer cannot update events they do not organize', async ({ page }) => {
      // Create a second event
      mockData.addEvent({
        id: '2',
        name: 'Other Event',
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-02'),
        numberOfRounds: 2,
        discussionsPerRound: 4,
        idealGroupSize: 6,
        minGroupSize: 4,
        maxGroupSize: 8,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // Add an organizer user for event 1 only
      mockData.addUser({
        id: 'organizer@example.com',
        email: 'organizer@example.com',
        firstname: 'Event',
        lastname: 'Organizer',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LebleWI/qLW4Sf3u2', // "changeme"
        role: 'Organizer',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // Login as organizer
      await page.goto('/login')
      await page.fill('input[type="email"]', 'organizer@example.com')
      await page.fill('input[type="password"]', 'changeme')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard')
      
      // Try to edit event 2 (which they don't organize)
      const response = await page.request.put('/api/events/2', {
        data: {
          name: 'Unauthorized Update'
        }
      })
      
      expect(response.status()).toBe(403)
    })
  })

  test.describe('Regular User Restrictions', () => {
    test('regular user cannot create topics without being a participant', async ({ page }) => {
      // Login as regular user (Darth)
      await page.goto('/login')
      await page.fill('input[type="email"]', 'darth@empire.com')
      await page.fill('input[type="password"]', 'changeme')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard')
      
      const response = await page.request.post('/api/events/1/topics', {
        data: {
          title: 'Unauthorized Topic',
          description: 'Should fail'
        }
      })
      
      expect(response.status()).toBe(403)
    })

    test('regular user can only edit their own topics', async ({ page }) => {
      // First, add the regular user as a participant
      mockData.addParticipant({
        id: 'participant-darth',
        eventId: '1',
        userId: 'darth@empire.com',
        email: 'darth@empire.com',
        firstname: 'Darth',
        lastname: 'Vador',
        status: 'confirmed',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // Login as regular user (Darth)
      await page.goto('/login')
      await page.fill('input[type="email"]', 'darth@empire.com')
      await page.fill('input[type="password"]', 'changeme')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard')
      
      // Try to edit someone else's topic
      const response = await page.request.put('/api/events/1/topics/topic-1', {
        data: {
          title: 'Unauthorized Edit'
        }
      })
      
      expect(response.status()).toBe(403)
    })

    test('regular user cannot update events', async ({ page }) => {
      // Login as regular user (Darth)
      await page.goto('/login')
      await page.fill('input[type="email"]', 'darth@empire.com')
      await page.fill('input[type="password"]', 'changeme')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard')
      
      const response = await page.request.put('/api/events/1', {
        data: {
          name: 'Unauthorized Update'
        }
      })
      
      expect(response.status()).toBe(403)
    })
  })
})
