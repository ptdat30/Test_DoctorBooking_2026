// e2e/pages/HealthAIPage.cjs
// Page Object Model cho trang Trợ lý Sức khỏe AI (/patient/healthlyai)

'use strict';

const { I } = inject();

module.exports = {
  // ── Locators ──────────────────────────────────────────────────────────────
  chatInput:       'input.chat-input',
  sendBtn:         'button[type="submit"].send-btn',
  welcomeScreen:   '.welcome-screen',
  aiMessage:       '.message.ai',
  typingIndicator: '.typing-indicator',
  bookingBtn:      '//button[contains(., "Đặt lịch khám")][contains(., "ngay")]',

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
    // Chờ ít nhất một tin nhắn từ AI xuất hiện (mock phản hồi nhanh nên bỏ qua typing indicator)
    I.waitForElement(this.aiMessage, 15);
  },

  clickBookingSuggestion() {
    I.waitForElement(this.bookingBtn, 10);
    I.click(this.bookingBtn);
    I.waitInUrl('/patient/doctors', 15);
  },

  seeTextInAIChat(text) {
    I.waitForText(text, 10, this.aiMessage);
  }
};
