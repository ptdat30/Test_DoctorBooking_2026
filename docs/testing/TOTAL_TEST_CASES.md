# Tổng Hợp Toàn Bộ Test Cases - Dự Án Doctor Booking System 2026

Tài liệu này tổng hợp toàn bộ các kịch bản kiểm thử (Test Cases) của dự án, bao gồm:
1. **Kiểm thử Đơn vị (JUnit Unit Tests)** ở phía Backend (Spring Boot).
2. **Kiểm thử Tự động hóa API (Postman API Automation)** sử dụng Newman để chạy các kịch bản tích hợp và kiểm thử biên (BVA).

---

## 📊 Tóm Tắt Tổng Quan

| Thành phần kiểm thử | Tổng số Test Cases | Phương pháp áp dụng nổi bật | Trạng thái |
|---------------------|--------------------|----------------------------|------------|
| **JUnit Unit Tests** (Backend) | **67** | Phân tích giá trị biên (BVA), Mocking (Mockito) | Đạt 100% |
| **Postman API Automation** | **114** | BVA, Data-Driven Testing (3 vai trò), Security (SQL Injection, XSS) | Đạt 100% |
| **TỔNG CỘNG** | **181** | **BVA & Integration Testing** | **Passed** |

---

## 1. Kiểm thử Đơn vị Backend (JUnit / Java)
Phần này mô tả các unit test được viết bằng Java, sử dụng JUnit 5 và Mockito để cô lập các Service. Chúng tập trung đặc biệt vào các logic xử lý nghiệp vụ phức tạp và các miền giá trị biên (BVA).

### 1.1. WalletServiceTest ([WalletServiceTest.java](file:///c:/Users/DAT/OneDrive%20-%20ut.edu.vn/Documents/Desktop/Repo/backend/src/test/java/com/doctorbooking/backend/service/WalletServiceTest.java) - 19 Test Cases)
Lớp này kiểm thử ví điện tử của bệnh nhân, cách tính điểm tích lũy và xếp hạng thành viên (Loyalty Tiers).
* **Loyalty Tiers BVA (Phân tích giá trị biên cho các hạng thành viên):**
  * Hạng **BRONZE**: Điểm tích lũy dưới 1000.
  * Hạng **SILVER**: Điểm tích lũy từ 1000 đến 4999.
  * Hạng **GOLD**: Điểm tích lũy từ 5000 đến 9999.
  * Hạng **PLATINUM**: Điểm tích lũy từ 10000 trở lên.

| STT | Tên Test Case (JUnit) | Mô tả | Loại | Giá trị biên kiểm thử |
|-----|----------------------|-------|------|-----------------------|
| 1 | `payForAppointment_success_sufficientBalance` | Thanh toán phí khám thành công khi số dư đủ | Positive | |
| 2 | `payForAppointment_insufficientBalance_throwsException` | Lỗi khi số dư không đủ thanh toán | Negative | |
| 3 | `payForAppointment_enoughPoints_upgradesToPlatinum` | Tích lũy đủ điểm và nâng hạng thành viên lên PLATINUM | Positive | |
| 4 | `payForAppointment_nullBalance_treatedAsZero` | Số dư rỗng (null) được xử lý là 0 và báo lỗi khi thanh toán phí > 0 | Negative | |
| 5 | `refundAppointment_success` | Hoàn tiền phí khám thành công và trừ điểm tích lũy tương ứng | Positive | |
| 6 | `refundAppointment_loyaltyPointsNotNegative` | Điểm tích lũy sau khi trừ hoàn phí không bao giờ bị âm | Positive | Biên dưới = 0 |
| 7 | `createDepositTransaction_success` | Tạo yêu cầu nạp tiền ở trạng thái PENDING thành công | Positive | |
| 8 | `completeDeposit_success` | Xác nhận nạp tiền thành công, cộng số dư, tích điểm và nâng hạng GOLD | Positive | |
| 9 | `completeDeposit_alreadyCompleted_returnsEarly` | Giao dịch đã COMPLETED trước đó không xử lý lại | Positive | |
| 10 | `completeDeposit_notFound_throwsException` | Báo lỗi khi mã giao dịch nạp tiền không tồn tại | Negative | |
| 11 | `failDeposit_success` | Đánh dấu giao dịch nạp tiền thất bại thành công | Positive | |
| 12 | `failDeposit_alreadyCompleted_returnsEarly` | Giao dịch đã COMPLETED không thể đổi sang FAILED | Negative | |
| 13 | `loyaltyTier_bronze` | Điểm tích lũy < 1000 giữ hạng BRONZE | Positive | |
| 14 | `loyaltyTier_silver` | Điểm tích lũy >= 1000 nâng hạng SILVER | Positive | |
| 15 | `loyaltyTier_gold` | Điểm tích lũy >= 5000 nâng hạng GOLD | Positive | |
| 16 | `loyaltyTier_platinum` | Điểm tích lũy >= 10000 nâng hạng PLATINUM | Positive | |
| 17 | `loyaltyTier_bva_0_bronze` | Điểm tối thiểu bằng 0 | BVA Biên dưới | 0 |
| 18 | `loyaltyTier_bva_999_bronze` | Điểm ngay dưới biên SILVER | BVA Biên dưới | 999 |
| 19 | `loyaltyTier_bva_1000_silver` | Điểm vừa chạm biên SILVER | BVA Biên trên | 1000 |
| 20 | `loyaltyTier_bva_1001_silver` | Điểm ngay trên biên SILVER | BVA Biên trên | 1001 |
| 21 | `loyaltyTier_bva_4999_silver` | Điểm ngay dưới biên GOLD | BVA Biên dưới | 4999 |
| 22 | `loyaltyTier_bva_5000_gold` | Điểm vừa chạm biên GOLD | BVA Biên trên | 5000 |
| 23 | `loyaltyTier_bva_5001_gold` | Điểm ngay trên biên GOLD | BVA Biên trên | 5001 |
| 24 | `loyaltyTier_bva_9999_gold` | Điểm ngay dưới biên PLATINUM | BVA Biên dưới | 9999 |
| 25 | `loyaltyTier_bva_10000_platinum` | Điểm vừa chạm biên PLATINUM | BVA Biên trên | 10000 |
| 26 | `loyaltyTier_bva_10001_platinum` | Điểm ngay trên biên PLATINUM | BVA Biên trên | 10001 |

### 1.2. FeedbackServiceTest ([FeedbackServiceTest.java](file:///c:/Users/DAT/OneDrive%20-%20ut.edu.vn/Documents/Desktop/Repo/backend/src/test/java/com/doctorbooking/backend/service/FeedbackServiceTest.java) - 21 Test Cases)
Kiểm thử tính năng đánh giá bác sĩ của bệnh nhân. Hạn chế biên đặc biệt: **Cho phép chỉnh sửa đánh giá trong vòng đúng 24 giờ kể từ lúc tạo, và chưa có bác sĩ phản hồi.**

| STT | Tên Test Case (JUnit) | Mô tả | Loại | Biên kiểm thử |
|-----|----------------------|-------|------|---------------|
| 1 | `createFeedback_success` | Tạo phản hồi thành công cho lịch khám đã hoàn thành | Positive | |
| 2 | `createFeedback_appointmentNotCompleted_throwsException` | Báo lỗi khi tạo phản hồi cho lịch khám chưa hoàn thành | Negative | |
| 3 | `createFeedback_appointmentNotBelongToPatient_throwsException` | Báo lỗi khi phản hồi lịch khám của bệnh nhân khác | Negative | |
| 4 | `createFeedback_alreadyExists_throwsException` | Không cho phép tạo phản hồi lần 2 cho cùng 1 lịch khám | Negative | |
| 5 | `updateFeedback_success` | Cập nhật phản hồi thành công (trong 24 giờ và chưa có phản hồi của bác sĩ) | Positive | |
| 6 | `updateFeedback_wrongPatient_throwsException` | Không cho phép bệnh nhân khác sửa phản hồi | Negative | |
| 7 | `updateFeedback_afterDoctorReply_throwsException` | Không cho phép chỉnh sửa sau khi bác sĩ đã phản hồi | Negative | |
| 8 | `updateFeedback_bva_within24Hours_succeeds` | Sửa thành công ở 23 giờ 59 phút 59 giây | BVA Biên trong | 23h 59m 59s |
| 9 | `updateFeedback_bva_exactly24Hours_succeeds` | Sửa thành công ở chính xác 24 giờ | BVA Biên | Đúng 24h 00m 00s |
| 10 | `updateFeedback_bva_after24Hours_throwsException` | Thất bại khi sửa ở 24 giờ 00 phút 01 giây | BVA Biên ngoài | 24h 00m 01s |
| 11 | `replyToFeedback_success` | Bác sĩ phản hồi nhận xét của bệnh nhân thành công | Positive | |
| 12 | `replyToFeedback_wrongDoctor_throwsException` | Bác sĩ không thể phản hồi nhận xét dành cho bác sĩ khác | Negative | |
| 13 | `averageRating_noFeedbacks_returnsZero` | Điểm đánh giá trung bình bằng 0.0 khi bác sĩ chưa có nhận xét nào | Positive | |
| 14 | `averageRating_withHiddenFeedbacks_ignoresHidden` | Điểm đánh giá trung bình không tính các nhận xét bị ẩn | Positive | |
| 15 | `averageRating_allHidden_returnsZero` | Trả về trung bình 0.0 nếu tất cả nhận xét của bác sĩ bị ẩn | Positive | |
| 16 | `hideFeedback_success` | Admin ẩn nhận xét xấu/không phù hợp thành công | Positive | |
| 17 | `unhideFeedback_success` | Admin bỏ ẩn nhận xét thành công | Positive | |
| 18 | `getDoctorFeedbacks_filtersHidden` | Danh sách nhận xét trả về cho người dùng không chứa nhận xét bị ẩn | Positive | |
| 19 | `getByStatus_nullStatus_returnsAll` | Admin lấy toàn bộ danh sách khi không chỉ định trạng thái lọc | Positive | |
| 20 | `getByStatus_validStatus_filters` | Admin lấy danh sách phản hồi lọc theo trạng thái (PENDING, REPLIED) | Positive | |
| 21 | `getByStatus_invalidStatus_returnsAll` | Lấy toàn bộ danh sách nếu truyền trạng thái không hợp lệ | Positive | |

### 1.3. AuthServiceTest ([AuthServiceTest.java](file:///c:/Users/DAT/OneDrive%20-%20ut.edu.vn/Documents/Desktop/Repo/backend/src/test/java/com/doctorbooking/backend/service/AuthServiceTest.java) - 11 Test Cases)
Kiểm thử tính năng xác thực, đăng nhập và đăng ký thành viên.

| STT | Tên Test Case (JUnit) | Mô tả | Loại |
|-----|----------------------|-------|------|
| 1 | `register_success_patient` | Đăng ký tài khoản Bệnh nhân mới thành công | Positive |
| 2 | `register_success_doctor` | Đăng ký tài khoản Bác sĩ mới thành công | Positive |
| 3 | `register_success_admin` | Đăng ký tài khoản Quản trị viên mới thành công | Positive |
| 4 | `register_noRole_defaultsToPatient` | Đăng ký không chỉ định role sẽ tự động gán là PATIENT | Positive |
| 5 | `register_fails_usernameExists` | Thất bại khi đăng ký trùng Username | Negative |
| 6 | `register_fails_emailExists` | Thất bại khi đăng ký trùng Email | Negative |
| 7 | `register_invalidRole_defaultsToPatient` | Đăng ký với role không hợp lệ sẽ tự động gán là PATIENT | Positive |
| 8 | `login_success` | Đăng nhập thành công, trả về JWT Token và thông tin cá nhân | Positive |
| 9 | `login_success_admin` | Đăng nhập tài khoản Quản trị viên thành công | Positive |
| 10 | `login_fails_badCredentials` | Từ chối đăng nhập khi sai mật khẩu | Negative |
| 11 | `login_patientWithoutProfile_fullNameNull` | Đăng nhập tài khoản chưa điền thông tin cá nhân sẽ trả về tên rỗng | Positive |

### 1.4. AppointmentServiceTest ([AppointmentServiceTest.java](file:///c:/Users/DAT/OneDrive%20-%20ut.edu.vn/Documents/Desktop/Repo/backend/src/test/java/com/doctorbooking/backend/service/AppointmentServiceTest.java) - 15 Test Cases)
Kiểm thử tính năng đặt lịch khám, chọn ca khám và hủy lịch/hoàn tiền.

| STT | Tên Test Case (JUnit) | Mô tả | Loại |
|-----|----------------------|-------|------|
| 1 | `getAvailableSlots_noPendingAppointments_returnsAllSlots` | Trả về toàn bộ 17 khung giờ khám trống khi bác sĩ chưa có lịch hẹn | Positive |
| 2 | `getAvailableSlots_removePendingSlot` | Loại bỏ các khung giờ đang có lịch hẹn ở trạng thái PENDING | Positive |
| 3 | `getAvailableSlots_confirmedRemovedCancelledKept` | Loại bỏ các ca đã CONFIRMED, nhưng giữ lại các ca đã CANCELLED | Positive |
| 4 | `createAppointment_cash_success` | Đặt lịch khám thành công với hình thức thanh toán bằng Tiền mặt | Positive |
| 5 | `createAppointment_wallet_success` | Đặt lịch khám và tự động thanh toán qua Ví điện tử thành công | Positive |
| 6 | `createAppointment_doctorNotFound_throwsException` | Báo lỗi khi đặt lịch khám với bác sĩ không tồn tại | Negative |
| 7 | `createAppointment_doctorNotActive_throwsException` | Không cho phép đặt lịch khám với bác sĩ đang tạm ngưng hoạt động | Negative |
| 8 | `createAppointment_slotAlreadyTaken_throwsException` | Trả về lỗi khi chọn ca khám đã có người đặt trước | Negative |
| 9 | `createAppointment_pastDate_throwsException` | Không cho phép đặt lịch khám vào các ngày trong quá khứ | Negative |
| 10 | `cancelAppointment_pending_success` | Bệnh nhân tự hủy lịch hẹn PENDING thành công (không cần hoàn tiền mặt) | Positive |
| 11 | `cancelAppointment_wallet_refund` | Hủy lịch hẹn đã thanh toán bằng ví → Tự động hoàn lại tiền vào ví điện tử | Positive |
| 12 | `cancelAppointment_wrongPatient_throwsException` | Không cho phép bệnh nhân này hủy lịch hẹn của bệnh nhân khác | Negative |
| 13 | `cancelAppointment_completed_throwsException` | Không thể hủy lịch hẹn đã khám xong (COMPLETED) | Negative |
| 14 | `cancelAppointment_alreadyCancelled_throwsException` | Không thể hủy một lịch hẹn đã được hủy trước đó | Negative |
| 15 | `confirmAppointment_success` | Bác sĩ xác nhận lịch hẹn PENDING chuyển sang CONFIRMED thành công | Positive |
| 16 | `confirmAppointment_wrongDoctor_throwsException` | Bác sĩ không thể xác nhận lịch khám của bác sĩ khác | Negative |
| 17 | `confirmAppointment_notPending_throwsException` | Chỉ cho phép xác nhận các lịch hẹn ở trạng thái PENDING | Negative |
| 18 | `getAppointmentsByDate_nullDate_returnsAll` | Lấy toàn bộ lịch hẹn khi không lọc theo ngày | Positive |
| 19 | `getAppointmentsByDate_withDate_filtersCorrectly` | Lọc danh sách lịch hẹn chính xác theo ngày chỉ định | Positive |

### 1.5. BackendApplicationTests ([BackendApplicationTests.java](file:///c:/Users/DAT/OneDrive%20-%20ut.edu.vn/Documents/Desktop/Repo/backend/src/test/java/com/doctorbooking/backend/BackendApplicationTests.java) - 1 Test Case)
| STT | Tên Test Case (JUnit) | Mô tả | Loại |
|-----|----------------------|-------|------|
| 1 | `contextLoads` | Đảm bảo context của ứng dụng Spring Boot khởi tạo thành công | Positive |

---

## 2. Kiểm thử Tự động hóa API (Postman / Newman)
Bộ API Automation Test Suite kiểm thử tích hợp toàn diện luồng nghiệp vụ của hệ thống (End-to-End) và thực thi các kiểm thử giá trị biên trực tiếp thông qua API HTTP.
* **Tổng số kịch bản API**: **114**
* **Cơ chế đặc biệt**: Dùng tập tin dữ liệu `data/users_login.json` để tự động chạy lặp 3 lần với 3 tài khoản vai trò khác nhau (PATIENT, DOCTOR, ADMIN), thực thi tổng cộng **348 yêu cầu HTTP** và kiểm tra **768 assertions** mà không gặp lỗi.
* **Cơ chế chống nghẽn email**: Toàn bộ luồng gửi email xác nhận và đơn thuốc qua SMTP được cấu hình chạy bất đồng bộ (Asynchronous via CompletableFuture) giúp tốc độ phản hồi API cực nhanh (< 500ms) và loại bỏ hoàn toàn các lỗi nghẽn cổng kết nối (`ESOCKETTIMEDOUT`).

### 2.1. Danh sách các nhóm API và Phân tích giá trị biên (BVA)

#### Nhóm 02_Auth (Xác thực & Biên đăng ký tài khoản)
* **Quy định biên Username (3 - 50 ký tự)** và **Password (>= 6 ký tự)**:
  1. `POST Register - Username Too Short (2 chars)` -> Trạng thái mong đợi: **400** (BVA Biên dưới ngoài)
  2. `POST Register - Username Min Length (3 chars) - Valid` -> Trạng thái mong đợi: **201** (BVA Biên dưới trong)
  3. `POST Register - Username Max Length (50 chars) - Valid` -> Trạng thái mong đợi: **201** (BVA Biên trên trong)
  4. `POST Register - Username Too Long (51 chars)` -> Trạng thái mong đợi: **400** (BVA Biên trên ngoài)
  5. `POST Register - Password Too Short (5 chars)` -> Trạng thái mong đợi: **400** (BVA Biên dưới ngoài)
  6. `POST Register - Password Min Length (6 chars) - Valid` -> Trạng thái mong đợi: **201** (BVA Biên dưới trong)
* **Security & Negative API Cases**:
  * Đăng ký Email không hợp lệ (Trạng thái **400**)
  * Đăng nhập thiếu mật khẩu (Trạng thái **400**)
  * Đăng nhập sai thông tin (Trạng thái **401**)
  * Kiểm thử chống tấn công SQL Injection trên trường Username (Trạng thái **400/401**, không gây lỗi sập Server 500)
  * Kiểm thử chống tấn công XSS trên trường Họ tên bệnh nhân (Xử lý lưu trữ an toàn)

#### Nhóm 07_Patient_Feedbacks (Đánh giá Bác sĩ & Biên Điểm đánh giá)
* **Quy định biên Điểm đánh giá (Rating từ 1 đến 5 sao)**:
  1. `POST Feedback - Rating Too Low (0)` -> Trạng thái mong đợi: **400** (BVA Biên dưới ngoài)
  2. `POST Feedback - Rating Min Valid (1)` -> Trạng thái mong đợi: **201** (BVA Biên dưới trong)
  3. `POST Feedback - Rating Max Valid (5)` -> Trạng thái mong đợi: **201** (BVA Biên trên trong)
  4. `POST Feedback - Rating Too High (6)` -> Trạng thái mong đợi: **400** (BVA Biên trên ngoài)
  5. `POST Feedback - Missing Rating` -> Trạng thái mong đợi: **400**

#### Nhóm 09_Patient_Wallet (Nạp tiền ví & Biên số tiền nạp tối thiểu)
* **Quy định biên Số tiền nạp tối thiểu (Min = 10,000 VNĐ)**:
  1. `POST Wallet Top-Up - Below Min BVA (9999 VNĐ)` -> Trạng thái mong đợi: **400** (BVA Biên dưới ngoài)
  2. `POST Wallet Top-Up - Min Valid (10000 VNĐ)` -> Trạng thái mong đợi: **201** (BVA Biên dưới trong)
  3. `POST Wallet Top-Up - Slightly Above Min (10001 VNĐ) - Valid` -> Trạng thái mong đợi: **201** (BVA Biên trên trong)
  4. `POST Top-Up - Below Minimum (100 VNĐ)` -> Trạng thái mong đợi: **400**

### 2.2. Bảng ánh xạ kịch bản API Automation Test Suite

| Thư mục Postman | Loại kịch bản | Mô tả kịch bản / endpoint kiểm thử | Trạng thái mong đợi |
|-----------------|---------------|------------------------------------|---------------------|
| **00_Setup** | Setup | Khởi tạo lại cờ bỏ qua và đăng nhập 3 vai trò để lấy Token | 200 / 201 |
| **01_Public** | Positive | Kiểm tra Endpoint y tế công khai (Health Check) | 200 |
| | Negative | Gọi Health Check sai phương thức POST | 405 / 403 / 500 |
| **02_Auth** | Positive | Đăng ký/Đăng nhập các vai trò & Kiểm tra BVA Biên trong | 201 |
| | Negative | Đăng ký sai định dạng, SQL Injection, XSS & Kiểm tra BVA Biên ngoài | 400 / 401 |
| **03_Patient_Profile** | Positive | Xem và Cập nhật hồ sơ bệnh nhân hiện tại | 200 |
| | Negative | Xem hồ sơ khi không truyền Token, dùng Token bác sĩ | 403 |
| **04_Patient_Doctors** | Positive | Xem danh sách bác sĩ và chi tiết bác sĩ theo ID | 200 |
| | Negative | Tìm bác sĩ với ID không tồn tại | 404 |
| **05_Patient_Appointments**| Positive | Lấy giờ trống và Đặt lịch khám mới thành công (CASH) | 200 / 201 |
| | Negative | Đặt lịch thiếu ID bác sĩ, sai định dạng thời gian, không Token | 400 / 403 / 404 |
| **06_Patient_Treatments** | Positive | Bệnh nhân xem danh sách đơn thuốc và chi tiết đơn thuốc | 200 |
| | Negative | Xem đơn thuốc không tồn tại | 404 |
| **07_Patient_Feedbacks** | Positive | Xem phản hồi và Đăng phản hồi biên hợp lệ | 200 / 201 |
| | Negative | Đăng phản hồi thiếu rating hoặc rating ngoài biên [1-5] | 400 |
| **08_Patient_Family** | Positive | Lọc, xem số liệu và thêm người nhà thành công | 200 / 201 |
| | Negative | Thêm người nhà thiếu tên, xóa người nhà không tồn tại | 400 / 404 |
| **09_Patient_Wallet** | Positive | Xem số dư, lịch sử giao dịch và nạp tiền biên hợp lệ | 200 / 201 |
| | Negative | Nạp tiền số lượng dưới 10,000 VNĐ | 400 |
| **10_Patient_AI** | Positive | Gọi AI chẩn đoán triệu chứng thông thường | 200 / 503 |
| | Negative | Gửi triệu chứng rỗng lên AI | 400 |
| **11_Patient_Notif** | Positive | Xem thông báo, đếm thông báo chưa đọc, đánh dấu đã đọc | 200 |
| | Negative | Đọc thông báo không tồn tại | 404 / 400 |
| **12_Doctor_Profile** | Positive | Bác sĩ xem và cập nhật hồ sơ cá nhân | 200 |
| | Negative | Xem hồ sơ bác sĩ bằng Token bệnh nhân | 403 |
| **13_Doctor_Appointments** | Positive | Bác sĩ xem lịch hẹn, chi tiết lịch hẹn và xác nhận ca khám | 200 |
| | Negative | Xem ca khám không tồn tại | 404 |
| **14_Doctor_Treatments** | Positive | Bác sĩ xem danh sách bệnh án và tạo bệnh án mới (Toa thuốc) | 200 / 201 |
| | Negative | Tạo bệnh án thiếu thông tin bệnh nhân | 400 |
| **15_Doctor_Patients** | Positive | Bác sĩ xem danh sách bệnh nhân và thông tin chi tiết từng người | 200 |
| | Negative | Xem chi tiết bệnh nhân không tồn tại | 404 |
| **16_Doctor_Misc** | Positive | Xem danh sách thuốc kê toa, nhận xét của bệnh nhân, điểm TB | 200 |
| | Negative | Lọc nhận xét theo điểm đánh giá không hợp lệ | 400 / 404 |
| **17_Admin_Doctors** | Positive | Admin quản lý danh sách bác sĩ, xem chi tiết và tìm kiếm | 200 |
| | Negative | Tìm bác sĩ không có thực, tạo mới thiếu trường bắt buộc | 400 / 404 |
| **18_Admin_Patients** | Positive | Admin quản lý bệnh nhân và xem chi tiết hồ sơ bệnh nhân | 200 |
| | Negative | Xem bệnh nhân không tồn tại | 404 |
| **19_Admin_Appts** | Positive | Admin quản lý toàn bộ ca khám của hệ thống | 200 |
| | Negative | Xem chi tiết ca khám không tồn tại | 404 |
| **20_Admin_Feedbacks** | Positive | Admin xem toàn bộ nhận xét và lọc nhận xét theo bác sĩ | 200 |
| | Negative | Xem nhận xét không tồn tại | 404 |
| **21_Admin_Users** | Positive | Admin xem danh sách tài khoản và tạo tài khoản mới | 200 / 201 |
| | Negative | Tạo tài khoản sai email, tìm tài khoản không tồn tại | 400 / 404 |
| **22_E2E_Flows** | Setup/E2E | Kịch bản trọn vẹn: Đặt lịch → Xác nhận → Khám & Kê đơn → Đánh giá → Dọn dẹp dữ liệu | 200 / 201 / 204 |
| **23_Debug_Test** | Setup/E2E | Endpoint kiểm tra thông tin phân quyền và kết nối CSDL | 200 |

---

## 3. Kết Luận
* Bộ test cases được xây dựng vững chắc bao phủ cả tầng **Logic nghiệp vụ (JUnit)** và tầng **Giao tiếp API (Postman)**.
* Việc tích hợp phương pháp **Phân tích giá trị biên (BVA)** ở cả 2 tầng giúp hệ thống phát hiện sớm các lỗi về độ dài chuỗi (Username, Password), khoảng số (Rating, Top-up) và thời gian (Feedback 24h limit), đảm bảo ứng dụng hoạt động chính xác và bảo mật.
* Giao dịch gửi email qua SMTP bất đồng bộ giúp hệ thống hoạt động trơn tru và ngăn chặn hoàn toàn lỗi nghẽn kiểm thử tự động.
