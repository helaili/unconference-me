import { test, expect } from './helpers/isolated-test-utils'

test.describe('Registration Mode Management', () => {
  test('should allow admin to configure registration mode to open', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.getByTestId('email-input').locator('input').fill('luke@rebels.com')
    await page.getByTestId('password-input').locator('input').fill('changeme')
    await page.getByTestId('login-submit-button').click()
    
    await page.waitForURL('/dashboard')
    
    // Navigate to events page
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    
    // Click on first event to manage it
    const firstEventCard = page.locator('text=Spring Unconference 2025').first()
    await firstEventCard.click()
    
    await page.waitForURL(/\/events\/event-/)
    
    // Look for Event Configuration section and Edit button
    const editButton = page.locator('text=Event Configuration').locator('..').locator('button:has-text("Edit")')
    await expect(editButton).toBeVisible({ timeout: 10000 })
    await editButton.click()
    
    // Find and select "Open Registration" radio option
    const openRadio = page.locator('input[type="radio"][value="open"]')
    await openRadio.check()
    
    // Save changes
    const saveButton = page.locator('button:has-text("Save Changes")')
    await saveButton.click()
    
    // Wait for success message
    await expect(page.locator('text=Event updated successfully')).toBeVisible({ timeout: 10000 })
  })

  test('should allow admin to configure registration mode to personal code', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.getByTestId('email-input').locator('input').fill('luke@rebels.com')
    await page.getByTestId('password-input').locator('input').fill('changeme')
    await page.getByTestId('login-submit-button').click()
    
    await page.waitForURL('/dashboard')
    
    // Navigate to events page
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    
    // Click on first event
    const firstEventCard = page.locator('text=Spring Unconference 2025').first()
    await firstEventCard.click()
    
    await page.waitForURL(/\/events\/event-/)
    
    // Edit event configuration
    const editButton = page.locator('text=Event Configuration').locator('..').locator('button:has-text("Edit")')
    await expect(editButton).toBeVisible({ timeout: 10000 })
    await editButton.click()
    
    // Select "Personal Invitation Code" radio option
    const personalCodeRadio = page.locator('input[type="radio"][value="personal-code"]')
    await personalCodeRadio.check()
    
    // Save changes
    const saveButton = page.locator('button:has-text("Save Changes")')
    await saveButton.click()
    
    // Wait for success message
    await expect(page.locator('text=Event updated successfully')).toBeVisible({ timeout: 10000 })
  })

  test('should allow admin to configure registration mode to generic code', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.getByTestId('email-input').locator('input').fill('luke@rebels.com')
    await page.getByTestId('password-input').locator('input').fill('changeme')
    await page.getByTestId('login-submit-button').click()
    
    await page.waitForURL('/dashboard')
    
    // Navigate to events page
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    
    // Click on first event
    const firstEventCard = page.locator('text=Spring Unconference 2025').first()
    await firstEventCard.click()
    
    await page.waitForURL(/\/events\/event-/)
    
    // Edit event configuration
    const editButton = page.locator('text=Event Configuration').locator('..').locator('button:has-text("Edit")')
    await expect(editButton).toBeVisible({ timeout: 10000 })
    await editButton.click()
    
    // Select "Event Generic Code" radio option
    const genericCodeRadio = page.locator('input[type="radio"][value="generic-code"]')
    await genericCodeRadio.check()
    
    // Save changes
    const saveButton = page.locator('button:has-text("Save Changes")')
    await saveButton.click()
    
    // Wait for success message
    await expect(page.locator('text=Event updated successfully')).toBeVisible({ timeout: 10000 })
    
    // Verify that the Generic Invitation Code section appears
    await expect(page.locator('text=Generic Invitation Code')).toBeVisible({ timeout: 10000 })
  })

  test('should allow admin to generate generic invitation code', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.getByTestId('email-input').locator('input').fill('luke@rebels.com')
    await page.getByTestId('password-input').locator('input').fill('changeme')
    await page.getByTestId('login-submit-button').click()
    
    await page.waitForURL('/dashboard')
    
    // Navigate to events page
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    
    // Click on first event
    const firstEventCard = page.locator('text=Spring Unconference 2025').first()
    await firstEventCard.click()
    
    await page.waitForURL(/\/events\/event-/)
    
    // First, set registration mode to generic-code
    const editButton = page.locator('text=Event Configuration').locator('..').locator('button:has-text("Edit")')
    await expect(editButton).toBeVisible({ timeout: 10000 })
    await editButton.click()
    
    const genericCodeRadio = page.locator('input[type="radio"][value="generic-code"]')
    await genericCodeRadio.check()
    
    const saveButton = page.locator('button:has-text("Save Changes")')
    await saveButton.click()
    
    await expect(page.locator('text=Event updated successfully')).toBeVisible({ timeout: 10000 })
    
    // Wait for the Generic Invitation Code section to appear
    await expect(page.locator('text=Generic Invitation Code')).toBeVisible({ timeout: 10000 })
    
    // Click "Generate Generic Code" button
    const generateButton = page.locator('button:has-text("Generate Generic Code")')
    await generateButton.click()
    
    // Wait for code to be generated (look for the text field with the code)
    await expect(page.locator('label:has-text("Generic Invitation Code")')).toBeVisible({ timeout: 10000 })
    
    // Verify a code value is present in the text field
    const codeField = page.locator('input[readonly]').first()
    const codeValue = await codeField.inputValue()
    expect(codeValue).toBeTruthy()
    expect(codeValue.length).toBeGreaterThan(0)
  })

  test('should show personal code generation option when mode is personal-code', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.getByTestId('email-input').locator('input').fill('luke@rebels.com')
    await page.getByTestId('password-input').locator('input').fill('changeme')
    await page.getByTestId('login-submit-button').click()
    
    await page.waitForURL('/dashboard')
    
    // Navigate to events page
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    
    // Click on first event
    const firstEventCard = page.locator('text=Spring Unconference 2025').first()
    await firstEventCard.click()
    
    await page.waitForURL(/\/events\/event-/)
    
    // Set registration mode to personal-code
    const editButton = page.locator('text=Event Configuration').locator('..').locator('button:has-text("Edit")')
    await expect(editButton).toBeVisible({ timeout: 10000 })
    await editButton.click()
    
    const personalCodeRadio = page.locator('input[type="radio"][value="personal-code"]')
    await personalCodeRadio.check()
    
    const saveButton = page.locator('button:has-text("Save Changes")')
    await saveButton.click()
    
    await expect(page.locator('text=Event updated successfully')).toBeVisible({ timeout: 10000 })
    
    // Scroll to invitations section
    await page.locator('text=Invitations').scrollIntoViewIfNeeded()
    
    // Verify the button text changes to "Generate Personal Codes"
    await expect(page.locator('button:has-text("Generate Personal Codes")')).toBeVisible({ timeout: 10000 })
  })
})
