# Integration Test Report (Excel)

## File chính

**[`DB_Integration_Test.xlsx`](./DB_Integration_Test.xlsx)**

Đây là báo cáo Integration Test chính thức theo template môn học (EVMS62).

## Cấu trúc sheet trong file

| Sheet | Nội dung cần điền / review |
|-------|------------------------------|
| **Cover** | Tên project, version, ngày, thành viên |
| **Test Case** | Danh sách test case tổng hợp |
| **Test Statistics** | Tổng pass/fail, coverage % |
| **Feature 1–5** | Test theo từng module |
| **Total API** | Ma trận API endpoint |

## Tham chiếu khi điền Excel

| Thông tin | Nguồn trong `docs/Report/` |
|-----------|------------------------------|
| Blackbox BVA cases | `02_Blackbox/` |
| White-box coverage % | `03_Whitebox/coverage-summary.md` |
| E2E test list | `04_E2E/test-matrix.md` |
| API endpoints | `05_API/README.md` |
| Jira tickets | `07_Traceability/jira-traceability.md` |
| CI evidence | `06_CI/ci-pipeline-summary.md` |

## Ghi chú Hybrid

File Excel là **báo cáo tổng hợp** để nộp. Chi tiết test tự động và chứng cứ tái lập nằm trong repository và các thư mục còn lại của `docs/Report/`.
