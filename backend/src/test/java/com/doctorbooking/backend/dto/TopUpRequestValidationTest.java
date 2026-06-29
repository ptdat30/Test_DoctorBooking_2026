package com.doctorbooking.backend.dto;

import com.doctorbooking.backend.dto.request.TopUpRequest;
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

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kiểm thử hộp đen (Blackbox) tầng validation cho amount của nạp tiền ví.
 *
 * <p>Áp dụng BVA một phía trên miền amount [10000, ∞) của {@link TopUpRequest}.
 * Tài liệu thiết kế: docs/blackbox/EP_BVA_Wallet_TopUp.md (prefix WAL).
 */
@DisplayName("TopUpRequest - EP & BVA Validation Tests (amount >= 10,000)")
class TopUpRequestValidationTest {

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

    private TopUpRequest build(BigDecimal amount, String method) {
        TopUpRequest req = new TopUpRequest();
        req.setAmount(amount);
        req.setPaymentMethod(method);
        return req;
    }

    private long violationsOn(TopUpRequest req, String property) {
        return validator.validate(req).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .filter(property::equals)
                .count();
    }

    private long amountViolations(long amount) {
        return violationsOn(build(BigDecimal.valueOf(amount), "VNPAY"), "amount");
    }

    @ParameterizedTest(name = "✅ amount={0} → hợp lệ (WAL-V1)")
    @ValueSource(longs = {10000, 10001, 50000, 1000000})
    @DisplayName("WAL-B1..B3: amount >= 10,000 → hợp lệ")
    void amount_validBoundaries_noViolation(long amount) {
        assertThat(amountViolations(amount)).isZero();
    }

    @Test
    @DisplayName("❌ WAL-X1/B0: amount=9,999 (< min) → không hợp lệ")
    void amount_belowMin_invalid() {
        assertThat(amountViolations(9999)).isPositive();
    }

    @Test
    @DisplayName("❌ WAL-X1/B4: amount=100 (rất thấp) → không hợp lệ")
    void amount_farBelow_invalid() {
        assertThat(amountViolations(100)).isPositive();
    }

    @Test
    @DisplayName("❌ WAL-X3: amount=0 → không hợp lệ")
    void amount_zero_invalid() {
        assertThat(amountViolations(0)).isPositive();
    }

    @Test
    @DisplayName("❌ WAL-X2: amount=null → không hợp lệ (@NotNull)")
    void amount_null_invalid() {
        assertThat(violationsOn(build(null, "VNPAY"), "amount")).isPositive();
    }

    @Test
    @DisplayName("❌ WAL-X4: paymentMethod=null → không hợp lệ (@NotNull)")
    void paymentMethod_null_invalid() {
        assertThat(violationsOn(build(BigDecimal.valueOf(50000), null), "paymentMethod")).isPositive();
    }
}
