package com.doctorbooking.backend.dto;

import com.doctorbooking.backend.dto.request.SymptomCheckRequest;
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
 * Kiểm thử hộp đen (Blackbox) tầng validation cho Health AI symptom check.
 *
 * <p>EP + BVA ranh giới rỗng/không rỗng (@NotBlank) của {@link SymptomCheckRequest}.
 * Tài liệu thiết kế: docs/blackbox/EP_BVA_Health_AI.md (prefix HAI).
 */
@DisplayName("SymptomCheckRequest - EP & BVA Validation Tests (@NotBlank)")
class SymptomCheckRequestValidationTest {

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

    private long violationsOn(String symptoms, String property) {
        SymptomCheckRequest req = new SymptomCheckRequest();
        req.setSymptoms(symptoms);
        return validator.validate(req).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .filter(property::equals)
                .count();
    }

    @Test
    @DisplayName("HAI-V1: symptoms hợp lệ → không vi phạm")
    void symptoms_valid_noViolation() {
        assertThat(violationsOn("Đau đầu nhẹ", "symptoms")).isZero();
    }

    @Test
    @DisplayName("HAI-X1/HAI-B0: symptoms rỗng → vi phạm @NotBlank")
    void symptoms_blank_invalid() {
        assertThat(violationsOn("", "symptoms")).isPositive();
    }

    @Test
    @DisplayName("HAI-X2/HAI-B1: symptoms chỉ khoảng trắng → vi phạm @NotBlank")
    void symptoms_whitespace_invalid() {
        assertThat(violationsOn("   ", "symptoms")).isPositive();
    }

    @Test
    @DisplayName("HAI-B2: symptoms null → vi phạm @NotBlank")
    void symptoms_null_invalid() {
        SymptomCheckRequest req = new SymptomCheckRequest();
        req.setSymptoms(null);
        long count = validator.validate(req).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .filter("symptoms"::equals)
                .count();
        assertThat(count).isPositive();
    }
}
