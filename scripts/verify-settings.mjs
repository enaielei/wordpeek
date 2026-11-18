import { _electron, expect } from '@playwright/test';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const output =
  process.env.WORDPEEK_ARTIFACTS || path.join(root, 'test-results');
await mkdir(path.join(root, 'test-results'), { recursive: true });
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(root, 'test-results/settings-'));
await writeFile(
  path.join(profile, 'settings.json'),
  JSON.stringify({ shortcut: 'Control+Alt+Shift+Y', clipboardFallback: false }),
);
const launch = () =>
  _electron.launch({
    args: ['scripts/testing/settings-harness.cjs'],
    cwd: root,
    env: { ...process.env, WORDPEEK_TEST_PROFILE: profile },
  });
let application = await launch();
async function choose(page, label, option) {
  await page.getByRole('combobox', { name: label }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}
try {
  let page = await application.firstWindow();
  await page.getByRole('heading', { name: 'Keep your place.' }).waitFor();
  await application.evaluate(() =>
    globalThis.wordpeekTestMenu.getMenuItemById('settings').click(),
  );
  await expect(
    page.getByRole('heading', { name: 'Settings', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Search engine' }),
  ).toHaveText('Google');
  expect(await page.locator('kbd').allTextContents()).toEqual([
    'Ctrl',
    'Alt',
    'Shift',
    'Y',
  ]);
  await page.getByRole('combobox', { name: 'Appearance' }).click();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('heading', { name: 'Settings', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Appearance' }),
  ).toHaveAttribute('aria-expanded', 'false');
  await choose(page, 'Search engine', 'DuckDuckGo');
  await page.getByRole('button', { name: 'Save Settings' }).click();
  await expect(page.getByRole('status')).toHaveText('Settings saved.');
  await expect
    .poll(() =>
      application.evaluate(
        () =>
          globalThis.wordpeekTestMenu.getMenuItemById('engine-duckduckgo')
            .checked,
      ),
    )
    .toBe(true);
  await application.evaluate(() =>
    globalThis.wordpeekTestMenu.getMenuItemById('engine-bing').click(),
  );
  await expect(
    page.getByRole('combobox', { name: 'Search engine' }),
  ).toHaveText('Bing');
  await application.evaluate(() =>
    globalThis.wordpeekTestMenu.getMenuItemById('clipboard-fallback').click(),
  );
  await expect(page.getByRole('checkbox')).toBeChecked();
  await choose(page, 'Search engine', 'Custom URL…');
  await page
    .getByRole('textbox', { name: 'Custom search URL' })
    .fill('https://example.com/define/{query}?from=wordpeek');
  await expect(
    page.getByText('https://example.com/define/take%20off?from=wordpeek', {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Save Settings' }).click();
  await expect(page.getByRole('status')).toHaveText('Settings saved.');
  await expect
    .poll(() =>
      application.evaluate(
        () =>
          globalThis.wordpeekTestMenu.getMenuItemById('engine-custom').checked,
      ),
    )
    .toBe(true);
  const bounds = await application.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].getBounds(),
  );
  expect(bounds.width).toBe(304);
  await page.setViewportSize({ width: bounds.width, height: bounds.height });
  await page.locator('main').evaluate((element) => {
    element.scrollTop = 0;
  });
  await choose(page, 'Appearance', 'Light');
  await page.getByRole('button', { name: 'Save Settings' }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-appearance',
    'light',
  );
  await page.screenshot({
    path: path.join(output, 'wordpeek-settings-light.png'),
  });
  await choose(page, 'Appearance', 'Dark');
  await page.getByRole('button', { name: 'Save Settings' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-appearance', 'dark');
  expect(
    await page
      .locator('body')
      .evaluate(
        (element) => globalThis.getComputedStyle(element).backgroundColor,
      ),
  ).toBe('rgb(41, 44, 48)');
  await expect
    .poll(() =>
      application.evaluate(
        () =>
          globalThis.wordpeekTestMenu.getMenuItemById('appearance-dark')
            .checked,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: path.join(output, 'wordpeek-settings-dark.png'),
  });
  await page.evaluate(() => globalThis.wordpeek.search('take off'));
  expect(
    await application.evaluate(() => globalThis.wordpeekTestExternal),
  ).toEqual(['https://example.com/define/take%20off?from=wordpeek']);
  const rejected = await page.evaluate(() =>
    globalThis.wordpeek.saveSettings({
      shortcut: 'Control+Alt+Shift+Y',
      clipboardFallback: false,
      appearance: 'dark',
      searchEngine: 'custom',
      customSearchUrl: 'javascript:alert(1)',
    }),
  );
  expect(rejected.ok).toBe(false);
  expect(
    JSON.parse(await readFile(path.join(profile, 'settings.json'), 'utf8'))
      .searchEngine,
  ).toBe('custom');
  await application.close();
  application = await launch();
  page = await application.firstWindow();
  await page.getByRole('heading', { name: 'Keep your place.' }).waitFor();
  expect(
    await page.evaluate(() => globalThis.wordpeek.settings()),
  ).toMatchObject({
    appearance: 'dark',
    searchEngine: 'custom',
    customSearchUrl: 'https://example.com/define/{query}?from=wordpeek',
    clipboardFallback: true,
  });
  await application.evaluate(() =>
    globalThis.wordpeekTestMenu.getMenuItemById('engine-google').click(),
  );
  await expect
    .poll(() =>
      page.evaluate(
        async () => (await globalThis.wordpeek.settings()).searchEngine,
      ),
    )
    .toBe('google');
  await page.evaluate(() => globalThis.wordpeek.search('take off'));
  expect(
    await application.evaluate(() => globalThis.wordpeekTestExternal),
  ).toEqual(['https://www.google.com/search?q=take%20off%20meaning']);
  console.log(
    'PASS: legacy migration; settings from tray; preset/custom saves; tray synchronization; clipboard toggle; encoded external search; invalid-save rejection; restart persistence. Browser navigation was intercepted.',
  );
} finally {
  await application.close();
}
