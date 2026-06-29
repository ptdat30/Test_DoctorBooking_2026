// e2e/tests/blackbox/feedback_rating_bva_test.cjs
// Blackbox BVA: Feedback rating [1,5]

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Blackbox BVA — Feedback Rating @bva');

let testPatient;

Before(async ({ I, LoginPage }) => {
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);

  await I.usePlaywrightTo('mock completed appointments for feedback BVA', async ({ page }) => {
    await page.route('**/api/patient/appointments', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 9001,
              doctorName: 'Dr. BVA Test',
              appointmentDate: '2026-06-20',
              appointmentTime: '09:00:00',
              status: 'COMPLETED',
            },
          ]),
        });
      } else {
        route.continue();
      }
    });

    await page.route('**/api/patient/feedbacks', route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 1, rating: body.rating, comment: body.comment }),
        });
      } else {
        route.continue();
      }
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

Scenario('FBR-B1: Rating 1 sao → gửi feedback thành công', async ({ FeedbackPage }) => {
  FeedbackPage.navigateToNewFeedback();
  await FeedbackPage.submitFeedback(1, 'BVA rating boundary min');
}).tag('@bva').tag('@feedback').tag('FBR-B1');

Scenario('FBR-B5: Rating 5 sao → gửi feedback thành công', async ({ FeedbackPage }) => {
  FeedbackPage.navigateToNewFeedback();
  await FeedbackPage.submitFeedback(5, 'BVA rating boundary max');
}).tag('@bva').tag('@feedback').tag('FBR-B5');
