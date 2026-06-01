package com.doctorbooking.backend.service;

import com.doctorbooking.backend.model.Patient;
import com.doctorbooking.backend.model.User;
import com.doctorbooking.backend.model.WalletTransaction;
import com.doctorbooking.backend.repository.PatientRepository;
import com.doctorbooking.backend.repository.WalletTransactionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WalletService Unit Tests")
class WalletServiceTest {

    @Mock private PatientRepository patientRepository;
    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private WalletService walletService;

    // ---- Helpers ----

    private Patient buildPatient(Long id, BigDecimal balance, int points, String tier) {
        User user = new User();
        user.setId(id);
        user.setUsername("patient" + id);
        user.setEmail("patient" + id + "@test.com");
        user.setPassword("password");
        user.setRole(User.Role.PATIENT);
        user.setEnabled(true);

        Patient p = new Patient();
        p.setId(id);
        p.setUser(user);
        p.setFullName("Patient " + id);
        p.setPhone("0901234567");
        p.setWalletBalance(balance);
        p.setLoyaltyPoints(points);
        p.setLoyaltyTier(tier);
        return p;
    }

    private WalletTransaction buildTransaction(Long id, String referenceId,
                                                WalletTransaction.TransactionStatus status,
                                                BigDecimal amount, Patient patient) {
        WalletTransaction t = new WalletTransaction();
        t.setId(id);
        t.setReferenceId(referenceId);
        t.setStatus(status);
        t.setAmount(amount);
        t.setPatient(patient);
        t.setTransactionType(WalletTransaction.TransactionType.DEPOSIT);
        t.setPaymentMethod("VNPAY");
        t.setDescription("Nạp tiền vào ví qua VNPAY");
        return t;
    }

    // =========================================================
    // payForAppointment TESTS
    // =========================================================
    @Nested
    @DisplayName("payForAppointment()")
    class PayForAppointmentTests {

        @Test
        @DisplayName("✅ Thanh toán thành công - số dư đủ")
        void payForAppointment_success_sufficientBalance() {
            // Patient có 2,500,000đ, phí khám 150,000đ
            Patient patient = buildPatient(6L, BigDecimal.valueOf(2_500_000), 5000, "GOLD");
            BigDecimal fee = BigDecimal.valueOf(150_000);

            WalletTransaction savedTx = new WalletTransaction();
            savedTx.setId(81L);
            savedTx.setStatus(WalletTransaction.TransactionStatus.COMPLETED);

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(walletTransactionRepository.save(any())).thenReturn(savedTx);
            when(patientRepository.save(any())).thenReturn(patient);

            WalletTransaction result = walletService.payForAppointment(6L, 88L, fee, "Phí khám bệnh");

            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(WalletTransaction.TransactionStatus.COMPLETED);
            // Số dư phải giảm 150,000đ
            assertThat(patient.getWalletBalance()).isEqualByComparingTo(BigDecimal.valueOf(2_350_000));
            // Điểm tích lũy: 150,000 / 100 = 1500 điểm
            assertThat(patient.getLoyaltyPoints()).isEqualTo(6500); // 5000 + 1500
        }

        @Test
        @DisplayName("❌ Số dư không đủ → throw RuntimeException")
        void payForAppointment_insufficientBalance_throwsException() {
            Patient patient = buildPatient(6L, BigDecimal.valueOf(100_000), 0, "BRONZE");
            BigDecimal fee = BigDecimal.valueOf(500_000);

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));

            assertThatThrownBy(() -> walletService.payForAppointment(6L, 88L, fee, "Phí khám"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Insufficient wallet balance");
        }

        @Test
        @DisplayName("✅ Điểm tích lũy đủ → nâng lên PLATINUM")
        void payForAppointment_enoughPoints_upgradesToPlatinum() {
            // Patient có 9,000 điểm, thanh toán 150,000đ → +1500 điểm = 10,500 → PLATINUM
            Patient patient = buildPatient(6L, BigDecimal.valueOf(5_000_000), 9000, "GOLD");
            BigDecimal fee = BigDecimal.valueOf(150_000);

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(walletTransactionRepository.save(any())).thenReturn(new WalletTransaction());
            when(patientRepository.save(any())).thenReturn(patient);

            walletService.payForAppointment(6L, 88L, fee, "Phí khám");

            assertThat(patient.getLoyaltyPoints()).isEqualTo(10500);
            assertThat(patient.getLoyaltyTier()).isEqualTo("PLATINUM");
        }

        @Test
        @DisplayName("✅ Patient không có balance (null) → số dư = 0 → lỗi nếu fee > 0")
        void payForAppointment_nullBalance_treatedAsZero() {
            Patient patient = buildPatient(6L, null, 0, "BRONZE"); // null balance
            BigDecimal fee = BigDecimal.valueOf(1);

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));

            assertThatThrownBy(() -> walletService.payForAppointment(6L, 88L, fee, "Phí khám"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Insufficient wallet balance");
        }
    }

    // =========================================================
    // refundAppointment TESTS
    // =========================================================
    @Nested
    @DisplayName("refundAppointment()")
    class RefundAppointmentTests {

        @Test
        @DisplayName("✅ Hoàn tiền thành công")
        void refundAppointment_success() {
            Patient patient = buildPatient(6L, BigDecimal.valueOf(1_000_000), 2000, "SILVER");
            BigDecimal refundAmount = BigDecimal.valueOf(150_000);

            WalletTransaction savedTx = new WalletTransaction();
            savedTx.setId(79L);
            savedTx.setStatus(WalletTransaction.TransactionStatus.COMPLETED);

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(walletTransactionRepository.save(any())).thenReturn(savedTx);
            when(patientRepository.save(any())).thenReturn(patient);

            WalletTransaction result = walletService.refundAppointment(6L, 88L, refundAmount, "Hoàn tiền hủy lịch");

            assertThat(result).isNotNull();
            // Số dư tăng lên 1,150,000đ
            assertThat(patient.getWalletBalance()).isEqualByComparingTo(BigDecimal.valueOf(1_150_000));
            // Điểm bị trừ: 150,000 / 100 = 1500 → 2000 - 1500 = 500
            assertThat(patient.getLoyaltyPoints()).isEqualTo(500);
        }

        @Test
        @DisplayName("✅ Điểm không bao giờ âm - trừ nhiều hơn điểm hiện có")
        void refundAppointment_loyaltyPointsNotNegative() {
            Patient patient = buildPatient(6L, BigDecimal.valueOf(500_000), 100, "BRONZE");
            BigDecimal refundAmount = BigDecimal.valueOf(500_000); // 500,000 / 100 = 5000 điểm cần trừ

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(walletTransactionRepository.save(any())).thenReturn(new WalletTransaction());
            when(patientRepository.save(any())).thenReturn(patient);

            walletService.refundAppointment(6L, 88L, refundAmount, "Hoàn tiền");

            // 100 - 5000 < 0 → phải là 0
            assertThat(patient.getLoyaltyPoints()).isEqualTo(0);
        }
    }

    // =========================================================
    // createDepositTransaction TESTS
    // =========================================================
    @Nested
    @DisplayName("createDepositTransaction()")
    class CreateDepositTransactionTests {

        @Test
        @DisplayName("✅ Tạo giao dịch nạp tiền PENDING thành công")
        void createDepositTransaction_success() {
            Patient patient = buildPatient(6L, BigDecimal.valueOf(1_000_000), 0, "BRONZE");
            BigDecimal depositAmount = BigDecimal.valueOf(500_000);

            WalletTransaction savedTx = new WalletTransaction();
            savedTx.setId(1L);
            savedTx.setStatus(WalletTransaction.TransactionStatus.PENDING);
            savedTx.setAmount(depositAmount);
            savedTx.setReferenceId("some-uuid");

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(walletTransactionRepository.save(any())).thenReturn(savedTx);

            WalletTransaction result = walletService.createDepositTransaction(6L, depositAmount, "VNPAY");

            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(WalletTransaction.TransactionStatus.PENDING);
            assertThat(result.getAmount()).isEqualByComparingTo(depositAmount);
            // referenceId phải được set
            assertThat(result.getReferenceId()).isNotNull();
        }
    }

    // =========================================================
    // completeDepositTransaction TESTS
    // =========================================================
    @Nested
    @DisplayName("completeDepositTransaction()")
    class CompleteDepositTransactionTests {

        @Test
        @DisplayName("✅ Hoàn tất giao dịch nạp tiền thành công")
        void completeDeposit_success() {
            Patient patient = buildPatient(6L, BigDecimal.valueOf(1_000_000), 0, "BRONZE");
            WalletTransaction tx = buildTransaction(1L, "ref-123", WalletTransaction.TransactionStatus.PENDING,
                    BigDecimal.valueOf(500_000), patient);

            when(walletTransactionRepository.findByReferenceId("ref-123")).thenReturn(tx);
            when(patientRepository.save(any())).thenReturn(patient);
            when(walletTransactionRepository.save(any())).thenReturn(tx);
            when(notificationService.createNotification(any(), any(), any(), any(), any())).thenReturn(null);

            WalletTransaction result = walletService.completeDepositTransaction("ref-123", "VNP12345");

            assertThat(tx.getStatus()).isEqualTo(WalletTransaction.TransactionStatus.COMPLETED);
            // Số dư tăng: 1,000,000 + 500,000 = 1,500,000
            assertThat(patient.getWalletBalance()).isEqualByComparingTo(BigDecimal.valueOf(1_500_000));
            // Điểm: 500,000 / 100 = 5000
            assertThat(patient.getLoyaltyPoints()).isEqualTo(5000);
            // Tier: GOLD (5000 điểm)
            assertThat(patient.getLoyaltyTier()).isEqualTo("GOLD");
        }

        @Test
        @DisplayName("✅ Transaction đã COMPLETED → trả về ngay, không xử lý lại")
        void completeDeposit_alreadyCompleted_returnsEarly() {
            Patient patient = buildPatient(6L, BigDecimal.valueOf(2_000_000), 1000, "SILVER");
            WalletTransaction tx = buildTransaction(1L, "ref-already", WalletTransaction.TransactionStatus.COMPLETED,
                    BigDecimal.valueOf(500_000), patient);

            when(walletTransactionRepository.findByReferenceId("ref-already")).thenReturn(tx);

            WalletTransaction result = walletService.completeDepositTransaction("ref-already", null);

            // Không save lại patient
            verify(patientRepository, never()).save(any());
            verify(walletTransactionRepository, never()).save(any());
        }

        @Test
        @DisplayName("❌ referenceId không tồn tại → throw RuntimeException")
        void completeDeposit_notFound_throwsException() {
            when(walletTransactionRepository.findByReferenceId("invalid-ref")).thenReturn(null);

            assertThatThrownBy(() -> walletService.completeDepositTransaction("invalid-ref", null))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Transaction not found with referenceId: invalid-ref");
        }
    }

    // =========================================================
    // failDepositTransaction TESTS
    // =========================================================
    @Nested
    @DisplayName("failDepositTransaction()")
    class FailDepositTransactionTests {

        @Test
        @DisplayName("✅ Đánh dấu giao dịch FAILED thành công")
        void failDeposit_success() {
            Patient patient = buildPatient(6L, BigDecimal.valueOf(1_000_000), 0, "BRONZE");
            WalletTransaction tx = buildTransaction(1L, "ref-fail", WalletTransaction.TransactionStatus.PENDING,
                    BigDecimal.valueOf(500_000), patient);

            when(walletTransactionRepository.findByReferenceId("ref-fail")).thenReturn(tx);
            when(walletTransactionRepository.save(any())).thenReturn(tx);

            WalletTransaction result = walletService.failDepositTransaction("ref-fail", "User cancelled");

            assertThat(tx.getStatus()).isEqualTo(WalletTransaction.TransactionStatus.FAILED);
        }

        @Test
        @DisplayName("✅ Transaction COMPLETED không thể đổi sang FAILED")
        void failDeposit_alreadyCompleted_returnsEarly() {
            Patient patient = buildPatient(6L, BigDecimal.valueOf(2_000_000), 0, "BRONZE");
            WalletTransaction tx = buildTransaction(1L, "ref-complete", WalletTransaction.TransactionStatus.COMPLETED,
                    BigDecimal.valueOf(500_000), patient);

            when(walletTransactionRepository.findByReferenceId("ref-complete")).thenReturn(tx);

            WalletTransaction result = walletService.failDepositTransaction("ref-complete", "Late failure");

            // Status vẫn COMPLETED, không save lại
            assertThat(tx.getStatus()).isEqualTo(WalletTransaction.TransactionStatus.COMPLETED);
            verify(walletTransactionRepository, never()).save(any());
        }
    }

    // =========================================================
    // Loyalty Tier Logic TESTS (via payForAppointment)
    // =========================================================
    @Nested
    @DisplayName("Loyalty Tier Calculation")
    class LoyaltyTierTests {

        private void doPayment(Patient patient, BigDecimal fee) {
            when(patientRepository.findById(patient.getId())).thenReturn(Optional.of(patient));
            when(walletTransactionRepository.save(any())).thenReturn(new WalletTransaction());
            when(patientRepository.save(any())).thenReturn(patient);
            walletService.payForAppointment(patient.getId(), 1L, fee, "Test");
        }

        @Test
        @DisplayName("✅ BRONZE: điểm < 1000")
        void loyaltyTier_bronze() {
            Patient p = buildPatient(1L, BigDecimal.valueOf(1_000_000), 0, "BRONZE");
            doPayment(p, BigDecimal.valueOf(50_000)); // +500 điểm
            assertThat(p.getLoyaltyTier()).isEqualTo("BRONZE");
        }

        @Test
        @DisplayName("✅ SILVER: điểm >= 1000")
        void loyaltyTier_silver() {
            Patient p = buildPatient(1L, BigDecimal.valueOf(5_000_000), 900, "BRONZE");
            doPayment(p, BigDecimal.valueOf(100_000)); // +1000 điểm → 1900 → SILVER
            assertThat(p.getLoyaltyTier()).isEqualTo("SILVER");
        }

        @Test
        @DisplayName("✅ GOLD: điểm >= 5000")
        void loyaltyTier_gold() {
            Patient p = buildPatient(1L, BigDecimal.valueOf(5_000_000), 4500, "SILVER");
            doPayment(p, BigDecimal.valueOf(100_000)); // +1000 điểm → 5500 → GOLD
            assertThat(p.getLoyaltyTier()).isEqualTo("GOLD");
        }

        @Test
        @DisplayName("✅ PLATINUM: điểm >= 10000")
        void loyaltyTier_platinum() {
            Patient p = buildPatient(1L, BigDecimal.valueOf(5_000_000), 9500, "GOLD");
            doPayment(p, BigDecimal.valueOf(100_000)); // +1000 điểm → 10500 → PLATINUM
            assertThat(p.getLoyaltyTier()).isEqualTo("PLATINUM");
        }
    }
}
