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
void (async () => {
  const { SelectionHost } = await import('../../electron/selection-host.mjs');
  const configure = SelectionHost.prototype.configure;
  SelectionHost.prototype.configure = function (automatic) {
    globalThis.wordpeekTestSelectionHost = this;
    return configure.call(this, automatic);
  };
  await import('../../electron/main.mjs');
})();
