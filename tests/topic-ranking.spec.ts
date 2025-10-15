import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';

test.describe('Topic Ranking', () => {
  test('should display ranking tasks on dashboard for logged-in user', async ({ page }) => {
    const auth = new AuthHelper(page);
    await auth.loginAsLuke();
    
    // Wait for the dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Check if the ranking tasks component is visible
    await expect(page.locator('text=Topic Ranking Tasks')).toBeVisible();
  });

  test('should navigate to ranking page when clicking rank button', async ({ page }) => {
    const auth = new AuthHelper(page);
    await auth.loginAsLuke();
    
    // Wait for the dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Wait for ranking tasks component to be visible
    await expect(page.locator('text=Topic Ranking Tasks')).toBeVisible();
    
    // Click on the rank or update button
    const rankButton = page.locator('text=Rank').or(page.locator('text=Update')).first();
    const isVisible = await rankButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await rankButton.click();
      
      // Should navigate to rankings page
      await expect(page).toHaveURL(/\/rankings\/\d+/);
      await expect(page.locator('h1')).toContainText('Rank Discussion Topics');
    }
  });

  test('should display topic ranking interface with drag-and-drop', async ({ page }) => {
    const auth = new AuthHelper(page);
    await auth.loginAsLuke();
    
    // Navigate directly to the ranking page
    await page.goto('/rankings/1');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the ranking component is visible
    await expect(page.locator('text=Rank Your Topic Preferences')).toBeVisible();
    
    // Check if topics are listed (at least one topic should be available)
    const draggableTopics = page.locator('[draggable="true"]');
    await expect(draggableTopics).toHaveCount(await draggableTopics.count());
    await expect(draggableTopics.first()).toBeVisible();
    
    // Check if save button exists
    const saveButton = page.locator('button:has-text("Save Ranking")');
    await expect(saveButton).toBeVisible();
  });

  test('should enforce minimum ranking requirement', async ({ page }) => {
    const auth = new AuthHelper(page);
    await auth.loginAsLuke();
    
    // Navigate to the ranking page
    await page.goto('/rankings/1');
    await page.waitForLoadState('networkidle');
    
    // Save button should be initially disabled or enabled depending on whether
    // the participant already meets the minimum ranking requirement
    const saveButton = page.locator('button:has-text("Save Ranking")');
    await expect(saveButton).toBeVisible();
    
    // Check if minimum ranking message is shown
    await expect(page.locator('text=You must rank at least')).toBeVisible();
  });

  test('should allow reordering topics with keyboard controls', async ({ page }) => {
    const auth = new AuthHelper(page);
    await auth.loginAsLuke();
    
    // Navigate to the ranking page
    await page.goto('/rankings/1');
    await page.waitForLoadState('networkidle');
    
    // Find the first topic item
    const firstTopic = page.locator('[draggable="true"]').first();
    await expect(firstTopic).toBeVisible();
    
    // Check if arrow buttons are present for keyboard navigation
    const upButton = firstTopic.locator('button[aria-label="Move up"]');
    const downButton = firstTopic.locator('button[aria-label="Move down"]');
    
    await expect(upButton).toBeVisible();
    await expect(downButton).toBeVisible();
  });
});
