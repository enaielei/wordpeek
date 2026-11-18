import { bridge } from '../bridge';
import { useState } from 'react';
import { ShortcutKeys } from './ShortcutKeys';

export function ShortcutInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  return (
    <div className={`shortcut-input${recording ? ' recording' : ''}`}>
      <input
        id="shortcut"
        name="shortcut"
        aria-label="Lookup shortcut"
        aria-describedby="shortcut-hint"
        value={value}
        readOnly
        disabled={disabled}
        onFocus={() => {
          setRecording(true);
          void bridge.recordShortcut(true);
        }}
        onBlur={() => {
          setRecording(false);
          void bridge.recordShortcut(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Tab') return;
          event.preventDefault();
          event.stopPropagation();
          if (event.key === 'Escape') {
            event.currentTarget.blur();
            return;
          }
          if (
            !/^[a-z0-9]$/iu.test(event.key) ||
            !(event.ctrlKey || event.altKey || event.metaKey)
          )
            return;
          const keys = [
            event.ctrlKey ? 'Control' : '',
            event.altKey ? 'Alt' : '',
            event.shiftKey ? 'Shift' : '',
            event.metaKey ? 'Super' : '',
            event.key.toUpperCase(),
          ].filter(Boolean);
          onChange(keys.join('+'));
          setRecording(false);
          event.currentTarget.blur();
        }}
      />
      <div className="shortcut-input-display" aria-hidden="true">
        {recording ? (
          <span>Press a shortcut…</span>
        ) : (
          <ShortcutKeys shortcut={value} />
        )}
      </div>
    </div>
  );
}
