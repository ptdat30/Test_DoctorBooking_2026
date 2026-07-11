// e2e/pages/FeedbackPage.cjs
// Page Object Model cho hệ thống Đánh giá & Phản hồi (Feedback) ở cả 3 vai trò (Patient, Doctor, Admin)

'use strict';

const { I } = inject();

module.exports = {
  // ── Locators ──────────────────────────────────────────────────────────────
  patient: {
    appointmentSelect: 'select[name="appointmentId"]',
    ratingRange:       'input[name="rating"]',
    commentArea:       'textarea[name="comment"]',
    submitBtn:         'button[type="submit"]',
    successMsg:        '//div[contains(text(), "Gửi phản hồi thành công")]',
    editBtn:           '//button[contains(., "Chỉnh sửa")]',
    cannotEdit24h:     'Hết thời hạn chỉnh sửa',
    editModalTitle:    '//h2[contains(text(), "Chỉnh sửa phản hồi")]',
    editSaveBtn:       '//div[contains(@class, "fixed")]//button[contains(., "Cập nhật")]',
  },

  doctor: {
    filterSelect: '//label[contains(., "Lọc theo sao")]/following-sibling::select | //div[contains(@class, "app-card")][.//label[contains(., "Lọc theo sao")]]//select',
    replyModalTextArea: '//div[contains(@class, "fixed")]//textarea',
    replyModalSubmit: '//div[contains(@class, "fixed")]//button[contains(., "Gửi phản hồi") or contains(., "Cập nhật")]',
  },

  admin: {
    searchInput:       'input[placeholder*="Tìm theo bệnh nhân, bác sĩ"]',
    statusFilter:      '//select[parent::div[label[contains(text(), "Trạng thái")]]]',
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  // --- Patient Actions ---
  navigateToNewFeedback() {
    I.amOnPage('/patient/feedback/new');
    I.waitInUrl('/patient/feedback/new', 10);
    I.waitForElement(this.patient.appointmentSelect, 15);
  },

  async submitFeedback(rating, comment, appointmentId = null) {
    I.waitForElement(this.patient.appointmentSelect, 15);
    if (appointmentId) {
      I.selectOption(this.patient.appointmentSelect, String(appointmentId));
    } else {
      const value = await I.executeScript(() => {
        const select = document.querySelector('select[name="appointmentId"]');
        if (select && select.options.length > 1) {
          return select.options[1].value;
        }
        return null;
      });
      if (value) {
        I.selectOption(this.patient.appointmentSelect, value);
      } else {
        throw new Error("No completed appointments found in dropdown!");
      }
    }
    // Click rating star: (//button[text()="★"])[rating]
    const starXPath = `(//button[text()="★"])[${rating}]`;
    I.waitForElement(starXPath, 10);
    I.click(starXPath);
    
    if (comment) {
      I.fillField(this.patient.commentArea, comment);
    }
    I.click(this.patient.submitBtn);
    I.waitForText('Gửi phản hồi thành công', 15);
  },

  navigateToMyFeedbacks() {
    I.amOnPage('/patient/feedbacks');
    I.waitInUrl('/patient/feedbacks', 10);
  },

  clickEditFeedback() {
    I.waitForElement(this.patient.editBtn, 15);
    I.click(this.patient.editBtn);
    I.waitForElement(this.patient.editModalTitle, 10);
  },

  submitEditFeedback(rating, comment) {
    // Chọn nút sao theo vị trí (1..5) — nút hiển thị ★ hoặc ☆ tùy rating hiện tại nên không thể lọc theo text="★"
    const starXPath = `(//div[contains(@class, "fixed")]//button[contains(@class, "text-3xl")])[${rating}]`;
    I.waitForElement(starXPath, 10);
    I.click(starXPath);
    I.clearField('//div[contains(@class, "fixed")]//textarea');
    I.fillField('//div[contains(@class, "fixed")]//textarea', comment);
    I.click(this.patient.editSaveBtn);
  },

  seeCannotEditWithin24h() {
    I.waitForText('Hết thời hạn chỉnh sửa', 10);
  },

  seeEditSuccessToast() {
    I.waitForText('Cập nhật phản hồi thành công', 10);
  },

  // --- Doctor Actions ---
  navigateToDoctorFeedbacks() {
    I.amOnPage('/doctor/feedbacks');
    I.waitInUrl('/doctor/feedbacks', 10);
    I.waitForElement(this.doctor.filterSelect, 15);
  },

  async replyToFeedback(patientName, replyText) {
    const rowXPath = `//div[contains(@class, "divide-y")]/div[.//h3[contains(text(), "${patientName}")]]`;
    I.waitForElement(rowXPath, 15);
    I.scrollTo(rowXPath);

    const replyBtnXPath = `${rowXPath}//button[contains(., "Trả lời") or contains(., "Sửa")]`;
    I.waitForElement(replyBtnXPath, 10);
    I.click(replyBtnXPath);

    I.waitForElement(this.doctor.replyModalTextArea, 10);
    I.fillField(this.doctor.replyModalTextArea, replyText);
    I.click(this.doctor.replyModalSubmit);
    I.waitForInvisible(this.doctor.replyModalTextArea, 10);
  },

  seeReplyOnDoctorPage(patientName, replyText) {
    const replyTextXPath = `//div[contains(@class, "divide-y")]/div[.//h3[contains(text(), "${patientName}")]]//p[contains(text(), "${replyText}")]`;
    I.waitForElement(replyTextXPath, 10);
    I.seeElement(replyTextXPath);
  },

  // --- Admin Actions ---
  navigateToAdminFeedbacks() {
    I.amOnPage('/admin/feedbacks');
    I.waitInUrl('/admin/feedbacks', 10);
    I.waitForElement(this.admin.searchInput, 15);
  },

  filterAdminFeedbacks(search) {
    I.clearField(this.admin.searchInput);
    I.fillField(this.admin.searchInput, search);
    I.pressKey('Enter');
  },

  async hideFeedback(patientName) {
    const hideBtnXPath = `//tbody/tr[td[contains(text(), "${patientName}")]]//button[@title="Ẩn phản hồi"]`;
    I.waitForElement(hideBtnXPath, 10);
    I.click(hideBtnXPath);
  },

  async unhideFeedback(patientName) {
    const unhideBtnXPath = `//tbody/tr[td[contains(text(), "${patientName}")]]//button[@title="Bỏ ẩn"]`;
    I.waitForElement(unhideBtnXPath, 10);
    I.click(unhideBtnXPath);
  },

  seeHiddenBadge(patientName) {
    const badgeXPath = `//tbody/tr[td[contains(text(), "${patientName}")]]//span[contains(text(), "Đã ẩn")]`;
    I.waitForElement(badgeXPath, 10);
    I.seeElement(badgeXPath);
  }
};
