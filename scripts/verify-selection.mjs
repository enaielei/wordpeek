import { _electron, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import { SelectionHost } from '../electron/selection-host.mjs';
const root = process.cwd();
const profile = await mkdtemp(path.join(root, 'test-results/selection-'));
const packets = [];
const host = new SelectionHost(
  path.join(root, 'native/bin/WordPeek.Native.exe'),
  process.pid,
  (s) => packets.push(s),
  () => {},
);
const source = await _electron.launch({
  args: ['scripts/testing/selection-source.cjs'],
  env: { ...process.env, WORDPEEK_TEST_PROFILE: profile },
});
try {
  const page = await source.firstWindow();
  await page.locator('#text').waitFor();
  host.configure(true);
  await page.bringToFront();
  await source.evaluate(({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows()[0];
    w.show();
    w.focus();
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.evaluate(() => {
    const range = globalThis.document.createRange();
    range.selectNodeContents(globalThis.document.querySelector('#text'));
    const selection = globalThis.window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
  await expect
    .poll(
      async () => {
        const result = await host.capture();
        return result.selection?.text;
      },
      { timeout: 10000 },
    )
    .toBe('bright');
  await page.evaluate(() => globalThis.window.getSelection().removeAllRanges());
  await new Promise((r) => setTimeout(r, 500));
  await page.evaluate(() => {
    const range = globalThis.document.createRange();
    range.selectNodeContents(globalThis.document.querySelector('#text'));
    globalThis.window.getSelection().addRange(range);
  });
  await expect
    .poll(() => packets.some((s) => s.text === 'bright'), { timeout: 10000 })
    .toBe(true);
  expect((await host.speak('bright')).ok).toBe(true);
  console.log(
    'PASS: native Chromium document selection with unrelated keyboard focus; automatic selection events; installed system speech accepted.',
  );
} finally {
  host.stop();
  await source.close();
}
