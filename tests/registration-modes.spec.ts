import { test, expect } from './helpers/isolated-test-utils'
import { AuthHelper } from './helpers/auth'

// Constants
const TEST_EVENT_NAME = 'Spring Unconference 2025'

// Helper functions
async function navigateToFirstEventManagement(page: any, eventName: string = TEST_EVENT_NAME) {
  await page.goto('/events')
  await page.waitForLoadState('networkidle')
  
  const firstEventCard = page.locator(`text=${eventName}`).first()
  await firstEventCard.click()
  
  await page.waitForURL(/\/events\/event-/)
}

async function clickEditEventConfiguration(page: any) {
  const editButton = page.locator('text=Event Configuration').locator('..').locator('button:has-text("Edit")')
  await expect(editButton).toBeVisible({ timeout: 10000 })
  await editButton.click()
}

async function saveEventConfiguration(page: any) {
  const saveButton = page.locator('button:has-text("Save Changes")')
  await saveButton.click()
  await expect(page.locator('text=Event updated successfully')).toBeVisible({ timeout: 10000 })
}

test.describe('Registration Mode Management', () => {
  let auth: AuthHelper

  test.beforeEach(async ({ page }) => {
    // Initialize auth helper
    auth = new AuthHelper(page)
    
    // Login as admin
    await auth.loginAsLuke()
  })

  test('should allow admin to configure registration mode to open', async ({ page }) => {
    await navigateToFirstEventManagement(page)
    
    // Edit event configuration
    await clickEditEventConfiguration(page)
    
    // Select "Open Registration" radio option
    const openRadio = page.locator('input[type="radio"][value="open"]')
    await openRadio.check()
    
    // Save changes
    await saveEventConfiguration(page)
  })

  test('should allow admin to configure registration mode to personal code', async ({ page }) => {
    await navigateToFirstEventManagement(page)
    
    // Edit event configuration
    await clickEditEventConfiguration(page)
    
    // Select "Personal Invitation Code" radio option
    const personalCodeRadio = page.locator('input[type="radio"][value="personal-code"]')
    await personalCodeRadio.check()
    
    // Save changes
    await saveEventConfiguration(page)
  })

  test('should allow admin to configure registration mode to generic code', async ({ page }) => {
    await navigateToFirstEventManagement(page)
    
    // Edit event configuration
    await clickEditEventConfiguration(page)
    
    // Select "Event Generic Code" radio option
    const genericCodeRadio = page.locator('input[type="radio"][value="generic-code"]')
    await genericCodeRadio.check()
    
    // Save changes
    await saveEventConfiguration(page)
    
    // Verify that the Generic Invitation Code section appears
    await expect(page.locator('text=Generic Invitation Code')).toBeVisible({ timeout: 10000 })
  })

  test('should allow admin to generate generic invitation code', async ({ page }) => {
    await navigateToFirstEventManagement(page)
    
    // First, set registration mode to generic-code
    await clickEditEventConfiguration(page)
    
    const genericCodeRadio = page.locator('input[type="radio"][value="generic-code"]')
    await genericCodeRadio.check()
    
    await saveEventConfiguration(page)
    
    // Wait for the Generic Invitation Code section to appear
    await expect(page.locator('text=Generic Invitation Code')).toBeVisible({ timeout: 10000 })
    
    // Click "Generate Generic Code" button
    const generateButton = page.locator('button:has-text("Generate Generic Code")')
    await generateButton.click()
    
    // Wait for code to be generated (look for the text field with the code)
    await expect(page.locator('label:has-text("Generic Invitation Code")')).toBeVisible({ timeout: 10000 })
    
    // Verify a code value is present by checking the readonly input with specific label
    const codeFieldContainer = page.locator('label:has-text("Generic Invitation Code")').locator('..')
    const codeField = codeFieldContainer.locator('input[readonly]')
    const codeValue = await codeField.inputValue()
    expect(codeValue).toBeTruthy()
    expect(codeValue.length).toBeGreaterThan(0)
  })

  test('should show personal code generation option when mode is personal-code', async ({ page }) => {
    await navigateToFirstEventManagement(page)
    
    // Set registration mode to personal-code
    await clickEditEventConfiguration(page)
    
    const personalCodeRadio = page.locator('input[type="radio"][value="personal-code"]')
    await personalCodeRadio.check()
    
    await saveEventConfiguration(page)
    
    // Scroll to invitations section
    await page.locator('text=Invitations').scrollIntoViewIfNeeded()
    
    // Verify the button text changes to "Generate Personal Codes"
    await expect(page.locator('button:has-text("Generate Personal Codes")')).toBeVisible({ timeout: 10000 })
  })
})
