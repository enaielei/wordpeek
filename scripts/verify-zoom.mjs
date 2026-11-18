import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
import { _electron, expect } from '@playwright/test';
await mkdir(path.join(root, 'test-results'), { recursive: true });
const profile = await mkdtemp(path.join(root, 'test-results/zoom-'));
await writeFile(
  path.join(profile, 'settings.json'),
  JSON.stringify({ shortcut: 'Control+Alt+Shift+Y', clipboardFallback: false }),
);
const application = await _electron.launch({
  args: ['scripts/testing/settings-harness.cjs'],
  cwd: root,
  env: { ...process.env, WORDPEEK_TEST_PROFILE: profile },
});
try {
  const page = await application.firstWindow();
  await page.getByRole('button', { name: 'Look Up' }).waitFor();
  await application.evaluate(() => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify([
          {
            word: 'reluctant',
            meanings: [
              {
                partOfSpeech: 'adjective',
                definitions: [
                  {
                    definition: 'Unwilling or hesitant to do something.',
                    example: 'She was reluctant to ask for help.',
                    synonyms: ['hesitant', 'unwilling'],
                    antonyms: ['willing', 'eager'],
                  },
                  { definition: 'Slow to take action.' },
                ],
              },
            ],
          },
        ]),
      );
  });
  await page.getByRole('textbox').fill('reluctant');
  await page.getByRole('button', { name: 'Look Up' }).click();
  await page.getByRole('heading', { name: 'reluctant', exact: true }).waitFor();
  for (const zoom of [1, 2]) {
    await application.evaluate(
      ({ BrowserWindow }, factor) =>
        BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(factor),
      zoom,
    );
    await expect
      .poll(() => page.evaluate(() => globalThis.devicePixelRatio))
      .toBeGreaterThanOrEqual(zoom);
    const result = await page.locator('main').evaluate((element) => ({
      width: element.clientWidth,
      scroll: element.scrollWidth,
    }));
    console.log(JSON.stringify({ zoom, ...result }));
    expect(result.scroll).toBeLessThanOrEqual(result.width);
  }
} finally {
  await application.close();
}
