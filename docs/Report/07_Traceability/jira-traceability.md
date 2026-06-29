# Ma trận truy vết (Jira ↔ Test ↔ Commit)

## Blackbox Testing (SCRUM-195 → SCRUM-208)

| Ticket | Chức năng | Loại test | Tài liệu BVA | Test tự động | Commit |
|--------|-----------|-----------|--------------|--------------|--------|
| SCRUM-195 | Register | BVA | `02_Blackbox/EP_BVA_Register.md` | JUnit + Postman + `register_bva_test.cjs` | `a6db7c8` area |
| SCRUM-196 | Login | BVA | `EP_BVA_Login.md` | JUnit + Postman + `login_bva_test.cjs` | — |
| SCRUM-197 | Appointment Booking | BVA | `EP_BVA_Appointment_Booking.md` | JUnit + Postman + `booking_bva_test.cjs` | — |
| SCRUM-198 | Feedback Rating | BVA | `EP_BVA_Feedback_Rating.md` | JUnit + `feedback_rating_bva_test.cjs` | — |
| SCRUM-199 | Feedback Edit 24h | BVA | `EP_BVA_Feedback_Edit24h.md` | JUnit + `feedback_edit_bva_test.cjs` | — |
| SCRUM-200 | Wallet Top-up | BVA | `EP_BVA_Wallet_TopUp.md` | JUnit + Postman + `wallet_bva_test.cjs` | — |
| SCRUM-201 | Loyalty Tier | BVA | `EP_BVA_LoyaltyTier.md` | JUnit + `loyalty_tier_bva_test.cjs` | — |
| SCRUM-202 | Health AI | BVA | `EP_BVA_Health_AI.md` | JUnit + `health_ai_bva_test.cjs` | — |
| SCRUM-203 | Notifications | EP | `EP_BVA_Notifications.md` | `notifications_bva_test.cjs` | — |
| SCRUM-204 | Profile Password | BVA | `EP_BVA_Profile.md` | `profile_bva_test.cjs` | — |
| SCRUM-205 | E2E Patient | Smoke | — | `patient/*`, `auth/*`, `integration/*` | `a6db7c8` area |
| SCRUM-206 | E2E Doctor | Smoke | — | `doctor/doctor_smoke_test.cjs` | — |
| SCRUM-207 | E2E Admin | Smoke | — | `admin/admin_smoke_test.cjs` | — |
| SCRUM-208 | E2E Public | Smoke | — | `public/public_pages_test.cjs` | `a6db7c8` |

## White-box Testing (SCRUM-209 → SCRUM-212)

| Ticket | Phạm vi | Files chính | Commit |
|--------|---------|-------------|--------|
| SCRUM-209 | JaCoCo setup & gate | `backend/pom.xml` | `f8db3c9` |
| SCRUM-210 | Controller unit tests | `backend/src/test/.../controller/*Test.java` (9 files) | `44dd87a` |
| SCRUM-211 | Service batch 1 | Admin, Notification, Medication, FamilyMember, VNPay, AISymptom | `10c8190` |
| SCRUM-212 | AppointmentService branches | `AppointmentServiceTest.java`, `AppointmentServiceExtraTest.java` | `fd6bbf5` |

## Ma trận Feature → 3 tầng test

| Feature | JUnit | Postman | CodeceptJS |
|---------|-------|---------|------------|
| Register | `RegisterRequestValidationTest` | `02_Auth` | `register_bva_test.cjs` |
| Login | `LoginRequestValidationTest` | `02_Auth` | `login_bva_test.cjs` |
| Feedback Rating | `FeedbackRequestValidationTest` | `07_Patient_Feedbacks` | `feedback_rating_bva_test.cjs` |
| Feedback 24h | `FeedbackServiceTest` | — | `feedback_edit_bva_test.cjs` |
| Wallet | `TopUpRequestValidationTest` | `09_Patient_Wallet` | `wallet_bva_test.cjs` |
| Loyalty | `WalletServiceTest` | — | `loyalty_tier_bva_test.cjs` |
| Booking | `AppointmentServiceTest` | `05_Patient_Appointments` | `booking_bva_test.cjs` |
| Health AI | `SymptomCheckRequestValidationTest` | — | `health_ai_bva_test.cjs` |
| Notifications | — | — | `notifications_bva_test.cjs` |
| Profile | — | — | `profile_bva_test.cjs` |

## Integration Report (Excel)

| Ticket / Deliverable | File |
|----------------------|------|
| Báo cáo Integration Test chính thức | `01_Integration_Report/DB_Integration_Test.xlsx` |
