import { expect, test } from '@playwright/test';

test.describe('Runtime Smoke', () => {
  test('runs traced question snippets from the question page', async ({ page }) => {
    await page.goto('/en/questions/2');

    await expect(page.getByRole('heading', { name: "What's the output?" }).first()).toBeVisible();

    await page.getByRole('button', { name: /3 3 3.*0 1 2/i }).click();

    const terminal = page.getByTestId('question-terminal');
    await expect(terminal).toContainText('3');
    await expect(terminal).toContainText('0');
    await expect(terminal).toContainText('1');
    await expect(terminal).toContainText('2');
    await expect(page.getByTestId('question-run-code')).toBeEnabled();

    await expect(page.getByRole('button', { name: 'Event Loop Replay' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Visual Debugger' })).toBeVisible();
  });

  test('runs scratchpad snippets with the unified runtime', async ({ page }) => {
    await page.goto('/en');

    await page.getByTestId('open-scratchpad').click();
    await expect(page.getByTestId('scratchpad-sheet')).toBeVisible();

    const editorTextarea = page.getByTestId('scratchpad-editor').locator('textarea').first();
    await editorTextarea.click();
    await page.keyboard.insertText('console.log("pw-runtime-ok")');

    await page.getByTestId('scratchpad-run-code').click();
    await expect(page.getByTestId('scratchpad-terminal')).toContainText('pw-runtime-ok');
  });
});
