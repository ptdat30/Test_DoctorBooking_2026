// e2e/tests/patient/wallet_test.cjs
// Test: Ví sức khỏe, nạp tiền và mô phỏng phản hồi kết quả thanh toán VNPAY

'use strict';

const assert = require('assert');
const factory = require('../../data/factory.cjs');

Feature('Ví sức khỏe (Health Wallet)');

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

Scenario('TC-WALLET-01: Bệnh nhân nạp tiền vào ví -> chuyển hướng và xử lý callback VNPAY thành công', async ({ I, WalletPage }) => {
  let mockBalance = 150000;
  let mockTransactions = [
    {
      id: 101,
      amount: 150000,
      transactionType: 'DEPOSIT',
      status: 'COMPLETED',
      description: 'Nạp số dư ban đầu',
      paymentMethod: 'VNPAY',
      createdAt: '2026-06-25T14:30:00Z'
    }
  ];

  // Intercept và Mock các API của Wallet để đảm bảo chạy độc lập, chống Flaky
  await I.usePlaywrightTo('mock wallet stateful API', async ({ page }) => {
    // 1. Mock GET wallet info
    await page.route('**/api/patient/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          balance: mockBalance,
          loyaltyPoints: 150,
          loyaltyTier: 'BRONZE'
        })
      });
    });

    // 2. Mock GET transactions
    await page.route(url => url.pathname.includes('/api/patient/wallet/transactions') || url.pathname.includes('/api/patient/transactions'), route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transactions: mockTransactions,
          total: mockTransactions.length
        })
      });
    });

    // 3. Mock POST top-up
    await page.route('**/api/patient/wallet/top-up', route => {
      // Khi nạp tiền thành công, cập nhật trạng thái mock dữ liệu
      mockBalance += 500000;
      mockTransactions.unshift({
        id: 102,
        amount: 500000,
        transactionType: 'DEPOSIT',
        status: 'COMPLETED',
        description: 'Nạp tiền vào ví',
        paymentMethod: 'VNPAY',
        createdAt: new Date().toISOString()
      });

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          paymentUrl: 'http://localhost:5173/patient/wallet/payment/result?vnp_ResponseCode=00&vnp_Amount=50000000&vnp_TransactionNo=12345678&vnp_TxnRef=TX-MOCK-999&vnp_OrderInfo=Nap+tien+vao+vi&vnp_BankCode=NCB&vnp_PayDate=20260626213000'
        })
      });
    });
  });

  // Act: 1. Truy cập Ví sức khỏe
  WalletPage.navigateTo();
  
  // Xác nhận số dư ban đầu
  const initialBalance = await WalletPage.getBalance();
  assert.strictEqual(initialBalance, 150000);

  // Act: 2. Nhấn nạp tiền
  WalletPage.openTopUpModal();
  WalletPage.selectQuickAmount500k();
  WalletPage.selectPaymentMethod('VNPAY');
  WalletPage.submitTopUp();

  // Đợi app chuyển hướng sang mock VNPAY page (chính là redirect của callback result page)
  I.waitInUrl('/patient/wallet/payment/result', 15);

  // Assert: 3. Thấy thông báo thành công trên trang kết quả
  WalletPage.seePaymentSuccess();
  I.see('500.000 VNĐ', '.result-details');
  I.see('TX-MOCK-999', '.result-details');

  // Act: 4. Nhấn nút "Quay về ví" để refresh lại số dư và lịch sử giao dịch
  WalletPage.clickBackToWallet();

  // Assert: 5. Số dư mới được cập nhật trên giao diện Ví
  const newBalance = await WalletPage.getBalance();
  assert.strictEqual(newBalance, 650000);

  // Xem tab lịch sử và xác nhận giao dịch mới được ghi nhận
  WalletPage.viewTransactionsTab();
  I.see('+500.000 VNĐ', '.transactions-list');
  I.see('Nạp tiền vào ví', '.transactions-list');
}).tag('@wallet').tag('@patient');

Scenario('TC-WALLET-02: Bệnh nhân nạp tiền bị hủy bởi người dùng -> Hiển thị thông báo lỗi', async ({ I, WalletPage }) => {
  let mockBalance = 200000;

  // Intercept và Mock các API của Wallet
  await I.usePlaywrightTo('mock wallet stateful API for failed scenario', async ({ page }) => {
    // 1. Mock GET wallet info
    await page.route('**/api/patient/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          balance: mockBalance,
          loyaltyPoints: 200,
          loyaltyTier: 'BRONZE'
        })
      });
    });

    // 2. Mock GET transactions - trả về danh sách rỗng
    await page.route(url => url.pathname.includes('/api/patient/wallet/transactions') || url.pathname.includes('/api/patient/transactions'), route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transactions: [],
          total: 0
        })
      });
    });

    // 3. Mock POST top-up với response code 24 (hủy giao dịch)
    await page.route('**/api/patient/wallet/top-up', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          paymentUrl: 'http://localhost:5173/patient/wallet/payment/result?vnp_ResponseCode=24&vnp_Amount=50000000&vnp_TransactionNo=12345678&vnp_TxnRef=TX-MOCK-CANCEL-123&vnp_OrderInfo=Nap+tien+vao+vi&vnp_BankCode=NCB&vnp_PayDate=20260626213000'
        })
      });
    });
  });

  // Act: 1. Truy cập Ví sức khỏe
  WalletPage.navigateTo();

  // Xác nhận số dư ban đầu
  const initialBalance = await WalletPage.getBalance();
  assert.strictEqual(initialBalance, 200000);

  // Act: 2. Nhấn nạp tiền và chọn mock VNPAY response 24 (hủy giao dịch)
  WalletPage.openTopUpModal();
  WalletPage.selectQuickAmount500k();
  WalletPage.selectPaymentMethod('VNPAY');
  WalletPage.submitTopUp();

  // Đợi app chuyển hướng sang trang kết quả với response code 24
  I.waitInUrl('/patient/wallet/payment/result', 15);

  // Assert: 3. Thấy thông báo thất bại trên trang kết quả
  WalletPage.seePaymentFailure();

  // Assert: 4. Kiểm tra toast error xuất hiện với message mong đợi
  I.waitForElement('.Toastify__toast--error', 5);
  I.see('Giao dịch nạp tiền đã bị hủy bởi người dùng hoặc thất bại!', '.Toastify__toast-body');

  // Act: 5. Nhấn "Thử lại" để quay về ví
  WalletPage.clickBackToWallet();

  // Assert: 6. Số dư không thay đổi (không có tiền được nạp)
  const finalBalance = await WalletPage.getBalance();
  assert.strictEqual(finalBalance, 200000);

  // Assert: 7. Không có giao dịch mới trong lịch sử
  WalletPage.viewTransactionsTab();
  I.dontSee('500.000 VNĐ', '.transactions-list');
  I.dontSee('Nạp tiền vào ví', '.transactions-list');
}).tag('@wallet').tag('@patient');
