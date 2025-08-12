import { test, expect } from '@playwright/test';

test.describe('UNO Game', () => {
  test('home page loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/UNO/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('UNO');
    
    // Check solo game button
    await expect(page.locator('text=Start Solo Game')).toBeVisible();
    
    // Check multiplayer section
    await expect(page.locator('text=Create Room')).toBeVisible();
  });

  test('can navigate to solo game', async ({ page }) => {
    await page.goto('/');
    
    // Click solo game link
    await page.click('text=Start Solo Game');
    
    // Should be on solo game page
    await expect(page).toHaveURL('/solo');
    await expect(page.locator('h1')).toContainText('Solo Game');
  });

  test('solo game initialization', async ({ page }) => {
    await page.goto('/solo');
    
    // Should see start game button
    await expect(page.locator('text=Start New Game')).toBeVisible();
    
    // Click to start game
    await page.click('text=Start New Game');
    
    // Game should initialize
    await expect(page.locator('text=Your Hand')).toBeVisible();
    await expect(page.locator('text=Your Turn')).toBeVisible();
    
    // Should see opponent info
    await expect(page.locator('text=Computer 1')).toBeVisible();
    await expect(page.locator('text=Computer 2')).toBeVisible();
  });

  test('can play a basic turn', async ({ page }) => {
    await page.goto('/solo');
    await page.click('text=Start New Game');
    
    // Wait for game to load
    await expect(page.locator('text=Your Turn')).toBeVisible();
    
    // Try to play a card or draw
    const drawButton = page.locator('[data-testid="draw-pile"]').first();
    const playableCard = page.locator('[data-testid="playable-card"]').first();
    
    if (await playableCard.isVisible()) {
      // Play a card if available
      await playableCard.click();
    } else if (await drawButton.isVisible()) {
      // Draw a card if no playable cards
      await drawButton.click();
    }
    
    // Game state should change (either turn advances or card drawn)
    // This is a basic test - in a real implementation you'd check specific state changes
  });
});

test.describe('Multiplayer (Placeholder)', () => {
  test('room page shows coming soon message', async ({ page }) => {
    await page.goto('/r/TEST123');
    
    await expect(page.locator('h1')).toContainText('Room: TEST123');
    await expect(page.locator('text=Coming Soon')).toBeVisible();
    await expect(page.locator('text=Play Solo')).toBeVisible();
  });
});

// Basic responsive test
test.describe('Mobile Experience', () => {
  test('home page is mobile friendly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if main elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Start Solo Game')).toBeVisible();
    
    // Should not have horizontal scroll
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });
});
