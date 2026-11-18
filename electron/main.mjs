import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  clipboard,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
  session,
  shell,
  protocol,
  net,
} from 'electron';
import { execFile } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import {
  fetchEntry,
  googleUrl,
  normalizeQuery,
  safeSource,
} from './provider.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '..');
const run = promisify(execFile);
const development =
  !app.isPackaged && process.env.WORDPEEK_DEV_URL === 'http://127.0.0.1:5173';
const defaults = { shortcut: 'Control+Alt+W', clipboardFallback: false };
let settings = { ...defaults };
let window;
let tray;
let quitting = false;
let capturing = false;
let latest = { word: '', message: '', revision: 0 };
let pendingLookup = null;

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'wordpeek',
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);

function showWindow(context) {
  if (context) latest = { ...context, revision: latest.revision + 1 };
  const cursor = screen.getCursorScreenPoint();
  const area = screen.getDisplayNearestPoint(cursor).workArea;
  const [width, height] = window.getSize();
  window.setPosition(
    Math.max(area.x, Math.min(cursor.x + 18, area.x + area.width - width)),
    Math.max(area.y, Math.min(cursor.y + 18, area.y + area.height - height)),
  );
  window.show();
  window.focus();
  window.webContents.send('selection:changed', latest);
}

async function captureSelection() {
  if (capturing) return;
  capturing = true;
  try {
    let text = '';
    if (process.platform === 'win32') {
      const script = path.join(
        directory.replace('app.asar', 'app.asar.unpacked'),
        'selection.ps1',
      );
      try {
        const { stdout } = await run(
          path.join(
            process.env.SystemRoot || 'C:\\Windows',
            'System32',
            'WindowsPowerShell',
            'v1.0',
            'powershell.exe',
          ),
          ['-NoLogo', '-NoProfile', '-NonInteractive', '-STA', '-File', script],
          {
            windowsHide: true,
            timeout: 5_000,
            maxBuffer: 16_384,
            encoding: 'utf8',
          },
        );
        text = stdout.trim();
      } catch {
        /* Show manual entry when the app does not expose a selection. */
      }
    }
    if (!text && settings.clipboardFallback) text = clipboard.readText().trim();
    if (text) {
      try {
        showWindow({ word: normalizeQuery(text), message: '' });
      } catch {
        showWindow({
          word: '',
          message: 'Select a word or short phrase, up to 80 characters.',
        });
      }
    } else {
      showWindow({
        word: '',
        message:
          'This app didn’t expose selected text. Type a word here, or copy it and choose “Look Up Clipboard” from the tray.',
      });
    }
  } finally {
    capturing = false;
  }
}

function registerShortcut(shortcut) {
  return globalShortcut.register(shortcut, () => {
    if (window.isFocused() && window.isVisible()) window.hide();
    else void captureSelection();
  });
}

function trusted(event) {
  const url = event.senderFrame?.url;
  return (
    event.sender === window.webContents &&
    event.senderFrame === event.sender.mainFrame &&
    (development
      ? url === 'http://127.0.0.1:5173/'
      : url === 'wordpeek://app/index.html')
  );
}

function handle(channel, fn) {
  ipcMain.handle(channel, async (event, ...args) => {
    if (!trusted(event)) throw new Error('Untrusted request');
    return fn(...args);
  });
}

function setupIpc() {
  handle('dictionary:lookup', async (word) => {
    try {
      normalizeQuery(word);
      if (pendingLookup)
        return {
          ok: false,
          error: {
            code: 'busy',
            message: 'A lookup is already running. Try again in a moment.',
          },
        };
      pendingLookup = fetchEntry(word);
      try {
        return { ok: true, entries: await pendingLookup };
      } finally {
        pendingLookup = null;
      }
    } catch (error) {
      return {
        ok: false,
        error: { code: error.code || 'unavailable', message: error.message },
      };
    }
  });
  handle('browser:google', (word) => shell.openExternal(googleUrl(word)));
  handle('browser:source', (url) => {
    const safe = safeSource(url);
    if (!safe) throw new Error('Unsupported source URL');
    return shell.openExternal(safe);
  });
  handle('window:resize', (requested) => {
    if (typeof requested !== 'number' || !Number.isFinite(requested))
      throw new Error('Invalid height');
    const bounds = window.getBounds();
    const area = screen.getDisplayMatching(bounds).workArea;
    const height = Math.max(
      280,
      Math.min(640, area.height, Math.ceil(requested)),
    );
    window.setSize(416, height);
    window.setPosition(
      Math.max(area.x, Math.min(bounds.x, area.x + area.width - 416)),
      Math.max(area.y, Math.min(bounds.y, area.y + area.height - height)),
    );
  });
  handle('window:hide', () => window.hide());
  handle('selection:context', () => latest);
  handle('settings:get', () => settings);
  handle('settings:save', async (input) => {
    if (
      !input ||
      typeof input.shortcut !== 'string' ||
      input.shortcut.length > 80 ||
      !/^(?:(?:Control|Alt|Shift|Super)\+){1,3}[A-Z0-9]$/.test(
        input.shortcut,
      ) ||
      typeof input.clipboardFallback !== 'boolean'
    ) {
      return {
        ok: false,
        message: 'Use modifiers and one letter, for example Control+Alt+W.',
      };
    }
    if (input.shortcut !== settings.shortcut) {
      try {
        if (!registerShortcut(input.shortcut))
          return {
            ok: false,
            message: 'That shortcut is already in use. Try another.',
          };
      } catch {
        return {
          ok: false,
          message: 'That shortcut is not available. Try another.',
        };
      }
    }
    const previous = settings;
    const next = {
      shortcut: input.shortcut,
      clipboardFallback: input.clipboardFallback,
    };
    try {
      await writeFile(
        path.join(app.getPath('userData'), 'settings.json'),
        JSON.stringify(next, null, 2),
      );
    } catch {
      if (next.shortcut !== previous.shortcut)
        globalShortcut.unregister(next.shortcut);
      return { ok: false, message: 'Couldn’t save your settings. Try again.' };
    }
    settings = next;
    if (next.shortcut !== previous.shortcut)
      globalShortcut.unregister(previous.shortcut);
    return { ok: true };
  });
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => {
    if (window) showWindow();
  });
  app
    .whenReady()
    .then(async () => {
      protocol.handle('wordpeek', (request) => {
        const url = new URL(request.url);
        const file = path.resolve(
          root,
          'dist',
          `.${decodeURIComponent(url.pathname)}`,
        );
        const dist = path.join(root, 'dist');
        if (url.host !== 'app' || !file.startsWith(`${dist}${path.sep}`))
          return new Response('Not found', { status: 404 });
        return net.fetch(pathToFileURL(file).href);
      });
      await mkdir(app.getPath('userData'), { recursive: true });
      try {
        const loaded = JSON.parse(
          await readFile(
            path.join(app.getPath('userData'), 'settings.json'),
            'utf8',
          ),
        );
        if (
          typeof loaded.shortcut === 'string' &&
          /^(?:(?:Control|Alt|Shift|Super)\+){1,3}[A-Z0-9]$/.test(
            loaded.shortcut,
          )
        )
          settings.shortcut = loaded.shortcut;
        settings.clipboardFallback = loaded.clipboardFallback === true;
      } catch {
        /* First run uses defaults. */
      }
      session.defaultSession.setPermissionRequestHandler(
        (_contents, _permission, callback) => callback(false),
      );
      session.defaultSession.setPermissionCheckHandler(() => false);
      window = new BrowserWindow({
        width: 416,
        height: 420,
        minWidth: 360,
        minHeight: 280,
        show: false,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        backgroundColor: '#f7f6f2',
        title: 'WordPeek',
        icon: path.join(root, 'assets/brand/icon.png'),
        webPreferences: {
          preload: path.join(directory, 'preload.cjs'),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webSecurity: true,
          devTools: !app.isPackaged,
        },
      });
      window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      window.webContents.on('will-navigate', (event) => event.preventDefault());
      window.on('blur', () => window.hide());
      window.on('close', (event) => {
        if (!quitting) {
          event.preventDefault();
          window.hide();
        }
      });
      setupIpc();
      const icon = nativeImage.createFromPath(
        path.join(root, 'assets/brand/icon.png'),
      );
      tray = new Tray(icon.resize({ width: 20, height: 20 }));
      tray.setToolTip('WordPeek — a little clarity');
      tray.setContextMenu(
        Menu.buildFromTemplate([
          { label: 'Open WordPeek', click: () => showWindow() },
          {
            label: 'Look Up Clipboard',
            click: () => {
              try {
                showWindow({
                  word: normalizeQuery(clipboard.readText()),
                  message: '',
                });
              } catch {
                showWindow({
                  word: '',
                  message: 'Copy an English word or short phrase first.',
                });
              }
            },
          },
          { type: 'separator' },
          {
            label: 'Quit WordPeek',
            click: () => {
              quitting = true;
              app.quit();
            },
          },
        ]),
      );
      tray.on('double-click', () => showWindow());
      let registered = false;
      try {
        registered = registerShortcut(settings.shortcut);
      } catch {
        /* Open settings to choose another. */
      }
      if (!registered)
        latest.message =
          'Your shortcut is unavailable. Choose another in settings.';
      await (development
        ? window.loadURL('http://127.0.0.1:5173/')
        : window.loadURL('wordpeek://app/index.html'));
      showWindow();
    })
    .catch((error) => {
      console.error('WordPeek could not start:', error.message);
      app.quit();
    });
  app.on('before-quit', () => {
    quitting = true;
  });
  app.on('will-quit', () => globalShortcut.unregisterAll());
  app.on('window-all-closed', () => {
    /* The tray owns the app lifecycle. */
  });
}
