package com.doctorbooking.backend.controller;

import com.doctorbooking.backend.dto.request.TopUpRequest;
import com.doctorbooking.backend.dto.response.TopUpResponse;
import com.doctorbooking.backend.dto.response.WalletResponse;
import com.doctorbooking.backend.model.Appointment;
import com.doctorbooking.backend.model.Patient;
import com.doctorbooking.backend.model.User;
import com.doctorbooking.backend.model.WalletTransaction;
import com.doctorbooking.backend.repository.AppointmentRepository;
import com.doctorbooking.backend.repository.PatientRepository;
import com.doctorbooking.backend.service.AppointmentService;
import com.doctorbooking.backend.service.UserService;
import com.doctorbooking.backend.service.VNPayService;
import com.doctorbooking.backend.service.WalletService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.ModelAndView;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentController Unit Tests")
class PaymentControllerTest {

    @Mock private WalletService walletService;
    @Mock private VNPayService vnPayService;
    @Mock private UserService userService;
    @Mock private PatientRepository patientRepository;
    @Mock private AppointmentService appointmentService;
    @Mock private AppointmentRepository appointmentRepository;

    @InjectMocks
    private PaymentController controller;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(controller, "frontendUrl", "http://fe");

        User user = new User();
        user.setId(10L);
        user.setUsername("patient");
        lenient().when(userService.findByUsername("patient")).thenReturn(user);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("patient", null));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Patient patientWith(BigDecimal balance, Integer points, String tier) {
        Patient p = new Patient();
        p.setId(6L);
        p.setFullName("Patient A");
        p.setWalletBalance(balance);
        p.setLoyaltyPoints(points);
        p.setLoyaltyTier(tier);
        return p;
    }

    private HttpServletRequest mockRequest(Map<String, String> params) {
        HttpServletRequest request = mock(HttpServletRequest.class);
        Map<String, String[]> raw = new LinkedHashMap<>();
        params.forEach((k, v) -> raw.put(k, new String[]{v}));
        lenient().when(request.getParameterMap()).thenReturn(raw);
        params.forEach((k, v) ->
                lenient().when(request.getParameterValues(k)).thenReturn(new String[]{v}));
        lenient().when(request.getRequestURL()).thenReturn(new StringBuffer("http://callback"));
        lenient().when(request.getQueryString()).thenReturn("query");
        lenient().when(request.getParameter(anyString()))
                .thenAnswer(inv -> params.get(inv.getArgument(0)));
        return request;
    }

    // ── getWallet ──
    @Test
    void getWallet_success() {
        when(patientRepository.findByUserId(10L))
                .thenReturn(java.util.Optional.of(patientWith(new BigDecimal("100000"), 50, "SILVER")));
        ResponseEntity<WalletResponse> result = controller.getWallet();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getWallet_nullFields_useDefaults() {
        when(patientRepository.findByUserId(10L))
                .thenReturn(java.util.Optional.of(patientWith(null, null, null)));
        ResponseEntity<WalletResponse> result = controller.getWallet();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getWallet_patientNotFound_internalError() {
        when(patientRepository.findByUserId(10L)).thenReturn(java.util.Optional.empty());
        ResponseEntity<WalletResponse> result = controller.getWallet();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // ── topUp ──
    @Test
    void topUp_success() {
        when(patientRepository.findByUserId(10L))
                .thenReturn(java.util.Optional.of(patientWith(BigDecimal.ZERO, 0, "BRONZE")));
        TopUpRequest req = new TopUpRequest();
        req.setAmount(new BigDecimal("100000"));
        req.setPaymentMethod("VNPAY");
        WalletTransaction tx = mock(WalletTransaction.class);
        when(tx.getReferenceId()).thenReturn("REF1");
        when(walletService.createDepositTransaction(eq(6L), any(), any())).thenReturn(tx);
        when(vnPayService.createPaymentUrl(anyLong(), anyString(), eq("REF1"))).thenReturn("http://pay");

        ResponseEntity<TopUpResponse> result = controller.topUp(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody().getPaymentUrl()).isEqualTo("http://pay");
    }

    @Test
    void topUp_amountTooLow_badRequest() {
        when(patientRepository.findByUserId(10L))
                .thenReturn(java.util.Optional.of(patientWith(BigDecimal.ZERO, 0, "BRONZE")));
        TopUpRequest req = new TopUpRequest();
        req.setAmount(new BigDecimal("5000"));
        ResponseEntity<TopUpResponse> result = controller.topUp(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void topUp_amountTooHigh_badRequest() {
        when(patientRepository.findByUserId(10L))
                .thenReturn(java.util.Optional.of(patientWith(BigDecimal.ZERO, 0, "BRONZE")));
        TopUpRequest req = new TopUpRequest();
        req.setAmount(new BigDecimal("60000000"));
        ResponseEntity<TopUpResponse> result = controller.topUp(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void topUp_patientNotFound_internalError() {
        when(patientRepository.findByUserId(10L)).thenReturn(java.util.Optional.empty());
        TopUpRequest req = new TopUpRequest();
        req.setAmount(new BigDecimal("100000"));
        ResponseEntity<TopUpResponse> result = controller.topUp(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // ── getTransactions ──
    @Test
    void getTransactions_success() {
        when(patientRepository.findByUserId(10L))
                .thenReturn(java.util.Optional.of(patientWith(BigDecimal.ZERO, 0, "BRONZE")));
        Page<WalletTransaction> page = new PageImpl<>(List.of());
        when(walletService.getTransactions(eq(6L), any())).thenReturn(page);
        ResponseEntity<Map<String, Object>> result = controller.getTransactions(0, 10);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getTransactions_error_internalError() {
        when(patientRepository.findByUserId(10L)).thenReturn(java.util.Optional.empty());
        ResponseEntity<Map<String, Object>> result = controller.getTransactions(0, 10);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // ── vnpayCallback (wallet) ──
    @Test
    void vnpayCallback_success() {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_TxnRef", "REF1");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TransactionNo", "NO1");
        params.put("vnp_Amount", "10000000");
        when(vnPayService.verifyPayment(any())).thenReturn(true);
        when(walletService.completeDepositTransaction("REF1", "NO1")).thenReturn(mock(WalletTransaction.class));

        ModelAndView mv = controller.vnpayCallback(mockRequest(params));
        assertThat(mv.getViewName()).startsWith("redirect:");
        verify(walletService).completeDepositTransaction("REF1", "NO1");
    }

    @Test
    void vnpayCallback_failedPayment() {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_TxnRef", "REF1");
        params.put("vnp_ResponseCode", "07");
        params.put("vnp_TransactionNo", "NO1");
        when(vnPayService.verifyPayment(any())).thenReturn(true);
        when(walletService.failDepositTransaction(eq("REF1"), anyString())).thenReturn(mock(WalletTransaction.class));

        ModelAndView mv = controller.vnpayCallback(mockRequest(params));
        assertThat(mv.getViewName()).startsWith("redirect:");
        verify(walletService).failDepositTransaction(eq("REF1"), anyString());
    }

    @Test
    void vnpayCallback_invalidChecksum() {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_TxnRef", "REF1");
        params.put("vnp_ResponseCode", "00");
        when(vnPayService.verifyPayment(any())).thenReturn(false);

        ModelAndView mv = controller.vnpayCallback(mockRequest(params));
        assertThat(mv.getViewName()).contains("Invalid%20checksum");
    }

    @Test
    void vnpayCallback_missingTxnRef() {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_ResponseCode", "00");
        when(vnPayService.verifyPayment(any())).thenReturn(true);

        ModelAndView mv = controller.vnpayCallback(mockRequest(params));
        assertThat(mv.getViewName()).contains("Missing%20transaction%20ID");
    }

    @Test
    void vnpayCallback_exception() {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_TxnRef", "REF1");
        when(vnPayService.verifyPayment(any())).thenThrow(new RuntimeException("boom"));

        ModelAndView mv = controller.vnpayCallback(mockRequest(params));
        assertThat(mv.getViewName()).startsWith("redirect:");
    }

    // ── vnpayAppointmentCallback ──
    @Test
    void vnpayAppointmentCallback_success() {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_TxnRef", "APT5_123");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TransactionNo", "NO1");
        params.put("vnp_Amount", "10000000");
        when(vnPayService.verifyPayment(any())).thenReturn(true);

        ModelAndView mv = controller.vnpayAppointmentCallback(mockRequest(params));
        assertThat(mv.getViewName()).startsWith("redirect:");
        verify(appointmentService).updatePaymentStatus(5L, Appointment.PaymentStatus.PAID);
    }

    @Test
    void vnpayAppointmentCallback_failed() {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_TxnRef", "APT5_123");
        params.put("vnp_ResponseCode", "07");
        when(vnPayService.verifyPayment(any())).thenReturn(true);

        ModelAndView mv = controller.vnpayAppointmentCallback(mockRequest(params));
        assertThat(mv.getViewName()).startsWith("redirect:");
        verify(appointmentService).cancelAppointmentDueToPaymentFailure(5L);
    }

    @Test
    void vnpayAppointmentCallback_invalidChecksum() {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_TxnRef", "APT5_123");
        params.put("vnp_ResponseCode", "00");
        when(vnPayService.verifyPayment(any())).thenReturn(false);

        ModelAndView mv = controller.vnpayAppointmentCallback(mockRequest(params));
        assertThat(mv.getViewName()).contains("Invalid%20checksum");
    }

    @Test
    void vnpayAppointmentCallback_exception() {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_TxnRef", "APT5_123");
        when(vnPayService.verifyPayment(any())).thenThrow(new RuntimeException("boom"));

        ModelAndView mv = controller.vnpayAppointmentCallback(mockRequest(params));
        assertThat(mv.getViewName()).startsWith("redirect:");
    }
}
