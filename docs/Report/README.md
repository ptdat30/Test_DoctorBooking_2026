# Báo cáo kiểm thử — Doctor Booking System 2026

> **Phương pháp:** Hybrid (Excel tổng hợp + Repository chứng cứ kỹ thuật)
>
> **Mục đích:** Gói tài liệu chính thức nộp giảng viên. Mọi test tự động vẫn nằm trong source code; folder này chỉ **lọc và tổ chức** phần cần trình bày.
>
> **GitHub Release (tải file ZIP/Excel):** [Doctor Booking - QA & Test (v1.0.0-qa)](https://github.com/ptdat30/Test_DoctorBooking_2026/releases/tag/v1.0.0-qa)

---

## Cấu trúc thư mục

| Thư mục | Nội dung | Đối tượng đọc |
|---------|----------|---------------|
| [`01_Integration_Report/`](./01_Integration_Report/) | `DB_Integration_Test.xlsx` — báo cáo Integration Test chính thức | Giảng viên (file nộp chính) |
| [`02_Blackbox/`](./02_Blackbox/) | EP/BVA theo từng chức năng (10 feature) | Giảng viên + reviewer |
| [`03_Whitebox/`](./03_Whitebox/) | JaCoCo coverage, CFG, short-circuit | Giảng viên (white-box) |
| [`04_E2E/`](./04_E2E/) | Ma trận CodeceptJS smoke + BVA | Giảng viên (E2E) |
| [`05_API/`](./05_API/) | Postman collection + hướng dẫn Newman | Giảng viên (API test) |
| [`06_CI/`](./06_CI/) | Tóm tắt CI pipeline GitHub Actions | Giảng viên (chứng cứ tự động) |
| [`07_Traceability/`](./07_Traceability/) | Ma trận Jira ticket ↔ test ↔ commit | Giảng viên (traceability) |
| [`08_How_To_Reproduce.md`](./08_How_To_Reproduce.md) | Lệnh chạy lại toàn bộ test | Giảng viên / TA |
| [`09_Oral_Defense_Report/`](./09_Oral_Defense_Report/) | Báo cáo vấn đáp tổng hợp tài liệu + link code | Giảng viên (vấn đáp) |

---

## Tổng quan 4 lớp kiểm thử

| Lớp | Công cụ | Kết quả | Bằng chứng trong repo |
|-----|---------|---------|------------------------|
| **Blackbox BVA/EP** | Markdown + CodeceptJS | 10 feature ✅ | `02_Blackbox/`, `frontend/e2e/tests/blackbox/` |
| **White-box Unit** | JUnit 5 + Mockito + JaCoCo | Line ~91%, Branch ~70.5% ✅ | `backend/src/test/java/`, `03_Whitebox/` |
| **Integration/API** | Postman + Newman + MySQL | Collection đầy đủ ✅ | `05_API/`, `postman/` |
| **E2E Smoke** | CodeceptJS + Playwright | Patient/Doctor/Admin/Public ✅ | `04_E2E/`, `frontend/e2e/tests/` |

---

## Thứ tự đọc đề xuất cho giảng viên

1. **Cover + Statistics** trong `01_Integration_Report/DB_Integration_Test.xlsx`
2. **Chiến lược Blackbox** — `02_Blackbox/README.md`
3. **White-box coverage** — `03_Whitebox/coverage-summary.md`
4. **Traceability** — `07_Traceability/jira-traceability.md`
5. **Tái lập kết quả** — `08_How_To_Reproduce.md`

---

## Repository & CI

- **GitHub:** `https://github.com/ptdat30/Test_DoctorBooking_2026`
- **Nhánh chính kiểm thử:** `staging`
- **CI:** `.github/workflows/ci.yml` (xem `06_CI/ci-pipeline-summary.md`)

---

## Ghi chú

- File Excel là **báo cáo tổng hợp**; chi tiết test case tự động nằm trong source code.
- Báo cáo JaCoCo HTML đầy đủ: chạy `mvnw clean verify` trong `backend/`, mở `backend/target/site/jacoco/index.html`.
- Ảnh CFG / Short-Circuit minh họa white-box nằm tại `03_Whitebox/diagrams/`.
