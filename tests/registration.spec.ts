import { test, expect } from './helpers/mock-test-utils'

test.describe('Registration', () => {
  test.beforeEach(async ({ page, mockData }) => {
    // Reset mock data before each test
    mockData.resetToDefaults()
    await page.goto('/register', { waitUntil: 'networkidle' })
  })

  test('should display registration form', async ({ page }) => {
    await expect(page.getByTestId('firstname-input')).toBeVisible()
    await expect(page.getByTestId('lastname-input')).toBeVisible()
    await expect(page.getByTestId('email-input')).toBeVisible()
    await expect(page.getByTestId('password-input')).toBeVisible()
    await expect(page.getByTestId('confirm-password-input')).toBeVisible()
    await expect(page.getByTestId('register-submit-button')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    // Submit button should be disabled when fields are empty
    await expect(page.getByTestId('register-submit-button')).toBeDisabled()
    
    // Trigger validation by clicking and blurring
    await page.getByTestId('firstname-input').locator('input').click()
    await page.getByTestId('firstname-input').locator('input').blur()
    
    await expect(page.locator('text=First name is required')).toBeVisible()
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.getByTestId('firstname-input').locator('input').fill('John')
    await page.getByTestId('lastname-input').locator('input').fill('Doe')
    await page.getByTestId('email-input').locator('input').fill('invalid-email')
    await page.getByTestId('password-input').locator('input').fill('password123')
    
    await page.click('body')
    
    await expect(page.locator('text=E-mail must be valid')).toBeVisible()
    await expect(page.getByTestId('register-submit-button')).toBeDisabled()
  })

  test('should show validation error for short password', async ({ page }) => {
    await page.getByTestId('firstname-input').locator('input').fill('John')
    await page.getByTestId('lastname-input').locator('input').fill('Doe')
    await page.getByTestId('email-input').locator('input').fill('john@example.com')
    await page.getByTestId('password-input').locator('input').fill('short')
    
    await page.click('body')
    
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
    await expect(page.getByTestId('register-submit-button')).toBeDisabled()
  })

  test('should show error when passwords do not match', async ({ page }) => {
    await page.getByTestId('firstname-input').locator('input').fill('John')
    await page.getByTestId('lastname-input').locator('input').fill('Doe')
    await page.getByTestId('email-input').locator('input').fill('john@example.com')
    await page.getByTestId('password-input').locator('input').fill('password123')
    await page.getByTestId('confirm-password-input').locator('input').fill('password456')
    
    await page.click('body')
    
    await expect(page.locator('text=Passwords must match')).toBeVisible()
    await expect(page.getByTestId('register-submit-button')).toBeDisabled()
  })

  test('should successfully register with valid data', async ({ page }) => {
    await page.getByTestId('firstname-input').locator('input').fill('John')
    await page.getByTestId('lastname-input').locator('input').fill('Doe')
    await page.getByTestId('email-input').locator('input').fill('john.new@example.com')
    await page.getByTestId('password-input').locator('input').fill('password123')
    await page.getByTestId('confirm-password-input').locator('input').fill('password123')
    
    await page.getByTestId('register-submit-button').click()
    
    // Should redirect to login page after successful registration
    await expect(page).toHaveURL('/login', { timeout: 10000 })
  })

  test('should show error when registering with existing email', async ({ page }) => {
    // Try to register with Luke's email (already exists)
    await page.getByTestId('firstname-input').locator('input').fill('Luke')
    await page.getByTestId('lastname-input').locator('input').fill('Skywalker')
    await page.getByTestId('email-input').locator('input').fill('luke@rebels.com')
    await page.getByTestId('password-input').locator('input').fill('password123')
    await page.getByTestId('confirm-password-input').locator('input').fill('password123')
    
    await page.getByTestId('register-submit-button').click()
    
    // Should show error message
    await expect(page.getByTestId('register-error')).toBeVisible({ timeout: 5000 })
  })

  test('should have login link that points to correct auth URL', async ({ page }) => {
    const loginLink = page.getByTestId('login-link')
    await expect(loginLink).toBeVisible()
    
    const href = await loginLink.getAttribute('href')
    // Should point to /login for local auth (default in test environment)
    expect(href).toBe('/login')
  })

  test('should pre-fill form data when token is valid', async ({ page, mockData }) => {
    // Add a user with registration token via API endpoint to ensure server and client use same data
    const token = 'test-token-123'
    const userToAdd = {
      id: 'pending@example.com',
      email: 'pending@example.com',
      firstname: 'Pending',
      lastname: 'User',
      role: 'Participant' as const,
      password: 'testpassword123',
      registrationToken: token,
      registrationTokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Add user via server API to ensure both server and test see the same data
    const addUserResponse = await page.request.post('/api/test/add-user', {
      data: userToAdd
    })
    expect(addUserResponse.ok()).toBeTruthy()
    
    // Navigate with token
    await page.goto(`/register?token=${token}`, { waitUntil: 'networkidle' })
    
    // Wait for form to load and pre-fill
    await page.waitForTimeout(2000)
    
    // Check that fields are pre-filled
    const firstname = await page.getByTestId('firstname-input').locator('input').inputValue()
    const lastname = await page.getByTestId('lastname-input').locator('input').inputValue()
    const email = await page.getByTestId('email-input').locator('input').inputValue()
    
    expect(firstname).toBe('Pending')
    expect(lastname).toBe('User')
    expect(email).toBe('pending@example.com')
    
    // Email field should be disabled
    await expect(page.getByTestId('email-input').locator('input')).toBeDisabled()
  })
})

test.describe('Registration - Mobile Compatibility', () => {
  test.use({
    viewport: { width: 375, height: 667 } // Mobile viewport
  })

  test.beforeEach(async ({ page, mockData }) => {
    mockData.resetToDefaults()
    await page.goto('/register', { waitUntil: 'networkidle' })
  })

  test('should display registration form correctly on mobile', async ({ page }) => {
    await expect(page.getByTestId('firstname-input')).toBeVisible()
    await expect(page.getByTestId('lastname-input')).toBeVisible()
    await expect(page.getByTestId('email-input')).toBeVisible()
    await expect(page.getByTestId('register-submit-button')).toBeVisible()
  })

  test('should have block button on mobile', async ({ page }) => {
    const button = page.getByTestId('register-submit-button')
    await expect(button).toBeVisible()
    
    // Wait for any hydration to complete
    await page.waitForTimeout(1000)
    
    // Get the viewport width
    const viewportSize = page.viewportSize()
    expect(viewportSize?.width).toBe(375)
    
    // Get button box
    const box = await button.boundingBox()
    expect(box).toBeTruthy()
    
    // On mobile (375px viewport), with card padding, the button should take up most of the available width
    // The v-card has pa-5 (20px padding on each side) and mx-2 (8px margin on each side when mobile)
    // Button with block style should be close to 100% of card content width
    // Actual measured width is around 260px, so we verify it's at least 250px (much wider than desktop button)
    const minExpectedWidth = 250 // Block button should be at least 250px on 375px viewport
    expect(box!.width).toBeGreaterThanOrEqual(minExpectedWidth)
  })
})
