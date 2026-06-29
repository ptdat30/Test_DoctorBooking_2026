package com.doctorbooking.backend.dto;

import com.doctorbooking.backend.dto.request.CreateFeedbackRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kiểm thử hộp đen (Blackbox) tầng validation cho rating của Feedback.
 *
 * <p>Áp dụng BVA trên miền rating [1, 5] của {@link CreateFeedbackRequest}.
 * Tài liệu thiết kế: docs/blackbox/EP_BVA_Feedback_Rating.md (prefix FBR).
 */
@DisplayName("CreateFeedbackRequest - EP & BVA Validation Tests (rating [1,5])")
class FeedbackRequestValidationTest {

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

    private long ratingViolations(Integer rating) {
        CreateFeedbackRequest req = new CreateFeedbackRequest();
        req.setAppointmentId(1L);
        req.setRating(rating);
        req.setComment("Good service");
        return validator.validate(req).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .filter("rating"::equals)
                .count();
    }

    @ParameterizedTest(name = "✅ rating={0} → hợp lệ (FBR-V1)")
    @ValueSource(ints = {1, 2, 3, 4, 5})
    @DisplayName("FBR-B1..B5: rating trong [1,5] → hợp lệ")
    void rating_validBoundaries_noViolation(int rating) {
        assertThat(ratingViolations(rating)).isZero();
    }

    @Test
    @DisplayName("❌ FBR-X1/B0: rating=0 (< min) → không hợp lệ")
    void rating_belowMin_invalid() {
        assertThat(ratingViolations(0)).isPositive();
    }

    @Test
    @DisplayName("❌ FBR-X2/B6: rating=6 (> max) → không hợp lệ")
    void rating_aboveMax_invalid() {
        assertThat(ratingViolations(6)).isPositive();
    }

    @Test
    @DisplayName("❌ FBR-X1: rating=-1 (âm) → không hợp lệ")
    void rating_negative_invalid() {
        assertThat(ratingViolations(-1)).isPositive();
    }

    @Test
    @DisplayName("❌ FBR-X3: rating=null → không hợp lệ (@NotNull)")
    void rating_null_invalid() {
        assertThat(ratingViolations(null)).isPositive();
    }
}
