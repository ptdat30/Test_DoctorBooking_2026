# AI Context Guide: Frontend End-to-End (E2E) Testing Strategy
**Vai trò**: Lead Frontend Test Engineer
**Mục đích**: Tài liệu định hướng thiết kế, xây dựng và bảo trì tầng kiểm thử End-to-End (E2E) UI. AI Agent bắt buộc phải tuân thủ chuẩn mực BDD (Behavior-Driven Development) và các kỹ thuật xử lý bất đồng bộ giao diện khi thao tác với hệ thống.

---

## 1. KIẾN TRÚC TẦNG E2E (E2E Architecture)
Dự án sử dụng sự kết hợp giữa **CodeceptJS** (Framework điều phối chuẩn BDD) và **Playwright** (Engine ẩn phía dưới chuyên xử lý browser).
- **Lý do chọn CodeceptJS**: Cung cấp cú pháp đọc hiểu dạng "hành vi người dùng" (VD: Tôi làm gì, Tôi thấy gì), che giấu sự phức tạp của các lệnh async/await thuần túy.
- **Lý do chọn Playwright**: Tốc độ khởi chạy cực nhanh, hỗ trợ bắt sự kiện DOM chính xác và chạy ổn định ở chế độ Chromium Headless trên hệ thống CI/CD (GitHub Actions).

---

## 2. QUY ƯỚC VIẾT KỊCH BẢN BDD (Gherkin/CodeceptJS Style)
Kịch bản test phải mô phỏng chính xác luồng thao tác của người dùng cuối. 
**Quy tắc bất đồng bộ (Asynchronous UI Rules)**: Không bao giờ dùng `I.wait(số_giây_cứng)`. Bắt buộc phải dùng `I.waitForElement()`, `I.waitForText()`, `I.waitForNavigation()` để đảm bảo tính ổn định (tránh Flaky tests do mạng chậm hoặc render React chậm).

### Code mẫu chuẩn mực: Đăng nhập và Đặt lịch khám
Dưới đây là mã nguồn JS hiện đại (Modern JavaScript) thực tế minh họa một Scenario hoàn chỉnh:

```javascript
// frontend/e2e/booking_test.js
const { faker } = require('@faker-js/faker/locale/vi'); // Tích hợp Faker bản địa hóa tiếng Việt

Feature('Patient Booking Workflow');

Scenario('Đăng nhập thành công và Đặt lịch khám bệnh', async ({ I }) => {
    // 1. Điều hướng và Đăng nhập
    I.amOnPage('/login');
    I.waitForElement('input[name="email"]', 5);
    
    I.fillField('input[name="email"]', 'patient1@doctorbooking.com');
    I.fillField('input[name="password"]', 'password123');
    I.click('button[type="submit"]');
    
    // 2. Chờ xử lý bất đồng bộ và kiểm tra chuyển hướng
    I.waitForNavigation('/patient/dashboard', 10);
    I.waitForText('Bảng điều khiển', 5, '.sidebar-menu');

    // 3. Thực hiện thao tác đặt lịch với Dữ liệu giả (Dynamic Mock Data)
    I.click('Đặt lịch khám');
    I.waitForElement('form.booking-form', 5);

    // Sinh dữ liệu động bằng Faker.js
    const randomName = faker.person.fullName();
    const randomPhone = faker.phone.number('09########');
    const randomReason = 'Khám tổng quát định kỳ - ' + faker.lorem.sentence(3);

    I.fillField('input[name="patientName"]', randomName);
    I.fillField('input[name="phoneNumber"]', randomPhone);
    I.selectOption('select[name="departmentId"]', 'Khoa Tim Mạch');
    I.fillField('textarea[name="reason"]', randomReason);
    
    // 4. Submit và Assert kết quả cuối cùng
    I.click('Xác nhận đặt lịch');
    
    // Đợi Toast Notification hoặc Popup thành công
    I.waitForElement('.toast-success', 10);
    I.see('Đặt lịch khám thành công', '.toast-success');
});
```

---

## 3. CHIẾN LƯỢC SINH DỮ LIỆU GIẢ (Dynamic Mock Data)
Tuyệt đối không hardcode dữ liệu (như nhập tên cứng "Nguyễn Văn A" trong nhiều test case) dẫn đến lỗi trùng lặp dữ liệu trong Database hoặc validation lỗi.

- Sử dụng **Faker.js** module `@faker-js/faker/locale/vi` để lấy đúng định dạng chuẩn của Việt Nam.
- **Email doanh nghiệp**: `faker.internet.email({ provider: 'doctorbooking.com' })`
- **Số điện thoại**: Định dạng chuẩn `09xxxxxxxx` (Dùng `faker.phone.number('09########')`)
- **CCCD giả lập**: Sinh ngẫu nhiên chuỗi 12 số `faker.string.numeric(12)`.

---

## 4. CẤU HÌNH SCRIPTS TRONG PACKAGE.JSON
Để các nhà phát triển và CI/CD có thể dễ dàng chạy bộ E2E Test, AI phải cấu hình các lệnh ngắn gọn (alias) vào file `package.json`.

```json
{
  "name": "frontend",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "e2e": "codeceptjs run --steps --config codecept.conf.cjs",
    "e2e:headless": "cross-env HEADLESS=true codeceptjs run --steps --config codecept.conf.cjs",
    "e2e:parallel": "cross-env HEADLESS=true codeceptjs run-workers 2 --config codecept.conf.cjs",
    "e2e:report": "allure generate e2e/output/allure-results --clean -o e2e/output/allure-report && allure open e2e/output/allure-report"
  },
  "devDependencies": {
    "codeceptjs": "^3.7.9",
    "playwright": "^1.61.1",
    "@faker-js/faker": "^9.9.0",
    "cross-env": "^7.0.3",
    "allure-commandline": "^2.43.0"
  }
}
```
*Ghi chú*: Sử dụng `cross-env HEADLESS=true` để tuỳ biến trạng thái có hiển thị giao diện hay không khi file config đọc biến môi trường.

---

## 5. TRÍCH XUẤT BÁO CÁO VỚI ALLURE REPORT
Báo cáo kiểm thử E2E cần cung cấp cái nhìn trực quan, bao gồm tổng số test pass/fail và đặc biệt là **Screenshot đính kèm khi Fail**.

1. **Tích hợp Plugin**: Đảm bảo file cấu hình `codecept.conf.cjs` đã khai báo plugin:
```javascript
plugins: {
  allure: {
    enabled: true,
    require: '@codeceptjs/allure-legacy',
    outputDir: './e2e/output/allure-results'
  },
  screenshotOnFail: {
    enabled: true // Tự động chụp màn hình đính kèm Allure khi lỗi
  }
}
```

2. **Quy trình sinh báo cáo**:
- Bước 1: Chạy test để sinh file XML/JSON kết quả (Lệnh: `npm run e2e:headless`).
- Bước 2: Build HTML Report và tự động mở lên trình duyệt (Lệnh: `npm run e2e:report`).
- Thư mục `e2e/output` bắt buộc phải đưa vào `.gitignore` để không push rác lên Git repository.

---

## 6. HƯỚNG DẪN CHẠY KIỂM THỬ (How to run tests)

Để chạy lại các kịch bản kiểm thử E2E trong dự án, bạn cần mở Terminal tại thư mục gốc của dự án frontend (nơi chứa file `package.json`) và thực hiện các lệnh sau:

1. **Cài đặt thư viện (nếu chưa cài):**
   ```bash
   npm install
   ```

2. **Chạy E2E Test ở chế độ có giao diện (UI Mode):**
   *Dùng để quan sát trực tiếp các thao tác kiểm thử trên trình duyệt.*
   ```bash
   npm run e2e
   ```

3. **Chạy E2E Test ở chế độ ẩn (Headless Mode):**
   *Không bật giao diện trình duyệt, chạy ngầm với tốc độ nhanh hơn (khuyên dùng cho CI/CD).*
   ```bash
   npm run e2e:headless
   ```

4. **Chạy song song nhiều Test Worker (Parallel Mode):**
   *Giúp tiết kiệm thời gian khi có quá nhiều kịch bản test.*
   ```bash
   npm run e2e:parallel
   ```

5. **Xuất và xem báo cáo kết quả (Allure Report):**
   *Tạo và mở báo cáo HTML trực quan, bao gồm cả hình ảnh chụp màn hình nếu có lỗi xảy ra.*
   ```bash
   npm run e2e:report
   ```

---

## 7. XỬ LÝ SỰ CỐ & VẤN ĐỀ THƯỜNG GẶP (Troubleshooting)

### 7.1 Lỗi "Support object undefined is not defined"
**Nguyên nhân**: Chưa import các file Page Object (`HomePage`, `LoginPage`, `RegisterPage`,...) vào khối `include` trong file cấu hình `codecept.conf.cjs`.
**Khắc phục**: Mở file `codecept.conf.cjs` và khai báo đường dẫn tương ứng với từng Page Object.

### 7.2 Lỗi Mất Đồng Bộ CSS Selector (UI Elements Not Found)
**Nguyên nhân**: Khi update component giao diện (ví dụ chuyển sang Form dùng chung `AuthUnified.jsx`), các HTML `id` hoặc `class` cũ bị mất đi khiến bài test bị Timeout (không tìm thấy DOM).
**Khắc phục**: Bổ sung lại chính xác các locator class/id mà thư mục `e2e/pages/` đang expect (VD: `id="login-username"`, `.auth-submit-btn`, `.error-message`). Giao diện Code React bắt buộc phải đồng bộ ID/Class với kịch bản kiểm thử.

### 7.3 Lỗi "Timeout waitForNavigation" ở bước Redirect sau khi Login
**Nguyên nhân**: Các kịch bản test có gọi hàm `I.createTestUser` để Seed dữ liệu giả. Nếu hàm này trong `e2e/steps_file.cjs` chưa được cấu hình gọi trực tiếp xuống API Backend, tài khoản test sẽ không thực sự tồn tại. Khi đó Frontend Submit form sẽ nhận về 401 Unauthorized từ Backend và không thể tự động Redirect trang như kịch bản mong muốn.
**Khắc phục**: Yêu cầu Dev/QA viết logic gọi API tạo dữ liệu bằng REST Helper vào trong các hàm mock data của `steps_file.cjs`.

---

## 8. CÁC PAGE OBJECTS & KỊCH BẢN BỔ SUNG (Added Page Objects & E2E Scenarios)

Để mở rộng độ bao phủ kiểm thử E2E cho các luồng chức năng nâng cao, dự án đã bổ sung thêm các Page Objects và bộ Test Suites hoàn chỉnh dưới đây:

### 8.1 Danh sách Page Objects mới (POM Layer)
*   **[ProfilePage.cjs](file:///c:/Users/DAT/OneDrive%20-%20ut.edu.vn/Documents/Desktop/Repo/frontend/e2e/pages/ProfilePage.cjs)**: Quản lý thông tin hồ sơ bệnh nhân, thay đổi mật khẩu và cập nhật thông tin liên hệ khẩn cấp (SOS).
*   **[FeedbackPage.cjs](file:///c:/Users/DAT/OneDrive%20-%20ut.edu.vn/Documents/Desktop/Repo/frontend/e2e/pages/FeedbackPage.cjs)**: Tích hợp các hành động đánh giá lịch khám (Bệnh nhân), trả lời đánh giá (Bác sĩ), và quản lý/ẩn phản hồi (Admin).
*   **[HealthAIPage.cjs](file:///c:/Users/DAT/OneDrive%20-%20ut.edu.vn/Documents/Desktop/Repo/frontend/e2e/pages/HealthAIPage.cjs)**: Quản lý các tương tác với chatbot Trợ lý sức khỏe AI, gửi tin nhắn triệu chứng và click nút gợi ý đặt lịch chuyên khoa.
*   **[WalletPage.cjs](file:///c:/Users/DAT/OneDrive%20-%20ut.edu.vn/Documents/Desktop/Repo/frontend/e2e/pages/WalletPage.cjs)**: Quản lý ví sức khỏe, nạp tiền và mô phỏng redirect callback thanh toán từ cổng VNPAY.

### 8.2 Các kịch bản kiểm thử E2E mới (Test Layer)
*   **Hồ sơ bệnh nhân (`patient/profile_test.cjs`)**:
    *   **TC-PROFILE-01**: Bệnh nhân cập nhật thành công các thông tin cá nhân và kiểm tra hiển thị đúng trên giao diện.
    *   **TC-PROFILE-02**: Bệnh nhân đổi mật khẩu thành công, đăng xuất và đăng nhập lại thành công bằng mật khẩu mới.
    *   **TC-PROFILE-03**: Bệnh nhân đổi mật khẩu thất bại và hiển thị lỗi chính xác khi nhập mật khẩu xác nhận không khớp.
*   **Đánh giá & Phản hồi (`integration/feedback_test.cjs`)**:
    *   **TC-FEEDBACK-ALL**: Luồng tích hợp liên thông giữa 3 vai trò: Bệnh nhân đặt lịch khám $\rightarrow$ Bác sĩ hoàn thành khám $\rightarrow$ Bệnh nhân đánh giá 5 sao $\rightarrow$ Bác sĩ phản hồi $\rightarrow$ Admin phê duyệt ẩn đánh giá đó.
*   **Trợ lý ảo AI (`patient/health_ai_test.cjs`)**:
    *   **TC-AI-01**: Bệnh nhân chat triệu chứng với AI $\rightarrow$ chatbot gợi ý khám Tim mạch $\rightarrow$ bệnh nhân click nút gợi ý $\rightarrow$ hệ thống chuyển hướng về trang tìm bác sĩ kèm bộ lọc tìm kiếm chuyên khoa tự động điền sẵn.
*   **Ví sức khỏe (`patient/wallet_test.cjs`)**:
    *   **TC-WALLET-01**: Bệnh nhân mở ví nạp 500.000 VNĐ $\rightarrow$ mock api/callback VNPAY thành công $\rightarrow$ kiểm tra số dư ví tăng thêm và giao dịch được ghi nhận trong lịch sử.

### 8.3 Kỹ thuật Chống Lỗi Ảo (Anti-Flaky Mechanisms) được áp dụng
1.  **Date Offset Ngẫu nhiên (Random Date Offsets)**: Tránh xung đột trùng lặp slot của cùng một bác sĩ trong database khi chạy test nhiều lần bằng cách tính toán ngày hẹn ngẫu nhiên (ví dụ `Math.floor(Math.random() * 10) + 43`).
2.  **API Routing Mocking**: Intercept và mock các API bên thứ 3 (như Groq AI, VNPAY callback) thông qua Playwright `page.route` giúp bộ E2E Test chạy độc lập, cực kỳ nhanh chóng và 100% ổn định trong môi trường CI/CD mà không phụ thuộc vào Internet hay API Key.
3.  **seeInField Helper**: Kiểm tra giá trị nhập của thẻ `<input>` (vốn không có text node con) thay thế cho hàm `see` truyền thống để đảm bảo tính chính xác tuyệt đối.

