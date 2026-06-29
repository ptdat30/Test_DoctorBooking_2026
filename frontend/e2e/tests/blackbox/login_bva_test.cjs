// e2e/tests/blackbox/login_bva_test.cjs
// Blackbox BVA: Login — @NotBlank boundaries

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Blackbox BVA — Login @bva');

Scenario('LOG-B0: Username rỗng → không submit được', async ({ I, LoginPage }) => {
  await LoginPage.navigateTo();
  LoginPage.fillCredentials('', 'ValidPass123');
  LoginPage.submit();
  I.seeInCurrentUrl('/login');
}).tag('@bva').tag('@login').tag('LOG-B0');

Scenario('LOG-B1: Username chỉ khoảng trắng → vẫn ở trang login', async ({ I, LoginPage }) => {
  await LoginPage.navigateTo();
  LoginPage.fillCredentials('   ', 'ValidPass123');
  LoginPage.submit();
  I.seeInCurrentUrl('/login');
}).tag('@bva').tag('@login').tag('LOG-B1');

Scenario('LOG-X2: Password rỗng → không submit được', async ({ I, LoginPage }) => {
  await LoginPage.navigateTo();
  LoginPage.fillCredentials('validuser', '');
  LoginPage.submit();
  I.seeInCurrentUrl('/login');
}).tag('@bva').tag('@login').tag('LOG-X2');

Scenario('LOG-X3: Sai mật khẩu → hiển thị lỗi 401', async ({ I, LoginPage }) => {
  const user = factory.createUser();
  await I.createTestUser(user);

  await LoginPage.login(user.username, 'WrongPassword999!');
  LoginPage.seeError('Invalid username or password');

  await I.deleteTestUser(user.username);
}).tag('@bva').tag('@login').tag('LOG-X3');
