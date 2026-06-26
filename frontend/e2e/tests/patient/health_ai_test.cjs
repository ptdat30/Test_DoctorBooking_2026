// e2e/tests/patient/health_ai_test.cjs
// Test: Trò chuyện với Trợ lý AI và đặt lịch khám gợi ý

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Trợ lý ảo HealthAI');

let testPatient;

Before(async ({ I, LoginPage }) => {
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);

  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');
});

After(async ({ I }) => {
  if (testPatient?.username) {
    await I.deleteTestUser(testPatient.username);
  }
});

Scenario('TC-AI-01: Bệnh nhân nhận tư vấn triệu chứng từ AI và click đặt lịch khám chuyên khoa gợi ý', async ({ I, HealthAIPage }) => {
  // Mock API `/patient/ai/check-symptoms` để trả về chuyên khoa Tim Mạch (Cardiology)
  // Tránh phụ thuộc vào Groq API key hay mạng ngoài (Anti-Flaky)
  await I.usePlaywrightTo('mock AI API response', async ({ page }) => {
    await page.route('**/api/patient/ai/check-symptoms', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestedSpecialization: 'Cardiology',
          riskLevel: 'Low',
          advice: 'Dựa trên mô tả triệu chứng của bạn (đau ngực trái lan ra vai), tôi khuyên bạn nên khám chuyên khoa Tim mạch sớm để được bác sĩ kiểm tra và điện tâm đồ.',
          reason: 'Nghi ngờ triệu chứng liên quan đến tim mạch',
          homeRemedies: [
            'Hạn chế vận động mạnh, nghỉ ngơi tại chỗ.',
            'Theo dõi nhịp tim và huyết áp.',
            'Uống một chút nước ấm và ngồi thả lỏng.'
          ]
        })
      });
    });
  });

  HealthAIPage.navigateTo();

  // Nhập triệu chứng và gửi tin nhắn
  HealthAIPage.sendMessage('Tôi bị đau ngực trái lan ra bả vai trái');

  // Chờ trợ lý AI phản hồi và kiểm tra nội dung
  HealthAIPage.waitForAIResponse();
  HealthAIPage.seeTextInAIChat('tôi khuyên bạn nên khám chuyên khoa Tim mạch');
  HealthAIPage.seeTextInAIChat('Nghi ngờ triệu chứng liên quan đến tim mạch');

  // Click vào nút gợi ý đặt lịch chuyên khoa -> Chuyển đến trang tìm bác sĩ chuyên khoa đó
  HealthAIPage.clickBookingSuggestion();
  
  // Xác nhận đã chuyển hướng đến trang doctors với query search tương ứng
  I.seeInCurrentUrl('/patient/doctors');
  // Chờ bộ lọc áp dụng
  I.waitForElement('#doctor-search-input', 10);
  I.seeInField('#doctor-search-input', 'Cardiology');
}).tag('@ai').tag('@patient');
