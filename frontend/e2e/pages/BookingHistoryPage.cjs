// e2e/pages/BookingHistoryPage.cjs
// Page Object Model cho lịch sử đặt lịch (/patient/history)

'use strict';

const { I } = inject();

module.exports = {
  cancelBtn:     '//button[contains(., "Hủy lịch hẹn")]',
  statusBadge:   '.app-badge',
  successAlert:  '.border-emerald-200',

  navigateTo() {
    I.amOnPage('/patient/history');
    I.waitInUrl('/patient/history', 10);
  },

  cancelFirstAppointment() {
    I.waitForElement(this.cancelBtn, 15);
    I.click(this.cancelBtn);
    I.acceptPopup();
  },

  seeCancelSuccess() {
    I.waitForText('Hủy lịch hẹn thành công', 10);
  },

  seeStatus(status) {
    const statusLabels = {
      PENDING: 'Đang chờ',
      CONFIRMED: 'Đã xác nhận',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    };
    I.waitForText(statusLabels[status] || status, 10, this.statusBadge);
  },
};
