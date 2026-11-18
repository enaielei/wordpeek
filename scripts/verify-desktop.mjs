import { _electron as electron, expect } from '@playwright/test';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = process.cwd();
const output =
  process.env.WORDPEEK_ARTIFACTS || path.join(root, 'test-results');
await mkdir(output, { recursive: true });
await mkdir(path.join(root, 'test-results'), { recursive: true });
const profile = await mkdtemp(path.join(root, 'test-results/desktop-'));
await writeFile(
  path.join(profile, 'settings.json'),
  JSON.stringify({ shortcut: 'Control+Alt+Shift+Y', clipboardFallback: false }),
);
const application = await electron.launch({
  executablePath: process.env.WORDPEEK_EXECUTABLE || undefined,
  args: process.env.WORDPEEK_EXECUTABLE
    ? [`--user-data-dir=${profile}`]
    : ['scripts/testing/settings-harness.cjs'],
  env: { ...process.env, WORDPEEK_TEST_PROFILE: profile },
  cwd: root,
  timeout: 30_000,
});
const errors = [];
let liveResult;
try {
  const page = await application.firstWindow();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.waitForLoadState('domcontentloaded');
  await expect(
    page.getByRole('heading', { name: 'Keep your place.' }),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Word or short phrase' })
    .fill('bright');
  await page.getByRole('button', { name: 'Look Up' }).click();
  await expect(
    page.getByRole('heading', { name: 'bright', exact: true }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByRole('navigation', { name: 'Meanings' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Next meaning' }).click();
  await expect(
    page.getByRole('button', { name: 'Previous meaning' }),
  ).toBeEnabled();
  await expect
    .poll(() =>
      application.evaluate(
        ({ BrowserWindow }) =>
          BrowserWindow.getAllWindows()[0].getBounds().height,
      ),
    )
    .toBeLessThan(400);
  const nativeBounds = await application.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].getBounds(),
  );
  await page.setViewportSize({
    width: nativeBounds.width,
    height: nativeBounds.height,
  });
  await page.screenshot({ path: path.join(output, 'wordpeek-live-light.png') });
  liveResult =
    'live bright lookup, meaning navigation, and attribution disclosure passed';
  await page.getByRole('button', { name: 'Source & License' }).click();
  await expect(
    page.getByRole('complementary', { name: 'Dictionary attribution' }),
  ).toContainText('CC BY-SA');
  await page.getByRole('button', { name: 'Source & License' }).click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: path.join(output, 'wordpeek-live-dark.png') });
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(
    page.getByRole('textbox', { name: 'Lookup shortcut' }),
  ).toHaveValue('Control+Alt+Shift+Y');
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await page.getByRole('button', { name: 'Back to dictionary' }).click();
  // Dismissal is tested against the real BrowserWindow, not a renderer mock.
  await page.keyboard.press('Escape');
  await expect
    .poll(() =>
      application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].isVisible(),
      ),
    )
    .toBe(false);
  await application.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].show(),
  );
  const brandWindow = application.waitForEvent('window');
  await application.evaluate(
    async ({ BrowserWindow }, url) => {
      const board = new BrowserWindow({
        width: 1320,
        height: 1000,
        show: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
        },
      });
      await board.loadURL(url);
    },
    pathToFileURL(path.join(root, 'docs/brand/index.html')).href,
  );
  const brandPage = await brandWindow;
  await brandPage.setViewportSize({ width: 1320, height: 1000 });
  await expect(
    brandPage.getByRole('heading', { name: /A little clarity/ }),
  ).toBeVisible();
  await brandPage.bringToFront();
  await brandPage.screenshot({
    path: path.join(output, 'wordpeek-brand-board.png'),
    fullPage: true,
  });
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(
    JSON.stringify({ liveResult, rendererErrors: errors, output }, null, 2),
  );
} finally {
  await application.close();
}
