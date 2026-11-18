// Test-only entry point: isolate preferences and intercept external navigation.
const { app, Menu, shell } = require('electron');
if (!process.env.WORDPEEK_TEST_PROFILE)
  throw new Error('A test profile is required.');
app.setPath('userData', process.env.WORDPEEK_TEST_PROFILE);
globalThis.wordpeekTestExternal = [];
shell.openExternal = async (url) => {
  globalThis.wordpeekTestExternal.push(url);
};
const build = Menu.buildFromTemplate.bind(Menu);
Menu.buildFromTemplate = (template) => {
  const menu = build(template);
  if (template.some((item) => item.id === 'open'))
    globalThis.wordpeekTestMenu = menu;
  return menu;
};
void import('../../electron/main.mjs');
