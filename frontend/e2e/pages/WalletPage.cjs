// e2e/pages/WalletPage.cjs
// Page Object Model cho trang Ví Sức khỏe (/patient/wallet)

'use strict';

const { I } = inject();

module.exports = {
  // ── Locators ──────────────────────────────────────────────────────────────
  balanceValue:      '.wallet-card.balance .card-value',
  topUpBtn:          '//button[contains(@class, "action-btn")][contains(text(), "Nạp tiền")]',
  tabBtnTransactions: '//button[contains(@class, "tab-btn")][contains(text(), "Lịch sử giao dịch")]',
  transactionItem:   '.transaction-item',

  topUpModal: {
    amountInput:     'input.topup-amount-input',
    quickAmount500k: '//button[contains(@class, "topup-quick-btn")][contains(., "500.000")]',
    momoRadio:       'input[value="MOMO"]',
    vnpayRadio:      'input[value="VNPAY"]',
    confirmBtn:      'button.topup-btn-confirm',
    cancelBtn:       'button.topup-btn-cancel',
  },

  resultPage: {
    successTitle:    '.result-title.success',
    errorTitle:      '.result-title.error',
    backBtn:         'button.btn-back-to-wallet',
    viewTxnBtn:      'button.btn-view-transactions',
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  navigateTo() {
    I.amOnPage('/patient/wallet');
    I.waitInUrl('/patient/wallet', 10);
    I.waitForElement(this.balanceValue, 15);
  },

  async getBalance() {
    I.waitForElement(this.balanceValue, 10);
    const balanceText = await I.grabTextFrom(this.balanceValue);
    // Trích xuất số từ chuỗi "500.000 VNĐ" -> 500000
    const amount = parseInt(balanceText.replace(/\D/g, ''));
    return amount;
  },

  openTopUpModal() {
    I.waitForVisible(this.topUpBtn, 10);
    I.click(this.topUpBtn);
    I.waitForVisible(this.topUpModal.amountInput, 10);
  },

  selectQuickAmount500k() {
    I.waitForVisible(this.topUpModal.quickAmount500k, 10);
    I.click(this.topUpModal.quickAmount500k);
  },

  fillCustomAmount(amount) {
    I.waitForVisible(this.topUpModal.amountInput, 10);
    I.clearField(this.topUpModal.amountInput);
    I.fillField(this.topUpModal.amountInput, String(amount));
  },

  selectPaymentMethod(method) {
    const labelSelector = `//label[contains(@class, "topup-payment-option")][.//input[@value="${method}"]]`;
    I.waitForElement(labelSelector, 10);
    I.click(labelSelector);
  },

  submitTopUp() {
    I.waitForEnabled(this.topUpModal.confirmBtn, 10);
    I.click(this.topUpModal.confirmBtn);
  },

  navigateToMockCallback(success = true, amount = 100000, txnRef = 'TX-MOCK-123') {
    const code = success ? '00' : '99';
    // Số tiền trong VNPAY callback nhân 100
    const vnpAmount = amount * 100;
    const url = `/patient/wallet/payment/result?vnp_ResponseCode=${code}&vnp_Amount=${vnpAmount}&vnp_TransactionNo=12345678&vnp_TxnRef=${txnRef}&vnp_OrderInfo=Nap+tien+vao+vi&vnp_BankCode=NCB&vnp_PayDate=20260626213000`;
    I.amOnPage(url);
    I.waitInUrl('/patient/wallet/payment/result', 10);
  },

  seePaymentSuccess() {
    I.waitForElement(this.resultPage.successTitle, 10);
    I.see('Thanh toán thành công!', this.resultPage.successTitle);
  },

  seePaymentFailure() {
    I.waitForElement(this.resultPage.errorTitle, 10);
    I.see('Thanh toán thất bại', this.resultPage.errorTitle);
  },

  clickBackToWallet() {
    I.waitForVisible(this.resultPage.backBtn, 10);
    I.click(this.resultPage.backBtn);
    I.waitInUrl('/patient/wallet', 15);
  },

  viewTransactionsTab() {
    I.waitForVisible(this.tabBtnTransactions, 10);
    I.click(this.tabBtnTransactions);
    I.waitForElement(this.transactionItem, 10);
  }
};
