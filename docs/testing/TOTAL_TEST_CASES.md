# Danh sách Test Cases — Doctor Booking System 2026

## 1. Backend (JUnit / Mockito)

### 1.1. Service layer

#### `WalletServiceTest` (26) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/WalletServiceTest.java)

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
`getAllDoctors`, `searchDoctors`, `getActiveDoctors`, `getDoctorById` (Success/NotFound), `createDoctor` (Success/UsernameExists/EmailExists), `updateDoctor` (Success/UsernameConflict/EmailConflict), `ensureDoctorProfile` (Exists/CreatesNew/UserNotDoctorRole/UserNotFound), `updateDoctorProfile`, `changePassword` (Success/IncorrectCurrentPassword), `deleteDoctor`.

#### `UserServiceTest` (17) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/UserServiceTest.java)
`loadUserByUsername` (byUsername/byEmail/NotFound), `findById` (Success/NotFound), `findByUsername_NotFound`, `createUser` (Success/UsernameExists/EmailExists), `updateUser` (Success/EmailConflict), `deleteUser` (Success/DataIntegrityViolation), `toggleUserStatus`, `changeUserPassword`, `searchUsers` (EmptySearch/WithQuery).

#### `AdminServiceTest` (29) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/AdminServiceTest.java)

#### `PatientServiceTest` (14) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/PatientServiceTest.java)
`searchPatients` (Empty/Null/WithKeyword), `getPatientById` (Success/NotFound), `getAllPatients`, `getPatientByUserId` (Success/NotFound), `updatePatientProfile` (Success/InvalidGender/PatientNotFound), `changePassword` (Success/IncorrectCurrentPassword/UserNotFound).

#### `FamilyMemberServiceTest` (15) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/FamilyMemberServiceTest.java)
`getFamilyMembers`, `createFamilyMember` (nonSelf/self/self_mainExists/patientNotFound), `updateFamilyMember` (notFound/mainAccount_throws/relationshipSelf_throws/allFields/emptyMedicalHistory→null), `deleteFamilyMember` (notFound/nonMain/onlyMainAccount_throws/mainAccount_multiple), `getFamilyStats`.

#### `NotificationServiceTest` (11) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/NotificationServiceTest.java)
`createNotification` (success/patientNotFound), `getNotificationsByPatientId`, `getUnreadCount`, `markAsRead` (success/notFound/wrongOwner), `markAllAsRead`, `deleteNotification` (success/notFound/wrongOwner).

#### `TreatmentServiceTest` (11) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/TreatmentServiceTest.java)
`getAllTreatments`, `getTreatmentsByDoctorId`, `getTreatmentsByPatientId`, `getTreatmentById` (Success/NotFound), `getTreatmentByAppointmentId`, `createTreatment` (Success/DoctorNotFound/PatientNotFound), `updateTreatment_Success`, `deleteTreatment_Success`.

#### `VNPayServiceTest` (8) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/VNPayServiceTest.java)
`init` trim tmnCode/hashSecret; `createPaymentUrl` (normalize tiếng Việt); `createPaymentUrlForAppointment`; `verifyPayment` (checksum hợp lệ→true / sai→false / thiếu `vnp_SecureHash`→false); `getResponseCode`; `isPaymentSuccess` ('00'→true, khác→false).

#### `MedicationServiceTest` (4) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/MedicationServiceTest.java)
`searchMedications` với `limit`: underLimit_returnsAll / overLimit_truncates / nullLimit_returnsAll / zeroLimit_returnsAll

#### `AISymptomServiceTest` (3) — [file](../../backend/src/test/java/com/doctorbooking/backend/service/AISymptomServiceTest.java)

---

### 1.2. Controller layer

#### `AuthControllerTest` (6) — [file](../../backend/src/test/java/com/doctorbooking/backend/controller/AuthControllerTest.java)
`register` thành công→201 / lỗi nghiệp vụ→400; `login` thành công→200 / sai thông tin→401 / lỗi hệ thống→500; `test` endpoint→200.

#### `PublicControllerTest` (1) — [file](../../backend/src/test/java/com/doctorbooking/backend/controller/PublicControllerTest.java)
`healthCheck_ok` → 200 với status UP.

#### `PatientControllerTest` (45) — [file](../../backend/src/test/java/com/doctorbooking/backend/controller/PatientControllerTest.java)

#### `DoctorControllerTest` (47) — [file](../../backend/src/test/java/com/doctorbooking/backend/controller/DoctorControllerTest.java)

#### `AdminControllerTest` (37) — [file](../../backend/src/test/java/com/doctorbooking/backend/controller/AdminControllerTest.java)

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

#### `LoginRequestValidationTest` (4) — [file](../../backend/src/test/java/com/doctorbooking/backend/dto/LoginRequestValidationTest.java)

#### `FeedbackRequestValidationTest` (5) — [file](../../backend/src/test/java/com/doctorbooking/backend/dto/FeedbackRequestValidationTest.java)

#### `TopUpRequestValidationTest` (6) — [file](../../backend/src/test/java/com/doctorbooking/backend/dto/TopUpRequestValidationTest.java)

#### `SymptomCheckRequestValidationTest` (4) — [file](../../backend/src/test/java/com/doctorbooking/backend/dto/SymptomCheckRequestValidationTest.java)

#### `BackendApplicationTests` (1) — [file](../../backend/src/test/java/com/doctorbooking/backend/BackendApplicationTests.java)
`contextLoads` — Spring Boot context khởi tạo thành công.

---

## 2. API (Postman / Newman)

| Folder | Test case (Positive) | Test case (Negative) |
|--------|----------------------|----------------------|
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

---

## 3. E2E (CodeceptJS + Playwright)

| ID | Test case | File | Tag |
|----|-----------|------|-----|
| TC-LOGIN-01 | Patient đăng nhập thành công và redirect đúng | `auth/login_test.cjs` | @smoke |
| TC-LOGIN-02 | Sai mật khẩu → hiển thị error | `auth/login_test.cjs` | @smoke |
| TC-LOGIN-03 | Username không tồn tại → hiển thị error | `auth/login_test.cjs` | @smoke |
| TC-LOGIN-04 | Để trống form → HTML5 required chặn submit | `auth/login_test.cjs` | @smoke |
| TC-LOGIN-05 | Đã login truy cập /login → redirect dashboard | `auth/login_test.cjs` | @smoke |
| TC-REG-01 | Đăng ký hợp lệ → redirect dashboard | `auth/register_test.cjs` | @smoke |
| TC-REG-02 | Username trùng → error | `auth/register_test.cjs` | @smoke |
| TC-REG-03 | Email trùng → error | `auth/register_test.cjs` | @smoke |
| TC-REG-04 | Password < 6 ký tự → không submit | `auth/register_test.cjs` | @smoke |
| TC-REG-05 | Bỏ trống Full Name → không submit | `auth/register_test.cjs` | @smoke |
| TC-DASH-01 | Patient thấy dashboard sau login | `patient/dashboard_test.cjs` | @smoke |
| TC-DASH-02 | Chưa login → /patient/dashboard redirect /login | `patient/dashboard_test.cjs` | @smoke |
| TC-DASH-03 | Dashboard hiển thị thống kê | `patient/dashboard_test.cjs` | @smoke |
| TC-DASH-04 | Logout từ dashboard → về login | `patient/dashboard_test.cjs` | @smoke |
| TC-PROFILE-01 | Cập nhật thông tin cá nhân thành công | `patient/profile_test.cjs` | @smoke |
| TC-PROFILE-02 | Đổi mật khẩu thành công, login lại được | `patient/profile_test.cjs` | @smoke |
| TC-PROFILE-03 | Đổi mật khẩu — xác nhận không khớp → lỗi | `patient/profile_test.cjs` | @smoke |
| TC-PROFILE-04 | Cập nhật liên hệ khẩn cấp SOS thành công | `patient/profile_test.cjs` | @smoke |
| TC-BOOK-01 | Trang đặt lịch hiển thị đầy đủ các bước | `patient/booking_test.cjs` | @smoke |
| TC-BOOK-02 | Chưa login → /patient/booking redirect /login | `patient/booking_test.cjs` | @smoke |
| TC-BOOK-03 | Chọn bác sĩ → calendar hiển thị | `patient/booking_test.cjs` | @smoke |
| TC-BOOK-04 | E2E đặt lịch hoàn chỉnh thành công | `patient/booking_test.cjs` | @smoke |
| TC-WALLET-01 | Nạp tiền → callback VNPAY thành công | `patient/wallet_test.cjs` | @smoke |
| TC-WALLET-02 | Nạp tiền bị hủy → hiển thị lỗi | `patient/wallet_test.cjs` | @smoke |
| TC-AI-01 | Tư vấn triệu chứng AI + đặt lịch chuyên khoa | `patient/health_ai_test.cjs` | @smoke |
| TC-SEARCH-01 | Trang tìm bác sĩ load sau login | `patient/doctor_search_test.cjs` | @smoke |
| TC-SEARCH-02 | Tìm kiếm → hiển thị kết quả | `patient/doctor_search_test.cjs` | @smoke |
| TC-SEARCH-03 | Không có kết quả → empty state | `patient/doctor_search_test.cjs` | @smoke |
| TC-SEARCH-04 | Search tiếng Việt hoạt động | `patient/doctor_search_test.cjs` | @smoke |
| TC-HISTORY-01 | Bệnh nhân hủy lịch PENDING thành công | `patient/history_test.cjs` | @smoke |
| TC-APT-PAY-01 | Callback thanh toán thành công | `patient/appointment_payment_test.cjs` | @smoke |
| TC-APT-PAY-02 | Callback thất bại (hủy giao dịch) | `patient/appointment_payment_test.cjs` | @smoke |
| TC-DOC-01 | Dashboard bác sĩ load thành công | `doctor/doctor_smoke_test.cjs` | @smoke |
| TC-DOC-02 | Hồ sơ bác sĩ + mở form chỉnh sửa | `doctor/doctor_smoke_test.cjs` | @smoke |
| TC-DOC-03 | Tìm kiếm bệnh nhân theo từ khóa | `doctor/doctor_smoke_test.cjs` | @smoke |
| TC-DOC-04 | Trang lịch hẹn bác sĩ load | `doctor/doctor_smoke_test.cjs` | @smoke |
| TC-DOC-05 | Trang phản hồi bác sĩ load | `doctor/doctor_smoke_test.cjs` | @smoke |
| TC-DOC-06 | Trang quản lý điều trị load | `doctor/doctor_smoke_test.cjs` | @smoke |
| TC-ADM-01 | Dashboard admin load | `admin/admin_smoke_test.cjs` | @smoke |
| TC-ADM-02 | Danh sách người dùng + form tạo | `admin/admin_smoke_test.cjs` | @smoke |
| TC-ADM-03 | Danh sách bác sĩ + form tạo | `admin/admin_smoke_test.cjs` | @smoke |
| TC-ADM-04 | Danh sách bệnh nhân + form tạo | `admin/admin_smoke_test.cjs` | @smoke |
| TC-ADM-05 | Quản lý lịch hẹn load | `admin/admin_smoke_test.cjs` | @smoke |
| TC-ADM-06 | Quản lý phản hồi load | `admin/admin_smoke_test.cjs` | @smoke |
| TC-PUB-01 | Danh sách bác sĩ công khai load | `public/public_pages_test.cjs` | @smoke |
| TC-PUB-02 | Trang chuyên khoa load | `public/public_pages_test.cjs` | @smoke |
| TC-PUB-03 | Trang giới thiệu load | `public/public_pages_test.cjs` | @smoke |
| TC-PUB-04 | Trang liên hệ load | `public/public_pages_test.cjs` | @smoke |
| TC-INT-01 | Bệnh nhân đặt lịch → Bác sĩ duyệt | `integration/multi_role_test.cjs` | integration |
| TC-INT-02 | Bệnh nhân đặt lịch → Bác sĩ hủy | `integration/multi_role_test.cjs` | integration |
| TC-INT-03 | Bác sĩ kê đơn → Bệnh nhân xem bệnh án | `integration/multi_role_test.cjs` | integration |
| TC-INT-04 | Thêm người nhà → đặt lịch cho người nhà | `integration/family_booking_test.cjs` | integration |
| TC-INT-05 | Admin khóa Doctor → không login/đặt lịch được | `integration/admin_flow_test.cjs` | integration |
| TC-FEEDBACK-ALL | Gửi đánh giá → Bác sĩ phản hồi → Admin ẩn | `integration/feedback_test.cjs` | integration |
| REG-B0/B1 | Username 2 ký tự → minLength chặn | `blackbox/register_bva_test.cjs` | @bva |
| REG-B6 | Username 51 ký tự → API 400 | `blackbox/register_bva_test.cjs` | @bva |
| REG-B13 | Email sai định dạng → HTML5 chặn | `blackbox/register_bva_test.cjs` | @bva |
| REG-B7 | Password 5 ký tự → minLength chặn | `blackbox/register_bva_test.cjs` | @bva |
| REG-B2/B3 | Username 3 và 50 ký tự → đăng ký OK | `blackbox/register_bva_test.cjs` | @bva |
| LOG-B0 | Username rỗng → không submit | `blackbox/login_bva_test.cjs` | @bva |
| LOG-B1 | Username chỉ khoảng trắng → ở trang login | `blackbox/login_bva_test.cjs` | @bva |
| LOG-X2 | Password rỗng → không submit | `blackbox/login_bva_test.cjs` | @bva |
| LOG-X3 | Sai mật khẩu → lỗi 401 | `blackbox/login_bva_test.cjs` | @bva |
| APT-B0 | Ngày quá khứ bị chặn | `blackbox/booking_bva_test.cjs` | @bva |
| APT-B6/B7 | Slot 08:00 và 17:00 có trong dropdown | `blackbox/booking_bva_test.cjs` | @bva |
| FBR-B1 | Rating 1 sao → feedback OK | `blackbox/feedback_rating_bva_test.cjs` | @bva |
| FBR-B5 | Rating 5 sao → feedback OK | `blackbox/feedback_rating_bva_test.cjs` | @bva |
| FBT-V1 | canEdit=true → sửa feedback OK | `blackbox/feedback_edit_bva_test.cjs` | @bva |
| FBT-X1 | canEdit=false (quá 24h) → không có nút sửa | `blackbox/feedback_edit_bva_test.cjs` | @bva |
| WAL-B0 | Nạp 9.999 VNĐ → nút disabled | `blackbox/wallet_bva_test.cjs` | @bva |
| WAL-B1 | Nạp 10.000 VNĐ → nút enabled | `blackbox/wallet_bva_test.cjs` | @bva |
| WAL-B2 | Nạp 10.001 VNĐ → nút enabled | `blackbox/wallet_bva_test.cjs` | @bva |
| LOY-B0 | 999 điểm → BRONZE | `blackbox/loyalty_tier_bva_test.cjs` | @bva |
| LOY-B1 | 1.000 điểm → SILVER | `blackbox/loyalty_tier_bva_test.cjs` | @bva |
| LOY-B3 | 5.000 điểm → GOLD | `blackbox/loyalty_tier_bva_test.cjs` | @bva |
| HAI-B0 | Triệu chứng rỗng → nút gửi disabled | `blackbox/health_ai_bva_test.cjs` | @bva |
| HAI-B1 | Triệu chứng không rỗng → gửi được | `blackbox/health_ai_bva_test.cjs` | @bva |
| NOT-V1 | Có thông báo chưa đọc → badge số lượng | `blackbox/notifications_bva_test.cjs` | @bva |
| NOT-V2 | Danh sách rỗng → "Chưa có thông báo nào" | `blackbox/notifications_bva_test.cjs` | @bva |
| PRF-B7 | Mật khẩu mới 5 ký tự → minLength chặn | `blackbox/profile_bva_test.cjs` | @bva |

