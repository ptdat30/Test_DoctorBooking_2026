// e2e/tests/blackbox/feedback_edit_bva_test.cjs
// Blackbox BVA: Feedback edit window 24h

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Blackbox BVA — Feedback Edit 24h @bva');

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

Scenario('FBT-V1: canEdit=true → chỉnh sửa feedback thành công', async ({ I, FeedbackPage }) => {
  await I.usePlaywrightTo('mock editable feedback', async ({ page }) => {
    // GET danh sách feedback
    await page.route('**/api/patient/feedbacks', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 7001,
              doctorName: 'Dr. Editable',
              rating: 3,
              comment: 'Original comment',
              status: 'PENDING',
              canEdit: true,
              createdAt: new Date().toISOString(),
            },
          ]),
        });
      } else {
        route.continue();
      }
    });

    // PUT cập nhật feedback theo id: /patient/feedbacks/{id}
    await page.route('**/api/patient/feedbacks/*', route => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 7001, rating: 4, comment: 'Updated BVA comment' }),
        });
      } else {
        route.continue();
      }
    });
  });

  FeedbackPage.navigateToMyFeedbacks();
  FeedbackPage.clickEditFeedback();
  FeedbackPage.submitEditFeedback(4, 'Updated BVA comment');
  FeedbackPage.seeEditSuccessToast();
}).tag('@bva').tag('@feedback').tag('FBT-V1');

Scenario('FBT-X1: canEdit=false (quá 24h) → không có nút chỉnh sửa', async ({ I, FeedbackPage }) => {
  await I.usePlaywrightTo('mock non-editable feedback', async ({ page }) => {
    await page.route('**/api/patient/feedbacks', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 7002,
            doctorName: 'Dr. Locked',
            rating: 5,
            comment: 'Old feedback',
            status: 'READ',
            canEdit: false,
            createdAt: '2020-01-01T10:00:00Z',
          },
        ]),
      });
    });
  });

  FeedbackPage.navigateToMyFeedbacks();
  FeedbackPage.seeCannotEditWithin24h();
  I.dontSeeElement(FeedbackPage.patient.editBtn);
}).tag('@bva').tag('@feedback').tag('FBT-X1');
