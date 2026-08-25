// Karma configuration for the Paint unit suite.
//
// Kept minimal: the Angular builder supplies the frameworks and the bundle, this
// file only decides *which* browser runs them. `ChromeHeadlessCI` is the same
// Chrome with the flags a container needs (`--no-sandbox`, no /dev/shm), and it
// honours `CHROME_BIN` so CI can point it at whatever Chromium it has.
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      jasmine: {},
      clearContext: false,
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/paint'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      },
    },
    browserNoActivityTimeout: 120000,
    browserDisconnectTimeout: 30000,
    captureTimeout: 120000,
    restartOnFileChange: true,
  });
};