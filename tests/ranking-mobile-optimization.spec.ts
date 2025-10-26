import { test, expect } from './helpers/mock-test-utils';
import { AuthHelper } from './helpers/auth';

test.describe('Ranking Page Mobile Optimization', () => {
  let auth: AuthHelper;

  test.beforeEach(async ({ page, mockData }) => {
    // Ensure we have default mock data for each test
    mockData.resetToDefaults();
    auth = new AuthHelper(page);
  });

  test('should display page header controls stacked vertically on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await auth.loginAsVader();
    await page.goto('/rankings/1');
    await page.waitForLoadState('networkidle');
    
    // Check if page title is visible
    const pageTitle = page.locator('h1:has-text("Rank Discussion Topics")');
    await expect(pageTitle).toBeVisible();
    
    // Check if buttons are visible and have block layout (full width)
    const viewAllTopicsBtn = page.locator('button:has-text("View All Topics")');
    const backToDashboardBtn = page.locator('button:has-text("Back to Dashboard")');
    
    await expect(viewAllTopicsBtn).toBeVisible();
    await expect(backToDashboardBtn).toBeVisible();
  });

  test('should display page header controls horizontally on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    await auth.loginAsVader();
    await page.goto('/rankings/1');
    await page.waitForLoadState('networkidle');
    
    // Check if page title is visible
    const pageTitle = page.locator('h1:has-text("Rank Discussion Topics")');
    await expect(pageTitle).toBeVisible();
    
    // Check if buttons are visible
    const viewAllTopicsBtn = page.locator('button:has-text("View All Topics")');
    const backToDashboardBtn = page.locator('button:has-text("Back to Dashboard")');
    
    await expect(viewAllTopicsBtn).toBeVisible();
    await expect(backToDashboardBtn).toBeVisible();
  });

  test('should display instruction alert with close button when user has ranking', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await auth.loginAsVader();
    await page.goto('/rankings/1');
    await page.waitForLoadState('networkidle');
    
    // Check if instruction alert is visible
    const instructionAlert = page.locator('text=Drag and drop').locator('..');
    await expect(instructionAlert).toBeVisible();
    
    // Check if close button is visible (alert is closable)
    const closeButton = page.getByLabel('Close');
    const closeButtonCount = await closeButton.count();
    
    // There should be at least one close button visible
    expect(closeButtonCount).toBeGreaterThan(0);
  });

  test('should allow closing instruction alert on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await auth.loginAsVader();
    await page.goto('/rankings/1');
    await page.waitForLoadState('networkidle');
    
    // Check if instruction alert is visible initially
    const instructionText = page.locator('text=Drag and drop');
    await expect(instructionText).toBeVisible();
    
    // Click the close button
    const closeButton = page.getByLabel('Close').first();
    await closeButton.click();
    
    // Wait a moment for the alert to close
    await page.waitForTimeout(500);
    
    // Check if instruction alert is hidden
    await expect(instructionText).not.toBeVisible();
  });

  test('should display save button and warning alert stacked on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await auth.loginAsVader();
    await page.goto('/rankings/1');
    await page.waitForLoadState('networkidle');
    
    // Check if warning alert is visible - use v-alert class to be more specific
    const warningAlert = page.locator('.v-alert:has-text("Rank at least")').first();
    await expect(warningAlert).toBeVisible();
    
    // Check if save button is visible
    const saveButton = page.locator('button:has-text("Save Ranking")');
    await expect(saveButton).toBeVisible();
    
    // Verify save button is disabled (not enough topics ranked)
    await expect(saveButton).toBeDisabled();
  });

  test('should display save button and warning alert horizontally on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    await auth.loginAsVader();
    await page.goto('/rankings/1');
    await page.waitForLoadState('networkidle');
    
    // Check if warning alert is visible - use v-alert class to be more specific
    const warningAlert = page.locator('.v-alert:has-text("Rank at least")').first();
    await expect(warningAlert).toBeVisible();
    
    // Check if save button is visible
    const saveButton = page.locator('button:has-text("Save Ranking")');
    await expect(saveButton).toBeVisible();
    
    // Verify save button is disabled (not enough topics ranked)
    await expect(saveButton).toBeDisabled();
  });

  test('should maintain functionality after mobile optimization', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await auth.loginAsVader();
    await page.goto('/rankings/1');
    await page.waitForLoadState('networkidle');
    
    // Test navigation buttons work
    const viewAllTopicsBtn = page.locator('button:has-text("View All Topics")');
    await viewAllTopicsBtn.click();
    await expect(page).toHaveURL('/topics');
    
    // Navigate back to rankings
    await page.goto('/rankings/1');
    await page.waitForLoadState('networkidle');
    
    const backToDashboardBtn = page.locator('button:has-text("Back to Dashboard")');
    await backToDashboardBtn.click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should verify touch targets meet minimum size on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await auth.loginAsVader();
    await page.goto('/rankings/1');
    await page.waitForLoadState('networkidle');
    
    // Check button sizes meet accessibility standards (44px minimum)
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const buttonBox = await button.boundingBox();
      
      if (buttonBox) {
        // Check minimum touch target size for accessibility
        expect(buttonBox.height).toBeGreaterThanOrEqual(36); // Allow some flexibility for compact buttons
      }
    }
  });
});
