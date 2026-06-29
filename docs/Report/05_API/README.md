# API / Postman Integration Test

## Files trong thư mục này

| File | Mô tả |
|------|-------|
| `test_doctor_booking_2026.postman_collection.json` | Collection API đầy đủ |
| `test_doctor_booking_2026.postman_environment.json` | Environment variables |

## Source đầy đủ (repo)

```
postman/test_doctor_booking_2026/
├── test_doctor_booking_2026.postman_collection.json
├── test_doctor_booking_2026.postman_environment.json
├── data/                    # Test data matrices (register, appointment, login)
├── schemas/                 # JSON Schema validation
├── scripts/                 # Pre-request & test scripts
└── newman/
    ├── run.ps1              # Chạy trên Windows
    └── run.sh               # Chạy trên Linux/CI
```

## Chạy Newman (local)

```powershell
cd postman/test_doctor_booking_2026/newman
.\run.ps1
```

Yêu cầu: backend đang chạy tại `http://localhost:8080`.

## Nhóm API chính (theo controller)

| Prefix | Role | Ví dụ endpoint |
|--------|------|----------------|
| `/api/auth` | Public | `POST /register`, `POST /login` |
| `/api/public` | Public | `GET /health` |
| `/api/patient` | PATIENT | `POST /appointments`, `GET /doctors`, `POST /ai/check-symptoms` |
| `/api/patient/notifications` | PATIENT | `GET /`, `PUT /mark-all-read` |
| `/api/patient/wallet` | PATIENT | `GET /wallet`, `POST /top-up` (PaymentController) |
| `/api/doctor` | DOCTOR | `GET /appointments`, `PUT /appointments/{id}/confirm` |
| `/api/admin` | ADMIN | `GET /users`, `GET /doctors`, `POST /appointments/{id}/cancel` |
| `/api/family-members` | PATIENT | CRUD người nhà |

## Mapping BVA → Postman

| Feature | Postman folder | Data file |
|---------|----------------|-----------|
| Register | `02_Auth` | `data/register_cases.json` |
| Login | `02_Auth` | `data/users_login.json` |
| Appointment | `05_Patient_Appointments` | `data/appointment_cases.json` |
| Wallet | `09_Patient_Wallet` | — |
| Feedback | `07_Patient_Feedbacks` | — |

## CI

Newman chạy trong GitHub Actions khi có thay đổi `postman/**` — xem [`../06_CI/ci-pipeline-summary.md`](../06_CI/ci-pipeline-summary.md).
