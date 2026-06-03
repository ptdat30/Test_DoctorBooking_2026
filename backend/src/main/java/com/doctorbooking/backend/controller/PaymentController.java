package com.doctorbooking.backend.controller;

import com.doctorbooking.backend.dto.request.TopUpRequest;
import com.doctorbooking.backend.dto.response.TopUpResponse;
import com.doctorbooking.backend.dto.response.WalletResponse;
import com.doctorbooking.backend.dto.response.WalletTransactionResponse;
import com.doctorbooking.backend.model.Appointment;
import com.doctorbooking.backend.model.Patient;
import com.doctorbooking.backend.model.WalletTransaction;
import com.doctorbooking.backend.model.User;
import com.doctorbooking.backend.repository.PatientRepository;
import com.doctorbooking.backend.service.PatientService;
import com.doctorbooking.backend.service.UserService;
import com.doctorbooking.backend.service.VNPayService;
import com.doctorbooking.backend.service.WalletService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);
    private static final String REDIRECT_PREFIX = "redirect:";

    // ── VNPay param key constants (java:S1192) ───────────────────────────────
    private static final String VNP_TXN_REF        = "vnp_TxnRef";
    private static final String VNP_TRANSACTION_NO = "vnp_TransactionNo";
    private static final String VNP_AMOUNT         = "vnp_Amount";
    private static final String VNP_RESPONSE_CODE  = "vnp_ResponseCode";
    private static final String VNP_ORDER_INFO     = "vnp_OrderInfo";
    private static final String VNP_BANK_CODE      = "vnp_BankCode";
    private static final String VNP_PAY_DATE       = "vnp_PayDate";

    // ── Redirect message constants (java:S1192) ────────────────────────────
    private static final String MSG_PAYMENT_SUCCESS = "&message=Thanh%20toan%20thanh%20cong";
    private static final String MSG_PAYMENT_FAILED  = "&message=Thanh%20toan%20that%20bai";
    private static final String MSG_UPDATE_ERROR    = "&message=Loi%20cap%20nhat%20giao%20dich";

    private final WalletService walletService;
    private final VNPayService vnPayService;
    private final UserService userService;
    private final PatientRepository patientRepository;
    private final com.doctorbooking.backend.service.AppointmentService appointmentService;
    private final com.doctorbooking.backend.repository.AppointmentRepository appointmentRepository;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url}")
    private String frontendUrl;

    /**
     * Lấy thông tin ví
     */
    @GetMapping("/wallet")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<WalletResponse> getWallet() {
        try {
            Long userId = getCurrentUserId();
            Patient patient = patientRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Patient not found"));

            WalletResponse response = new WalletResponse(
                    patient.getWalletBalance() != null ? patient.getWalletBalance() : BigDecimal.ZERO,
                    patient.getLoyaltyPoints() != null ? patient.getLoyaltyPoints() : 0,
                    patient.getLoyaltyTier() != null ? patient.getLoyaltyTier() : "BRONZE");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting wallet", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Tạo yêu cầu nạp tiền
     */
    @PostMapping("/wallet/top-up")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<TopUpResponse> topUp(@Valid @RequestBody TopUpRequest request) {
        try {
            Long userId = getCurrentUserId();
            Patient patient = patientRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Patient not found"));
            Long patientId = patient.getId();

            // Validate amount
            if (request.getAmount().compareTo(new BigDecimal("10000")) < 0) {
                return ResponseEntity.badRequest().build();
            }
            if (request.getAmount().compareTo(new BigDecimal("50000000")) > 0) {
                return ResponseEntity.badRequest().build();
            }

            // Tạo transaction
            WalletTransaction transaction = walletService.createDepositTransaction(
                    patientId,
                    request.getAmount(),
                    request.getPaymentMethod());

            // Tạo payment URL
            String orderInfo = "Nap tien vao vi - " + patient.getFullName();
            String paymentUrl = vnPayService.createPaymentUrl(
                    request.getAmount().longValue(),
                    orderInfo,
                    transaction.getReferenceId());

            TopUpResponse response = new TopUpResponse();
            response.setPaymentUrl(paymentUrl);
            response.setTransactionId(transaction.getReferenceId());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error creating top-up request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Callback từ VNPAY sau khi thanh toán ví
     */
    @GetMapping("/payments/vnpay/callback")
    public ModelAndView vnpayCallback(HttpServletRequest request) {
        logger.info("=== VNPAY CALLBACK RECEIVED ===");
        logger.info("Request URL: {}", request.getRequestURL());
        logger.info("Query String: {}", request.getQueryString());

        try {
            Map<String, String> vnpParams = extractVnpParams(request);
            logger.info("VNPAY Callback received with {} params", vnpParams.size());
            logger.info("VNPAY Params: {}", vnpParams);

            String vnpTxnRef = vnpParams.get(VNP_TXN_REF);
            String vnpResponseCode = vnpParams.get(VNP_RESPONSE_CODE);
            String vnpTransactionNo = vnpParams.get(VNP_TRANSACTION_NO);

            // Verify checksum
            if (!vnPayService.verifyPayment(vnpParams)) {
                return handleInvalidChecksum(vnpTxnRef);
            }

            // Validate vnp_TxnRef
            if (vnpTxnRef == null || vnpTxnRef.isEmpty()) {
                logger.error("vnp_TxnRef is null or empty in callback");
                return redirect(frontendUrl + "/patient/wallet/payment/result?code=99&message=Missing%20transaction%20ID");
            }

            StringBuilder query = buildWalletQueryString(vnpParams, vnpResponseCode, vnpTxnRef, vnpTransactionNo);
            processWalletPayment(vnpResponseCode, vnpTxnRef, vnpTransactionNo, query);

            return redirect(frontendUrl + "/patient/wallet/payment/result" + query);
        } catch (Exception e) {
            logger.error("Error processing VNPAY callback", e);
            failTransactionSilently(request.getParameter(VNP_TXN_REF), "System error: " + e.getMessage());
            return redirect(frontendUrl + "/patient/wallet/payment/result?code=99&message=Loi%20he%20thong");
        }
    }

    /**
     * Callback từ VNPAY sau khi thanh toán APPOINTMENT
     */
    @GetMapping("/payments/vnpay/appointment-callback")
    public ModelAndView vnpayAppointmentCallback(HttpServletRequest request) {
        logger.info("=== VNPAY APPOINTMENT CALLBACK RECEIVED ===");
        logger.info("Request URL: {}", request.getRequestURL());
        logger.info("Query String: {}", request.getQueryString());

        try {
            Map<String, String> vnpParams = extractVnpParams(request);
            String vnpResponseCode = vnpParams.get(VNP_RESPONSE_CODE);
            String vnpTxnRef = vnpParams.get(VNP_TXN_REF); // Format: APT{appointmentId}_{timestamp}
            String vnpTransactionNo = vnpParams.get(VNP_TRANSACTION_NO);

            // Verify checksum
            if (!vnPayService.verifyPayment(vnpParams)) {
                logger.warn("Invalid VNPAY checksum for appointment payment: {}", vnpTxnRef);
                return redirect(frontendUrl + "/patient/appointment/payment/result?code=97&message=Invalid%20checksum");
            }

            Long appointmentId = extractAppointmentId(vnpTxnRef);
            StringBuilder query = buildAppointmentQueryString(vnpResponseCode, vnpTransactionNo,
                    vnpParams.get(VNP_AMOUNT), appointmentId);

            processAppointmentPayment(vnpResponseCode, appointmentId, query);

            String redirectUrl = frontendUrl + "/patient/appointment/payment/result" + query;
            logger.info("Redirecting to: {}", redirectUrl);
            return redirect(redirectUrl);
        } catch (Exception e) {
            logger.error("Error processing VNPAY appointment callback", e);
            return redirect(frontendUrl + "/patient/appointment/payment/result?code=99&message=Loi%20he%20thong");
        }
    }

    /**
     * Lấy lịch sử giao dịch
     */
    @GetMapping("/wallet/transactions")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Map<String, Object>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Long userId = getCurrentUserId();
            Patient patient = patientRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Patient not found"));
            Long patientId = patient.getId();

            Pageable pageable = PageRequest.of(page, size);
            Page<WalletTransaction> transactions = walletService.getTransactions(patientId, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("transactions", transactions.getContent().stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList()));
            response.put("totalPages", transactions.getTotalPages());
            response.put("totalElements", transactions.getTotalElements());
            response.put("currentPage", transactions.getNumber());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting transactions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ─── Private helpers ────────────────────────────────────────────────────────

    /** Trích xuất tất cả params từ VNPAY request vào Map. */
    private Map<String, String> extractVnpParams(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        for (String name : request.getParameterMap().keySet()) {
            String[] values = request.getParameterValues(name);
            String value = (values != null && values.length > 0) ? values[0] : null;
            params.put(name, value);
            logger.debug("VNPAY Param: {} = {}", name, value);
        }
        return params;
    }

    /** Xử lý khi checksum VNPAY không hợp lệ (wallet). */
    private ModelAndView handleInvalidChecksum(String vnpTxnRef) {
        logger.warn("Invalid VNPAY checksum for transaction: {}", vnpTxnRef);
        if (vnpTxnRef != null && !vnpTxnRef.isEmpty()) {
            failTransactionSilently(vnpTxnRef, "Invalid checksum");
        }
        String url = frontendUrl + "/patient/wallet/payment/result?code=97&message=Invalid%20checksum&vnp_TxnRef="
                + (vnpTxnRef != null ? vnpTxnRef : "");
        return redirect(url);
    }

    /** Build query string cho wallet callback (chứa code, txnRef, amount, ...). */
    private StringBuilder buildWalletQueryString(Map<String, String> params, String responseCode,
            String txnRef, String transactionNo) {
        StringBuilder q = new StringBuilder();
        q.append("?code=").append(responseCode);
        q.append("&").append(VNP_RESPONSE_CODE).append("=").append(responseCode);
        q.append("&").append(VNP_TXN_REF).append("=").append(txnRef);
        q.append("&transactionId=").append(txnRef);
        appendIfPresent(q, VNP_TRANSACTION_NO, transactionNo);
        appendIfPresent(q, VNP_AMOUNT, params.get(VNP_AMOUNT));
        if (params.get(VNP_ORDER_INFO) != null) {
            q.append("&").append(VNP_ORDER_INFO).append("=").append(
                    java.net.URLEncoder.encode(params.get(VNP_ORDER_INFO), java.nio.charset.StandardCharsets.UTF_8));
        }
        appendIfPresent(q, VNP_BANK_CODE, params.get(VNP_BANK_CODE));
        appendIfPresent(q, VNP_PAY_DATE, params.get(VNP_PAY_DATE));
        return q;
    }

    /** Xử lý thanh toán ví: thành công hoặc thất bại. */
    private void processWalletPayment(String responseCode, String txnRef, String transactionNo,
            StringBuilder query) {
        if ("00".equals(responseCode)) {
            logger.info("Processing successful payment for transaction: {}", txnRef);
            try {
                WalletTransaction updated = walletService.completeDepositTransaction(txnRef, transactionNo);
                logger.info("Transaction completed: {} -> Status: {}", txnRef, updated.getStatus());
                query.append(MSG_PAYMENT_SUCCESS);
            } catch (Exception e) {
                logger.error("Error completing transaction: {}", txnRef, e);
                query.append(MSG_UPDATE_ERROR);
            }
        } else {
            logger.info("Processing failed payment for transaction: {}, ResponseCode: {}", txnRef, responseCode);
            try {
                WalletTransaction updated = walletService.failDepositTransaction(txnRef,
                        "Payment failed: ResponseCode=" + responseCode);
                logger.info("Transaction failed and updated to FAILED: {} -> Status: {}", txnRef, updated.getStatus());
                query.append(MSG_PAYMENT_FAILED);
            } catch (Exception e) {
                logger.error("Error updating transaction to FAILED: {}", txnRef, e);
                query.append(MSG_UPDATE_ERROR);
            }
        }
    }

    /** Trích xuất appointmentId từ vnp_TxnRef (format: APT{id}_{timestamp}). */
    private Long extractAppointmentId(String vnpTxnRef) {
        try {
            String idStr = vnpTxnRef.substring(3, vnpTxnRef.indexOf("_"));
            return Long.parseLong(idStr);
        } catch (Exception e) {
            logger.error("Cannot extract appointmentId from vnp_TxnRef: {}", vnpTxnRef, e);
            return null;
        }
    }

    /** Build query string cho appointment callback. */
    private StringBuilder buildAppointmentQueryString(String responseCode, String transactionNo,
            String amount, Long appointmentId) {
        StringBuilder q = new StringBuilder();
        q.append("?code=").append(responseCode);
        q.append("&appointmentId=").append(appointmentId != null ? appointmentId : "");
        appendIfPresent(q, VNP_TRANSACTION_NO, transactionNo);
        appendIfPresent(q, VNP_AMOUNT, amount);
        return q;
    }

    /** Xử lý thanh toán appointment: thành công hoặc thất bại. */
    private void processAppointmentPayment(String responseCode, Long appointmentId, StringBuilder query) {
        if ("00".equals(responseCode)) {
            logger.info("Processing successful appointment payment: appointmentId={}", appointmentId);
            handleSuccessfulAppointmentPayment(appointmentId, query);
        } else {
            logger.info("Processing failed appointment payment: appointmentId={}, ResponseCode: {}",
                    appointmentId, responseCode);
            handleFailedAppointmentPayment(appointmentId, query);
        }
    }

    private void handleSuccessfulAppointmentPayment(Long appointmentId, StringBuilder query) {
        try {
            if (appointmentId != null) {
                appointmentService.updatePaymentStatus(appointmentId, Appointment.PaymentStatus.PAID);
                logger.info("Appointment payment completed: appointmentId={}", appointmentId);
                query.append(MSG_PAYMENT_SUCCESS);
            } else {
                query.append("&message=Thanh%20toan%20thanh%20cong%20nhung%20khong%20tim%20thay%20lich%20hen");
            }
        } catch (Exception e) {
            logger.error("Error updating appointment payment status", e);
            query.append(MSG_UPDATE_ERROR);
        }
    }

    private void handleFailedAppointmentPayment(Long appointmentId, StringBuilder query) {
        try {
            if (appointmentId != null) {
                appointmentService.cancelAppointmentDueToPaymentFailure(appointmentId);
                logger.info("Appointment cancelled due to payment failure: appointmentId={}", appointmentId);
            }
            query.append(MSG_PAYMENT_FAILED);
        } catch (Exception e) {
            logger.error("Error cancelling appointment", e);
            query.append(MSG_PAYMENT_FAILED);
        }
    }

    /** Append param vào query string nếu value không null. */
    private void appendIfPresent(StringBuilder sb, String key, String value) {
        if (value != null) {
            sb.append("&").append(key).append("=").append(value);
        }
    }

    /** Cố gắng đánh dấu transaction là FAILED mà không throw exception. */
    private void failTransactionSilently(String txnRef, String reason) {
        if (txnRef == null || txnRef.isEmpty()) {
            return;
        }
        try {
            walletService.failDepositTransaction(txnRef, reason);
            logger.info("Transaction updated to FAILED: {}", txnRef);
        } catch (Exception ex) {
            logger.error("Error updating transaction status in exception handler", ex);
        }
    }

    /** Tạo redirect ModelAndView. */
    private ModelAndView redirect(String url) {
        return new ModelAndView(REDIRECT_PREFIX + url);
    }

    private WalletTransactionResponse mapToResponse(WalletTransaction transaction) {
        return new WalletTransactionResponse(
                transaction.getId(),
                transaction.getTransactionType().name(),
                transaction.getAmount(),
                transaction.getPointsEarned(),
                transaction.getDescription(),
                transaction.getStatus().name(),
                transaction.getPaymentMethod(),
                transaction.getCreatedAt());
    }

    private Long getCurrentUserId() {
        org.springframework.security.core.Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        return user.getId();
    }
}
