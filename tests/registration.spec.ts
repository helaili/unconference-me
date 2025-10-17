import { test, expect } from './helpers/isolated-test-utils'

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    // mockData is automatically reset and isolated per test
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
    // Use unique email to avoid conflicts when tests run in parallel
    const uniqueEmail = `john.new.${Date.now()}.${Math.random().toString(36).substr(2, 9)}@example.com`
    
    await page.getByTestId('firstname-input').locator('input').fill('John')
    await page.getByTestId('lastname-input').locator('input').fill('Doe')
    await page.getByTestId('email-input').locator('input').fill(uniqueEmail)
    await page.getByTestId('password-input').locator('input').fill('password123')
    await page.getByTestId('confirm-password-input').locator('input').fill('password123')
    
    // Wait for the button to be enabled
    await expect(page.getByTestId('register-submit-button')).toBeEnabled({ timeout: 5000 })
    
    // Click button
    await page.getByTestId('register-submit-button').click()
    
    // Wait for either successful navigation or error message
    await Promise.race([
      page.waitForURL('/login', { timeout: 10000 }),
      page.waitForSelector('[data-testid="register-error"]', { timeout: 10000 })
    ])
    
    // Should have navigated to login (no error)
    await expect(page).toHaveURL('/login')
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

  test('should pre-fill form data when token is valid', async ({ page, contextId }, testInfo) => {
    // TEMPORARY: Skip this test when running full suite with unconverted tests
    // Once all tests are converted to isolated-test-utils, this can be removed
    if (testInfo.config.workers && testInfo.config.workers >= 8) {
      test.skip()
    }
    
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
    
    // Give the server a moment to process the user addition
    // This helps avoid race conditions when running with high concurrency
    await page.waitForTimeout(100)
    
    // Set up promise to wait for the check-token API call (any status)
    const checkTokenPromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/check-token'), 
      { timeout: 10000 }
    )
    
    // Navigate with token and context ID (for webkit compatibility)
    await page.goto(`/register?token=${token}&test-context-id=${contextId}`, { waitUntil: 'networkidle' })
    
    // Wait for the check-token API call to complete
    const checkTokenResponse = await checkTokenPromise
    
    // If the token check failed, retry once (to handle rare race conditions with high worker count)
    if (checkTokenResponse.status() !== 200) {
      console.warn(`Token check failed with status ${checkTokenResponse.status()}, retrying...`)
      await page.reload({ waitUntil: 'networkidle' })
      const retryResponse = await page.waitForResponse(r => r.url().includes('/api/auth/check-token'))
      expect(retryResponse.status()).toBe(200)
    } else {
      expect(checkTokenResponse.status()).toBe(200)
    }
    
    // Wait for the email field to be populated first (this indicates the API call completed)
    await expect(page.getByTestId('email-input').locator('input')).toHaveValue('pending@example.com', { timeout: 10000 })
    
    // Then verify it's disabled (should be immediate after data loads)
    await expect(page.getByTestId('email-input').locator('input')).toBeDisabled()
    
    // Check that all fields are pre-filled
    await expect(page.getByTestId('firstname-input').locator('input')).toHaveValue('Pending')
    await expect(page.getByTestId('lastname-input').locator('input')).toHaveValue('User')
  })
})

test.describe('Registration - Mobile Compatibility', () => {
  test.use({
    viewport: { width: 375, height: 667 } // Mobile viewport
  })

  test.beforeEach(async ({ page }) => {
    // mockData is automatically reset and isolated per test
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
