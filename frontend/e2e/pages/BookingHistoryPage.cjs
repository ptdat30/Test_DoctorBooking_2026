// e2e/pages/BookingHistoryPage.cjs
// Page Object Model cho lịch sử đặt lịch (/patient/history)

'use strict';

const { I } = inject();

module.exports = {
  cancelBtn:     'button.action-btn.cancel',
  statusBadge:   '.status-badge',
  successAlert:  '.alert-success',

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
    I.waitForText('Hủy lịch hẹn thành công', 10, this.successAlert);
  },

  seeStatus(status) {
    I.waitForText(status, 10, this.statusBadge);
  },
};
