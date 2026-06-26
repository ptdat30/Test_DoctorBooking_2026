# AI Context Guide: Test Design Techniques (Whitebox & BVA)
**Vai trò**: Senior Test Architect
**Mục đích**: Thiết lập "Kim chỉ nam" kỹ thuật cho AI Agents và Software Engineers khi thiết kế các Test Case cụ thể cho hệ thống, đảm bảo chất lượng kiểm thử chuyên sâu thông qua hai trụ cột: Whitebox Testing (Branch Coverage, Mutation Testing) và Boundary Value Analysis (BVA).

---

## 1. MỤC TIÊU & TƯ DUY KIỂM THỬ (Objective & Mindset)
Mục tiêu tối thượng của kiểm thử trong dự án này không chỉ dừng lại ở việc viết test để các kịch bản chạy thành công (**Green Test**), mà là **tìm kiếm và phát hiện các khe hở logic tiềm ẩn**. 

Tư duy thiết kế test bắt buộc phải tuân theo hai nguyên tắc:
1. **Không bỏ sót ngóc ngách của mã nguồn (Whitebox)**: Hiểu rõ luồng xử lý bên trong (Internal Control Flow) của code để đảm bảo mọi dòng lệnh, mọi rẽ nhánh (`if-else`, `catch`) đều được kích hoạt ít nhất một lần.
2. **Kiểm soát chặt chẽ ranh giới dữ liệu (BVA)**: Lỗi phần mềm thường phát sinh tại các điểm biên (Boundary Points). Do đó, việc thiết kế dữ liệu test quanh các ngưỡng nhạy cảm là bắt buộc để ngăn chặn các lỗi "lệch 1 đơn vị" (Off-by-one errors).

---

## 2. CHIẾN LƯỢC WHITEBOX TESTING (Kiểm thử Hộp trắng)

Whitebox Testing trong hệ thống của chúng ta tập trung chủ yếu vào **tầng Logic (Services và Utils)**, nơi trực tiếp điều phối các luồng nghiệp vụ của hệ thống Spring Boot.

### 2.1. Quy định về Branch Coverage (Độ bao phủ rẽ nhánh) với JaCoCo
Chỉ số **Line Coverage** (Độ bao phủ dòng code) là chưa đủ. JaCoCo đo lường cả **Branch Coverage** (Độ bao phủ rẽ nhánh). AI và Developer bắt buộc phải thiết kế test case để đi qua tất cả các hướng rẽ nhánh có thể xảy ra:
*   Các nhánh `if` đúng (true).
*   Các nhánh `else` / `if` sai (false).
*   Các khối `catch` để bắt lỗi ngoại lệ (Exceptions).

#### Ví dụ thực tế: Kiểm thử nhánh ném ngoại lệ khi `User == null`
Giả sử chúng ta có phương thức tìm kiếm người dùng trong `UserService.java`:
```java
public User getUserById(Long id) {
    if (id == null) {
        throw new IllegalArgumentException("ID người dùng không được để trống!");
    }
    return userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
}
```

Để đạt **100% Branch Coverage** cho hàm này, AI bắt buộc phải viết **3 test cases** riêng biệt:
1.  **Case 1 (Nhánh `id == null`):** Truyền vào `id = null` và assert ném ra `IllegalArgumentException`.
2.  **Case 2 (Nhánh `id != null` nhưng không có trong DB):** Mock Repository trả về `Optional.empty()` và assert ném ra `ResourceNotFoundException`.
3.  **Case 3 (Nhánh `id != null` và có trong DB - Thành công):** Mock Repository trả về đối tượng `User` hợp lệ và assert đối tượng trả về.

#### Code mẫu kiểm thử ngoại lệ (JUnit 5 & Mockito):
```java
@Test
void should_ThrowIllegalArgumentException_When_IdIsNull() {
    // Action & Assert
    IllegalArgumentException exception = assertThrows(
        IllegalArgumentException.class,
        () -> userService.getUserById(null)
    );
    
    // Đảm bảo message ngoại lệ trùng khớp hoàn toàn
    assertEquals("ID người dùng không được để trống!", exception.getMessage());
}

@Test
void should_ThrowResourceNotFoundException_When_UserDoesNotExist() {
    // Arrange
    Long userId = 99L;
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    // Action & Assert
    ResourceNotFoundException exception = assertThrows(
        ResourceNotFoundException.class,
        () -> userService.getUserById(userId)
    );
    
    assertEquals("Không tìm thấy người dùng với ID: 99", exception.getMessage());
}
```

---

### 2.2. Quy định về Mutation Coverage với PiTest
**Mutation Testing** (Kiểm thử đột biến) được sử dụng để đánh giá chất lượng của chính các hàm test. PiTest sẽ tự động sửa đổi mã nguồn gốc (ví dụ đổi toán tử `>` thành `>=`, đổi `+` thành `-`, hoặc thay đổi giá trị trả về) tạo ra các **Mutant** (đột biến). Nếu bộ test của bạn vẫn **PASS** sau khi code bị phá hỏng, nghĩa là Mutant đó sống sót (**Surviving Mutant**) -> Test của bạn quá lỏng lẻo!

#### Quy tắc viết Assert chặt chẽ để "Tiêu diệt" Mutant:
*   **KHÔNG** dùng các câu lệnh assert mơ hồ hoặc quá chung chung như `assertNotNull(result)` hoặc chỉ kiểm tra `statusCode == 200` nếu bạn đang trả về một Object phức tạp.
*   **BẮT BUỘC** kiểm tra sâu giá trị của các thuộc tính quan trọng của đối tượng trả về.
*   **Ví dụ hời hợt (Mutant sẽ sống sót):**
    ```java
    UserResponse response = userService.createUser(request);
    assertNotNull(response); // Mutant thay đổi logic gán tên vẫn pass!
    ```
*   **Ví dụ chặt chẽ (Mutant bị tiêu diệt hoàn toàn):**
    ```java
    UserResponse response = userService.createUser(request);
    assertAll("Kiểm tra toàn diện thông tin User được tạo mới",
        () -> assertNotNull(response.getId(), "ID không được null"),
        () -> assertEquals("Nguyen Van A", response.getFullName(), "Tên không khớp"),
        () -> assertEquals("nguyenvana@email.com", response.getEmail(), "Email không khớp"),
        () -> assertEquals(Role.PATIENT, response.getRole(), "Role không khớp")
    );
    ```

---

## 3. KỸ THUẬT PHÂN TÍCH GIÁ TRỊ BIÊN - BVA (Boundary Value Analysis)

### 3.1. Định nghĩa BVA trong dự án
BVA tập trung vào việc thiết kế dữ liệu kiểm thử xung quanh các điểm biên (ranh giới phân chia giữa vùng dữ liệu hợp lệ và không hợp lệ).
Đối với bất kỳ điều kiện biên $[Min, Max]$ nào, các giá trị bắt buộc phải kiểm thử bao gồm:
*   **Biên dưới (Min Boundary)**: $Min$, $Min - 1$ (Giá trị không hợp lệ sát biên), $Min + 1$ (Giá trị hợp lệ sát biên).
*   **Biên trên (Max Boundary)**: $Max$, $Max - 1$ (Giá trị hợp lệ sát biên), $Max + 1$ (Giá trị không hợp lệ sát biên).

### 3.2. Tích hợp BVA với JUnit 5 Parameterized Tests
Thay vì viết nhiều hàm test trùng lặp cấu trúc chỉ để đổi giá trị truyền vào, AI và Developer **bắt buộc** phải sử dụng `@ParameterizedTest` kết hợp với `@ValueSource` hoặc `@CsvSource`. 

*   `@ValueSource`: Phù hợp khi chỉ cần truyền danh sách các giá trị đầu vào cho một kịch bản duy nhất (Ví dụ: Tất cả các biên lỗi đều phải ném cùng một loại Exception).
*   `@CsvSource`: Phù hợp khi muốn ánh xạ mỗi giá trị kiểm thử với kết quả kỳ vọng (Expected Outcome) tương ứng.

---

### 3.3. Blueprint Code Mẫu (Java JUnit 5)
Dưới đây là mã nguồn mẫu chuẩn mực cho logic kiểm tra số tiền thanh toán của cổng VNPAY.
**Quy tắc nghiệp vụ:** Số tiền thanh toán qua VNPAY phải $\ge 10.000$ VNĐ và $\le 1.000.000.000$ VNĐ.

Các mốc kiểm thử theo BVA:
*   **9.999 VNĐ** ($Min - 1$): Không hợp lệ (Fail)
*   **10.000 VNĐ** ($Min$): Hợp lệ (Pass)
*   **50.000 VNĐ** (Giá trị trung gian hợp lệ): Hợp lệ (Pass)
*   **1.000.000.000 VNĐ** ($Max$): Hợp lệ (Pass)
*   **1.000.000.001 VNĐ** ($Max + 1$): Không hợp lệ (Fail)

#### Lớp nghiệp vụ: `PaymentValidator.java`
```java
package com.doctorbooking.backend.validator;

public class PaymentValidator {
    
    public static final long MIN_VNPAY_AMOUNT = 10_000L;
    public static final long MAX_VNPAY_AMOUNT = 1_000_000_000L;

    /**
     * Xác thực số tiền thanh toán VNPAY hợp lệ theo quy định.
     */
    public boolean isValidVNPayAmount(long amount) {
        return amount >= MIN_VNPAY_AMOUNT && amount <= MAX_VNPAY_AMOUNT;
    }
}
```

#### Lớp kiểm thử chuẩn BVA: `PaymentValidatorTest.java`
```java
package com.doctorbooking.backend.validator;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PaymentValidatorTest {

    private final PaymentValidator paymentValidator = new PaymentValidator();

    @ParameterizedTest(name = "[{index}] Số tiền: {0} VNĐ -> Hợp lệ: {1}")
    @CsvSource({
        "9999, false",         // Biên dưới ngoài khoảng (Min - 1) -> INVALID
        "10000, true",         // Biên dưới trong khoảng (Min) -> VALID
        "50000, true",         // Điểm danh nghĩa hợp lệ -> VALID
        "1000000000, true",    // Biên trên trong khoảng (Max) -> VALID
        "1000000001, false"    // Biên trên ngoài khoảng (Max + 1) -> INVALID
    })
    @DisplayName("Nên xác thực chính xác số tiền thanh toán VNPAY theo ranh giới BVA")
    void should_ValidateVNPayAmountCorrectly_WithBoundaryValues(long amount, boolean expectedResult) {
        // Act
        boolean actualResult = paymentValidator.isValidVNPayAmount(amount);

        // Assert
        assertEquals(expectedResult, actualResult, 
            String.format("Xác thực thất bại cho số tiền: %,d VNĐ. Kỳ vọng: %b", amount, expectedResult));
    }
}
```

---

## 4. KẾT HỢP VỚI API & E2E TEST

Kỹ thuật kiểm thử giá trị biên (BVA) cũng phải được áp dụng đồng bộ trên các tầng kiểm thử cấp cao như API Test (Postman) và E2E UI Test (CodeceptJS).

### 4.1. Áp dụng BVA khi sinh dữ liệu giả với Faker.js trong CodeceptJS
Khi viết E2E Test, chúng ta thường dùng `Faker.js` để sinh dữ liệu ngẫu nhiên. Tuy nhiên, để kiểm tra các ràng buộc giới hạn (ví dụ: Độ tuổi của bệnh nhân đăng ký khám trực tuyến phải từ $18$ đến $60$ tuổi), ta phải chủ động kiểm soát biên dữ liệu.

*   **Không dùng:** Dữ liệu hoàn toàn ngẫu nhiên không kiểm soát biên (`faker.number.int()`).
*   **Giải pháp:** Kết hợp hàm helper để ép sinh giá trị chính xác tại các mốc biên: $17$ (lỗi), $18$ (đúng), $60$ (đúng), $61$ (lỗi).

#### CodeceptJS code mẫu áp dụng BVA:
```javascript
// frontend/e2e/tests/registration_boundary_test.cjs
Feature('Patient Age Boundary Validation');

const ageBoundaries = [
  { age: 17, expectedSuccess: false, desc: 'Biên dưới - 1 (Dưới tuổi quy định)' },
  { age: 18, expectedSuccess: true, desc: 'Biên dưới (Vừa đủ tuổi quy định)' },
  { age: 60, expectedSuccess: true, desc: 'Biên trên (Giới hạn tuổi tối đa)' },
  { age: 61, expectedSuccess: false, desc: 'Biên trên + 1 (Vượt quá tuổi tối đa)' }
];

ageBoundaries.forEach(({ age, expectedSuccess, desc }) => {
  Scenario(`Đăng ký tài khoản với độ tuổi: ${age} (${desc})`, async ({ I, RegisterPage }) => {
    I.amOnPage('/register');
    
    // Sinh ngày tháng năm sinh tương ứng với số tuổi mục tiêu
    const birthYear = new Date().getFullYear() - age;
    const dobString = `01/01/${birthYear}`;

    // Điền form thông qua Page Object
    await RegisterPage.fillRegistrationForm({
      fullName: 'Bệnh Nhân Biên ' + age,
      email: `patient_boundary_${age}@example.com`,
      phone: '0987654321',
      dob: dobString,
      password: 'Password123'
    });

    if (expectedSuccess) {
      I.waitForNavigation('/login', 10);
      I.see('Đăng ký thành công');
    } else {
      I.waitForElement('.error-message', 5);
      I.see('Tuổi của bệnh nhân phải nằm trong khoảng từ 18 đến 60 tuổi', '.error-message');
    }
  });
});
```

### 4.2. Áp dụng BVA khi truyền Query Params trong Postman
Khi kiểm thử API tích hợp hoặc tự động qua Newman, các tham số phân trang (`page`, `limit`) hoặc các tham số lọc phải được thiết kế theo BVA:
*   `page`: Biên dưới là `0` hoặc `1` (tùy quy chuẩn API). Cần kiểm thử: `page=-1` (Lỗi hoặc trả về default), `page=0` (Hợp lệ nếu 0-indexed), `page=1` (Hợp lệ).
*   `limit` (Số lượng item trên trang): Biên quy định thường từ $1$ đến $100$. Cần kiểm thử: `limit=0` (Lỗi/Không trả về item), `limit=1` (Biên dưới), `limit=100` (Biên trên), `limit=101` (Vượt biên - ném lỗi hoặc tự động hạ xuống 100).

---

## 5. CHỈ THỊ BẮT BUỘC DÀNH CHO AI (Mandatory Directive for AI)

> [!IMPORTANT]
> **QUY TẮC BẮT BUỘC ĐỐI VỚI AI VÀ DEVELOPER:**
> Từ nay về sau, mọi đoạn code test sinh ra có liên quan đến kiểm thử logic xác thực (Validation), bao gồm:
> 1. Xác thực giá trị số học (Ví dụ: Số tiền, số tuổi, số lượng sản phẩm).
> 2. Xác thực độ dài chuỗi (Ví dụ: Độ dài mật khẩu từ 8-20 ký tự, độ dài tên từ 2-50 ký tự).
> 3. Xác thực mốc thời gian/ngày tháng (Ví dụ: Ngày hẹn khám phải lớn hơn ngày hiện tại ít nhất 1 ngày).
> 
> **BẮT BUỘC phải sử dụng `@ParameterizedTest` của JUnit 5** để kiểm thử tập trung toàn bộ các giá trị biên (BVA) trong cùng một phương thức kiểm thử. Nghiêm cấm viết nhiều hàm test đơn lẻ rời rạc cho các trường hợp kiểm thử biên tương tự nhau.
