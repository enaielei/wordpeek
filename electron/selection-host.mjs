import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

export class SelectionHost {
  constructor(executable, ownerPid, onSelection, onClear) {
    Object.assign(this, { executable, ownerPid, onSelection, onClear });
    this.pending = new Map();
    this.serial = 0;
    this.automatic = false;
    this.stopped = false;
  }
  start() {
    if (this.child || this.stopped) return;
    const child = spawn(this.executable, [], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    this.child = child;
    const lines = createInterface({ input: child.stdout });
    lines.on('line', (line) => {
      if (line.length > 8192) return;
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        return;
      }
      if (message.type === 'ready')
        this.send({
          action: 'configure',
          ownerPid: this.ownerPid,
          automatic: this.automatic,
        });
      if (message.type === 'busy') {
        clearTimeout(this.watchdog);
        this.watchdog = setTimeout(() => {
          this.reset();
          if (this.automatic) this.start();
        }, 3000);
      }
      if (
        ['capture', 'speech', 'idle', 'clear', 'selection'].includes(
          message.type,
        )
      ) {
        clearTimeout(this.watchdog);
        this.watchdog = null;
      }
      if (message.id && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id);
        clearTimeout(pending.timer);
        this.pending.delete(message.id);
        pending.resolve(message);
      }
      if (message.type === 'selection') this.onSelection(message.selection);
      if (message.type === 'clear') this.onClear();
    });
    child.stdin.on('error', () => this.reset());
    child.on('error', () => this.reset());
    child.on('exit', () => {
      if (this.child === child) this.reset();
    });
  }
  send(command) {
    if (this.child?.stdin.writable)
      this.child.stdin.write(JSON.stringify(command) + '\n');
  }
  configure(automatic) {
    this.automatic = automatic;
    this.start();
    this.send({ action: 'configure', ownerPid: this.ownerPid, automatic });
  }
  request(action, extra = {}) {
    this.start();
    const id = String(++this.serial);
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        resolve({ ok: false, selection: null });
        this.reset();
      }, 3500);
      this.pending.set(id, { resolve, timer });
      this.send({ action, id, ...extra });
    });
  }
  capture() {
    return this.request('capture');
  }
  speak(word) {
    return this.request('speak', { word });
  }
  stopSpeech() {
    this.send({ action: 'stop-speech' });
  }
  reset() {
    clearTimeout(this.watchdog);
    this.watchdog = null;
    const child = this.child;
    this.child = null;
    child?.kill();
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.resolve({ ok: false, selection: null });
    }
    this.pending.clear();
  }
  stop() {
    this.stopped = true;
    this.send({ action: 'quit' });
    this.reset();
  }
}
