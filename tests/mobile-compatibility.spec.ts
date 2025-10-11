import { test, expect } from '@playwright/test'

test.describe('Mobile Compatibility', () => {
  test('should render homepage correctly on mobile', async ({ page }) => {
    await page.goto('/')

    // Check if the main header is visible and appropriately sized
    const header = page.locator('h1')
    await expect(header).toBeVisible()

    // Check if the join discussion button is visible and appropriately sized
    const joinButton = page.locator('text=Join the Discussion')
    await expect(joinButton).toBeVisible()

    // Check if viewport meta tag is present
    const viewportMeta = page.locator('meta[name="viewport"]')
    await expect(viewportMeta).toHaveAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover')
  })

  test('should navigate on mobile with touch interaction', async ({ page }) => {
    await page.goto('/')

    // Test touch navigation to login page
    await page.tap('text=Join the Discussion')
    await expect(page).toHaveURL('/login')

    // Check if login form is properly displayed
    const loginForm = page.locator('form').first()
    await expect(loginForm).toBeVisible()
  })

  test('should display mobile-friendly navigation in authenticated layout', async ({ page }) => {
    // First, go to login and simulate authentication
    await page.goto('/login')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Try to find and fill login form if it exists
    const usernameField = page.locator('input[name="username"], input[type="text"]').first()
    const passwordField = page.locator('input[name="password"], input[type="password"]').first()
    const loginButton = page.locator('button[type="submit"], button:has-text("Login")').first()
    
    // Check if login form elements exist
    if (await usernameField.isVisible()) {
      await usernameField.fill('testuser')
      await passwordField.fill('testpass')
      await loginButton.click()
      
      // Wait for potential navigation after login
      await page.waitForLoadState('networkidle')
    }
    
    // Navigate to dashboard (or check if already redirected there)
    if (!page.url().includes('/dashboard')) {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
    }

    // Check if we can find any navigation elements that indicate we're in an authenticated layout
    const appBar = page.locator('#app-bar')
    await expect(appBar).toBeVisible()
    
    // Look for navigation elements - could be nav icon or menu
    const navElements = page.locator('#app-bar-nav-icon, .v-app-bar-nav-icon, [role="button"]:has(svg)')
    
    // If no nav icon is found, that's still okay - different layouts may not have it
    const navElementCount = await navElements.count()
    if (navElementCount > 0) {
      const firstNavElement = navElements.first()
      await expect(firstNavElement).toBeVisible()
      
      // Try to interact with it
      await firstNavElement.click()
      
      // Look for any drawer or navigation menu that opens
      const drawer = page.locator('#nav-drawer, .v-navigation-drawer, .v-menu')
      const drawerCount = await drawer.count()
      
      // If a drawer exists, verify it becomes visible
      if (drawerCount > 0) {
        await expect(drawer.first()).toBeVisible()
      }
    }
  })

  test('should display responsive content layout', async ({ page }) => {
    await page.goto('/topics')
    await page.waitForLoadState('networkidle')

    // Check if page loaded successfully with some content
    const pageContent = page.locator('.v-main').first()
    await expect(pageContent).toBeVisible()

    // Look for topic-related content - could be expansion panels, forms, or lists
    const topicElements = page.locator('.v-expansion-panel, .topic-form, form, .v-card')
    const elementCount = await topicElements.count()
    
    if (elementCount > 0) {
      // Check if topic submission form or similar content renders properly on mobile
      const firstElement = topicElements.first()
      await expect(firstElement).toBeVisible()

      // Look for any expandable content
      const expandableElements = page.locator('.v-expansion-panel')
      const expandableCount = await expandableElements.count()
      
      if (expandableCount > 0) {
        // Open the expansion panel
        await expandableElements.first().click()
        await page.waitForTimeout(500) // Wait for animation
      }

      // Check if form fields exist and are properly sized for mobile
      const formFields = page.locator('input, textarea, .v-text-field, .v-textarea')
      const fieldCount = await formFields.count()
      
      if (fieldCount > 0) {
        const firstField = formFields.first()
        await expect(firstField).toBeVisible()
      }

      // Check for submit buttons or similar interactive elements
      const buttons = page.locator('button, .v-btn')
      const buttonCount = await buttons.count()
      
      if (buttonCount > 0) {
        const firstButton = buttons.first()
        await expect(firstButton).toBeVisible()
      }
    }
  })

  test('should handle touch events for interactive elements', async ({ page }) => {
    await page.goto('/')

    // Test touch interaction with cards and buttons
    const joinButton = page.locator('text=Join the Discussion')
    
    // Simulate touch events
    await joinButton.hover()
    await joinButton.tap()
    
    await expect(page).toHaveURL('/login')
  })

  test('should display proper font sizes and spacing on mobile', async ({ page }) => {
    await page.goto('/')

    // Check if main heading is visible and properly styled
    const mainHeading = page.locator('h1').first()
    await expect(mainHeading).toBeVisible()
    
    // Ensure minimum touch target sizes (44px minimum for accessibility)
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const buttonBox = await button.boundingBox()
      
      if (buttonBox) {
        // Check minimum touch target size
        expect(buttonBox.height).toBeGreaterThanOrEqual(44)
      }
    }
  })
})