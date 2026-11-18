import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixture } from './test/fixtures';

const mock = vi.hoisted(() => ({
  lookup: vi.fn(),
  google: vi.fn(),
  hide: vi.fn(),
}));
vi.mock('./bridge', () => ({
  bridge: {
    ...mock,
    context: async () => ({ word: '', message: '', revision: 0 }),
    settings: async () => ({
      shortcut: 'Control+Alt+W',
      clipboardFallback: false,
    }),
    resize: async () => undefined,
    onSelection: () => () => undefined,
    saveSettings: async () => ({ ok: true }),
  },
}));
import { App } from './App';

beforeEach(() => {
  vi.clearAllMocks();
  mock.lookup.mockResolvedValue({ ok: true, entries: fixture });
});

async function lookup(word = 'bright') {
  const user = userEvent.setup();
  render(<App />);
  await waitFor(() =>
    expect(
      screen.getByRole('textbox', { name: 'Word or short phrase' }),
    ).toHaveFocus(),
  );
  await user.type(
    screen.getByRole('textbox', { name: 'Word or short phrase' }),
    word,
  );
  await user.click(screen.getByRole('button', { name: 'Look Up' }));
  return user;
}

describe('compact vocabulary card', () => {
  it('navigates definitions, examples, and relationships together without wrapping', async () => {
    const user = await lookup();
    expect(await screen.findByText('Giving off a lot of light.')).toBeVisible();
    expect(screen.queryByText('Quick to learn.')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Previous meaning' }),
    ).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next meaning' }));
    expect(screen.getByText('Quick to learn.')).toBeVisible();
    expect(
      screen.getByText('The bright student solved the puzzle.'),
    ).toBeVisible();
    expect(screen.getByText('clever')).toBeVisible();
    expect(screen.queryByText('dim')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next meaning' })).toBeDisabled();
  });
  it('hands the looked-up word to Google even if the input has been edited', async () => {
    const user = await lookup();
    await screen.findByText('Giving off a lot of light.');
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'different');
    await user.click(
      screen.getByRole('button', { name: 'Search Google for bright' }),
    );
    expect(mock.google).toHaveBeenCalledWith('bright');
  });
  it('hides absent fields and pagination for a single sense', async () => {
    mock.lookup.mockResolvedValue({
      ok: true,
      entries: [
        {
          word: 'test',
          meanings: [
            { partOfSpeech: 'noun', definitions: [{ definition: 'A check.' }] },
          ],
        },
      ],
    });
    await lookup('test');
    expect(await screen.findByText('A check.')).toBeVisible();
    expect(
      screen.queryByRole('navigation', { name: 'Meanings' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Similar')).not.toBeInTheDocument();
    expect(screen.queryByText('Opposite')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Pronunciation unavailable' }),
    ).toBeDisabled();
  });
  it('provides retry and Google after a provider failure', async () => {
    mock.lookup.mockResolvedValueOnce({
      ok: false,
      error: {
        code: 'network',
        message: 'Check your connection, then try again.',
      },
    });
    const user = await lookup();
    expect(
      await screen.findByText('Check your connection, then try again.'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(await screen.findByText('Giving off a lot of light.')).toBeVisible();
  });
  it('shows source and license without crowding the initial card', async () => {
    const user = await lookup();
    await screen.findByText('Giving off a lot of light.');
    expect(screen.queryByText('CC BY-SA 3.0')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Source & License' }));
    expect(screen.getByText('CC BY-SA 3.0')).toBeVisible();
  });
});
