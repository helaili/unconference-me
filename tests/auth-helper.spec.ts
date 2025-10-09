import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';

test.describe('Authentication with Helper', () => {
  let auth: AuthHelper;

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page);
  });

  test('should login as Luke (Admin) using helper', async ({ page }) => {
    await auth.loginAsLuke();
    
    // Verify admin-specific content
    await expect(page.locator('text=You have full access to the dashboard features')).toBeVisible();
  });

  test('should login as Vader (User) using helper', async ({ page }) => {
    await auth.loginAsVader();
    
    // Verify user-specific content
    await expect(page.locator('text=You have limited access to the dashboard features')).toBeVisible();
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');
    await auth.expectToBeOnLoginPage();
  });

  test('should show error alert for invalid credentials using helper', async ({ page: _page }) => {
    await auth.loginWithInvalidCredentials();
    
    // Should still be on login page
    await auth.expectToBeOnLoginPage();
  });

  test('should show specific error message for login failure', async ({ page: _page }) => {
    await auth.loginWithInvalidCredentials('nonexistent@test.com', 'badpassword');
    await auth.expectLoginError('Invalid credentials');
  });

  test('should show specific error message for login failure with short password', async ({ page: _page }) => {
    await auth.loginWithInvalidCredentials('nonexistent@test.com', 'badpass');
    await auth.expectLoginError('Too small: expected string to have >=8 characters');
  });
});