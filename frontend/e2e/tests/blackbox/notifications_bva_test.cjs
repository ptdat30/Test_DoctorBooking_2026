// e2e/tests/blackbox/notifications_bva_test.cjs
// Blackbox EP: Notifications — empty vs unread count

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Blackbox BVA — Notifications @bva');

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

Scenario('NOT-V2: Danh sách rỗng → hiển thị "Chưa có thông báo nào"', async ({ I, LoginPage, NotificationPage }) => {
  await I.usePlaywrightTo('mock empty notifications', async ({ page }) => {
    await page.route('**/api/patient/notifications', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.route('**/api/patient/notifications/unread-count', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ unreadCount: 0 }),
      });
    });
  });

  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  I.amOnPage('/patient/dashboard');
  NotificationPage.openDropdown();
  NotificationPage.seeEmptyNotifications();
  NotificationPage.dontSeeUnreadBadge();
}).tag('@bva').tag('@notifications').tag('NOT-V2');

Scenario('NOT-V1: Có thông báo chưa đọc → badge hiển thị số lượng', async ({ I, LoginPage, NotificationPage }) => {
  await I.usePlaywrightTo('mock unread notifications', async ({ page }) => {
    await page.route('**/api/patient/notifications', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: 'Nhắc lịch khám',
            message: 'Bạn có lịch khám vào ngày mai',
            type: 'APPOINTMENT_REMINDER_24H',
            isRead: false,
            appointmentId: 100,
            timeAgo: 'Vừa xong',
          },
          {
            id: 2,
            title: 'Thanh toán thành công',
            message: 'Giao dịch nạp tiền hoàn tất',
            type: 'PAYMENT_SUCCESS',
            isRead: false,
            appointmentId: null,
            timeAgo: '5 phút trước',
          },
        ]),
      });
    });
    await page.route('**/api/patient/notifications/unread-count', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ unreadCount: 2 }),
      });
    });
  });

  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  I.amOnPage('/patient/dashboard');
  NotificationPage.seeUnreadBadge(2);
  NotificationPage.openDropdown();
  NotificationPage.seeNotificationCount(2);
}).tag('@bva').tag('@notifications').tag('NOT-V1');
