import { test, expect } from './helpers/mock-test-utils'
import { AuthHelper } from './helpers/auth'

test.describe('User Registration', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page, mockData }) => {
    mockData.resetToDefaults()
    auth = new AuthHelper(page)
  })

  test('should display registration form', async ({ page }) => {
    await page.goto('/register')
    
    await expect(page.locator('h1, h2, h3').filter({ hasText: 'Register' })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('label:has-text("First Name")')).toBeVisible()
    await expect(page.locator('label:has-text("Last Name")')).toBeVisible()
    await expect(page.locator('label:has-text("Password")')).toBeVisible()
    await expect(page.locator('label:has-text("Confirm Password")')).toBeVisible()
  })

  test('should register a new user', async ({ page }) => {
    await page.goto('/register')
    
    // Fill in registration form
    await page.locator('input[type="email"]').fill('newuser@example.com')
    await page.locator('input[label="First Name"]').first().fill('New')
    await page.locator('input').filter({ hasText: /First Name/i }).fill('New')
    
    // Use more specific selectors
    const inputs = await page.locator('input[type="text"]').all()
    if (inputs.length >= 2) {
      await inputs[0].fill('New')  // First Name
      await inputs[1].fill('User')  // Last Name
    }
    
    const passwordInputs = await page.locator('input[type="password"]').all()
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].fill('newpassword123')
      await passwordInputs[1].fill('newpassword123')
    }
    
    // Submit form
    await page.locator('button[type="submit"]').click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  })

  test('should show error for password mismatch', async ({ page }) => {
    await page.goto('/register')
    
    await page.locator('input[type="email"]').fill('newuser@example.com')
    
    const inputs = await page.locator('input[type="text"]').all()
    if (inputs.length >= 2) {
      await inputs[0].fill('New')
      await inputs[1].fill('User')
    }
    
    const passwordInputs = await page.locator('input[type="password"]').all()
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].fill('password123')
      await passwordInputs[1].fill('differentpassword')
    }
    
    await page.locator('button[type="submit"]').click()
    
    // Should show error
    await expect(page.locator('text=/password.*do not match/i')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('User Management (Admin)', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page, mockData }) => {
    mockData.resetToDefaults()
    auth = new AuthHelper(page)
  })

  test('should display user list for admin', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/users')
    
    await expect(page.locator('h1').filter({ hasText: 'User Management' })).toBeVisible({ timeout: 10000 })
    
    // Should see users table
    await expect(page.locator('table')).toBeVisible()
    
    // Should see at least the default users
    await expect(page.locator('text=luke@rebels.com')).toBeVisible()
  })

  test('should not allow non-admin to access user management', async ({ page }) => {
    await auth.loginAsVader()
    await page.goto('/users')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  })

  test('should generate invitation link', async ({ page }) => {
    await auth.loginAsLuke()
    await page.goto('/users')
    
    await expect(page.locator('h1').filter({ hasText: 'User Management' })).toBeVisible({ timeout: 10000 })
    
    // Find and click a generate/regenerate button
    const generateButton = page.locator('button').filter({ hasText: /link/i }).first()
    await generateButton.click()
    
    // Should show invitation dialog
    await expect(page.locator('text=/invitation link/i')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Invitation Token Flow', () => {
  test.beforeEach(async ({ mockData }) => {
    mockData.resetToDefaults()
  })

  test('should pre-fill email from invitation link', async ({ page, mockData }) => {
    // Generate an invitation token for a test user
    const testEmail = 'invited@example.com'
    mockData.addUser({
      id: 'invited-user',
      email: testEmail,
      firstname: 'Invited',
      lastname: 'User',
      role: 'Participant'
    })
    
    const token = mockData.generateInvitationToken(testEmail)
    
    // Visit registration page with token
    await page.goto(`/register?token=${token}&email=${encodeURIComponent(testEmail)}`)
    
    // Email should be pre-filled and readonly
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveValue(testEmail)
    await expect(emailInput).toHaveAttribute('readonly')
    
    // Should show invitation notice
    await expect(page.locator('text=/invited to register/i')).toBeVisible()
  })
})
