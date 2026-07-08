# 🚀 Doctor Booking QA Release — Test Deliverables

Release này tổng hợp toàn bộ kết quả kiểm thử tự động, phân tích giá trị biên (BVA), độ phủ mã nguồn (JaCoCo), kiểm thử API (Newman) và E2E (CodeceptJS) của dự án **Doctor Booking System 2026** tính đến **09/07/2026**.

---

## 📄 Chi tiết báo cáo

- **Báo cáo vấn đáp (tổng hợp tài liệu + link code):** [09_Oral_Defense_Report/README.md](https://github.com/ptdat30/Test_DoctorBooking_2026/blob/fix/main-ci-appointment-tests/docs/Report/09_Oral_Defense_Report/README.md)
- **Báo cáo kiểm thử tổng hợp:** [docs/Report/README.md](https://github.com/ptdat30/Test_DoctorBooking_2026/blob/main/docs/Report/README.md)
- **Tổng hợp test cases:** [docs/testing/TOTAL_TEST_CASES.md](https://github.com/ptdat30/Test_DoctorBooking_2026/blob/main/docs/testing/TOTAL_TEST_CASES.md)
- **Hướng dẫn tái lập:** [docs/Report/08_How_To_Reproduce.md](https://github.com/ptdat30/Test_DoctorBooking_2026/blob/main/docs/Report/08_How_To_Reproduce.md)

---

## 📊 Phân tích BVA (Boundary Value Analysis)

- [Đăng ký tài khoản](https://github.com/ptdat30/Test_DoctorBooking_2026/blob/main/docs/Report/02_Blackbox/EP_BVA_Register.md)
- [Đăng nhập](https://github.com/ptdat30/Test_DoctorBooking_2026/blob/main/docs/Report/02_Blackbox/EP_BVA_Login.md)
- [Đặt lịch khám](https://github.com/ptdat30/Test_DoctorBooking_2026/blob/main/docs/Report/02_Blackbox/EP_BVA_Appointment_Booking.md)
- [Nạp tiền ví](https://github.com/ptdat30/Test_DoctorBooking_2026/blob/main/docs/Report/02_Blackbox/EP_BVA_Wallet_TopUp.md)
- [Đánh giá bác sĩ](https://github.com/ptdat30/Test_DoctorBooking_2026/blob/main/docs/Report/02_Blackbox/EP_BVA_Feedback_Rating.md)
- [Hạng thành viên](https://github.com/ptdat30/Test_DoctorBooking_2026/blob/main/docs/Report/02_Blackbox/EP_BVA_LoyaltyTier.md)
- [Health AI](https://github.com/ptdat30/Test_DoctorBooking_2026/blob/main/docs/Report/02_Blackbox/EP_BVA_Health_AI.md)
- [Đổi mật khẩu / Profile](https://github.com/ptdat30/Test_DoctorBooking_2026/blob/main/docs/Report/02_Blackbox/EP_BVA_Profile.md)

---

## 📦 Chi tiết các tệp bàn giao (Deliverables)

| Tên Tệp Bàn Giao | Định Dạng | Mô Tả Chi Tiết | Hướng Dẫn Sử Dụng |
| :--- | :--- | :--- | :--- |
| [`DB_Integration_Test.xlsx`](https://github.com/ptdat30/Test_DoctorBooking_2026/releases/download/v1.0.0-qa/DB_Integration_Test.xlsx) | Excel | Báo cáo Integration Test chính thức theo template môn học (Cover, Test Case, Statistics, Feature 1–5, Total API). | Mở bằng Microsoft Excel hoặc Google Sheets. |
| [`jacoco_report.zip`](https://github.com/ptdat30/Test_DoctorBooking_2026/releases/download/v1.0.0-qa/jacoco_report.zip) | ZIP | Báo cáo độ phủ mã nguồn JaCoCo (HTML + CSV). Line ~91%, Branch ~70.5%. | Giải nén và mở file `index.html` bằng trình duyệt. |
| [`postman_api_tests.zip`](https://github.com/ptdat30/Test_DoctorBooking_2026/releases/download/v1.0.0-qa/postman_api_tests.zip) | ZIP | Postman Collection + Environment cho 114 kịch bản API (Newman). | Import vào Postman hoặc chạy Newman theo `postman/test_doctor_booking_2026/README.md`. |
| [`qa_deliverables_bundle.zip`](https://github.com/ptdat30/Test_DoctorBooking_2026/releases/download/v1.0.0-qa/qa_deliverables_bundle.zip) | ZIP | Gói toàn bộ tài liệu `docs/Report/` (Blackbox, Whitebox, E2E, API, CI, Traceability). | Giải nén để xem offline; mở `README.md` làm mục lục. |
| [`source_code_snapshot.zip`](https://github.com/ptdat30/Test_DoctorBooking_2026/releases/download/v1.0.0-qa/source_code_snapshot.zip) | ZIP | Snapshot mã nguồn backend + frontend + test tại thời điểm release. | Giải nén và mở bằng IDE (IntelliJ / VS Code). |

---

## ✅ Tóm tắt kết quả kiểm thử

| Lớp kiểm thử | Công cụ | Kết quả |
| :--- | :--- | :--- |
| White-box Unit | JUnit 5 + Mockito + JaCoCo | **496** test methods, Line **~91%**, Branch **~70.5%** |
| Integration/API | Postman + Newman | **114** kịch bản API |
| E2E Smoke | CodeceptJS + Playwright | **27** smoke scenarios (Patient/Doctor/Admin/Public) |
| Static Analysis | SonarCloud | Quality Gate **Pass** |

**SonarCloud Dashboard:** [ptdat30_Test_DoctorBooking_2026](https://sonarcloud.io/dashboard?id=ptdat30_Test_DoctorBooking_2026)

**CI Pipeline:** [GitHub Actions](https://github.com/ptdat30/Test_DoctorBooking_2026/actions)

---

## 🔗 Repository

Toàn bộ mã nguồn và tài liệu: [https://github.com/ptdat30/Test_DoctorBooking_2026](https://github.com/ptdat30/Test_DoctorBooking_2026)
