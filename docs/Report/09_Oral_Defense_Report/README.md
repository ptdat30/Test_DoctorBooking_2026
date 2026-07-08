# Bao cao van dap - Doctor Booking System

> **GitHub Release (giong mau NovaTicket):** [Doctor Booking - QA & Test (v1.0.0-qa)](https://github.com/ptdat30/Test_DoctorBooking_2026/releases/tag/v1.0.0-qa)
>
> Noi dung release: bang deliverables + file Excel/ZIP tai xuong truc tiep.

Tai lieu nay la ban tong hop nhanh de trinh bay van dap, giup giang vien:
- Mo truc tiep cac tai lieu tren GitHub.
- Truy cap nhanh vao cac thu muc/file code lien quan.
- Tai toan bo project de chay lai va kiem chung.

---

## 1) Link xem va tai du an

- GitHub repository: [Test_DoctorBooking_2026](https://github.com/ptdat30/Test_DoctorBooking_2026)
- Xem toan bo thu muc bao cao: [`docs/Report/`](../)
- Tai source code:
  - Cach 1: `Code` -> `Download ZIP` tren GitHub
  - Cach 2: `git clone https://github.com/ptdat30/Test_DoctorBooking_2026.git`

---

## 2) Tong hop tai lieu nop van dap

1. Bao cao tong hop (Excel):
   - [`01_Integration_Report/DB_Integration_Test.xlsx`](../01_Integration_Report/DB_Integration_Test.xlsx)
2. Blackbox (EP/BVA):
   - [`02_Blackbox/README.md`](../02_Blackbox/README.md)
3. Whitebox + coverage:
   - [`03_Whitebox/README.md`](../03_Whitebox/README.md)
   - [`03_Whitebox/coverage-summary.md`](../03_Whitebox/coverage-summary.md)
   - [`03_Whitebox/jacoco/index.html`](../03_Whitebox/jacoco/index.html)
4. E2E:
   - [`04_E2E/test-matrix.md`](../04_E2E/test-matrix.md)
5. API / Postman:
   - [`05_API/README.md`](../05_API/README.md)
   - [`05_API/test_doctor_booking_2026.postman_collection.json`](../05_API/test_doctor_booking_2026.postman_collection.json)
6. CI/CD:
   - [`06_CI/ci-pipeline-summary.md`](../06_CI/ci-pipeline-summary.md)
7. Traceability:
   - [`07_Traceability/jira-traceability.md`](../07_Traceability/jira-traceability.md)
8. Huong dan tai lap:
   - [`08_How_To_Reproduce.md`](../08_How_To_Reproduce.md)

---

## 3) Link code chinh de giang vien mo nhanh

### Backend (Spring Boot)

- Entry point:
  - [`backend/src/main/java/com/doctorbooking/backend/BackendApplication.java`](../../../backend/src/main/java/com/doctorbooking/backend/BackendApplication.java)
- Controllers:
  - [`backend/src/main/java/com/doctorbooking/backend/controller/`](../../../backend/src/main/java/com/doctorbooking/backend/controller/)
- Services:
  - [`backend/src/main/java/com/doctorbooking/backend/service/`](../../../backend/src/main/java/com/doctorbooking/backend/service/)
- Repositories:
  - [`backend/src/main/java/com/doctorbooking/backend/repository/`](../../../backend/src/main/java/com/doctorbooking/backend/repository/)
- DTOs:
  - [`backend/src/main/java/com/doctorbooking/backend/dto/`](../../../backend/src/main/java/com/doctorbooking/backend/dto/)
- Unit tests:
  - [`backend/src/test/java/com/doctorbooking/backend/`](../../../backend/src/test/java/com/doctorbooking/backend/)

### Frontend (React + Vite)

- Entry routes:
  - [`frontend/src/App.jsx`](../../../frontend/src/App.jsx)
- Pages:
  - [`frontend/src/pages/`](../../../frontend/src/pages/)
- Components:
  - [`frontend/src/components/`](../../../frontend/src/components/)
- API services:
  - [`frontend/src/services/`](../../../frontend/src/services/)
- E2E tests:
  - [`frontend/e2e/tests/`](../../../frontend/e2e/tests/)
  - [`frontend/e2e/pages/`](../../../frontend/e2e/pages/)

### Cau hinh va ha tang

- CI workflow:
  - [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml)
- Deploy production:
  - [`.github/workflows/deploy-production.yml`](../../../.github/workflows/deploy-production.yml)
- Render config:
  - [`render.yaml`](../../../render.yaml)
- Docker compose:
  - [`docker-compose.yml`](../../../docker-compose.yml)

---

## 4) Goi y trinh bay van dap (5-10 phut)

1. Gioi thieu nhanh project + stack (`README.md`).
2. Trinh bay ma tran test (blackbox + whitebox + e2e + api).
3. Mo Excel tong hop va doi chieu voi cac bang chung trong `docs/Report/`.
4. Mo truc tiep 1-2 test case trong `backend/src/test/...` va `frontend/e2e/tests/...`.
5. Chot bang traceability (`07_Traceability/`) va cach tai lap (`08_How_To_Reproduce.md`).

---

## 5) Ghi chu nop GitHub

- Thu muc nay duoc tao de doc truc tiep tren GitHub.
- Toan bo code va tai lieu da nam trong cung mot repository de giang vien mo/tai dong bo.
- Neu can nop them file PDF, co the xuat tu noi dung Markdown nay va dat cung thu muc `09_Oral_Defense_Report/`.
