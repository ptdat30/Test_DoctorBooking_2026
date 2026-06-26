Feature('Login Flow');

Scenario('Patient logs in with invalid credentials', ({ I }) => {
  I.amOnPage('/login');
  I.see('Đăng nhập hệ thống');
  
  // Fill invalid credentials
  I.fillField('#login-username', 'patient1');
  I.fillField('#login-password', 'wrongpassword');
  I.click('Đăng nhập');
  
  // See error message
  I.waitForElement('.bg-rose-50', 5); // Đợi hộp thoại lỗi xuất hiện
});

Scenario('Patient logs in with valid credentials', ({ I }) => {
  I.amOnPage('/login');
  
  // Fill valid credentials (seeded patient1)
  I.fillField('#login-username', 'patient1');
  I.fillField('#login-password', 'password123');
  I.click('Đăng nhập');
  
  // Wait for redirect to patient dashboard
  I.waitForElement('.patient-layout', 10);
  I.seeInCurrentUrl('/patient/dashboard');
  I.see('Bảng điều khiển');
});
