import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';

test.describe('Admin Dashboard', () => {
  let auth: AuthHelper;

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page);
  });

  test('should display event configuration for admin users', async ({ page }) => {
    // Login as admin (Luke)
    await auth.loginAsLuke();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Check for Event Status component
    await expect(page.locator('text=Event Status')).toBeVisible({ timeout: 10000 });
    
    // Check for Event Configuration component
    await expect(page.locator('text=Event Configuration')).toBeVisible();
    
    // Check for Assignment List component
    await expect(page.locator('text=Current Assignments')).toBeVisible();
  });

  test('should display event details in status component', async ({ page }) => {
    await auth.loginAsLuke();
    await expect(page).toHaveURL('/dashboard');
    
    // Wait for event data to load by checking for the event name
    await expect(page.getByText('Universe User Group 2025').first()).toBeVisible({ timeout: 10000 });
    
    // Check for event status
    await expect(page.locator('text=ACTIVE')).toBeVisible();
  });

  test('should allow admin to edit event configuration', async ({ page }) => {
    await auth.loginAsLuke();
    await expect(page).toHaveURL('/dashboard');
    
    // Wait for Event Configuration to load
    await expect(page.locator('text=Event Configuration')).toBeVisible({ timeout: 10000 });
    
    // Find and click the Edit button in Event Configuration
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    
    // Configuration fields should now be editable
    const numberOfRoundsField = page.locator('input[type="number"]').first();
    await expect(numberOfRoundsField).toBeVisible();
    await expect(numberOfRoundsField).toBeEditable();
  });

  test('should display participant statistics', async ({ page }) => {
    await auth.loginAsLuke();
    await expect(page).toHaveURL('/dashboard');
    
    // Wait for participant statistics to load
    await expect(page.locator('text=Participant Statistics')).toBeVisible({ timeout: 10000 });
    
    // Check for stat cards using more specific locators within the statistics section
    const statisticsSection = page.locator('h3:has-text("Participant Statistics")').locator('..')
    await expect(statisticsSection.locator('.text-caption', { hasText: 'Total' })).toBeVisible();
    await expect(statisticsSection.locator('.text-caption', { hasText: 'Registered' })).toBeVisible();
    await expect(statisticsSection.locator('.text-caption', { hasText: 'Confirmed' })).toBeVisible();
    await expect(statisticsSection.locator('.text-caption', { hasText: 'Checked In' })).toBeVisible();
  });

  test('should display assignments grouped by round', async ({ page }) => {
    await auth.loginAsLuke();
    await expect(page).toHaveURL('/dashboard');
    
    // Wait for assignments to load
    await expect(page.locator('text=Current Assignments')).toBeVisible({ timeout: 10000 });
    
    // Assignments should be grouped by round
    await expect(page.locator('text=Round 1')).toBeVisible();
  });

  test('should not show admin dashboard features for non-admin users', async ({ page }) => {
    // Login as non-admin (Vader)
    await auth.loginAsVader();
    
    await expect(page).toHaveURL('/dashboard');
    
    // Should see the user welcome message
    await expect(page.locator('text=Welcome, User!')).toBeVisible();
    
    // Should NOT see admin-specific components
    await expect(page.locator('text=Event Configuration')).not.toBeVisible();
    await expect(page.locator('text=Event Status')).not.toBeVisible();
  });

  test('should display event settings page', async ({ page }) => {
    await auth.loginAsLuke();
    
    // Navigate to admin settings
    await page.goto('/adminSettings');
    
    await expect(page).toHaveURL('/adminSettings');
    await expect(page.locator('h1:has-text("Event Settings")')).toBeVisible();
    
    // Wait for event data to load
    await expect(page.locator('text=Event Configuration')).toBeVisible({ timeout: 10000 });
  });

  test('should validate group size constraints', async ({ page }) => {
    await auth.loginAsLuke();
    await page.goto('/adminSettings');
    
    // Wait for Event Configuration to load
    await expect(page.locator('text=Event Configuration')).toBeVisible({ timeout: 10000 });
    
    // Click Edit button
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    
    // Try to set invalid values (min > max)
    // Use label-based selection for better stability
    const minGroupSizeField = page.locator('input[type="number"]').filter({ hasText: /Minimum Group Size/i }).or(
      page.getByLabel('Minimum Group Size', { exact: false })
    ).or(page.locator('input[type="number"]').nth(2));
    const maxGroupSizeField = page.locator('input[type="number"]').filter({ hasText: /Maximum Group Size/i }).or(
      page.getByLabel('Maximum Group Size', { exact: false })
    ).or(page.locator('input[type="number"]').nth(4));
    
    await minGroupSizeField.first().fill('10');
    await maxGroupSizeField.first().fill('5');
    
    // Should show validation error
    await expect(page.locator('text=Please ensure: Min Group Size ≤ Ideal Group Size ≤ Max Group Size')).toBeVisible();
    
    // Save button should be disabled due to validation error
    const saveButton = page.locator('button[type="submit"]:has-text("Save Changes")');
    await expect(saveButton).toBeDisabled();
  });
});

test.describe('Admin Dashboard API Integration', () => {
  let auth: AuthHelper;

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page);
  });

  test('should fetch event data on dashboard load', async ({ page }) => {
    // Set up interceptors BEFORE logging in
    const eventRequest = page.waitForResponse(response => 
      response.url().includes('/api/events/1') && 
      response.status() === 200
    );
    
    await auth.loginAsLuke();
    
    // Verify API was called
    const response = await eventRequest;
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.event).toBeDefined();
  });

  test('should fetch assignments data', async ({ page }) => {
    // Set up interceptors BEFORE logging in
    const assignmentsRequest = page.waitForResponse(response => 
      response.url().includes('/api/events/1/assignments') && 
      response.status() === 200
    );
    
    await auth.loginAsLuke();
    
    // Verify API was called
    const response = await assignmentsRequest;
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.assignments).toBeDefined();
    expect(Array.isArray(data.assignments)).toBe(true);
  });

  test('should fetch participant stats', async ({ page }) => {
    // Set up interceptors BEFORE logging in
    const participantsRequest = page.waitForResponse(response => 
      response.url().includes('/api/events/1/participants') && 
      response.status() === 200
    );
    
    await auth.loginAsLuke();
    
    // Verify API was called
    const response = await participantsRequest;
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.stats).toBeDefined();
    expect(data.stats.total).toBeDefined();
  });
});
