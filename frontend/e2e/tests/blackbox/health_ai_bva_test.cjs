// e2e/tests/blackbox/health_ai_bva_test.cjs
// Blackbox BVA: Health AI — symptoms @NotBlank

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Blackbox BVA — Health AI @bva');

let testPatient;

Before(async ({ I, LoginPage }) => {
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');
});

After(async ({ I }) => {
  if (testPatient?.username) {
    await I.deleteTestUser(testPatient.username);
  }
});

Scenario('HAI-B0: Triệu chứng rỗng → nút gửi bị disabled', async ({ HealthAIPage }) => {
  HealthAIPage.navigateTo();
  HealthAIPage.seeSendDisabled();
}).tag('@bva').tag('@ai').tag('HAI-B0');

Scenario('HAI-B1: Triệu chứng không rỗng → có thể gửi (mock API)', async ({ I, HealthAIPage }) => {
  await I.usePlaywrightTo('mock symptom check API', async ({ page }) => {
    await page.route('**/api/patient/ai/check-symptoms', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestedSpecialization: 'General Practice',
          riskLevel: 'Low',
          advice: 'Nghỉ ngơi và theo dõi triệu chứng.',
          reason: 'Triệu chứng nhẹ',
          homeRemedies: ['Uống nước ấm'],
        }),
      });
    });
  });

  HealthAIPage.navigateTo();
  HealthAIPage.sendMessage('Đau đầu nhẹ');
  HealthAIPage.waitForAIResponse();
}).tag('@bva').tag('@ai').tag('HAI-B1');
