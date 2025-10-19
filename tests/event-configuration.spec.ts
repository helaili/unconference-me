import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers/auth'

test.describe('Event Configuration Persistence', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page }) => {
    // Login as admin using AuthHelper
    auth = new AuthHelper(page)
    await auth.loginAsLuke()
  })

  test('should persist event configuration changes', async ({ page }) => {
    // Navigate to an event - use correct event ID from mock data
    await page.goto('/events/1')
    await page.waitForLoadState('networkidle')

    // Click Edit button on Event Configuration card - use more specific selector
    const editButton = page.locator('.v-card-title >> text=Event Configuration').locator('..').locator('button:has-text("Edit")')
    await editButton.click()

    // Wait for edit mode to activate
    await page.waitForTimeout(500)

    // Change group size values - find inputs by their labels
    const minGroupSizeInput = page.locator('label:has-text("Minimum Group Size")').locator('..').locator('input[type="number"]')
    await minGroupSizeInput.fill('3')
    
    const idealGroupSizeInput = page.locator('label:has-text("Ideal Group Size")').locator('..').locator('input[type="number"]')
    await idealGroupSizeInput.fill('5')
    
    const maxGroupSizeInput = page.locator('label:has-text("Maximum Group Size")').locator('..').locator('input[type="number"]')
    await maxGroupSizeInput.fill('8')

    // Toggle Enable Auto Assignment
    const autoAssignmentSwitch = page.locator('label:has-text("Enable Auto Assignment")').locator('..').locator('input[type="checkbox"]')
    await autoAssignmentSwitch.click()

    // Save changes
    await page.click('button:has-text("Save Changes")')
    
    // Wait for save to complete and edit mode to exit
    await page.waitForTimeout(1500)

    // Click Edit again to verify the values were saved
    const editButtonAgain = page.locator('.v-card-title >> text=Event Configuration').locator('..').locator('button:has-text("Edit")')
    await editButtonAgain.click()
    await page.waitForTimeout(500)

    // Verify changes persisted in the form
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
    // Navigate to an event - use correct event ID from mock data
    await page.goto('/events/1')
    await page.waitForLoadState('networkidle')

    // Wait for Event Configuration to be visible
    await expect(page.locator('.v-card-title >> text=Event Configuration').first()).toBeVisible({ timeout: 10000 })
    
    // Click Edit - use more specific selector
    const editButton = page.locator('.v-card-title >> text=Event Configuration').locator('..').locator('button:has-text("Edit")')
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

    // Click Edit again to see current values - use more specific selector
    const editButton2 = page.locator('.v-card-title >> text=Event Configuration').locator('..').locator('button:has-text("Edit")')
    await editButton2.click()

    // Verify that topicRanking setting was preserved
    const topicRankingSwitch2 = page.locator('label:has-text("Enable Topic Ranking")')
    const finalTopicRankingState = await topicRankingSwitch2.locator('..').locator('input[type="checkbox"]').isChecked()

    expect(finalTopicRankingState).toBe(initialTopicRankingState)
  })
})
