# Hướng dẫn tái lập kết quả kiểm thử

## Yêu cầu môi trường

| Thành phần | Phiên bản |
|------------|-----------|
| JDK | 21 (Temurin) |
| Node.js | 20+ |
| MySQL | 8.0 |
| Maven | Wrapper (`mvnw`) trong `backend/` |

---

## 1. White-box + JaCoCo (Backend)

```powershell
cd backend
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
.\mvnw.cmd clean verify
```

**Kết quả mong đợi:** BUILD SUCCESS, JaCoCo gate pass.

**Xem báo cáo:**
```
backend/target/site/jacoco/index.html
```

---

## 2. API / Postman (Newman)

```powershell
# Terminal 1 — khởi động backend
cd backend
.\mvnw.cmd spring-boot:run

# Terminal 2 — chạy Newman
cd postman\test_doctor_booking_2026\newman
.\run.ps1
```

---

## 3. E2E CodeceptJS (Frontend)

```powershell
# Terminal 1 — backend :8080
cd backend
.\mvnw.cmd spring-boot:run

# Terminal 2 — frontend :5173
cd frontend
npm install
npm run dev

# Terminal 3 — E2E
cd frontend
npm run e2e:smoke    # Smoke tests
npm run e2e:bva      # Blackbox BVA
npm run e2e          # Toàn bộ
```

---

## 4. CI (GitHub Actions)

Push lên nhánh `staging` → workflow **CI Pipeline** tự chạy.

Kiểm tra: `https://github.com/ptdat30/Test_DoctorBooking_2026/actions`

---

## 5. Báo cáo Excel

Mở và điền (nếu cần cập nhật số liệu mới nhất):

```
docs/Report/01_Integration_Report/DB_Integration_Test.xlsx
```

Tham chiếu số liệu coverage từ `03_Whitebox/coverage-summary.md`.

---

## Checklist nộp giảng viên

- [ ] `01_Integration_Report/DB_Integration_Test.xlsx` — đã điền Statistics + API
- [ ] `02_Blackbox/` — 10 file EP/BVA
- [ ] `03_Whitebox/coverage-summary.md` + diagrams
- [ ] `07_Traceability/jira-traceability.md`
- [ ] Link GitHub repo + screenshot CI green (tuỳ chọn)
- [ ] `08_How_To_Reproduce.md` (file này)
