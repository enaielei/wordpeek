import { mkdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
if (process.platform !== 'win32') {
  console.log(
    'Native selection helper is Windows-only; skipping on this platform.',
  );
  process.exit(0);
}
const root = process.cwd();
const source = path.join(root, 'native/SelectionHost.cs'),
  output = path.join(root, 'native/bin/WordPeek.Native.exe');
await mkdir(path.dirname(output), { recursive: true });
try {
  if ((await stat(output)).mtimeMs >= (await stat(source)).mtimeMs)
    process.exit(0);
} catch {
  /* First native build. */
}
const framework = path.join(
  process.env.SystemRoot || 'C:\\Windows',
  'Microsoft.NET/Framework64/v4.0.30319',
);
const references = [
  'WPF/UIAutomationClient.dll',
  'WPF/UIAutomationTypes.dll',
  'WPF/WindowsBase.dll',
  'System.Web.Extensions.dll',
  'WPF/System.Speech.dll',
].map((file) => `/reference:${path.join(framework, file)}`);
const result = spawnSync(
  path.join(framework, 'csc.exe'),
  [
    '/nologo',
    '/target:exe',
    '/platform:x64',
    '/optimize+',
    `/out:${output}`,
    ...references,
    source,
  ],
  { stdio: 'inherit', windowsHide: true },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
