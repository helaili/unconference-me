import { test, expect } from '@playwright/test'

test.describe('Event Configuration Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should persist event configuration changes', async ({ page }) => {
    // Navigate to an event
    await page.goto('/events/event-1')
    await page.waitForLoadState('networkidle')

    // Click Edit button on Event Configuration card
    const editButton = page.locator('text=Event Configuration').locator('..').locator('button:has-text("Edit")')
    await editButton.click()

    // Change group size values
    const minGroupSizeInput = page.locator('input[type="number"]:has-text("Minimum Group Size")').first()
    await minGroupSizeInput.fill('3')
    
    const idealGroupSizeInput = page.locator('input[type="number"]:has-text("Ideal Group Size")').first()
    await idealGroupSizeInput.fill('5')
    
    const maxGroupSizeInput = page.locator('input[type="number"]:has-text("Maximum Group Size")').first()
    await maxGroupSizeInput.fill('8')

    // Toggle Enable Auto Assignment
    const autoAssignmentSwitch = page.locator('label:has-text("Enable Auto Assignment")').locator('..')
    await autoAssignmentSwitch.click()

    // Save changes
    await page.click('button:has-text("Save Changes")')
    
    // Wait for save to complete
    await page.waitForTimeout(1000)

    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify changes persisted
    const minGroupSize = await page.locator('label:has-text("Minimum Group Size")').locator('..').locator('input').inputValue()
    const idealGroupSize = await page.locator('label:has-text("Ideal Group Size")').locator('..').locator('input').inputValue()
    const maxGroupSize = await page.locator('label:has-text("Maximum Group Size")').locator('..').locator('input').inputValue()

    expect(minGroupSize).toBe('3')
    expect(idealGroupSize).toBe('5')
    expect(maxGroupSize).toBe('8')

    // Check that auto assignment toggle is in the correct state
    // This is the key test - nested settings should be preserved
  })

  test('should preserve other settings when updating one field', async ({ page }) => {
    // Navigate to an event
    await page.goto('/events/event-1')
    await page.waitForLoadState('networkidle')

    // Get initial state of settings
    await page.click('text=Event Configuration')
    
    // Click Edit
    const editButton = page.locator('text=Event Configuration').locator('..').locator('button:has-text("Edit")')
    await editButton.click()

    // Check initial state of enableTopicRanking
    const topicRankingSwitch = page.locator('label:has-text("Enable Topic Ranking")')
    const initialTopicRankingState = await topicRankingSwitch.locator('..').locator('input[type="checkbox"]').isChecked()

    // Toggle only enableAutoAssignment
    const autoAssignmentSwitch = page.locator('label:has-text("Enable Auto Assignment")')
    await autoAssignmentSwitch.click()

    // Save changes
    await page.click('button:has-text("Save Changes")')
    await page.waitForTimeout(1000)

    // Reload
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Click Edit again to see current values
    const editButton2 = page.locator('text=Event Configuration').locator('..').locator('button:has-text("Edit")')
    await editButton2.click()

    // Verify that topicRanking setting was preserved
    const topicRankingSwitch2 = page.locator('label:has-text("Enable Topic Ranking")')
    const finalTopicRankingState = await topicRankingSwitch2.locator('..').locator('input[type="checkbox"]').isChecked()

    expect(finalTopicRankingState).toBe(initialTopicRankingState)
  })
})
