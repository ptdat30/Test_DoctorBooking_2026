// e2e/pages/NotificationPage.cjs
// Page Object Model cho dropdown thông báo trên PatientLayout

'use strict';

const { I } = inject();

module.exports = {
  bell:              '.notification-bell',
  badge:             '.notification-badge',
  dropdown:          '.notification-dropdown',
  emptyState:        '.notification-empty',
  notificationItem:  '.notification-item',
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
    I.see('Chưa có thông báo nào', this.emptyState);
  },

  seeNotificationCount(n) {
    I.waitNumberOfVisibleElements(this.notificationItem, n, 10);
  },

  markAllAsRead() {
    I.waitForElement(this.markAllReadBtn, 10);
    I.click(this.markAllReadBtn);
  },
};
