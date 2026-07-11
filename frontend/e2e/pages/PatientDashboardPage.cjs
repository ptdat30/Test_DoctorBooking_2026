// e2e/pages/PatientDashboardPage.js
// Page Object Model cho trang Patient Dashboard (/patient/dashboard)

'use strict';

const { I } = inject();

module.exports = {
  // ── Locators ──────────────────────────────────────────────────────────────
  // Dựa trên PatientDashboard.jsx
  layout: {
    sidebar:    '.app-shell-sidebar, .sidebar, [class*="sidebar"]',
    mainContent: '.main-content, [class*="main-content"], main',
    welcomeMsg:  'h1, h2, [class*="welcome"]',
  },

  stats: {
    container:    'button.app-card, .app-card',
    appointmentCount: '[class*="appointment"] [class*="count"], [class*="stat"]',
  },

  appointments: {
    upcomingList:  '[class*="upcoming"], [class*="appointment-list"]',
    appointmentCard: '[class*="appointment-card"], [class*="booking-card"]',
    noDataMsg:     '[class*="empty"], [class*="no-data"]',
  },

  nav: {
    newBookingBtn:  'a[href*="new-booking"], button[class*="booking"]',
    logoutBtn:      'button[class*="logout"], [class*="logout"]',
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Đợi dashboard load hoàn toàn sau khi login
   */
  waitForLoad() {
    I.waitInUrl('/patient/dashboard', 15);
    // Đợi sidebar xuất hiện – dấu hiệu app đã render xong
    I.waitForElement(this.layout.sidebar, 10);
  },

  /**
   * Kiểm tra dashboard hiển thị đúng
   */
  seeDashboardLoaded() {
    I.dontSee('404');
    I.dontSee('Unauthorized');
    I.seeInCurrentUrl('/patient/dashboard');
  },

  /**
   * Kiểm tra có stats card
   */
  seeStatsSection() {
    I.waitForText('Lịch hẹn sắp tới', 10);
    I.waitForText('Tổng lịch hẹn', 5);
  },

  /**
   * Click vào button Đặt lịch mới
   */
  clickNewBooking() {
    I.click(this.nav.newBookingBtn);
    I.waitForNavigation({ timeout: 5000 });
  },

  /**
   * Logout
   */
  logout() {
    I.click(this.nav.logoutBtn);
    I.waitForNavigation({ timeout: 5000 });
  },
};
