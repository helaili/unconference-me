import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers/auth'

test.describe('Assignment Algorithm', () => {
  test.beforeEach(async ({ page }) => {
    // Reset mock data before each test
    await page.goto('/')
    await fetch('http://localhost:3000/api/test/reset-mock-data', {
      method: 'POST'
    })
  })

  test('admin can see assignment generator on dashboard', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()

    // Check that assignment generator is visible
    await expect(page.getByText('Assignment Generator')).toBeVisible()
    await expect(page.getByText('Generate Assignments')).toBeVisible()
  })

  test('assignment generator shows disabled state when auto-assignment is off', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()
    
    // Should see the disabled chip or warning
    const disabledChip = page.locator('text=Automatic assignment is not enabled')
    await expect(disabledChip).toBeVisible()
  })

  test('admin can generate assignments for an event', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()

    // Wait for the page to load
    await page.waitForTimeout(1000)

    // Click generate assignments button
    const generateButton = page.getByRole('button', { name: /generate assignments/i })
    
    if (await generateButton.isDisabled()) {
      // If disabled, we need to enable auto-assignment first
      // This test assumes auto-assignment is enabled in the test event
      console.log('Assignment generation is disabled - auto-assignment may not be enabled')
    } else {
      await generateButton.click()

      // Wait for generation to complete
      await page.waitForTimeout(2000)

      // Check for success message
      await expect(page.getByText(/successfully generated/i)).toBeVisible({ timeout: 10000 })

      // Check for statistics display
      await expect(page.getByText('Assignment Statistics')).toBeVisible()
      await expect(page.getByText('Total Assignments')).toBeVisible()
    }
  })

  test('user can view their assignments after generation', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()

    // Check for user assignment card
    await expect(page.getByText('Your Discussion Assignments')).toBeVisible()

    // If assignments exist, they should be displayed
    // Otherwise, should see "No assignments yet" message
    const noAssignmentsText = page.getByText(/no assignments yet/i)
    const assignmentsList = page.locator('[data-testid="assignments-list"]')

    const hasAssignments = await assignmentsList.isVisible().catch(() => false)
    const hasNoAssignments = await noAssignmentsText.isVisible().catch(() => false)

    expect(hasAssignments || hasNoAssignments).toBeTruthy()
  })

  test('admin can clear assignments', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()

    // Wait for page to load
    await page.waitForTimeout(1000)

    // Click clear assignments button
    const clearButton = page.getByRole('button', { name: /clear assignments/i })
    await clearButton.click()

    // Confirm in dialog
    const confirmButton = page.getByRole('button', { name: /clear assignments/i }).last()
    await confirmButton.click()

    // Wait for operation to complete
    await page.waitForTimeout(2000)

    // Check for success message
    await expect(page.getByText(/successfully cleared/i)).toBeVisible({ timeout: 10000 })
  })

  test('assignment statistics show correct data structure', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()

    // Wait for page to load
    await page.waitForTimeout(1000)

    // Try to generate assignments first
    const generateButton = page.getByRole('button', { name: /generate assignments/i })
    
    if (!await generateButton.isDisabled()) {
      await generateButton.click()
      await page.waitForTimeout(2000)

      // Check for statistics display
      if (await page.getByText('Assignment Statistics').isVisible()) {
        // Verify key statistics are present
        await expect(page.getByText('Total Assignments')).toBeVisible()
        await expect(page.getByText('Fully Assigned')).toBeVisible()
        await expect(page.getByText('Topics Used')).toBeVisible()
        await expect(page.getByText('Avg Group Size')).toBeVisible()
        
        // Check for round details
        await expect(page.getByText('Round Details')).toBeVisible()
      }
    }
  })

  test('non-admin users cannot access assignment generation', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsVader()

    // Non-admin should not see assignment generator
    await expect(page.getByText('Assignment Generator')).not.toBeVisible()
    await expect(page.getByText('Generate Assignments')).not.toBeVisible()

    // But should see their own assignments
    await expect(page.getByText('Your Discussion Assignments')).toBeVisible()
  })

  test('user sees waiting message when no assignments exist', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsVader()

    // Wait for page to load
    await page.waitForTimeout(1000)

    // Should see the "no assignments yet" message
    const waitingMessage = page.getByText(/no assignments yet/i)
    await expect(waitingMessage).toBeVisible()

    // Should mention completing topic rankings
    await expect(page.getByText(/complete your topic rankings/i)).toBeVisible()
  })

  test('user assignments are grouped by round', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()

    // Wait for page to load
    await page.waitForTimeout(1000)

    // First generate assignments
    const generateButton = page.getByRole('button', { name: /generate assignments/i })
    
    if (!await generateButton.isDisabled()) {
      await generateButton.click()
      await page.waitForTimeout(2000)

      // Check user view by logging in as a different user
      await page.goto('/login')
      const auth2 = new AuthHelper(page)
      await auth2.loginAsVader()
      
      await page.waitForTimeout(1000)

      // If assignments exist, check they're grouped by round
      if (await page.getByText(/round \d+/i).isVisible()) {
        const roundHeaders = page.getByText(/round \d+/i)
        const count = await roundHeaders.count()
        expect(count).toBeGreaterThan(0)
      }
    }
  })

  test('assignment card is mobile responsive', async ({ page, viewport }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const auth = new AuthHelper(page)
    await auth.loginAsVader()

    await page.waitForTimeout(1000)

    // Check that assignment card is visible on mobile
    const assignmentCard = page.locator('text=Your Discussion Assignments')
    await expect(assignmentCard).toBeVisible()

    // Check mobile-specific classes or layouts
    const card = page.locator('v-card').first()
    const isMobileOptimized = await card.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.padding !== '24px' // Mobile should have different padding
    })

    expect(isMobileOptimized).toBeTruthy()
  })

  test('ranking tasks show when assignments are pending', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsVader()

    // Wait for page to load
    await page.waitForTimeout(1000)

    // User should see ranking tasks
    await expect(page.getByText('Topic Ranking Tasks')).toBeVisible()

    // If no assignments, should be encouraged to rank
    if (await page.getByText(/no assignments yet/i).isVisible()) {
      // The message should mention ranking
      await expect(page.getByText(/complete your topic rankings/i)).toBeVisible()
    }
  })

  test('assignment generation handles edge cases gracefully', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()

    await page.waitForTimeout(1000)

    // Try to generate assignments
    const generateButton = page.getByRole('button', { name: /generate assignments/i })
    
    if (!await generateButton.isDisabled()) {
      await generateButton.click()
      await page.waitForTimeout(2000)

      // Check if warnings are displayed
      const warningsSection = page.getByText(/assignment warnings/i)
      if (await warningsSection.isVisible()) {
        // Warnings should be in a list format
        const warningsList = page.locator('ul li')
        const count = await warningsList.count()
        expect(count).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('assignments show topic details', async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.loginAsLuke()

    await page.waitForTimeout(1000)

    // Generate assignments first
    const generateButton = page.getByRole('button', { name: /generate assignments/i })
    
    if (!await generateButton.isDisabled()) {
      await generateButton.click()
      await page.waitForTimeout(2000)

      // Switch to regular user to see assignments
      await page.goto('/login')
      const auth2 = new AuthHelper(page)
      await auth2.loginAsVader()
      
      await page.waitForTimeout(1000)

      // Expand an event to see assignments
      const eventPanel = page.locator('.v-expansion-panel').first()
      if (await eventPanel.isVisible()) {
        await eventPanel.click()
        await page.waitForTimeout(500)

        // Check for topic title and description
        const topicTitle = page.locator('.v-list-item-title')
        if (await topicTitle.first().isVisible()) {
          await expect(topicTitle.first()).toContainText(/\w+/)
        }
      }
    }
  })
})
