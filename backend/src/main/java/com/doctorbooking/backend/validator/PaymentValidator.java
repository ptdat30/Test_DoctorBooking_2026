package com.doctorbooking.backend.validator;

public final class PaymentValidator {

    public static final long MIN_VNPAY_AMOUNT = 10_000L;
    public static final long MAX_VNPAY_AMOUNT = 1_000_000_000L;

    private PaymentValidator() {
        // Utility class
    }

    public static boolean isValidVNPayAmount(long amount) {
        return amount >= MIN_VNPAY_AMOUNT && amount <= MAX_VNPAY_AMOUNT;
    }
}
