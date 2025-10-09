import { type Page, expect } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  async loginAs(email: string, password: string) {
    await this.page.goto('/login', { waitUntil: 'networkidle' });
    await this.page.getByTestId('email-input').locator('input').fill(email);
    await this.page.getByTestId('password-input').locator('input').fill(password);
    try {
      // Wait for the button to be enabled before clicking
      await expect(this.page.getByTestId('login-submit-button')).toBeEnabled({ timeout: 5000 });
      // Click the button, but handle potential timeout errors gracefully
      await this.page.getByTestId('login-submit-button').click();
    } catch (err: unknown) {
      // If the click failed due to a timeout, quietly continue; rethrow other errors.
      if (!(err instanceof Error && err.message.includes('Timeout'))) throw err;
    }
  }

  async loginAsLuke() {
    await this.loginAs('luke@rebels.com', 'changeme');
    await expect(this.page).toHaveURL('/dashboard');
    await expect(this.page.locator('text=Welcome, Admin!')).toBeVisible();
  }

  async loginAsVader() {
    await this.loginAs('darth@empire.com', 'changeme');
    await expect(this.page).toHaveURL('/dashboard');
    await expect(this.page.locator('text=Welcome, User!')).toBeVisible();
  }

  async expectToBeOnLoginPage() {
    await expect(this.page).toHaveURL('/login');
    await expect(this.page.getByTestId('email-input')).toBeVisible();
  }

  async expectToBeOnDashboard() {
    await expect(this.page).toHaveURL('/dashboard');
    await expect(this.page.locator('h1')).toContainText('Dashboard');
  }

  async expectLoginError(expectedMessage?: string) {
    // Wait for the error alert to appear
    await expect(this.page.getByTestId('login-error')).toBeVisible({ timeout: 10000 });
    
    // If a specific message is provided, check for it
    if (expectedMessage) {
      await expect(this.page.getByTestId('login-error')).toContainText(expectedMessage);
    }
  }

  async expectPasswordValidationError(expectedMessage?: string) {
    // Wait for the error alert to appear
    await expect(this.page.locator(`text=${expectedMessage}`)).toBeVisible();
  }

  async loginWithInvalidCredentials(email: string = 'invalid@example.com', password: string = 'wrongpassword') {
    await this.loginAs(email, password);
    if (password.length < 8) {
      await this.expectPasswordValidationError('Password must be at least 8 characters');
    } else {
      await this.expectLoginError('Invalid credentials');
    }
  }
}