// e2e/tests/blackbox/wallet_bva_test.cjs
// Blackbox BVA: Wallet top-up amount ≥ 10,000 VNĐ

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Blackbox BVA — Wallet Top-up @bva');

let testPatient;

Before(async ({ I, LoginPage }) => {
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);

  await I.usePlaywrightTo('mock wallet API for BVA', async ({ page }) => {
    await page.route('**/api/patient/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ balance: 100000, loyaltyPoints: 500, loyaltyTier: 'BRONZE' }),
      });
    });
    await page.route(url => url.pathname.includes('/api/patient/wallet/transactions') || url.pathname.includes('/api/patient/transactions'), route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ transactions: [], total: 0 }),
      });
    });
  });

  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');
});

After(async ({ I }) => {
  if (testPatient?.username) {
    await I.deleteTestUser(testPatient.username);
  }
});

Scenario('WAL-B0: Nạp 9.999 VNĐ → nút xác nhận bị disabled', async ({ WalletPage }) => {
  WalletPage.navigateTo();
  WalletPage.openTopUpModal();
  WalletPage.fillCustomAmount(9999);
  WalletPage.seeConfirmDisabled();
}).tag('@bva').tag('@wallet').tag('WAL-B0');

Scenario('WAL-B1: Nạp 10.000 VNĐ → nút xác nhận enabled', async ({ WalletPage }) => {
  WalletPage.navigateTo();
  WalletPage.openTopUpModal();
  WalletPage.fillCustomAmount(10000);
  WalletPage.seeConfirmEnabled();
}).tag('@bva').tag('@wallet').tag('WAL-B1');

Scenario('WAL-B2: Nạp 10.001 VNĐ → nút xác nhận enabled', async ({ WalletPage }) => {
  WalletPage.navigateTo();
  WalletPage.openTopUpModal();
  WalletPage.fillCustomAmount(10001);
  WalletPage.seeConfirmEnabled();
}).tag('@bva').tag('@wallet').tag('WAL-B2');
