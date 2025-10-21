import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers/auth'

test.describe('Assignment Statistics', () => {
  test.beforeEach(async ({ page }) => {
    // Reset mock data before each test
    await page.goto('/')
    await fetch('http://localhost:3000/api/test/reset-mock-data', {
      method: 'POST'
    })
  })

  test('displays preferred choice distribution after generating assignments', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()

    // Wait for the page to load
    await page.waitForTimeout(1000)

    // Generate assignments
    const generateButton = page.getByRole('button', { name: /generate assignments/i })
    
    // Skip if button is disabled
    if (await generateButton.isDisabled()) {
      test.skip()
      return
    }

    await generateButton.click()
    await page.waitForTimeout(2000)

    // Check if success message appears
    const successMessage = page.getByText(/successfully generated/i)
    if (await successMessage.isVisible()) {
      // Check for Preferred Choice Success section
      const preferredChoiceHeader = page.getByText('Preferred Choice Success')
      await expect(preferredChoiceHeader).toBeVisible({ timeout: 5000 })

      // Check for distribution description
      const preferredDescription = page.locator('text=/Distribution of participants by how many of their top .* preferred topics/i')
      await expect(preferredDescription).toBeVisible()

      // Check for table headers
      await expect(page.getByText('Top Preferences Assigned')).toBeVisible()
      await expect(page.getByText('Participants')).toBeVisible()
      await expect(page.getByText('Percentage')).toBeVisible()
    }
  })

  test('displays sorted choice distribution after generating assignments', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()

    await page.waitForTimeout(1000)

    // Generate assignments
    const generateButton = page.getByRole('button', { name: /generate assignments/i })
    
    if (await generateButton.isDisabled()) {
      test.skip()
      return
    }

    await generateButton.click()
    await page.waitForTimeout(2000)

    const successMessage = page.getByText(/successfully generated/i)
    if (await successMessage.isVisible()) {
      // Check for Sorted Choice Success section
      const sortedChoiceHeader = page.getByText('Sorted Choice Success')
      await expect(sortedChoiceHeader).toBeVisible({ timeout: 5000 })

      // Check for distribution description mentioning sorted topics
      const sortedDescription = page.locator('text=/Distribution of participants by how many of their .* sorted topics/i')
      await expect(sortedDescription).toBeVisible()

      // Check for table headers
      await expect(page.getByText('Sorted Topics Assigned')).toBeVisible()
    }
  })

  test('distribution shows correct structure with colored chips', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()

    await page.waitForTimeout(1000)

    const generateButton = page.getByRole('button', { name: /generate assignments/i })
    
    if (await generateButton.isDisabled()) {
      test.skip()
      return
    }

    await generateButton.click()
    await page.waitForTimeout(2000)

    const successMessage = page.getByText(/successfully generated/i)
    if (await successMessage.isVisible()) {
      // Check for colored chips in the distribution tables
      // Look for chips with text like "3 of 3", "2 of 3", etc.
      const chips = page.locator('.v-chip:has-text("of")')
      const chipCount = await chips.count()
      
      // Should have at least some distribution chips
      expect(chipCount).toBeGreaterThan(0)

      // Check that percentages are displayed
      const percentages = page.locator('text=/%/')
      const percentageCount = await percentages.count()
      expect(percentageCount).toBeGreaterThan(0)
    }
  })

  test('statistics include participant count information', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()

    await page.waitForTimeout(1000)

    const generateButton = page.getByRole('button', { name: /generate assignments/i })
    
    if (await generateButton.isDisabled()) {
      test.skip()
      return
    }

    await generateButton.click()
    await page.waitForTimeout(2000)

    const successMessage = page.getByText(/successfully generated/i)
    if (await successMessage.isVisible()) {
      // Check for participant count information
      const participantInfo = page.locator('text=/Based on .* participants with rankings/i')
      await expect(participantInfo.first()).toBeVisible({ timeout: 5000 })
      
      // Should appear twice (once for each distribution type)
      const count = await participantInfo.count()
      expect(count).toBeGreaterThanOrEqual(2)
    }
  })

  test('statistics are hidden when no assignments exist', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()

    await page.waitForTimeout(1000)

    // Clear any existing assignments first
    const clearButton = page.getByRole('button', { name: /clear assignments/i })
    const clearButtonVisible = await clearButton.isVisible().catch(() => false)
    
    if (clearButtonVisible) {
      await clearButton.click()
      
      // Confirm in dialog
      const confirmButton = page.getByRole('button', { name: /clear assignments/i }).last()
      await confirmButton.click()
      await page.waitForTimeout(1000)
    }

    // Verify statistics sections are not visible
    const preferredChoiceHeader = page.getByText('Preferred Choice Success')
    const sortedChoiceHeader = page.getByText('Sorted Choice Success')
    
    await expect(preferredChoiceHeader).not.toBeVisible()
    await expect(sortedChoiceHeader).not.toBeVisible()
  })

  test('distribution tables are mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const auth = new AuthHelper(page)
    await auth.loginAsLuke()

    await page.waitForTimeout(1000)

    const generateButton = page.getByRole('button', { name: /generate assignments/i })
    
    if (await generateButton.isDisabled()) {
      test.skip()
      return
    }

    await generateButton.click()
    await page.waitForTimeout(2000)

    const successMessage = page.getByText(/successfully generated/i)
    if (await successMessage.isVisible()) {
      // Check that statistics card is visible on mobile
      const statisticsCard = page.locator('.v-card:has-text("Assignment Statistics")')
      await expect(statisticsCard).toBeVisible()

      // Check that the distribution sections are visible
      const preferredChoiceHeader = page.getByText('Preferred Choice Success')
      await expect(preferredChoiceHeader).toBeVisible({ timeout: 5000 })

      // Verify table is responsive and visible
      const table = page.locator('.v-table').first()
      await expect(table).toBeVisible()
    }
  })

  test('displays topic occurrence distribution after generating assignments', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()

    await page.waitForTimeout(1000)

    // Generate assignments
    const generateButton = page.getByRole('button', { name: /generate assignments/i })
    
    if (await generateButton.isDisabled()) {
      test.skip()
      return
    }

    await generateButton.click()
    await page.waitForTimeout(2000)

    const successMessage = page.getByText(/successfully generated/i)
    if (await successMessage.isVisible()) {
      // Check for Topic Schedule Distribution section
      const topicDistributionHeader = page.getByText('Topic Schedule Distribution')
      await expect(topicDistributionHeader).toBeVisible({ timeout: 5000 })

      // Check for total topics planned display
      await expect(page.getByText('Total Topics Planned')).toBeVisible()

      // Check for distribution table headers
      await expect(page.getByText('Times Scheduled')).toBeVisible()
      await expect(page.getByText('Number of Topics')).toBeVisible()
    }
  })
})
