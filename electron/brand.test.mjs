// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const css = readFileSync(
  new URL('../src/brand/tokens.css', import.meta.url),
  'utf8',
);
const tokens = (block) =>
  Object.fromEntries(
    [...block.matchAll(/--wp-([a-z-]+):\s*(#[a-f0-9]{6})/gu)].map((match) => [
      match[1],
      match[2],
    ]),
  );
const themes = {
  light: tokens(css.match(/:root\s*\{([^}]+)\}/u)[1]),
  dark: tokens(css.match(/:root\[data-appearance='dark'\]\s*\{([^}]+)\}/u)[1]),
};
function luminance(hex) {
  const rgb = hex
    .slice(1)
    .match(/../gu)
    .map((value) => parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
describe('compact text contrast', () => {
  for (const [name, theme] of Object.entries(themes))
    for (const [text, background] of [
      ['ink', 'paper'],
      ['ink', 'surface'],
      ['muted', 'paper'],
      ['muted', 'surface'],
      ['accent', 'paper'],
    ])
      it(`${name}: ${text} on ${background} meets AA normal-text contrast`, () => {
        const a = luminance(theme[text]),
          b = luminance(theme[background]);
        expect(
          (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        ).toBeGreaterThanOrEqual(4.5);
      });
});
