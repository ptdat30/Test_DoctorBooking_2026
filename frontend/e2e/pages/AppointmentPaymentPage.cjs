// e2e/pages/AppointmentPaymentPage.cjs
// Page Object Model cho kết quả thanh toán lịch hẹn VNPAY

'use strict';

const { I } = inject();

module.exports = {
  successMessage: 'Thanh toán phí khám bệnh thành công',
  failureMessage: 'Bạn đã hủy giao dịch',
  detailsHeading: 'Chi tiết giao dịch',

  navigateToResult({ success = true, appointmentId = 501, amount = 300000 } = {}) {
    const code = success ? '00' : '24';
    const vnpAmount = amount * 100;
    const url = `/patient/appointment/payment/result?code=${code}&appointmentId=${appointmentId}&vnp_Amount=${vnpAmount}&vnp_TransactionNo=TX-APT-E2E&vnp_BankCode=NCB&vnp_PayDate=20260626213000`;
    I.amOnPage(url);
    I.waitInUrl('/patient/appointment/payment/result', 10);
  },

  seePaymentSuccess() {
    I.waitForText(this.successMessage, 10);
    I.see(this.detailsHeading);
  },

  seePaymentFailure() {
    I.waitForText(this.failureMessage, 10);
    I.see(this.detailsHeading);
  },

  seeAppointmentId(id) {
    I.waitForText(this.detailsHeading, 10);
    I.see(`#${id}`);
  },
};
