// e2e/pages/HealthAIPage.cjs
// Page Object Model cho trang Trợ lý Sức khỏe AI (/patient/healthlyai)

'use strict';

const { I } = inject();

module.exports = {
  // ── Locators ──────────────────────────────────────────────────────────────
  chatInput:       'input[placeholder*="Đau đầu"]',
  sendBtn:         'form button[type="submit"]',
  welcomeScreen:   '//h2[contains(text(), "Xin chào")]',
  aiMessage:       '//div[contains(text(), "AI")]/following-sibling::div | //div[contains(@class, "rounded-2xl")]',
  bookingBtn:      '//button[contains(., "Đặt lịch khám")]',

  // ── Actions ───────────────────────────────────────────────────────────────

  navigateTo() {
    I.amOnPage('/patient/healthlyai');
    I.waitInUrl('/patient/healthlyai', 10);
    I.waitForElement(this.chatInput, 15);
  },

  sendMessage(text) {
    I.waitForElement(this.chatInput, 10);
    I.fillField(this.chatInput, text);
    I.click(this.sendBtn);
  },

  waitForAIResponse() {
    // Chờ tin nhắn AI (bubble bên trái có nhãn AI hoặc nội dung phản hồi)
    I.waitForElement('//div[contains(@class, "rounded-full")][contains(text(), "AI")]', 15);
  },

  clickBookingSuggestion() {
    I.waitForElement(this.bookingBtn, 10);
    I.click(this.bookingBtn);
    I.waitInUrl('/patient/doctors', 15);
  },

  seeTextInAIChat(text) {
    I.waitForText(text, 10);
  },

  seeSendDisabled() {
    I.waitForElement(this.sendBtn, 10);
    I.seeElement(`${this.sendBtn}[disabled]`);
  },
};
