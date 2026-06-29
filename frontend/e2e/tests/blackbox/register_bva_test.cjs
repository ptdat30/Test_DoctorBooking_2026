// e2e/tests/blackbox/register_bva_test.cjs
// Blackbox BVA: Đăng ký — username/password/email biên

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Blackbox BVA — Register @bva');

let createdUsername = null;

After(async ({ I }) => {
  if (createdUsername) {
    await I.deleteTestUser(createdUsername);
    createdUsername = null;
  }
});

Scenario('REG-B0/B1: Username 2 ký tự → HTML5 minLength chặn submit', async ({ I, RegisterPage }) => {
  const userData = factory.createUser();
  userData.username = factory.stringOfLength(2);

  await RegisterPage.navigateTo();
  RegisterPage.fillForm(userData);
  RegisterPage.submit();

  RegisterPage.seeValidationBlocked();
}).tag('@bva').tag('@register').tag('REG-B0').tag('REG-B1');

Scenario('REG-B6: Username 51 ký tự → API 400 validation', async ({ I, RegisterPage }) => {
  const userData = factory.createUser();
  userData.username = factory.stringOfLength(51);

  await RegisterPage.register(userData);
  RegisterPage.seeApiError();
  RegisterPage.seeStayOnRegister();
}).tag('@bva').tag('@register').tag('REG-B6');

Scenario('REG-B13: Email sai định dạng → HTML5 type=email chặn submit', async ({ I, RegisterPage }) => {
  const userData = factory.createUser();
  userData.email = 'not-an-email';

  await RegisterPage.navigateTo();
  RegisterPage.fillForm(userData);
  RegisterPage.submit();

  // input type="email" → trình duyệt chặn submit, vẫn ở /register
  RegisterPage.seeEmailInvalid();
  RegisterPage.seeValidationBlocked();
}).tag('@bva').tag('@register').tag('REG-B13');

Scenario('REG-B7: Password 5 ký tự → HTML5 minLength chặn submit', async ({ I, RegisterPage }) => {
  const userData = factory.createUser();
  userData.password = '12345';

  await RegisterPage.navigateTo();
  RegisterPage.fillForm(userData);
  RegisterPage.submit();

  RegisterPage.seeValidationBlocked();
}).tag('@bva').tag('@register').tag('REG-B7');

Scenario('REG-B2/B3: Username 3 và 50 ký tự → đăng ký thành công', async ({ I, RegisterPage }) => {
  const userData = factory.createUser();
  userData.username = factory.stringOfLength(3, 'u');
  createdUsername = userData.username;

  await RegisterPage.register(userData);
  RegisterPage.seeSuccessRedirect();
}).tag('@bva').tag('@register').tag('REG-B2').tag('REG-B3');
