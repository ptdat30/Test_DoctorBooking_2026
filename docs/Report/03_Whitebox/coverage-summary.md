# JaCoCo Code Coverage Summary

> Đo lường sau `mvnw clean verify` — gate đã pass trên nhánh `staging`.

## Gate cấu hình (`backend/pom.xml`)

| Metric | Minimum | Kết quả | Trạng thái |
|--------|---------|---------|------------|
| **Line coverage** | 80% | **~91.3%** | ✅ Pass |
| **Branch coverage** | 70% | **~70.5%** | ✅ Pass |

## Tổng hợp bundle (controller + service)

| Package | Line missed | Line covered | Branch missed | Branch covered |
|---------|-------------|--------------|---------------|----------------|
| `controller` (9 class) | 39 | 677 | 18 | 78 |
| `service` (13 class) | 155 | 1,357 | 170 | 450 |
| **Tổng** | **194** | **2,034** | **188** | **528** |

## Chi tiết theo class

### Controller

| Class | Line % | Branch % | Ghi chú |
|-------|--------|----------|---------|
| AuthController | 100% | — | SCRUM-210 |
| PublicController | 100% | — | SCRUM-210 |
| AdminController | 100% | 75% | SCRUM-210 |
| PatientController | 100% | 86% | SCRUM-210 |
| DoctorController | 100% | 100% | SCRUM-210 |
| NotificationController | 100% | 75% | SCRUM-210 |
| UserController | 100% | 88% | SCRUM-210 |
| FamilyMemberController | 80% | — | SCRUM-210 |
| PaymentController | 85% | 75% | SCRUM-210 (VNPAY callback) |

### Service

| Class | Line % | Branch % | Ghi chú |
|-------|--------|----------|---------|
| AppointmentService | 89% | 70% | SCRUM-212 |
| AdminService | 100% | 93% | SCRUM-211 |
| NotificationService | 100% | 100% | SCRUM-211 |
| MedicationService | 100% | 100% | SCRUM-211 |
| FamilyMemberService | 97% | 90% | SCRUM-211 |
| VNPayService | 91% | 62% | SCRUM-211 |
| WalletService | 95% | 72% | Existing tests |
| AuthService | 85% | 62% | Existing tests |
| PatientService | 98% | 70% | Existing tests |
| DoctorService | 100% | 63% | Existing tests |
| TreatmentService | 91% | 58% | Existing tests |
| FeedbackService | 73% | 72% | Existing tests |
| UserService | 77% | 61% | Existing tests |

## Loại trừ khỏi coverage (có lý do)

| Class | Lý do |
|-------|-------|
| `EmailService` | Side-effect SMTP, không unit test ổn định |
| `AppointmentReminderService` | Scheduled job / side-effect |
| `AISymptomService` | Tích hợp Groq API qua HttpClient nội bộ |
| `TestController` | Dev-only endpoint |
| `config/`, `dto/`, `model/`, `repository/` | Infrastructure / data layer |

## Sơ đồ minh họa

| File | Mô tả |
|------|-------|
| `diagrams/AuthService.register.png` | Control flow — `AuthService.register()` |
| `diagrams/CFG.png` | Control Flow Graph mẫu |
| `diagrams/Short-Circuit.png` | Short-circuit evaluation |

## Báo cáo HTML đầy đủ

- Snapshot CSV: `jacoco/jacoco.csv`
- Snapshot HTML index: `jacoco/index.html`
- Regenerate: `cd backend && mvnw clean verify` → `backend/target/site/jacoco/index.html`
