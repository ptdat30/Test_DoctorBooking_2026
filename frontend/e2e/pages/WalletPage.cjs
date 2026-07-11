// e2e/pages/WalletPage.cjs
// Page Object Model cho trang Ví Sức khỏe (/patient/wallet) — UI shell redesign

'use strict';

const { I } = inject();

module.exports = {
  // ── Locators ──────────────────────────────────────────────────────────────
  balanceLabel:      '//p[contains(text(), "Số dư")]',
  balanceValue:      '//p[contains(text(), "Số dư")]/following-sibling::p[contains(@class, "font-bold")]',
  pointsCard:        '//p[contains(text(), "Điểm tích lũy")]/ancestor::div[contains(@class, "app-card")]',
  tierCard:          '//p[contains(text(), "Hạng thành viên")]/ancestor::div[contains(@class, "app-card")]',
  topUpBtn:          '//button[contains(., "Nạp tiền")]',
  tabBtnTransactions: '//button[contains(., "Lịch sử giao dịch")]',
  transactionItem:   '//div[contains(@class, "divide-y")]/div[contains(@class, "flex")]',
  transactionsList:  '//div[contains(@class, "divide-y")]',

  topUpModal: {
    amountInput:     '//div[contains(@class, "fixed")]//input[@placeholder="Nhập số tiền"]',
    quickAmount500k: '//div[contains(@class, "fixed")]//button[contains(., "500.000")]',
    confirmBtn:      '//div[contains(@class, "fixed")]//button[contains(., "Xác nhận")]',
    cancelBtn:       '//div[contains(@class, "fixed")]//button[contains(., "Hủy")]',
  },

  resultPage: {
    successTitle:    '//h1[contains(text(), "Thanh toán thành công")]',
    errorTitle:      '//h1[contains(text(), "Thanh toán thất bại")]',
    details:         '//div[contains(@class, "bg-neutral-50")]',
    backBtn:         '//button[contains(., "Quay về ví") or contains(., "Thử lại")]',
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  navigateTo() {
    I.amOnPage('/patient/wallet');
    I.waitInUrl('/patient/wallet', 10);
    I.waitForText('Số dư', 15);
    I.waitForElement(this.balanceValue, 15);
  },

  async getBalance() {
    I.waitForElement(this.balanceValue, 10);
    const balanceText = await I.grabTextFrom(this.balanceValue);
    return parseInt(balanceText.replace(/\D/g, ''), 10);
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
    const labelSelector = `//div[contains(@class, "fixed")]//input[@name="topupPayment"][@value="${method}"]/ancestor::label | //div[contains(@class, "fixed")]//input[@name="topupPayment"][@value="${method}"]/ancestor::div[contains(@class, "rounded")]`;
    I.waitForElement(`//div[contains(@class, "fixed")]//input[@name="topupPayment"][@value="${method}"]`, 10);
    I.executeScript((m) => {
      const input = document.querySelector(`input[name="topupPayment"][value="${m}"]`);
      if (input) {
        input.click();
        input.dispatchEvent(new Event('change', { bubbles: true }));
        const card = input.closest('label, div');
        if (card) card.click();
      }
    }, method);
  },

  submitTopUp() {
    I.waitForEnabled(this.topUpModal.confirmBtn, 10);
    I.click(this.topUpModal.confirmBtn);
  },

  seeConfirmDisabled() {
    I.waitForVisible(this.topUpModal.confirmBtn, 10);
    I.seeElement(`${this.topUpModal.confirmBtn}[@disabled]`);
  },

  seeConfirmEnabled() {
    I.waitForVisible(this.topUpModal.confirmBtn, 10);
    I.waitForEnabled(this.topUpModal.confirmBtn, 10);
  },

  navigateToMockCallback(success = true, amount = 100000, txnRef = 'TX-MOCK-123') {
    const code = success ? '00' : '99';
    const vnpAmount = amount * 100;
    const url = `/patient/wallet/payment/result?vnp_ResponseCode=${code}&vnp_Amount=${vnpAmount}&vnp_TransactionNo=12345678&vnp_TxnRef=${txnRef}&vnp_OrderInfo=Nap+tien+vao+vi&vnp_BankCode=NCB&vnp_PayDate=20260626213000`;
    I.amOnPage(url);
    I.waitInUrl('/patient/wallet/payment/result', 10);
  },

  seePaymentSuccess() {
    I.waitForElement(this.resultPage.successTitle, 10);
    I.see('Thanh toán thành công!');
  },

  seePaymentFailure() {
    I.waitForElement(this.resultPage.errorTitle, 10);
    I.see('Thanh toán thất bại');
  },

  seePaymentFailureToast() {
    I.waitForText('hủy', 10);
  },

  clickBackToWallet() {
    I.waitForVisible(this.resultPage.backBtn, 10);
    I.click(this.resultPage.backBtn);
    I.waitInUrl('/patient/wallet', 15);
  },

  viewTransactionsTab() {
    I.waitForVisible(this.tabBtnTransactions, 10);
    I.click(this.tabBtnTransactions);
    I.waitForText('Lịch sử giao dịch', 10);
  },

  seeEmptyTransactions() {
    I.see('Chưa có giao dịch nào');
  },

  seeLoyaltyTier(tierName) {
    I.waitForText(`Hạng ${tierName}`, 10);
  },
};
