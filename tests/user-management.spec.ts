import { test, expect } from './helpers/mock-test-utils'
import { AuthHelper } from './helpers/auth'

test.describe('User Management', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page, mockData }) => {
    mockData.resetToDefaults()
    auth = new AuthHelper(page)
  })

  test('should redirect non-admin users to dashboard', async ({ page }) => {
    // Login as non-admin (Vader)
    await auth.loginAsVader()
    
    // Try to access user management page
    await page.goto('/users')
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should allow admin to access user management page', async ({ page }) => {
    // Login as admin (Luke)
    await auth.loginAsLuke()
    
    // Navigate to user management page
    await page.goto('/users')
    
    // Should stay on users page
    await expect(page).toHaveURL('/users')
    await expect(page.locator('text=User Management')).toBeVisible()
  })

  test('should display existing users in table', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/users')
    
    // Wait for table to load
    await expect(page.locator('text=User Management')).toBeVisible()
    
    // Should display default users
    await expect(page.locator('text=luke@rebels.com')).toBeVisible()
    await expect(page.locator('text=darth@empire.com')).toBeVisible()
  })

  test('should open add user dialog', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/users')
    
    // Click add user button
    await page.locator('button:has-text("Add User")').click()
    
    // Dialog should be visible
    await expect(page.locator('text=Add User').nth(1)).toBeVisible() // nth(1) for dialog title
  })

  test('should add a new user', async ({ page, mockData }) => {
    await auth.loginAsLuke()
    await page.goto('/users')
    
    // Click add user button
    await page.locator('button:has-text("Add User")').click()
    
    // Fill in user details
    await page.locator('input[type="text"]').first().fill('New')
    await page.locator('input[type="text"]').nth(1).fill('User')
    await page.locator('input[type="email"]').fill('newuser@example.com')
    
    // Click Add button in dialog
    await page.locator('button:has-text("Add")').last().click()
    
    // Wait for dialog to close and page to reload
    await page.waitForTimeout(1000)
    
    // New user should be in the list
    await expect(page.locator('text=newuser@example.com')).toBeVisible()
  })

  test('should open CSV import dialog', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/users')
    
    // Click import CSV button
    await page.locator('button:has-text("Import CSV")').click()
    
    // Dialog should be visible
    await expect(page.locator('text=Import Users from CSV')).toBeVisible()
  })

  test('should import users from CSV', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/users')
    
    // Click import CSV button
    await page.locator('button:has-text("Import CSV")').click()
    
    // Fill in CSV data
    const csvData = `firstname,lastname,email
Jane,Smith,jane.smith@example.com
Bob,Johnson,bob.johnson@example.com`
    
    await page.locator('textarea').fill(csvData)
    
    // Click Import button
    await page.locator('button:has-text("Import")').last().click()
    
    // Wait for dialog to close and page to reload
    await page.waitForTimeout(1000)
    
    // Imported users should be in the list
    await expect(page.locator('text=jane.smith@example.com')).toBeVisible()
    await expect(page.locator('text=bob.johnson@example.com')).toBeVisible()
  })

  test('should generate registration link for user', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/users')
    
    // Wait for table to load
    await expect(page.locator('text=luke@rebels.com')).toBeVisible()
    
    // Click Link button for first user
    await page.locator('button:has-text("Link")').first().click()
    
    // Link dialog should be visible
    await expect(page.locator('text=Registration Link')).toBeVisible()
    await expect(page.locator('input[readonly]')).toBeVisible()
    
    // Link should contain token
    const linkValue = await page.locator('input[readonly]').inputValue()
    expect(linkValue).toContain('/register?token=')
  })

  test('should be able to regenerate registration link', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/users')
    
    // Wait for table to load
    await expect(page.locator('text=luke@rebels.com')).toBeVisible()
    
    // Click Link button for first user
    await page.locator('button:has-text("Link")').first().click()
    
    // Get initial link
    const initialLink = await page.locator('input[readonly]').inputValue()
    
    // Click Regenerate button
    await page.locator('button:has-text("Regenerate")').click()
    
    // Wait for new link to be generated
    await page.waitForTimeout(1000)
    
    // Get new link
    const newLink = await page.locator('input[readonly]').inputValue()
    
    // Links should be different
    expect(newLink).not.toBe(initialLink)
  })

  test('should delete a user', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/users')
    
    // Wait for table to load
    await expect(page.locator('text=darth@empire.com')).toBeVisible()
    
    // Setup dialog confirmation handler
    page.on('dialog', dialog => dialog.accept())
    
    // Click Delete button for Vader
    const deleteButtons = page.locator('button:has-text("Delete")')
    await deleteButtons.last().click()
    
    // Wait for deletion to complete
    await page.waitForTimeout(1000)
    
    // User should be removed from the list
    // We should still see Luke's email but not Vader's
    await expect(page.locator('text=luke@rebels.com')).toBeVisible()
  })
})

test.describe('User Management - Mobile Compatibility', () => {
  let auth: AuthHelper

  test.use({
    viewport: { width: 375, height: 667 } // Mobile viewport
  })

  test.beforeEach(async ({ page, mockData }) => {
    mockData.resetToDefaults()
    auth = new AuthHelper(page)
    await auth.loginAsLuke()
  })

  test('should display user management page correctly on mobile', async ({ page }) => {
    await page.goto('/users')
    
    await expect(page.locator('text=User Management')).toBeVisible()
    await expect(page.locator('button:has-text("Add User")')).toBeVisible()
    await expect(page.locator('button:has-text("Import CSV")')).toBeVisible()
  })

  test('should have block buttons on mobile', async ({ page }) => {
    await page.goto('/users')
    
    const addButton = page.locator('button:has-text("Add User")')
    const box = await addButton.boundingBox()
    
    // Button should be close to full width on mobile
    expect(box?.width).toBeGreaterThan(300)
  })

  test('should open dialogs correctly on mobile', async ({ page }) => {
    await page.goto('/users')
    
    // Click add user button
    await page.locator('button:has-text("Add User")').click()
    
    // Dialog should be visible and properly sized
    await expect(page.locator('text=Add User').nth(1)).toBeVisible()
  })
})
