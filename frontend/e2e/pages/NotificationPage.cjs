// e2e/pages/NotificationPage.cjs
// Page Object Model cho dropdown thông báo (ShellNotifications)

'use strict';

const { I } = inject();

module.exports = {
  root:              '[data-notifications-root]',
  bell:              'button[aria-label="Thông báo"]',
  badge:             '[data-notifications-root] span.bg-rose-500',
  dropdown:          '[data-notifications-root] .absolute',
  emptyState:        '//p[contains(text(), "Chưa có thông báo")]',
  notificationItem:  '[data-notifications-root] button.w-full.text-left',
  markAllReadBtn:    '//button[contains(., "Đánh dấu tất cả đã đọc")]',

  openDropdown() {
    I.waitForElement(this.bell, 10);
    I.click(this.bell);
    I.waitForVisible(this.dropdown, 10);
  },

  seeUnreadBadge(count) {
    I.waitForElement(this.badge, 10);
    I.see(String(count), this.badge);
  },

  dontSeeUnreadBadge() {
    I.dontSeeElement(this.badge);
  },

  seeEmptyNotifications() {
    I.waitForElement(this.emptyState, 10);
    I.see('Chưa có thông báo');
  },

  seeNotificationCount(n) {
    I.waitNumberOfVisibleElements(this.notificationItem, n, 10);
  },

  markAllAsRead() {
    I.waitForElement(this.markAllReadBtn, 10);
    I.click(this.markAllReadBtn);
  },
};
