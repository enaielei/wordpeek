import { _electron, expect } from '@playwright/test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';
const profile = await mkdtemp(
  path.join(process.cwd(), 'test-results/passive-'),
);
await writeFile(
  path.join(profile, 'settings.json'),
  JSON.stringify({ shortcut: 'Control+Alt+Shift+Y', autoPopupEnabled: true }),
);
const app = await _electron.launch({
  args: ['scripts/testing/settings-harness.cjs'],
  env: { ...process.env, WORDPEEK_TEST_PROFILE: profile },
});
try {
  const page = await app.firstWindow();
  await page.getByRole('heading', { name: 'Keep your place.' }).waitFor();
  await app.evaluate(({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows()[0];
    w.hide();
    globalThis.passiveCalls = { show: 0, focus: 0 };
    const inactive = w.showInactive.bind(w);
    w.showInactive = () => {
      globalThis.passiveCalls.show++;
      inactive();
    };
    const focus = w.focus.bind(w);
    w.focus = () => {
      globalThis.passiveCalls.focus++;
      focus();
    };
  });
  await app.evaluate(() =>
    globalThis.wordpeekTestSelectionHost.onSelection({
      text: 'bright',
      x: 200,
      y: 200,
      width: 40,
      height: 20,
    }),
  );
  await expect
    .poll(() => app.evaluate(() => globalThis.passiveCalls))
    .toEqual({ show: 1, focus: 0 });
  expect(
    await page.evaluate(() => globalThis.wordpeek.context()),
  ).toMatchObject({ word: 'bright', passive: true });
  expect(
    await page
      .locator('.app-header')
      .evaluate((el) =>
        globalThis.getComputedStyle(el).getPropertyValue('-webkit-app-region'),
      ),
  ).toBe('drag');
  await app.evaluate(() => globalThis.wordpeekTestSelectionHost.onClear());
  expect(
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].isVisible(),
    ),
  ).toBe(false);
  console.log(
    'PASS: simulated native selection uses showInactive without calling focus; passive context; draggable header; cleared selection hides passive card. OS focus preservation requires interactive acceptance.',
  );
} finally {
  await app.close();
}
