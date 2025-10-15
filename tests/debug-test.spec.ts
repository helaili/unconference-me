import { test, expect } from './helpers/mock-test-utils'
import { AuthHelper } from './helpers/auth'

test('debug event status', async ({ page, mockData }) => {
  mockData.resetToDefaults()
  const auth = new AuthHelper(page)
  
  // Login as Luke (admin user)
  await auth.loginAsLuke()
  
  // Wait for redirect to dashboard
  await expect(page).toHaveURL('/dashboard')
  
  // Wait a bit for components to load
  await page.waitForTimeout(5000)
  
  // Take a screenshot to see what's rendered
  await page.screenshot({ path: 'debug-dashboard.png', fullPage: true })
  
  // Check what text is actually on the page
  const pageText = await page.textContent('body')
  console.log('Page content:', pageText)
  
  // Look for any status-related elements
  const statusElements = await page.locator('*:has-text("ACTIVE")').all()
  console.log('Found ACTIVE elements:', statusElements.length)
  
  // Check if event status component exists
  const eventStatusExists = await page.locator('text=Event Status').isVisible()
  console.log('Event Status component exists:', eventStatusExists)
  
  // Check if event name exists
  const eventNameExists = await page.getByText('Universe User Group 2025').isVisible()
  console.log('Event name exists:', eventNameExists)
  
  // Also check for the chip element specifically
  const chipExists = await page.locator('v-chip').isVisible()
  console.log('V-chip exists:', chipExists)
  
  // Check for lowercase active
  const activeExists = await page.locator('*:has-text("active")').isVisible()
  console.log('Lowercase active exists:', activeExists)
})