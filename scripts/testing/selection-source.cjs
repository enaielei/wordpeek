const { app, BrowserWindow } = require('electron');
app.setPath('userData', process.env.WORDPEEK_TEST_PROFILE);
app.whenReady().then(() => {
  app.accessibilitySupportEnabled = true;
  const w = new BrowserWindow({ width: 600, height: 450 });
  w.loadURL(
    'data:text/html,<h1>Selection test</h1><p id="text">bright</p><input aria-label="Other control">',
  );
});
