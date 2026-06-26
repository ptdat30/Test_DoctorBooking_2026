/** @type {CodeceptJS.MainConfig} */
exports.config = {
  tests: './e2e/**/*_test.*js',
  output: './e2e/output',
  helpers: {
    Playwright: {
      url: 'http://localhost:5173',
      show: false,
      browser: 'chromium'
    },
    ApiHelper: {
      require: './e2e/helpers/ApiHelper.cjs',
      apiBaseUrl: 'http://localhost:8080/api'
    }
  },
  include: {
    I: './e2e/steps_file.cjs',
    HomePage: './e2e/pages/HomePage.cjs',
    LoginPage: './e2e/pages/LoginPage.cjs',
    BookingPage: './e2e/pages/BookingPage.cjs',
    DoctorSearchPage: './e2e/pages/DoctorSearchPage.cjs',
    PatientDashboardPage: './e2e/pages/PatientDashboardPage.cjs',
    RegisterPage: './e2e/pages/RegisterPage.cjs',
    AuthSteps: './e2e/steps/AuthSteps.cjs',
    DoctorPage: './e2e/pages/DoctorPage.cjs',
    AdminPage: './e2e/pages/AdminPage.cjs',
    ProfilePage: './e2e/pages/ProfilePage.cjs',
    FeedbackPage: './e2e/pages/FeedbackPage.cjs',
    HealthAIPage: './e2e/pages/HealthAIPage.cjs',
    WalletPage: './e2e/pages/WalletPage.cjs'
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
