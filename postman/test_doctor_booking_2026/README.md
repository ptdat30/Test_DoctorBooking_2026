# test_doctor_booking_2026 — API Automation Test Suite

Postman Collection + Newman CI/CD cho **Doctor Booking System**.  
Bao gồm: positive/negative tests, schema validation, data-driven tests, E2E flows, tích hợp GitHub Actions.

---

## Cấu trúc thư mục

```
postman/test_doctor_booking_2026/
├── test_doctor_booking_2026.postman_collection.json   ← Import vào Postman/Newman
├── test_doctor_booking_2026.postman_environment.json  ← Import environment
├── data/                    # JSON/CSV cho data-driven tests
│   ├── users_login.json         # Tài khoản login test (3 roles)
│   ├── register_cases.json      # Test cases đăng ký (valid/invalid)
│   ├── register_cases.csv       # CSV version cho Newman -d
│   ├── appointment_cases.json   # Test cases đặt lịch
│   └── negative_payloads.json   # Payloads sai để test negative
├── schemas/                 # JSON Schema (tv4 validator)
├── scripts/                 # Source scripts của collection
├── newman/                  # CLI runners + CI/CD
│   ├── run.ps1                  # PowerShell runner (Windows)
│   ├── run.sh                   # Bash runner (Linux/macOS)
│   └── github-actions-postman.yml  # GitHub Actions workflow snippet
├── reports/                 # Kết quả Newman HTML/JSON output
├── generate-collection.js   # Tái tạo collection từ scripts
├── generate-matrix.js       # Tái tạo TEST_CASE_MATRIX.md
└── TEST_CASE_MATRIX.md      # Bảng test case đầy đủ
```

---

## Danh sách API được test

| # | Folder | Role | Endpoints |
|---|--------|------|-----------|
| 00 | Setup | ALL | Login Patient / Doctor / Admin, lấy token |
| 01 | Public | — | `GET /api/public/health` |
| 02 | Auth | — | `POST /api/auth/register`, `POST /api/auth/login` |
| 03 | Patient – Profile | PATIENT | `GET/PUT /api/patient/profile`, `POST /api/patient/change-password` |
| 04 | Patient – Doctors | PATIENT | `GET /api/patient/doctors`, `GET /api/patient/doctors/{id}` |
| 05 | Patient – Appointments | PATIENT | `GET/POST /api/patient/appointments`, `GET/DELETE /api/patient/appointments/{id}`, `GET /api/patient/appointments/available-slots` |
| 06 | Patient – Treatments | PATIENT | `GET /api/patient/treatments`, `GET /api/patient/treatments/{id}`, `GET /api/patient/appointments/{id}/treatment` |
| 07 | Patient – Feedback | PATIENT | `GET/POST /api/patient/feedbacks`, `GET/PUT /api/patient/feedbacks/{id}` |
| 08 | Patient – Family Members | PATIENT | `GET/POST /api/patient/family-members`, `PUT/DELETE /api/patient/family-members/{id}`, `GET /api/patient/family-members/stats` |
| 09 | Patient – Notifications | PATIENT | `GET /api/patient/notifications`, `GET /api/patient/notifications/unread-count`, `PUT /api/patient/notifications/{id}/read`, `PUT /api/patient/notifications/mark-all-read`, `DELETE /api/patient/notifications/{id}` |
| 10 | Patient – Wallet | PATIENT | `GET /api/patient/wallet`, `POST /api/patient/wallet/top-up`, `GET /api/patient/wallet/transactions` |
| 11 | Patient – AI Symptoms | PATIENT | `POST /api/patient/ai/check-symptoms` |
| 12 | Doctor – Profile | DOCTOR | `GET/PUT /api/doctor/profile`, `POST /api/doctor/change-password` |
| 13 | Doctor – Appointments | DOCTOR | `GET /api/doctor/appointments`, `GET /api/doctor/appointments/{id}`, `PUT /api/doctor/appointments/{id}/confirm`, `POST /api/doctor/appointments/{id}/cancel` |
| 14 | Doctor – Treatments | DOCTOR | `GET/POST /api/doctor/treatments`, `GET/PUT/DELETE /api/doctor/treatments/{id}` |
| 15 | Doctor – Patients | DOCTOR | `GET /api/doctor/patients`, `GET /api/doctor/patients/{id}`, `GET /api/doctor/patients/{id}/treatments` |
| 16 | Doctor – Medications | DOCTOR | `GET /api/doctor/medications` |
| 17 | Doctor – Feedback | DOCTOR | `GET /api/doctor/feedbacks`, `GET /api/doctor/feedbacks/{id}`, `GET /api/doctor/feedbacks/rating/{rating}`, `POST/PUT /api/doctor/feedbacks/{id}/reply`, `GET /api/doctor/average-rating` |
| 18 | Admin – Doctors | ADMIN | `GET/POST /api/admin/doctors`, `GET/PUT/DELETE /api/admin/doctors/{id}` |
| 19 | Admin – Patients | ADMIN | `GET/POST /api/admin/patients`, `GET/PUT/DELETE /api/admin/patients/{id}` |
| 20 | Admin – Appointments | ADMIN | `GET /api/admin/appointments`, `GET/PUT /api/admin/appointments/{id}`, `POST /api/admin/appointments/{id}/cancel`, `DELETE /api/admin/appointments/{id}` |
| 21 | Admin – Feedbacks | ADMIN | `GET /api/admin/feedbacks`, `GET /api/admin/feedbacks/{id}`, `GET /api/admin/feedbacks/doctor/{id}`, `GET /api/admin/feedbacks/patient/{id}`, `PUT /api/admin/feedbacks/{id}/hide`, `PUT /api/admin/feedbacks/{id}/unhide` |
| 21b | Admin – Users | ADMIN | `GET/POST /api/admin/users`, `GET/PUT/DELETE /api/admin/users/{id}`, `PATCH /api/admin/users/{id}/toggle-status`, `PATCH /api/admin/users/{id}/change-password` |
| 22 | E2E Flows | ALL | Luồng hoàn chỉnh: đăng ký → đặt lịch → xác nhận → điều trị → feedback |

---

## Yêu cầu

- **Backend** chạy tại `http://localhost:8080`  
- **Node.js** ≥ 18 (để chạy Newman)  
- **Newman** + reporter: `npm install -g newman newman-reporter-htmlextra`
- Tài khoản test (cập nhật trong environment nếu khác):

| Role | Username | Password |
|------|----------|----------|
| PATIENT | `patient1` | `password123` |
| DOCTOR | `doctor1` | `password123` |
| ADMIN | `admin` | `admin123` |

---

## Import vào Postman GUI

1. Postman → **Import** → chọn `test_doctor_booking_2026.postman_collection.json`
2. Postman → **Import** → chọn `test_doctor_booking_2026.postman_environment.json`
3. Chọn environment **test_doctor_booking_2026 - Local**
4. Chạy folder **00_Setup** đầu tiên (lấy token cho 3 roles)
5. Chạy từng folder module hoặc **22_E2E_Flows** để test E2E

---

## Chạy bằng Newman (CLI)

### Windows (PowerShell)

```powershell
cd postman/test_doctor_booking_2026

# Chạy toàn bộ suite (data-driven)
./newman/run.ps1

# Chỉ chạy Setup (lấy token)
./newman/run.ps1 -SetupOnly

# Chỉ chạy E2E flows
./newman/run.ps1 -E2EOnly

# Chạy 1 folder cụ thể
./newman/run.ps1 -Folder "05_Patient_Appointments"

# Chạy với data file riêng
./newman/run.ps1 -DataFile "register_cases.csv"

# Chạy toàn bộ, báo cáo HTML
./newman/run.ps1 -All
```

### Linux / macOS (Bash)

```bash
cd postman/test_doctor_booking_2026
chmod +x newman/run.sh
./newman/run.sh                         # full suite
./newman/run.sh "22_E2E_Flows"          # chỉ E2E
./newman/run.sh "00_Setup"              # chỉ setup
```

### Lệnh Newman thủ công

```bash
# Chạy toàn bộ collection
newman run test_doctor_booking_2026.postman_collection.json \
  -e test_doctor_booking_2026.postman_environment.json \
  --reporters cli,htmlextra,json \
  --reporter-htmlextra-export reports/report.html \
  --reporter-json-export reports/report.json \
  --timeout-request 15000 \
  --delay-request 200

# Data-driven: chạy với CSV
newman run test_doctor_booking_2026.postman_collection.json \
  -e test_doctor_booking_2026.postman_environment.json \
  --folder "02_Auth" \
  -d data/register_cases.csv \
  --reporters cli
```

---

## Xem kết quả

Sau khi chạy Newman, báo cáo HTML xuất tại:

```
reports/report.html   ← Mở bằng trình duyệt
reports/report.json   ← Dùng cho CI/CD parsing
```

---

## Environment Variables

| Biến | Mô tả | Loại |
|------|-------|------|
| `base_url` | API root (mặc định: `http://localhost:8080`) | default |
| `patient_username` / `patient_password` | Tài khoản patient test | default / secret |
| `doctor_username` / `doctor_password` | Tài khoản doctor test | default / secret |
| `admin_username` / `admin_password` | Tài khoản admin test | default / secret |
| `patient_token` | JWT token của patient (auto-set sau Login) | secret |
| `doctor_token` | JWT token của doctor (auto-set sau Login) | secret |
| `admin_token` | JWT token của admin (auto-set sau Login) | secret |
| `auth_token` | Token đang active (auto-set theo `current_role`) | secret |
| `current_role` | Role hiện tại: `PATIENT` / `DOCTOR` / `ADMIN` | default |
| `patientId` | ID của patient (auto-set từ profile response) | default |
| `doctorId` | ID của doctor test (mặc định: `1`) | default |
| `appointmentId` | ID lịch hẹn (auto-set từ create appointment) | default |
| `treatmentId` | ID điều trị (auto-set từ create treatment) | default |
| `feedbackId` | ID feedback (auto-set từ create feedback) | default |
| `familyMemberId` | ID thành viên gia đình | default |
| `notificationId` | ID thông báo | default |
| `tomorrow_date` | Ngày mai format `YYYY-MM-DD` (auto-set) | default |
| `slot_time` | Giờ đặt lịch (mặc định: `09:00:00`) | default |
| `skip_dependent_tests` | Bỏ qua test phụ thuộc nếu test trước fail | default |
| `skip_ai_tests` | Bỏ qua AI tests nếu không có Groq API key | default |
| `max_response_ms` | Ngưỡng thời gian phản hồi (mặc định: `2000`ms) | default |

---

## CI/CD — GitHub Actions

Copy nội dung `newman/github-actions-postman.yml` vào `.github/workflows/api-tests.yml`.  
Workflow sẽ:
1. Khởi động MySQL service container
2. Build & start Spring Boot backend
3. Chờ API health check OK
4. Chạy **Setup** → **E2E** qua Newman
5. Upload báo cáo HTML/JSON dưới dạng artifact

---

## Regenerate Collection

Sau khi thêm endpoint mới vào controller, cập nhật `generate-collection.js` rồi chạy:

```bash
node generate-collection.js
node generate-matrix.js
```

---

## Kiến trúc test script

Mỗi request trong collection có:
- **Pre-request Script**: set `auth_token` theo role, generate dữ liệu ngẫu nhiên (`random_email`, `tomorrow_date`, ...)
- **Test Script**: kiểm tra status code, schema JSON (tv4), extract variables (`appointmentId`, `feedbackId`, ...) để chain sang request tiếp theo

Collection-level scripts:
- `pm.test('Response time is below threshold')` — chạy cho mọi request
- `validateSchema(schema, data, label)` — helper validate JSON Schema
- `assertRequiredFields(obj, fields, label)` — helper kiểm tra fields bắt buộc
- `onTestFail()` — tự động set `skip_dependent_tests=true` khi fail
