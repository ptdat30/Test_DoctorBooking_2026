package com.doctorbooking.backend.dto;

import com.doctorbooking.backend.dto.request.LoginRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kiểm thử hộp đen (Blackbox) tầng validation cho Login.
 *
 * <p>EP + BVA ranh giới rỗng/không rỗng (@NotBlank) của {@link LoginRequest}.
 * Tài liệu thiết kế: docs/blackbox/EP_BVA_Login.md (prefix LOG).
 */
@DisplayName("LoginRequest - EP & BVA Validation Tests (@NotBlank)")
class LoginRequestValidationTest {

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

    private long violationsOn(String username, String password, String property) {
        LoginRequest req = new LoginRequest();
        req.setUsername(username);
        req.setPassword(password);
        return validator.validate(req).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .filter(property::equals)
                .count();
    }

    @Test
    @DisplayName("✅ LOG-V1/V2/B2: username & password không rỗng → hợp lệ")
    void validRequest_noViolation() {
        assertThat(violationsOn("a", "a", "username")).isZero();
        assertThat(violationsOn("a", "a", "password")).isZero();
    }

    @Test
    @DisplayName("❌ LOG-X1/B0: username rỗng → không hợp lệ")
    void username_empty_invalid() {
        assertThat(violationsOn("", "password123", "username")).isPositive();
    }

    @Test
    @DisplayName("❌ LOG-X1/B1: username chỉ khoảng trắng → không hợp lệ (@NotBlank)")
    void username_whitespace_invalid() {
        assertThat(violationsOn("   ", "password123", "username")).isPositive();
    }

    @Test
    @DisplayName("❌ LOG-X2: password rỗng → không hợp lệ")
    void password_blank_invalid() {
        assertThat(violationsOn("validuser", "", "password")).isPositive();
    }
}
