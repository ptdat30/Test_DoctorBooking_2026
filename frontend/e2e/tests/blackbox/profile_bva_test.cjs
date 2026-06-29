// e2e/tests/blackbox/profile_bva_test.cjs
// Blackbox BVA: Profile — password min 6 characters

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Blackbox BVA — Profile Password @bva');

let testPatient;

Before(async ({ I }) => {
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);
});

After(async ({ I }) => {
  if (testPatient?.username) {
    await I.deleteTestUser(testPatient.username);
  }
});

Scenario('PRF-B7: Mật khẩu mới 5 ký tự → HTML5 minLength chặn submit', async ({ LoginPage, ProfilePage }) => {
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  ProfilePage.navigateTo();
  ProfilePage.openChangePassword();
  ProfilePage.changePassword(testPatient.password, '12345', '12345');

  // New Password có minLength=6 → trình duyệt chặn submit khi 5 ký tự
  ProfilePage.seeNewPasswordTooShort();
}).tag('@bva').tag('@profile').tag('PRF-B7');
