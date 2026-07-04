# Tổng Hợp Toàn Bộ Test Cases - Dự Án Doctor Booking System 2026

Tài liệu này tổng hợp toàn bộ các kịch bản kiểm thử (Test Cases) của dự án, gồm 3 tầng:

1. **Kiểm thử Đơn vị / Tích hợp (JUnit + Mockito)** ở Backend (Spring Boot) — Whitebox.
2. **Kiểm thử Tự động hóa API (Postman + Newman)** — Integration/Blackbox.
3. **Kiểm thử Giao diện E2E (CodeceptJS + Playwright)** — Blackbox/BVA trên UI.

> Số liệu được đối soát trực tiếp từ mã nguồn (`backend/src/test`, `postman/`, `frontend/e2e`) — cập nhật lần cuối theo trạng thái repo hiện tại.

---

## Tóm Tắt Tổng Quan

| Thành phần kiểm thử | Số lượng | Phương pháp nổi bật | Trạng thái |
|---------------------|----------|---------------------|------------|
| **JUnit** (Backend, 30 lớp test) | **496 test method** | BVA, Mocking (Mockito), branch coverage | Passed |
| **Postman API** (24 folder) | **114 kịch bản** (×3 vai trò ⇒ ~348 request, ~768 assertion) | BVA, Data-Driven, Security (SQLi/XSS) | Passed |
| **E2E UI** (CodeceptJS) | **~30 file test** (`@smoke` + `@bva`) | Page Object, BVA trên UI | Passed |

**JaCoCo coverage backend**: Instruction **90%**, Branch **70%**, Line **91%** (gate tối thiểu: line ≥ 80%, branch ≥ 70%).

> Ghi chú số học: 496 test method = 493 `@Test` + 3 `@ParameterizedTest`. Các `@ParameterizedTest` chạy nhiều bộ dữ liệu nên tổng số **lần thực thi** còn cao hơn (~505). Một số test phụ thuộc đồng hồ dùng `Assumptions.assumeTrue(...)` để tự bỏ qua an toàn; `AISymptomServiceTest` có thể bị skip khi `SKIP_AI_TESTS=true`.

---

## 1. Kiểm thử Backend (JUnit / Mockito)

### 1.0. Bản đồ 30 lớp test

| # | Lớp test | Tầng | Số test | Trọng tâm |
|---|----------|------|---------|-----------|
| 1 | `AppointmentServiceTest` | Service | 32 | Đặt/hủy/xác nhận lịch, khung giờ hợp lệ (BVA slot) |
| 2 | `AppointmentServiceExtraTest` | Service | 44 | Nhánh phụ: hủy bởi bác sĩ/admin, thanh toán ví, family |
| 3 | `WalletServiceTest` | Service | 26 | Ví điện tử, tích điểm, hạng thành viên (BVA loyalty) |
| 4 | `FeedbackServiceTest` | Service | 27 | Đánh giá bác sĩ, giới hạn sửa 24h (BVA thời gian) |
| 5 | `AuthServiceTest` | Service | 11 | Đăng ký/đăng nhập 3 vai trò |
| 6 | `DoctorServiceTest` | Service | 19 | CRUD bác sĩ, đổi mật khẩu, ensure profile |
| 7 | `UserServiceTest` | Service | 17 | UserDetails, CRUD user, đổi trạng thái |
| 8 | `AdminServiceTest` | Service | 29 | Facade quản trị (bác sĩ/BN/lịch/feedback) |
| 9 | `PatientServiceTest` | Service | 14 | Hồ sơ bệnh nhân, tìm kiếm, đổi mật khẩu |
| 10 | `FamilyMemberServiceTest` | Service | 15 | Người nhà, tài khoản chính, thống kê |
| 11 | `NotificationServiceTest` | Service | 11 | Tạo/đọc/xóa thông báo, phân quyền chủ sở hữu |
| 12 | `TreatmentServiceTest` | Service | 11 | Bệnh án / đơn thuốc |
| 13 | `VNPayServiceTest` | Service | 8 | Tạo URL, verify checksum VNPAY |
| 14 | `MedicationServiceTest` | Service | 4 | Tìm thuốc, giới hạn kết quả (BVA limit) |
| 15 | `AISymptomServiceTest` | Service | 3 | Nhánh fallback chẩn đoán triệu chứng |
| 16 | `AuthControllerTest` | Controller | 6 | Endpoint đăng ký/đăng nhập, mã HTTP |
| 17 | `PublicControllerTest` | Controller | 1 | Health check |
| 18 | `PatientControllerTest` | Controller | 45 | Toàn bộ endpoint bệnh nhân |
| 19 | `DoctorControllerTest` | Controller | 47 | Toàn bộ endpoint bác sĩ |
| 20 | `AdminControllerTest` | Controller | 37 | Toàn bộ endpoint quản trị |
| 21 | `UserControllerTest` | Controller | 17 | CRUD user + mã lỗi (409/404/400) |
| 22 | `PaymentControllerTest` | Controller | 18 | Ví, nạp tiền (BVA), callback VNPAY |
| 23 | `NotificationControllerTest` | Controller | 11 | Endpoint thông báo |
| 24 | `FamilyMemberControllerTest` | Controller | 10 | Endpoint người nhà |
| 25 | `RegisterRequestValidationTest` | DTO/BVA | 13 | Validation đăng ký (username/password/email/fullName) |
| 26 | `LoginRequestValidationTest` | DTO/BVA | 4 | Validation đăng nhập (@NotBlank) |
| 27 | `FeedbackRequestValidationTest` | DTO/BVA | 5 | Validation rating [1,5] |
| 28 | `TopUpRequestValidationTest` | DTO/BVA | 6 | Validation số tiền nạp ≥ 10.000 |
| 29 | `SymptomCheckRequestValidationTest` | DTO/BVA | 4 | Validation triệu chứng (@NotBlank) |
| 30 | `BackendApplicationTests` | App | 1 | Spring context khởi tạo |

> Tổng: **496 test method** (Service 271 · Controller 192 · DTO validation 32 · App 1).

---

### 1.1. Service layer — Logic nghiệp vụ lõi

#### `WalletServiceTest` (26) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/WalletServiceTest.java)
Ví điện tử, tính điểm tích lũy (1 điểm / 100đ) và hạng thành viên. **BVA hạng:** BRONZE < 1000 ≤ SILVER < 5000 ≤ GOLD < 10000 ≤ PLATINUM.

| # | Test | Mô tả | Loại |
|---|------|-------|------|
| 1 | `payForAppointment_success_sufficientBalance` | Thanh toán phí khám khi đủ số dư | Positive |
| 2 | `payForAppointment_insufficientBalance_throwsException` | Số dư không đủ → lỗi | Negative |
| 3 | `payForAppointment_enoughPoints_upgradesToPlatinum` | Đủ điểm → nâng hạng PLATINUM | Positive |
| 4 | `payForAppointment_nullBalance_treatedAsZero` | Số dư null coi như 0 → lỗi khi fee>0 | Negative/BVA |
| 5 | `refundAppointment_success` | Hoàn tiền + trừ điểm tương ứng | Positive |
| 6 | `refundAppointment_loyaltyPointsNotNegative` | Điểm không bao giờ âm (biên 0) | BVA |
| 7 | `createDepositTransaction_success` | Tạo giao dịch nạp tiền PENDING | Positive |
| 8 | `completeDeposit_success` | Xác nhận nạp tiền → cộng dư, tích điểm, nâng GOLD | Positive |
| 9 | `completeDeposit_alreadyCompleted_returnsEarly` | Giao dịch đã COMPLETED không xử lý lại | Positive |
| 10 | `completeDeposit_notFound_throwsException` | referenceId không tồn tại → lỗi | Negative |
| 11 | `failDeposit_success` | Đánh dấu giao dịch FAILED | Positive |
| 12 | `failDeposit_alreadyCompleted_returnsEarly` | COMPLETED không thể đổi sang FAILED | Negative |
| 13-16 | `loyaltyTier_bronze/silver/gold/platinum` | Xác định hạng theo mốc điểm | Positive |
| 17 | `loyaltyTier_bva_0_bronze` | Điểm = 0 → BRONZE | BVA |
| 18 | `loyaltyTier_bva_999_bronze` | Điểm = 999 (dưới biên SILVER) | BVA |
| 19 | `loyaltyTier_bva_1000_silver` | Điểm = 1000 (chạm biên SILVER) | BVA |
| 20 | `loyaltyTier_bva_1001_silver` | Điểm = 1001 (trên biên) | BVA |
| 21 | `loyaltyTier_bva_4999_silver` | Điểm = 4999 (dưới biên GOLD) | BVA |
| 22 | `loyaltyTier_bva_5000_gold` | Điểm = 5000 (chạm biên GOLD) | BVA |
| 23 | `loyaltyTier_bva_5001_gold` | Điểm = 5001 (trên biên) | BVA |
| 24 | `loyaltyTier_bva_9999_gold` | Điểm = 9999 (dưới biên PLATINUM) | BVA |
| 25 | `loyaltyTier_bva_10000_platinum` | Điểm = 10000 (chạm biên PLATINUM) | BVA |
| 26 | `loyaltyTier_bva_10001_platinum` | Điểm = 10001 (trên biên) | BVA |

#### `FeedbackServiceTest` (27) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/FeedbackServiceTest.java)
Đánh giá bác sĩ. **Ràng buộc biên: chỉ sửa được trong đúng 24 giờ kể từ khi tạo và khi bác sĩ chưa phản hồi.**

| # | Test | Mô tả | Loại |
|---|------|-------|------|
| 1 | `createFeedback_success` | Tạo feedback cho lịch COMPLETED | Positive |
| 2 | `createFeedback_appointmentNotCompleted_throwsException` | Lịch chưa hoàn tất → lỗi | Negative |
| 3 | `createFeedback_appointmentNotBelongToPatient_throwsException` | Lịch của bệnh nhân khác → lỗi | Negative |
| 4 | `createFeedback_alreadyExists_throwsException` | Đã có feedback → không tạo lần 2 | Negative |
| 5 | `updateFeedback_success` | Sửa trong 24h, chưa có reply | Positive |
| 6 | `updateFeedback_wrongPatient_throwsException` | Người khác sửa → lỗi | Negative |
| 7 | `updateFeedback_afterDoctorReply_throwsException` | Đã có reply của bác sĩ → không sửa | Negative |
| 8 | `updateFeedback_bva_within24Hours_succeeds` | Sửa ở 23h59m59s → OK | BVA |
| 9 | `updateFeedback_bva_exactly24Hours_succeeds` | Sửa ở đúng 24h → OK | BVA |
| 10 | `updateFeedback_bva_after24Hours_throwsException` | Sửa ở 24h00m01s → lỗi | BVA |
| 11 | `replyToFeedback_success` | Bác sĩ phản hồi thành công | Positive |
| 12 | `replyToFeedback_wrongDoctor_throwsException` | Bác sĩ khác phản hồi → lỗi | Negative |
| 13 | `updateDoctorReply_success` | Bác sĩ sửa phản hồi trong 24h | Positive |
| 14 | `updateDoctorReply_after24Hours_throwsException` | Sửa phản hồi quá 24h → lỗi | BVA |
| 15 | `updateDoctorReply_legacyFeedbackRepliedAtNull_throwsException` | Dữ liệu cũ `repliedAt` null → lỗi thay vì NPE | Negative |
| 16 | `fromEntity_nullCreatedAt_success` | Map entity `createdAt` null không NPE, `canEdit=false` | Positive |
| 17 | `averageRating_noFeedbacks_returnsZero` | Chưa có feedback → 0.0 | Positive |
| 18 | `averageRating_withHiddenFeedbacks_ignoresHidden` | Bỏ qua feedback bị ẩn | Positive |
| 19 | `averageRating_allHidden_returnsZero` | Tất cả bị ẩn → 0.0 | Positive |
| 20 | `averageRating_withNullHiddenFeedbacks_ignoresNullHidden` | `isHidden` null coi như hiển thị | Positive |
| 21 | `hideFeedback_success` | Admin ẩn feedback | Positive |
| 22 | `unhideFeedback_success` | Admin bỏ ẩn feedback | Positive |
| 23 | `getDoctorFeedbacks_filtersHidden` | Danh sách công khai loại feedback ẩn | Positive |
| 24 | `getDoctorFeedbacks_withNullHiddenFeedbacks_succeeds` | Không NPE khi `isHidden` null | Positive |
| 25 | `getByStatus_nullStatus_returnsAll` | Status null → tất cả | Positive |
| 26 | `getByStatus_validStatus_filters` | Lọc theo status hợp lệ | Positive |
| 27 | `getByStatus_invalidStatus_returnsAll` | Status không hợp lệ → tất cả | Positive |

#### `AppointmentServiceTest` (32) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/AppointmentServiceTest.java)
Đặt lịch, khung giờ hợp lệ (17 slot 08:00–17:00, nghỉ trưa 12:00), hủy & hoàn tiền, xác nhận.

| # | Test | Mô tả | Loại |
|---|------|-------|------|
| 1 | `getAvailableSlots_noPendingAppointments_returnsAllSlots` | Trả về đủ 17 slot khi trống | Positive |
| 2 | `getAvailableSlots_removePendingSlot` | Loại slot đang PENDING | Positive |
| 3 | `getAvailableSlots_confirmedRemovedCancelledKept` | Bỏ CONFIRMED, giữ CANCELLED | Positive |
| 4 | `getAvailableSlots_completedAppointment_kept` | Giữ slot COMPLETED | Positive |
| 5 | `createAppointment_cash_success` | Đặt lịch tiền mặt | Positive |
| 6 | `createAppointment_wallet_success` | Đặt lịch trả ví (tự trừ tiền) | Positive |
| 7 | `createAppointment_doctorNotFound_throwsException` | Bác sĩ không tồn tại | Negative |
| 8 | `createAppointment_doctorNotActive_throwsException` | Bác sĩ ngưng hoạt động | Negative |
| 9 | `createAppointment_invalidTimeSlot_throwsException` | Slot 08:15 không hợp lệ | Negative/BVA |
| 10 | `createAppointment_slotAlreadyTaken_throwsException` | Slot đã có người đặt | Negative |
| 11 | `createAppointment_pastDate_throwsException` | Ngày quá khứ | Negative |
| 12 | `shouldRejectInvalidTimeSlot` | 08:15 → lỗi | BVA |
| 13 | `shouldAcceptValidTimeSlot` | 14:30 → OK | BVA |
| 14 | `shouldAcceptEightOClockSlot` | 08:00 (biên đầu) → OK | BVA |
| 15 | `shouldAcceptFivePmSlot` | 17:00 (biên cuối) → OK | BVA |
| 16 | `shouldRejectLunchBreakTimeSlot` | 12:00 nghỉ trưa → lỗi | BVA |
| 17 | `shouldRejectAfterWorkingHours` | 17:30 sau giờ làm → lỗi | BVA |
| 18 | `createAppointment_pastTimeToday_throwsException` | Hôm nay nhưng giờ đã qua | Negative/BVA |
| 19 | `createAppointment_futureTimeToday_success` | Hôm nay giờ tương lai → OK | BVA |
| 20 | `cancelAppointment_pending_success` | Hủy lịch PENDING | Positive |
| 21 | `cancelAppointment_wallet_refund` | Hủy lịch trả ví → hoàn tiền | Positive |
| 22 | `cancelAppointment_wrongPatient_throwsException` | Hủy lịch người khác | Negative |
| 23 | `cancelAppointment_completed_throwsException` | Không hủy lịch COMPLETED | Negative |
| 24 | `cancelAppointment_alreadyCancelled_throwsException` | Không hủy lịch đã hủy | Negative |
| 25 | `confirmAppointment_success` | Bác sĩ xác nhận PENDING→CONFIRMED | Positive |
| 26 | `confirmAppointment_wrongDoctor_throwsException` | Xác nhận lịch không của mình | Negative |
| 27 | `confirmAppointment_notPending_throwsException` | Chỉ PENDING mới xác nhận | Negative |
| 28 | `getByDate_nullDate_returnsAll` | Không lọc → tất cả | Positive |
| 29 | `getByDate_withDate_filtersCorrectly` | Lọc theo ngày | Positive |
| 30 | `updateAppointmentByAdmin_pastDate_throwsException` | Admin dời về ngày quá khứ | Negative |
| 31 | `updateAppointmentByAdmin_pastTimeToday_throwsException` | Admin dời về giờ đã qua hôm nay | Negative/BVA |
| 32 | `updateAppointmentByAdmin_futureTimeToday_success` | Admin dời tới giờ tương lai | BVA |

#### `AppointmentServiceExtraTest` (44) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/AppointmentServiceExtraTest.java)
Bổ sung phủ nhánh: hoàn tất khám, hủy bởi bác sĩ/admin, thanh toán ví, đặt lịch cho người nhà.

| # | Test | Mô tả | Loại |
|---|------|-------|------|
| 1-2 | `getAppointmentById_found` / `_notFound` | Chi tiết lịch theo ID | Positive / Negative |
| 3 | `getPatientAppointments_withAndWithoutFeedback` | Danh sách lịch + cờ đã/chưa feedback | Positive |
| 4-5 | `updatePaymentStatus_success` / `_notFound` | Cập nhật trạng thái thanh toán | Positive / Negative |
| 6-7 | `cancelDueToPaymentFailure_success` / `_notFound` | Hủy do thanh toán thất bại | Positive / Negative |
| 8 | `completeAppointment_success` | Hoàn tất khám (CONFIRMED→COMPLETED) | Positive |
| 9 | `completeAppointment_notConfirmed_throws` | Chỉ CONFIRMED mới hoàn tất | Negative |
| 10 | `completeAppointment_notFound` | Không tồn tại | Negative |
| 11-12 | `deleteAppointment_success` / `_notFound` | Xóa lịch | Positive / Negative |
| 13 | `cancelByDoctor_success_noRefund` | Bác sĩ hủy lịch tiền mặt | Positive |
| 14 | `cancelByDoctor_walletRefund` | Bác sĩ hủy → hoàn ví | Positive |
| 15 | `cancelByDoctor_wrongDoctor` | Hủy lịch không của mình | Negative |
| 16-17 | `cancelByDoctor_completed` / `_alreadyCancelled` | Trạng thái không hợp lệ | Negative |
| 18 | `cancelByDoctor_within24h_throws` | Không hủy trong 24h trước giờ khám | BVA |
| 19-20 | `cancelByAdmin_success` / `_walletRefund` | Admin hủy (± hoàn ví) | Positive |
| 21-23 | `cancelByAdmin_completed` / `_alreadyCancelled` / `_notFound` | Trạng thái không hợp lệ | Negative |
| 24 | `createAppointment_walletPaid_success` | Đặt lịch trả ví | Positive |
| 25 | `createAppointment_walletPaymentFails` | Ví thanh toán lỗi | Negative |
| 26 | `createAppointment_walletFreeConsultation_paid` | Phí = 0 vẫn đánh dấu PAID | BVA |
| 27-28 | `createAppointment_doctorNotActive_throws` / `_slotTaken_throws` | Bác sĩ ngưng / slot đã đặt | Negative |
| 29 | `createAppointment_forFamilyMember_success` | Đặt lịch cho người nhà | Positive |
| 30 | `createAppointment_familyMemberNotFound_throws` | Người nhà không tồn tại | Negative |
| 31 | `getAllAppointments_returnsList` | Toàn bộ lịch | Positive |
| 32-33 | `getAppointmentsByDate_null_returnsAll` / `_withDate` | Lọc theo ngày | Positive |
| 34-36 | `getAvailableTimeSlots_futureDate...` / `_excludesBookedPending` / `_ignoresCancelledSlots` | Slot trống theo trạng thái | Positive |
| 37 | `createAppointment_pastDate_throws` | Ngày quá khứ | Negative |
| 38 | `createAppointment_reuseCancelledSlot_deletesOld` | Đặt lại slot đã hủy → xóa bản ghi cũ | Positive |
| 39 | `createAppointment_nullConsultationFee_treatedAsZero` | Phí null coi như 0 | BVA |
| 40 | `createAppointment_patientEmailEmpty_skipsEmail` | Email rỗng → bỏ qua gửi mail | Positive |
| 41 | `cancelAppointment_walletRefundFails_throws` | Hoàn ví lỗi khi hủy → throw | Negative |
| 42-43 | `cancelAppointment_notFound` / `cancelByDoctor_notFound` | Không tồn tại | Negative |
| 44 | `updateAppointmentByAdmin_statusToConfirmed_sendsEmail` | Admin đổi sang CONFIRMED → gửi email | Positive |

#### `AuthServiceTest` (11) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/AuthServiceTest.java)

| # | Test | Mô tả | Loại |
|---|------|-------|------|
| 1-3 | `register_success_patient/doctor/admin` | Đăng ký 3 vai trò | Positive |
| 4 | `register_noRole_defaultsToPatient` | Không role → PATIENT | Positive |
| 5 | `register_fails_usernameExists` | Trùng username | Negative |
| 6 | `register_fails_emailExists` | Trùng email | Negative |
| 7 | `register_invalidRole_defaultsToPatient` | Role sai → PATIENT | Positive |
| 8 | `login_success` | Đăng nhập trả JWT + thông tin | Positive |
| 9 | `login_success_admin` | Đăng nhập admin | Positive |
| 10 | `login_fails_badCredentials` | Sai mật khẩu | Negative |
| 11 | `login_patientWithoutProfile_fullNameNull` | Chưa có hồ sơ → fullName null | Positive |

#### `DoctorServiceTest` (19) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/DoctorServiceTest.java)
`getAllDoctors`, `searchDoctors`, `getActiveDoctors`, `getDoctorById` (Success/NotFound), `createDoctor` (Success/UsernameExists/EmailExists), `updateDoctor` (Success/UsernameConflict/EmailConflict), `ensureDoctorProfile` (Exists/CreatesNew/UserNotDoctorRole/UserNotFound), `updateDoctorProfile`, `changePassword` (Success/IncorrectCurrentPassword), `deleteDoctor`. — CRUD + đổi mật khẩu + đảm bảo hồ sơ (Positive/Negative).

#### `UserServiceTest` (17) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/UserServiceTest.java)
`loadUserByUsername` (byUsername/byEmail/NotFound), `findById` (Success/NotFound), `findByUsername_NotFound`, `createUser` (Success/UsernameExists/EmailExists), `updateUser` (Success/EmailConflict), `deleteUser` (Success/DataIntegrityViolation), `toggleUserStatus`, `changeUserPassword`, `searchUsers` (EmptySearch/WithQuery). — Xác thực UserDetails + CRUD.

#### `AdminServiceTest` (29) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/AdminServiceTest.java)
Facade uỷ quyền cho các service con: quản lý bác sĩ (`getAll/search/getById/create/update/delete`), bệnh nhân (`create/update/delete` + biên email trùng/không đổi), lịch hẹn (`getAll ± date/getById/update/delete`), feedback (`getAll/byDoctor/byPatient/getById/hide/unhide`). — Positive + Negative (NotFound/EmailExists).

#### `PatientServiceTest` (14) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/PatientServiceTest.java)
`searchPatients` (Empty/Null/WithKeyword), `getPatientById` (Success/NotFound), `getAllPatients`, `getPatientByUserId` (Success/NotFound), `updatePatientProfile` (Success/InvalidGender/PatientNotFound), `changePassword` (Success/IncorrectCurrentPassword/UserNotFound).

#### `FamilyMemberServiceTest` (15) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/FamilyMemberServiceTest.java)
`getFamilyMembers`, `createFamilyMember` (nonSelf/self/self_mainExists/patientNotFound), `updateFamilyMember` (notFound/mainAccount_throws/relationshipSelf_throws/allFields/emptyMedicalHistory→null), `deleteFamilyMember` (notFound/nonMain/onlyMainAccount_throws/mainAccount_multiple), `getFamilyStats`.

#### `NotificationServiceTest` (11) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/NotificationServiceTest.java)
`createNotification` (success/patientNotFound), `getNotificationsByPatientId`, `getUnreadCount`, `markAsRead` (success/notFound/wrongOwner), `markAllAsRead`, `deleteNotification` (success/notFound/wrongOwner). — Có kiểm tra phân quyền chủ sở hữu.

#### `TreatmentServiceTest` (11) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/TreatmentServiceTest.java)
`getAllTreatments`, `getTreatmentsByDoctorId`, `getTreatmentsByPatientId`, `getTreatmentById` (Success/NotFound), `getTreatmentByAppointmentId`, `createTreatment` (Success/DoctorNotFound/PatientNotFound), `updateTreatment_Success`, `deleteTreatment_Success`.

#### `VNPayServiceTest` (8) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/VNPayServiceTest.java)
`init` trim tmnCode/hashSecret; `createPaymentUrl` (normalize tiếng Việt); `createPaymentUrlForAppointment`; `verifyPayment` (checksum hợp lệ→true / sai→false / thiếu `vnp_SecureHash`→false); `getResponseCode`; `isPaymentSuccess` ('00'→true, khác→false).

#### `MedicationServiceTest` (4) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/MedicationServiceTest.java)
`searchMedications` với `limit`: underLimit_returnsAll / overLimit_truncates / nullLimit_returnsAll / zeroLimit_returnsAll — **BVA giới hạn kết quả**.

#### `AISymptomServiceTest` (3) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/AISymptomServiceTest.java)
Đường fallback khi không gọi được AI ngoài: lời chào → thân thiện (riskLevel Low); hỏi khám khoa nào → gợi ý; mô tả triệu chứng → phản hồi chung. *(Có thể skip khi `SKIP_AI_TESTS=true`.)*

---

### 1.2. Controller layer — Kiểm thử API & mã HTTP (MockMvc)

#### `AuthControllerTest` (6) — [file](../../backend/src/test/java/com/doctorbooking/backend/controller/AuthControllerTest.java)
`register` thành công→201 / lỗi nghiệp vụ→400; `login` thành công→200 / sai thông tin→401 / lỗi hệ thống→500; `test` endpoint→200.

#### `PublicControllerTest` (1) — [file](../../backend/src/test/java/com/doctorbooking/backend/controller/PublicControllerTest.java)
`healthCheck_ok` → 200 với status UP.

#### `PatientControllerTest` (45) — [file](../../backend/src/test/java/com/doctorbooking/backend/controller/PatientControllerTest.java)
Bao phủ toàn bộ endpoint bệnh nhân: hồ sơ (`getProfile`/`updateProfile`/`changePassword` + case notFound/badRequest); đặt lịch (`createAppointment` cash/vnpay/urlError/serviceError), `getAppointments`, `getAppointmentById` (success/forbidden/notFound), `cancelAppointment`, `getAvailableTimeSlots` (success/invalidDate); tìm bác sĩ (`searchDoctors`, `getDoctorById` active/inactive/exception); bệnh án (`getTreatments`, `getTreatmentById`, `getTreatmentByAppointmentId` + forbidden/notFound/null); feedback (`createFeedback`, `getFeedbacks`, `getFeedbackById`, `updateFeedback` + badRequest); AI (`checkSymptoms` empty/success/illegalArgument/genericError). — Đủ Positive + Negative (400/403/404/500).

#### `DoctorControllerTest` (47) — [file](../../backend/src/test/java/com/doctorbooking/backend/controller/DoctorControllerTest.java)
Toàn bộ endpoint bác sĩ: hồ sơ & đổi mật khẩu; lịch hẹn (`getAppointments` byDate/all/error, `getAppointmentById` success/forbidden/notFound, `confirm`/`cancel` success/badRequest); bệnh án/đơn thuốc (`getTreatments`, `getTreatmentById`, `create`/`update`/`delete` + forbidden/notFound/badRequest); bệnh nhân (`searchPatients`, `getPatientById`, `getPatientTreatments`); thuốc (`searchMedications`); feedback (`getDoctorFeedbacks`, `getFeedbacksByRating`, `getFeedbackById`, `replyToFeedback`, `updateDoctorReply`, `getAverageRating` + exception→0).

#### `AdminControllerTest` (37) — [file](../../backend/src/test/java/com/doctorbooking/backend/controller/AdminControllerTest.java)
Quản trị bác sĩ (`getAll` ±search, `getById` found/notFound, `create`/`update`/`delete` + badRequest/notFound); bệnh nhân (tương tự); lịch hẹn (`getAll`, `getById`, `update`, `cancel`, `delete` + badRequest/notFound); feedback (`getAll`, `byDoctor`, `byPatient`, `getById`, `hide`/`unhide` + notFound).

#### `UserControllerTest` (17) — [file](../../backend/src/test/java/com/doctorbooking/backend/controller/UserControllerTest.java)
`getAllUsers` (noSearch/withSearch/blankSearch), `getUserById` (found/notFound), `createUser` (success/badRequest), `updateUser` (success/badRequest), `deleteUser` (success/**dataIntegrity→409**/notFound/otherError→400), `toggleUserStatus` (success/notFound), `changePassword` (success/badRequest).

#### `PaymentControllerTest` (18) — [file](../../backend/src/test/java/com/doctorbooking/backend/controller/PaymentControllerTest.java)
`getWallet` (success/nullFields→defaults/patientNotFound→500); `topUp` (success/**amountTooLow→400**/**amountTooHigh→400**/patientNotFound→500); `getTransactions` (success/error); callback ví `vnpayCallback` (success/failedPayment/invalidChecksum/missingTxnRef/exception); callback lịch hẹn `vnpayAppointmentCallback` (success/failed/invalidChecksum/exception).

#### `NotificationControllerTest` (11) — [file](../../backend/src/test/java/com/doctorbooking/backend/controller/NotificationControllerTest.java)
`getNotifications` (success/notAuthenticated/patientNotFound), `getUnreadCount` (success/error), `markAsRead` (success/error), `markAllAsRead` (success/error), `deleteNotification` (success/error).

#### `FamilyMemberControllerTest` (10) — [file](../../backend/src/test/java/com/doctorbooking/backend/controller/FamilyMemberControllerTest.java)
`getFamilyMembers`, `getFamilyStats`, `createFamilyMember`, `updateFamilyMember`, `deleteFamilyMember` — mỗi endpoint có case success + lỗi (500/400).

---

### 1.3. DTO Validation layer — Blackbox EP & BVA (Jakarta Validation)

Kiểm thử ràng buộc `@NotBlank`, `@Size`, `@Email`, `@NotNull`, `@DecimalMin` ở tầng DTO bằng `Validator` — thiết kế theo tài liệu `docs/blackbox/`.

#### `RegisterRequestValidationTest` (13) — [file](../../backend/src/test/java/com/doctorbooking/backend/dto/RegisterRequestValidationTest.java)
- **username `@Size(3,50)`**: B1=3 / B2=4 / B3=26 / B4=49 / B5=50 hợp lệ; X1/B0=2 & X2/B6=51 không hợp lệ; rỗng→lỗi `@NotBlank`.
- **password `@Size(min=6)`**: B8=6/B9=7/B10=20 hợp lệ (parameterized); X4/B7=5 không hợp lệ; rỗng→lỗi.
- **email `@Email`+`@NotBlank`**: đúng định dạng hợp lệ; thiếu `@` không hợp lệ; rỗng→lỗi.
- **fullName `@NotBlank`**: 1 ký tự hợp lệ; chỉ khoảng trắng→lỗi.
- **nominal**: tất cả hợp lệ → 0 vi phạm.

#### `LoginRequestValidationTest` (4) — [file](../../backend/src/test/java/com/doctorbooking/backend/dto/LoginRequestValidationTest.java)
username & password không rỗng → hợp lệ; username rỗng / chỉ khoảng trắng / password rỗng → lỗi `@NotBlank`.

#### `FeedbackRequestValidationTest` (5) — [file](../../backend/src/test/java/com/doctorbooking/backend/dto/FeedbackRequestValidationTest.java)
rating ∈ [1,5] hợp lệ (parameterized B1..B5); rating=0 (<min) / 6 (>max) / -1 (âm) / null (`@NotNull`) → không hợp lệ.

#### `TopUpRequestValidationTest` (6) — [file](../../backend/src/test/java/com/doctorbooking/backend/dto/TopUpRequestValidationTest.java)
amount ≥ 10.000 hợp lệ (parameterized 10000/10001/50000/1000000); 9.999 (<min) / 100 / 0 / null → không hợp lệ; paymentMethod null → lỗi `@NotNull`.

#### `SymptomCheckRequestValidationTest` (4) — [file](../../backend/src/test/java/com/doctorbooking/backend/dto/SymptomCheckRequestValidationTest.java)
symptoms hợp lệ → OK; rỗng / chỉ khoảng trắng / null → lỗi `@NotBlank`.

#### `BackendApplicationTests` (1) — [file](../../backend/src/test/java/com/doctorbooking/backend/BackendApplicationTests.java)
`contextLoads` — Spring Boot context khởi tạo thành công.

---

## 2. Kiểm thử Tự động hóa API (Postman / Newman)

Bộ API Test Suite kiểm thử tích hợp end-to-end và BVA trực tiếp qua HTTP.

* **114 kịch bản** trong **24 folder**. Dùng data file `data/users_login.json` chạy lặp cho **3 vai trò** (PATIENT/DOCTOR/ADMIN) ⇒ ~**348 request**, ~**768 assertion**.
* **Async email**: luồng gửi email/đơn thuốc qua SMTP chạy bất đồng bộ (`CompletableFuture`) → phản hồi API < 500ms, tránh `ESOCKETTIMEDOUT`.
* CI chạy tuần tự 23 folder `00_Setup` → `22_E2E_Flows` (folder `23_Debug_Test` dành cho debug thủ công).

### 2.1. Điểm nhấn BVA qua API

| Nhóm | Biên | Case | Mã mong đợi |
|------|------|------|-------------|
| `02_Auth` | username [3,50] | 2 ký tự / 3 / 50 / 51 | 400 / 201 / 201 / 400 |
| `02_Auth` | password ≥ 6 | 5 ký tự / 6 ký tự | 400 / 201 |
| `02_Auth` | Security | SQL Injection, XSS trên username/họ tên | 400/401, không 500 |
| `07_Patient_Feedbacks` | rating [1,5] | 0 / 1 / 5 / 6 / thiếu | 400 / 201 / 201 / 400 / 400 |
| `09_Patient_Wallet` | nạp ≥ 10.000đ | 9.999 / 10.000 / 10.001 / 100 | 400 / 201 / 201 / 400 |

### 2.2. Bảng ánh xạ 24 folder

| Folder | Positive | Negative |
|--------|----------|----------|
| `00_Setup` | Reset cờ + đăng nhập 3 vai trò lấy token (200/201) | — |
| `01_Public` | Health check (200) | Sai method POST (405/403) |
| `02_Auth` | Đăng ký/đăng nhập + BVA biên trong (201) | Sai định dạng, SQLi, XSS, BVA biên ngoài (400/401) |
| `03_Patient_Profile` | Xem/cập nhật hồ sơ (200) | Thiếu token / token bác sĩ (403) |
| `04_Patient_Doctors` | Danh sách & chi tiết bác sĩ (200) | ID không tồn tại (404) |
| `05_Patient_Appointments` | Lấy giờ trống + đặt lịch CASH (200/201) | Thiếu ID, sai thời gian, không token (400/403/404) |
| `06_Patient_Treatments` | Xem đơn thuốc & chi tiết (200) | Đơn không tồn tại (404) |
| `07_Patient_Feedbacks` | Xem & đăng feedback hợp lệ (200/201) | Thiếu/ngoài biên rating (400) |
| `08_Patient_FamilyMembers` | Lọc, thống kê, thêm người nhà (200/201) | Thiếu tên, xóa không tồn tại (400/404) |
| `09_Patient_Wallet_Payments` | Số dư, lịch sử, nạp tiền biên hợp lệ (200/201) | Nạp < 10.000đ (400) |
| `10_Patient_AI` | Chẩn đoán triệu chứng (200/503) | Triệu chứng rỗng (400) |
| `11_Patient_Notifications` | Xem, đếm chưa đọc, đánh dấu đã đọc (200) | Thông báo không tồn tại (404/400) |
| `12_Doctor_Profile` | Xem/cập nhật hồ sơ bác sĩ (200) | Token bệnh nhân (403) |
| `13_Doctor_Appointments` | Lịch hẹn, chi tiết, xác nhận (200) | Ca không tồn tại (404) |
| `14_Doctor_Treatments` | Danh sách + tạo bệnh án (200/201) | Thiếu thông tin bệnh nhân (400) |
| `15_Doctor_Patients` | Danh sách & chi tiết bệnh nhân (200) | Bệnh nhân không tồn tại (404) |
| `16_Doctor_Medications_Feedbacks` | Thuốc, nhận xét, điểm TB (200) | Lọc rating không hợp lệ (400/404) |
| `17_Admin_Doctors` | Quản lý & tìm kiếm bác sĩ (200) | Không tồn tại / thiếu trường (400/404) |
| `18_Admin_Patients` | Quản lý bệnh nhân (200) | Không tồn tại (404) |
| `19_Admin_Appointments` | Quản lý toàn bộ ca khám (200) | Không tồn tại (404) |
| `20_Admin_Feedbacks` | Xem & lọc nhận xét (200) | Không tồn tại (404) |
| `21_Admin_Users` | Danh sách & tạo tài khoản (200/201) | Sai email, không tồn tại (400/404) |
| `22_E2E_Flows` | Đặt lịch→Xác nhận→Khám & kê đơn→Đánh giá→Dọn dữ liệu | (200/201/204) |
| `23_Debug_Test` | Kiểm tra phân quyền & kết nối CSDL | (200) |

---

## 3. Kiểm thử Giao diện E2E (CodeceptJS + Playwright)

Chạy khi backend `:8080` và frontend đang hoạt động. Lệnh: `npm run e2e:smoke` (`@smoke`), `npm run e2e:bva` (`@bva`), `npm run e2e` (toàn bộ). Chi tiết map file↔ticket xem `docs/Report/04_E2E/test-matrix.md`.

* **Blackbox BVA (`@bva`)** — 10 file: Register, Login, Appointment Booking, Feedback Rating, Feedback Edit 24h, Wallet Top-up, Loyalty Tier, Health AI, Notifications, Profile Password.
* **Smoke (`@smoke`)** — theo vai trò: Public (`/doctors`, `/specialties`, `/about`, `/contact`), Patient (đăng nhập/đăng ký, dashboard, hồ sơ, đặt lịch, ví, AI, tìm bác sĩ, lịch sử, thanh toán), Doctor, Admin.
* **Integration flows** — đặt lịch cho người nhà, feedback end-to-end, luồng admin, đa vai trò.

---

## 4. Kết Luận

* Bộ test phủ 3 tầng: **Logic nghiệp vụ (JUnit)** → **API (Postman)** → **Giao diện (E2E)**, với **496 test method** backend, **114 kịch bản** API và **~30 file** E2E.
* **Phân tích giá trị biên (BVA)** được áp dụng nhất quán ở cả 3 tầng cho: độ dài chuỗi (username/password), khoảng số (rating 1–5, nạp ≥ 10.000đ, hạng loyalty), khung giờ khám (08:00–17:00, nghỉ trưa) và thời gian (giới hạn sửa feedback 24h).
* Độ phủ backend đạt Instruction 90% / Branch 70% / Line 91%, vượt cổng chất lượng JaCoCo (line ≥ 80%, branch ≥ 70%).
* Email SMTP bất đồng bộ giúp API phản hồi nhanh và loại bỏ lỗi nghẽn khi chạy kiểm thử tự động.
