import { test, expect } from '@playwright/test';

test.describe('Multiplayer Functionality', () => {
  test('multiplayer page loads and connects to server', async ({ page }) => {
    // Go to multiplayer page
    await page.goto('/multiplayer');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('SpellStack Multiplayer');
    
    // Wait for connection status to appear
    await page.waitForSelector('[data-testid="connection-status"]', { timeout: 5000 });
    
    // Should show connected status
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected to server');
  });

  test('can create a room', async ({ page }) => {
    await page.goto('/multiplayer');
    
    // Wait for connection
    await page.waitForSelector('[data-testid="connection-status"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected to server');
    
    // Fill in player name
    await page.fill('input[placeholder="Enter your name"]', 'TestPlayer');
    
    // Click create room button
    await page.click('button:has-text("Create New Room")');
    
    // Should navigate to room page
    await page.waitForURL(/\/r\/[A-Z0-9]+/, { timeout: 10000 });
    
    // Should be in a room
    await expect(page.locator('h1')).toContainText('Room');
  });
});
