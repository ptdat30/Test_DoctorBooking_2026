// e2e/tests/blackbox/loyalty_tier_bva_test.cjs
// Blackbox BVA: Loyalty tier boundaries 999 / 1000 / 5000 points

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Blackbox BVA — Loyalty Tier @bva');

let testPatient;

async function mockWallet(I, loyaltyPoints) {
  await I.usePlaywrightTo(`mock wallet ${loyaltyPoints} points`, async ({ page }) => {
    await page.route('**/api/patient/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          balance: 200000,
          loyaltyPoints,
          loyaltyTier: loyaltyPoints >= 10000 ? 'PLATINUM' : loyaltyPoints >= 5000 ? 'GOLD' : loyaltyPoints >= 1000 ? 'SILVER' : 'BRONZE',
        }),
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
}

Before(async ({ I }) => {
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);
});

After(async ({ I }) => {
  if (testPatient?.username) {
    await I.deleteTestUser(testPatient.username);
  }
});

Scenario('LOY-B0: 999 điểm → hạng Đồng (BRONZE)', async ({ I, LoginPage, WalletPage }) => {
  await mockWallet(I, 999);
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  WalletPage.navigateTo();
  I.see('Hạng Đồng', '.wallet-card.points');
}).tag('@bva').tag('@wallet').tag('LOY-B0');

Scenario('LOY-B1: 1.000 điểm → hạng Bạc (SILVER)', async ({ I, LoginPage, WalletPage }) => {
  await mockWallet(I, 1000);
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  WalletPage.navigateTo();
  I.see('Hạng Bạc', '.wallet-card.points');
}).tag('@bva').tag('@wallet').tag('LOY-B1');

Scenario('LOY-B3: 5.000 điểm → hạng Vàng (GOLD)', async ({ I, LoginPage, WalletPage }) => {
  await mockWallet(I, 5000);
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  WalletPage.navigateTo();
  I.see('Hạng Vàng', '.wallet-card.points');
}).tag('@bva').tag('@wallet').tag('LOY-B3');
