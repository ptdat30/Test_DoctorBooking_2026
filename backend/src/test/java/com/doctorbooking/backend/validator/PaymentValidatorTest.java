package com.doctorbooking.backend.validator;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DisplayName("PaymentValidator Boundary Tests")
class PaymentValidatorTest {

    @ParameterizedTest(name = "[{index}] amount={0} -> expected={1}")
    @CsvSource({
            "9999, false",
            "10000, true",
            "50000, true",
            "1000000000, true",
            "1000000001, false"
    })
    @DisplayName("Nên xác thực số tiền VNPAY theo biên BVA")
    void shouldValidateVNPayAmountBoundaries(long amount, boolean expectedResult) {
        boolean actualResult = PaymentValidator.isValidVNPayAmount(amount);

        assertEquals(expectedResult, actualResult,
                String.format("Số tiền %d VNĐ nên trả về %b", amount, expectedResult));
    }
}
