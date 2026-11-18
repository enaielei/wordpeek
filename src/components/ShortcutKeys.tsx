const labels: Record<string, string> = {
  Control: 'Ctrl',
  Super: 'Win',
  Escape: 'Esc',
};
export function ShortcutKeys({ shortcut }: { shortcut: string }) {
  return (
    <span
      className="shortcut-keys"
      aria-label={shortcut.replaceAll('+', ' plus ')}
    >
      {shortcut
        .split('+')
        .filter(Boolean)
        .map((key, index) => (
          <span className="shortcut-key-part" key={`${key}-${index}`}>
            {index ? (
              <span className="shortcut-plus" aria-hidden="true">
                +
              </span>
            ) : null}
            <kbd>{labels[key] || key}</kbd>
          </span>
        ))}
    </span>
  );
}
