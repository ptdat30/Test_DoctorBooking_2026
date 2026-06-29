package com.doctorbooking.backend.dto;

import com.doctorbooking.backend.dto.request.RegisterRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kiểm thử hộp đen (Blackbox) tầng validation đầu vào của chức năng Đăng ký.
 *
 * <p>Áp dụng Equivalence Partitioning (EP) + Boundary Value Analysis (BVA) trên
 * {@link RegisterRequest}. Tài liệu thiết kế: docs/blackbox/EP_BVA_Register.md
 *
 * <p>Phần test này lấp lỗ hổng: AuthServiceTest cũ chưa kiểm thử biên độ dài
 * username/password và định dạng email/fullName.
 */
@DisplayName("RegisterRequest - EP & BVA Validation Tests")
class RegisterRequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        if (factory != null) {
            factory.close();
        }
    }

    // ---- Helpers ----

    /** Tạo request hợp lệ làm base; mỗi test chỉ thay đổi 1 biến cần kiểm thử. */
    private RegisterRequest validBase() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("valid_user");
        req.setPassword("password123");
        req.setEmail("user@test.com");
        req.setFullName("Test User");
        req.setPhone("0901234567");
        req.setRole("PATIENT");
        return req;
    }

    /** Sinh chuỗi 'a' lặp lại n lần để điều khiển độ dài chính xác. */
    private String stringOfLength(int n) {
        return "a".repeat(n);
    }

    private Set<ConstraintViolation<RegisterRequest>> violationsOf(RegisterRequest req) {
        return validator.validate(req);
    }

    /** Đếm số lỗi vi phạm trên đúng 1 thuộc tính. */
    private long violationsOnProperty(RegisterRequest req, String property) {
        return violationsOf(req).stream()
                .filter(v -> v.getPropertyPath().toString().equals(property))
                .count();
    }

    // =========================================================
    // USERNAME — BVA độ dài [3, 50]  (tags: V1, X1, X2, X3, B0..B6)
    // =========================================================
    @Nested
    @DisplayName("username @Size(3,50)")
    class UsernameTests {

        @Test
        @DisplayName("✅ B1 min=3, B2 min+=4, B3 nominal=26, B4 max-=49, B5 max=50 → hợp lệ (V1)")
        void username_validBoundaries_noViolation() {
            int[] validLengths = {3, 4, 26, 49, 50};
            for (int len : validLengths) {
                RegisterRequest req = validBase();
                req.setUsername(stringOfLength(len));
                assertThat(violationsOnProperty(req, "username"))
                        .as("username length=%d phải hợp lệ", len)
                        .isZero();
            }
        }

        @Test
        @DisplayName("❌ X1/B0: username len=2 (< min) → không hợp lệ")
        void username_belowMin_invalid() {
            RegisterRequest req = validBase();
            req.setUsername(stringOfLength(2));
            assertThat(violationsOnProperty(req, "username")).isPositive();
        }

        @Test
        @DisplayName("❌ X2/B6: username len=51 (> max) → không hợp lệ")
        void username_aboveMax_invalid() {
            RegisterRequest req = validBase();
            req.setUsername(stringOfLength(51));
            assertThat(violationsOnProperty(req, "username")).isPositive();
        }

        @Test
        @DisplayName("❌ X3: username rỗng → không hợp lệ (@NotBlank)")
        void username_blank_invalid() {
            RegisterRequest req = validBase();
            req.setUsername("");
            assertThat(violationsOnProperty(req, "username")).isPositive();
        }
    }

    // =========================================================
    // PASSWORD — BVA chỉ có biên dưới [6, ∞)  (tags: V2, X4, X5, B7..B10)
    // =========================================================
    @Nested
    @DisplayName("password @Size(min=6)")
    class PasswordTests {

        @ParameterizedTest(name = "✅ password len={0} → hợp lệ (V2)")
        @ValueSource(ints = {6, 7, 20})
        @DisplayName("B8 min=6, B9 min+=7, B10 nominal=20 → hợp lệ")
        void password_validBoundaries_noViolation(int len) {
            RegisterRequest req = validBase();
            req.setPassword(stringOfLength(len));
            assertThat(violationsOnProperty(req, "password")).isZero();
        }

        @Test
        @DisplayName("❌ X4/B7: password len=5 (< min) → không hợp lệ")
        void password_belowMin_invalid() {
            RegisterRequest req = validBase();
            req.setPassword(stringOfLength(5));
            assertThat(violationsOnProperty(req, "password")).isPositive();
        }

        @Test
        @DisplayName("❌ X5: password rỗng → không hợp lệ (@NotBlank)")
        void password_blank_invalid() {
            RegisterRequest req = validBase();
            req.setPassword("");
            assertThat(violationsOnProperty(req, "password")).isPositive();
        }
    }

    // =========================================================
    // EMAIL — EP định dạng/rỗng  (tags: V3, X6, X7, B11..B13)
    // =========================================================
    @Nested
    @DisplayName("email @Email + @NotBlank")
    class EmailTests {

        @Test
        @DisplayName("✅ V3/B12: email đúng định dạng → hợp lệ")
        void email_valid() {
            RegisterRequest req = validBase();
            req.setEmail("a@b.co");
            assertThat(violationsOnProperty(req, "email")).isZero();
        }

        @Test
        @DisplayName("❌ X6/B13: email sai định dạng (thiếu @) → không hợp lệ")
        void email_invalidFormat_invalid() {
            RegisterRequest req = validBase();
            req.setEmail("not-an-email");
            assertThat(violationsOnProperty(req, "email")).isPositive();
        }

        @Test
        @DisplayName("❌ X7/B11: email rỗng → không hợp lệ (@NotBlank)")
        void email_blank_invalid() {
            RegisterRequest req = validBase();
            req.setEmail("");
            assertThat(violationsOnProperty(req, "email")).isPositive();
        }
    }

    // =========================================================
    // FULLNAME — EP rỗng/không rỗng  (tags: V4, X8, B14, B15)
    // =========================================================
    @Nested
    @DisplayName("fullName @NotBlank")
    class FullNameTests {

        @Test
        @DisplayName("✅ V4/B15: fullName 1 ký tự (không rỗng) → hợp lệ")
        void fullName_valid() {
            RegisterRequest req = validBase();
            req.setFullName("A");
            assertThat(violationsOnProperty(req, "fullName")).isZero();
        }

        @Test
        @DisplayName("❌ X8/B14: fullName chỉ khoảng trắng → không hợp lệ")
        void fullName_blank_invalid() {
            RegisterRequest req = validBase();
            req.setFullName("   ");
            assertThat(violationsOnProperty(req, "fullName")).isPositive();
        }
    }

    // =========================================================
    // Tổng hợp: request hợp lệ hoàn toàn → không có lỗi nào
    // =========================================================
    @Test
    @DisplayName("✅ TC_REG_VAL_NOM: tất cả nominal hợp lệ → 0 vi phạm")
    void validRequest_hasNoViolations() {
        RegisterRequest req = validBase();
        req.setUsername(stringOfLength(26));
        req.setPassword(stringOfLength(20));
        assertThat(violationsOf(req)).isEmpty();
    }
}
