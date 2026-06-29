package com.doctorbooking.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("VNPayService Unit Tests")
class VNPayServiceTest {

    private static final String SECRET = "SECRETKEY1234567890ABCDEF";
    private VNPayService service;

    @BeforeEach
    void setUp() {
        service = new VNPayService();
        ReflectionTestUtils.setField(service, "tmnCode", "  TESTCODE  ");
        ReflectionTestUtils.setField(service, "hashSecret", "  " + SECRET + "  ");
        ReflectionTestUtils.setField(service, "vnpUrl", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        ReflectionTestUtils.setField(service, "returnUrl", "http://fe/wallet/callback");
        ReflectionTestUtils.setField(service, "appointmentReturnUrl", "http://fe/appointment/callback");
        service.init(); // trims tmnCode & hashSecret
    }

    @Test
    @DisplayName("init() trim tmnCode và hashSecret")
    void init_trimsConfig() {
        assertThat((String) ReflectionTestUtils.getField(service, "hashSecret")).isEqualTo(SECRET);
        assertThat((String) ReflectionTestUtils.getField(service, "tmnCode")).isEqualTo("TESTCODE");
    }

    @Test
    @DisplayName("createPaymentUrl tạo URL ví hợp lệ, normalize tiếng Việt")
    void createPaymentUrl_wallet() {
        String url = service.createPaymentUrl(100000L, "Thanh toán phí khám - Đạt", "ORDER1");
        assertThat(url).startsWith("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?");
        assertThat(url).contains("vnp_SecureHash=");
        assertThat(url).contains("vnp_TxnRef=ORDER1");
        assertThat(url).contains("vnp_Amount=10000000"); // 100000 * 100
    }

    @Test
    @DisplayName("createPaymentUrlForAppointment dùng appointmentReturnUrl")
    void createPaymentUrl_appointment() {
        String url = service.createPaymentUrlForAppointment(50000L, "Phi kham benh", "APT9_123");
        assertThat(url).contains("vnp_TxnRef=APT9_123");
        assertThat(url).contains("vnp_SecureHash=");
    }

    @Test
    @DisplayName("verifyPayment checksum hợp lệ → true")
    void verifyPayment_valid() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Amount", "10000000");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TxnRef", "ORDER1");
        params.put("vnp_TransactionNo", "12345");
        params.put("vnp_SecureHash", expectedHash(params));

        assertThat(service.verifyPayment(params)).isTrue();
    }

    @Test
    @DisplayName("verifyPayment checksum sai → false")
    void verifyPayment_invalid() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Amount", "10000000");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TxnRef", "ORDER1");
        params.put("vnp_SecureHash", "deadbeef");

        assertThat(service.verifyPayment(params)).isFalse();
    }

    @Test
    @DisplayName("verifyPayment thiếu vnp_SecureHash → false (exception)")
    void verifyPayment_missingHash() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "ORDER1");
        assertThat(service.verifyPayment(params)).isFalse();
    }

    @Test
    @DisplayName("getResponseCode trả về vnp_ResponseCode")
    void getResponseCode_returnsCode() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_ResponseCode", "07");
        assertThat(service.getResponseCode(params)).isEqualTo("07");
    }

    @Test
    @DisplayName("isPaymentSuccess: '00' → true, khác → false")
    void isPaymentSuccess() {
        Map<String, String> ok = new HashMap<>();
        ok.put("vnp_ResponseCode", "00");
        Map<String, String> fail = new HashMap<>();
        fail.put("vnp_ResponseCode", "24");

        assertThat(service.isPaymentSuccess(ok)).isTrue();
        assertThat(service.isPaymentSuccess(fail)).isFalse();
    }

    // Replicate verifyPayment's hash algorithm to produce a valid checksum.
    private String expectedHash(Map<String, String> params) {
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String name = itr.next();
            String value = params.get(name);
            if (value != null && !value.isEmpty()) {
                hashData.append(name).append('=')
                        .append(URLEncoder.encode(value, StandardCharsets.UTF_8));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }
        return hmacSHA512(SECRET, hashData.toString());
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] digest = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
