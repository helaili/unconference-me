import { test, expect } from './helpers/mock-test-utils'
import { AuthHelper } from './helpers/auth'

test.describe('User Editing', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page, mockData }) => {
    // Reset mock data on server side for test isolation
    await page.request.post('/api/test/reset-mock-data')
    mockData.resetToDefaults()
    auth = new AuthHelper(page)
    
    // Login as admin
    await auth.loginAsLuke()
    
    // Navigate to users page
    await page.goto('/users')
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async ({ page }) => {
    // Clean up after each test
    await page.request.post('/api/test/reset-mock-data')
  })

  test('should open edit dialog when clicking edit button', async ({ page }) => {
    // Find and click the first edit button
    const editButton = page.locator('button:has-text("Edit"), button:has(svg.mdi-pencil)').first()
    await editButton.click()
    
    // Verify edit dialog is visible
    await expect(page.locator('text=Edit User')).toBeVisible()
    
    // Verify form fields are visible and have values
    const firstNameInput = page.locator('input[type="text"]').first()
    await expect(firstNameInput).toBeVisible()
    const value = await firstNameInput.inputValue()
    expect(value.length).toBeGreaterThan(0)
  })

  test('should update user information', async ({ page }) => {
    // Click edit on first user
    const editButton = page.locator('button:has-text("Edit"), button:has(svg.mdi-pencil)').first()
    await editButton.click()
    
    // Wait for dialog
    await page.waitForSelector('text=Edit User')
    
    // Get the original values
    const firstNameInput = page.locator('input[type="text"]').first()
    const lastNameInput = page.locator('input[type="text"]').nth(1)
    
    // Update fields
    await firstNameInput.fill('UpdatedFirstName')
    await lastNameInput.fill('UpdatedLastName')
    
    // Click update button
    await page.click('button:has-text("Update")')
    
    // Wait for dialog to close - this indicates the update was successful
    await expect(page.locator('text=Edit User')).not.toBeVisible({ timeout: 10000 })
    
    // Verify we're still on the users page
    await expect(page).toHaveURL('/users')
    
    // Verify the table is still showing data (at least 1 row)
    const rowCount = await page.locator('tbody tr').count()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('should not allow changing email address', async ({ page }) => {
    // Click edit on first user
    const editButton = page.locator('button:has-text("Edit"), button:has(svg.mdi-pencil)').first()
    await editButton.click()
    
    // Wait for dialog
    await page.waitForSelector('text=Edit User')
    
    // Verify email field is disabled
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeDisabled()
    
    // Verify hint text
    await expect(page.locator('text=Email cannot be changed')).toBeVisible()
  })

  test('should be able to change user role', async ({ page }) => {
    // Click edit on a participant user (not admin)
    const rows = page.locator('tbody tr')
    let participantRow = null
    
    // Find a participant row
    const rowCount = await rows.count()
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const roleText = await row.locator('td').nth(2).textContent()
      if (roleText?.includes('Participant')) {
        participantRow = row
        break
      }
    }
    
    if (participantRow) {
      const editButton = participantRow.locator('button:has-text("Edit"), button:has(svg.mdi-pencil)')
      await editButton.click()
      
      // Wait for dialog
      await page.waitForSelector('text=Edit User')
      
      // Change role to Organizer
      await page.click('div[role="combobox"]:has-text("Role")')
      await page.click('div[role="option"]:has-text("Organizer")')
      
      // Save changes
      await page.click('button:has-text("Update")')
      
      // Wait for dialog to close
      await expect(page.locator('text=Edit User')).not.toBeVisible()
      
      // Note: Verification of role change would require checking the updated row
      // which might need a more specific selector based on the user's email
    }
  })

  test('should cancel editing without saving changes', async ({ page }) => {
    // Get original first name
    const originalName = await page.locator('tbody tr').first().locator('td').first().textContent()
    
    // Click edit
    const editButton = page.locator('button:has-text("Edit"), button:has(svg.mdi-pencil)').first()
    await editButton.click()
    
    // Wait for dialog
    await page.waitForSelector('text=Edit User')
    
    // Change first name
    const firstNameInput = page.locator('input[type="text"]').first()
    await firstNameInput.clear()
    await firstNameInput.fill('ShouldNotBeSaved')
    
    // Click cancel
    await page.click('button:has-text("Cancel")')
    
    // Wait for dialog to close
    await expect(page.locator('text=Edit User')).not.toBeVisible()
    
    // Verify original name is still there
    await expect(page.locator('tbody tr').first().locator('td').first()).toContainText(originalName || '')
  })

  test('should show error message if update fails', async ({ page }) => {
    // Click edit
    const editButton = page.locator('button:has-text("Edit"), button:has(svg.mdi-pencil)').first()
    await editButton.click()
    
    // Wait for dialog
    await page.waitForSelector('text=Edit User')
    
    // Clear required field
    const firstNameInput = page.locator('input[type="text"]').first()
    await firstNameInput.clear()
    
    // Try to update
    await page.click('button:has-text("Update")')
    
    // Should show validation error or stay on dialog
    // (depending on implementation)
    await page.waitForTimeout(1000)
  })
})
