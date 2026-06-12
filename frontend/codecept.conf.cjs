/** @type {CodeceptJS.MainConfig} */
exports.config = {
  tests: './e2e/*_test.js',
  output: './e2e/output',
  helpers: {
    Playwright: {
      url: 'http://localhost:5173',
      show: false,
      browser: 'chromium'
    }
  },
  include: {
    I: './e2e/steps_file.cjs'
  },
  plugins: {
    screenshotOnFail: {
      enabled: true
    },
    tryTo: {
      enabled: true
    },
    retryFailedStep: {
      enabled: true
    }
  },
  name: 'frontend'
}
