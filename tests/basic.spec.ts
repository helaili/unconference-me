import { test, expect } from '@playwright/test';

test.describe('Basic functionality', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/Welcome/); // Adjust based on your actual title
    
    // Check for some basic content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to login (you might need to click a login link if available)
    await page.goto('/login');
    
    // Verify we're on the login page
    await expect(page).toHaveURL('/login');
    await expect(page.getByTestId('email-input')).toBeVisible();
  });
});