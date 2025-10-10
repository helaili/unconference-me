import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/login', { waitUntil: 'networkidle' });
  });

  test('should display login form', async ({ page }) => {
    // Check that the login form is visible
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('login-submit-button')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit without filling fields
    // Submit button should be disabled when fields are empty
    await expect(page.getByTestId('login-submit-button')).toBeDisabled();
    
    // Check for validation messages (Vuetify shows these as helper text)
    await page.getByTestId('email-input').locator('input').click();
    await page.getByTestId('email-input').locator('input').blur();
    await page.getByTestId('password-input').locator('input').click();
    await page.getByTestId('password-input').locator('input').blur();
    
    // click outside to ensure Vuetify validations render helper text
    await page.click('body');
    
    await expect(page.locator('text=Please log in')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // Enter invalid email
    await page.getByTestId('email-input').locator('input').fill('invalid-email');
    await page.getByTestId('password-input').locator('input').fill('somepassword');
    
    // Click outside to trigger validation
    await page.click('body');
    
    // Check for email validation message
    await expect(page.locator('text=E-mail must be valid')).toBeVisible();
    
    // Submit button should be disabled
    await expect(page.getByTestId('login-submit-button')).toBeDisabled();
  });

  test('should show validation error for short password', async ({ page }) => {
    // Enter valid email but short password
    await page.getByTestId('email-input').locator('input').fill('test@example.com');
    await page.getByTestId('password-input').locator('input').fill('123');
    
    // Click outside to trigger validation
    await page.click('body');
    
    // Check for password validation message
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    
    // Submit button should be disabled
    await expect(page.getByTestId('login-submit-button')).toBeDisabled();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill with invalid credentials - email that doesn't exist in users array
    await page.getByTestId('email-input').locator('input').fill('nonexistent@test.com');
    await page.getByTestId('password-input').locator('input').fill('wrongpass123');
    
    // Submit the form
    await page.getByTestId('login-submit-button').click();
    
    // Wait for network request to complete
    const response = await page.waitForResponse(response => response.url().includes('/api/auth/login'));
    console.log('Login response status:', response.status());
    
    // Wait a bit more for the error handling to complete
    await page.waitForTimeout(1000);
    
    // Check if the error alert is visible
    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 10000 });
    
    // The error message can be either "Invalid credentials" or "Login failed"
    await expect(page.getByTestId('login-error')).toContainText(/Invalid credentials|Login failed/);
  });

  test('should successfully login with valid credentials (Luke Skywalker)', async ({ page }) => {
    // Fill with valid credentials for Luke
    await page.getByTestId('email-input').locator('input').fill('luke@rebels.com');
    await page.getByTestId('password-input').locator('input').fill('changeme');
    
    // Submit the form
    await page.getByTestId('login-submit-button').click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Check that we're actually logged in by looking for dashboard content
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Welcome, Admin!')).toBeVisible(); // Luke has Admin role
  });

  test('should successfully login with valid credentials (Darth Vader)', async ({ page }) => {
    // Fill with valid credentials for Vader
    await page.getByTestId('email-input').locator('input').fill('darth@empire.com');
    await page.getByTestId('password-input').locator('input').fill('changeme');
    
    // Submit the form
    await page.getByTestId('login-submit-button').click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Check that we're actually logged in by looking for dashboard content
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Welcome, User!')).toBeVisible(); // Vader has User role
  });

  test('should maintain session after login', async ({ page }) => {
    // Login first
    await page.getByTestId('email-input').locator('input').fill('luke@rebels.com');
    await page.getByTestId('password-input').locator('input').fill('changeme');
    await page.getByTestId('login-submit-button').click();
    
    // Wait for redirect
    await expect(page).toHaveURL('/dashboard', { timeout: 20000 });
    
    // Navigate to another page and back to verify session persistence
    await page.goto('/');
    
    // If we try to go to a protected route, we should still be logged in
    // and not redirected to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Welcome, Admin!')).toBeVisible();
  });

  test('should redirect unauthenticated users from protected pages', async ({ page }) => {
    // Try to navigate directly to dashboard without logging in
    await page.goto('/dashboard');
    
    // Should be redirected to login page
    await expect(page).toHaveURL('/login');
  });
});