Feature('Login Flow');

Scenario('Patient logs in with invalid credentials', ({ I }) => {
  I.amOnPage('/login');
  I.see('Đăng nhập hệ thống');
  
  // Fill invalid credentials
  I.fillField('#linear-login-username', 'patient1');
  I.fillField('#linear-login-password', 'wrongpassword');
  I.click('Đăng nhập');
  
  // See error message
  I.waitForText('Đăng nhập thất bại', 5);
});

Scenario('Patient logs in with valid credentials', ({ I }) => {
  I.amOnPage('/login');
  
  // Fill valid credentials (seeded patient1)
  I.fillField('#linear-login-username', 'patient1');
  I.fillField('#linear-login-password', 'password123');
  I.click('Đăng nhập');
  
  // Wait for redirect to patient dashboard
  I.waitForElement('.patient-layout', 10);
  I.seeInCurrentUrl('/patient/dashboard');
  I.see('Bảng điều khiển');
});
