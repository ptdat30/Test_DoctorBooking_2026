// e2e/pages/AppointmentPaymentPage.cjs
// Page Object Model cho kết quả thanh toán lịch hẹn VNPAY

'use strict';

const { I } = inject();

module.exports = {
  successTitle: '.result-title.success',
  errorTitle:   '.result-title.error',
  detailsCard:  '.transaction-details-card',

  navigateToResult({ success = true, appointmentId = 501, amount = 300000 } = {}) {
    const code = success ? '00' : '24';
    const vnpAmount = amount * 100;
    const url = `/patient/appointment/payment/result?code=${code}&appointmentId=${appointmentId}&vnp_Amount=${vnpAmount}&vnp_TransactionNo=TX-APT-E2E&vnp_BankCode=NCB&vnp_PayDate=20260626213000`;
    I.amOnPage(url);
    I.waitInUrl('/patient/appointment/payment/result', 10);
  },

  seePaymentSuccess() {
    I.waitForElement(this.successTitle, 10);
    I.see('Thanh toán phí khám bệnh thành công', this.successTitle);
  },

  seePaymentFailure() {
    I.waitForElement(this.errorTitle, 10);
    I.see('Bạn đã hủy giao dịch', this.errorTitle);
  },

  seeAppointmentId(id) {
    I.waitForElement(this.detailsCard, 10);
    I.see(`#${id}`, this.detailsCard);
  },
};
