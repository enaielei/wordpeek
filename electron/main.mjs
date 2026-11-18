import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  clipboard,
  globalShortcut,
  ipcMain,
  nativeImage,
  nativeTheme,
  screen,
  session,
  shell,
  protocol,
  net,
} from 'electron';
import { execFile } from 'node:child_process';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { fetchEntry, normalizeQuery, safeSource } from './provider.mjs';

import { buildSearchUrl } from '../shared/search.mjs';
import {
  DEFAULT_SETTINGS,
  migrateSettings,
  validateSettings,
} from './settings.mjs';
import { trayTemplate } from './tray.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '..');
const run = promisify(execFile);
const development =
  !app.isPackaged && process.env.WORDPEEK_DEV_URL === 'http://127.0.0.1:5173';
let settings = { ...DEFAULT_SETTINGS };
let settingsQueue = Promise.resolve();
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

function applyAppearance() {
  nativeTheme.themeSource = settings.appearance;
  if (window)
    window.setBackgroundColor(
      nativeTheme.shouldUseDarkColors ? '#292c30' : '#f0f0ee',
    );
}

function showSettings(message = '') {
  showWindow();
  window.webContents.send('window:settings', { message });
}

async function applySettings(input) {
  let next;
  try {
    next = validateSettings(input);
  } catch (error) {
    return { ok: false, message: error.message };
  }
  const previous = settings;
  if (next.shortcut !== previous.shortcut) {
    try {
      if (!registerShortcut(next.shortcut))
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
  try {
    const target = path.join(app.getPath('userData'), 'settings.json');
    await writeFile(target + '.tmp', JSON.stringify(next, null, 2));
    await rename(target + '.tmp', target);
  } catch {
    if (next.shortcut !== previous.shortcut)
      globalShortcut.unregister(next.shortcut);
    return { ok: false, message: 'Couldn’t save your settings. Try again.' };
  }
  settings = next;
  applyAppearance();
  if (next.shortcut !== previous.shortcut)
    globalShortcut.unregister(previous.shortcut);
  refreshTray();
  window.webContents.send('settings:changed', settings);
  return { ok: true, settings };
}

function commitSettings(input) {
  const result = settingsQueue.then(() =>
    applySettings(typeof input === 'function' ? input(settings) : input),
  );
  settingsQueue = result.catch(() => undefined);
  return result;
}

function refreshTray() {
  if (!tray) return;
  tray.setContextMenu(
    Menu.buildFromTemplate(
      trayTemplate(settings, {
        open: () => showWindow(),
        settings: () => showSettings(),
        clipboard: () => {
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
        update: async (patch) => {
          const result = await commitSettings((current) => ({
            ...current,
            ...patch,
          }));
          if (!result.ok) {
            refreshTray();
            showSettings(result.message);
          }
        },
        quit: () => {
          quitting = true;
          app.quit();
        },
      }),
    ),
  );
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
  handle('browser:search', (word) =>
    shell.openExternal(buildSearchUrl(word, settings)),
  );
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
      180,
      Math.min(600, area.height, Math.ceil(requested)),
    );
    // Windows fixes the min/max bounds while a window is non-resizable.
    window.setResizable(true);
    window.setMinimumSize(280, 180);
    window.setSize(304, height);
    window.setResizable(false);
    window.setPosition(
      Math.max(area.x, Math.min(bounds.x, area.x + area.width - 304)),
      Math.max(area.y, Math.min(bounds.y, area.y + area.height - height)),
    );
  });
  handle('window:hide', () => window.hide());
  handle('selection:context', () => latest);
  handle('settings:get', () => settings);
  handle('settings:save', (input) => commitSettings(input));
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
        settings = migrateSettings(
          JSON.parse(
            await readFile(
              path.join(app.getPath('userData'), 'settings.json'),
              'utf8',
            ),
          ),
        );
      } catch {
        /* First run uses defaults. */
      }
      applyAppearance();
      nativeTheme.on('updated', () => {
        if (window)
          window.setBackgroundColor(
            nativeTheme.shouldUseDarkColors ? '#292c30' : '#f0f0ee',
          );
      });
      session.defaultSession.setPermissionRequestHandler(
        (_contents, _permission, callback) => callback(false),
      );
      session.defaultSession.setPermissionCheckHandler(() => false);
      window = new BrowserWindow({
        width: 304,
        height: 260,
        minWidth: 280,
        minHeight: 180,
        show: false,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        backgroundColor: nativeTheme.shouldUseDarkColors
          ? '#292c30'
          : '#f0f0ee',
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
      refreshTray();
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
