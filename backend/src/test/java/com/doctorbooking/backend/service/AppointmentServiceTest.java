package com.doctorbooking.backend.service;

import com.doctorbooking.backend.dto.request.CreateAppointmentRequest;
import com.doctorbooking.backend.dto.response.AppointmentResponse;
import com.doctorbooking.backend.model.*;
import com.doctorbooking.backend.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AppointmentService Unit Tests")
class AppointmentServiceTest {

    @Mock private AppointmentRepository appointmentRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private DoctorRepository doctorRepository;
    @Mock private WalletService walletService;
    @Mock private EmailService emailService;
    @Mock private NotificationService notificationService;
    @Mock private EntityManager entityManager;
    @Mock private FamilyAppointmentRepository familyAppointmentRepository;
    @Mock private FamilyMemberRepository familyMemberRepository;
    @Mock private FeedbackRepository feedbackRepository;

    @InjectMocks
    private AppointmentService appointmentService;

    // ---- Helpers ----

    private User buildUser(Long id, String username, String email, User.Role role) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setEmail(email);
        u.setPassword("password");
        u.setRole(role);
        u.setEnabled(true);
        return u;
    }

    private Patient buildPatient(Long id, User user, String fullName) {
        Patient p = new Patient();
        p.setId(id);
        p.setUser(user);
        p.setFullName(fullName);
        p.setPhone("0901234567");
        return p;
    }

    private Doctor buildDoctor(Long id, User user, String fullName, String specialization, Doctor.DoctorStatus status) {
        Doctor d = new Doctor();
        d.setId(id);
        d.setUser(user);
        d.setFullName(fullName);
        d.setSpecialization(specialization);
        d.setStatus(status);
        d.setConsultationFee(BigDecimal.valueOf(150000));
        d.setPhone("0901111111");
        d.setAddress("123 Đường Y Khoa");
        return d;
    }

    private Appointment buildAppointment(Long id, Patient patient, Doctor doctor,
                                          Appointment.AppointmentStatus status,
                                          Appointment.PaymentStatus paymentStatus,
                                          String paymentMethod) {
        Appointment a = new Appointment();
        a.setId(id);
        a.setPatient(patient);
        a.setDoctor(doctor);
        a.setAppointmentDate(LocalDate.now().plusDays(7));
        a.setAppointmentTime(LocalTime.of(9, 0));
        a.setStatus(status);
        a.setPaymentStatus(paymentStatus);
        a.setPaymentMethod(paymentMethod);
        a.setPrice(BigDecimal.valueOf(150000));
        return a;
    }

    private CreateAppointmentRequest buildCreateRequest(Long doctorId, String paymentMethod, Long familyMemberId) {
        CreateAppointmentRequest req = new CreateAppointmentRequest();
        req.setDoctorId(doctorId);
        req.setAppointmentDate(LocalDate.now().plusDays(7));
        req.setAppointmentTime(LocalTime.of(9, 0));
        req.setNotes("Khám định kỳ");
        req.setPaymentMethod(paymentMethod);
        req.setFamilyMemberId(familyMemberId);
        return req;
    }

    // =========================================================
    // getAvailableTimeSlots TESTS
    // =========================================================
    @Nested
    @DisplayName("getAvailableTimeSlots()")
    class GetAvailableTimeSlotsTests {

        @Test
        @DisplayName("✅ Trả về tất cả slots khi bác sĩ chưa có lịch hẹn nào")
        void getAvailableSlots_noPendingAppointments_returnsAllSlots() {
            when(appointmentRepository.findByDoctorAndDate(1L, LocalDate.now().plusDays(1)))
                    .thenReturn(Collections.emptyList());

            List<String> slots = appointmentService.getAvailableTimeSlots(1L, LocalDate.now().plusDays(1));

            assertThat(slots).hasSize(17); // 17 slots trong ngày
            assertThat(slots).contains("08:00", "09:00", "14:00", "17:00");
        }

        @Test
        @DisplayName("✅ Loại bỏ slot đã có lịch PENDING")
        void getAvailableSlots_removePendingSlot() {
            Patient patient = buildPatient(1L, buildUser(1L, "p", "p@t.com", User.Role.PATIENT), "Patient A");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "d", "d@t.com", User.Role.DOCTOR), "Dr. A", "Tim mạch", Doctor.DoctorStatus.ACTIVE);

            Appointment pendingApt = buildAppointment(1L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING,
                    Appointment.PaymentStatus.PENDING, "CASH");
            pendingApt.setAppointmentTime(LocalTime.of(8, 0)); // 08:00

            LocalDate date = LocalDate.now().plusDays(1);
            when(appointmentRepository.findByDoctorAndDate(1L, date))
                    .thenReturn(List.of(pendingApt));

            List<String> slots = appointmentService.getAvailableTimeSlots(1L, date);

            assertThat(slots).doesNotContain("08:00");
            assertThat(slots).hasSize(16);
        }

        @Test
        @DisplayName("✅ Loại bỏ slot CONFIRMED, giữ lại slot CANCELLED")
        void getAvailableSlots_confirmedRemovedCancelledKept() {
            Patient p = buildPatient(1L, buildUser(1L, "p", "p@t.com", User.Role.PATIENT), "Pat");
            Doctor d = buildDoctor(1L, buildUser(2L, "d", "d@t.com", User.Role.DOCTOR), "Dr", "Nhi", Doctor.DoctorStatus.ACTIVE);

            Appointment confirmed = buildAppointment(1L, p, d,
                    Appointment.AppointmentStatus.CONFIRMED, Appointment.PaymentStatus.PENDING, "CASH");
            confirmed.setAppointmentTime(LocalTime.of(9, 0)); // CONFIRMED → bị loại

            Appointment cancelled = buildAppointment(2L, p, d,
                    Appointment.AppointmentStatus.CANCELLED, Appointment.PaymentStatus.REFUNDED, "WALLET");
            cancelled.setAppointmentTime(LocalTime.of(10, 0)); // CANCELLED → vẫn còn

            LocalDate date = LocalDate.now().plusDays(1);
            when(appointmentRepository.findByDoctorAndDate(1L, date))
                    .thenReturn(List.of(confirmed, cancelled));

            List<String> slots = appointmentService.getAvailableTimeSlots(1L, date);

            assertThat(slots).doesNotContain("09:00"); // CONFIRMED bị loại
            assertThat(slots).contains("10:00");       // CANCELLED vẫn available
        }
    }

    // =========================================================
    // createAppointment TESTS
    // =========================================================
    @Nested
    @DisplayName("createAppointment()")
    class CreateAppointmentTests {

        @Test
        @DisplayName("✅ Tạo appointment thành công - thanh toán CASH")
        void createAppointment_cash_success() {
            User patientUser = buildUser(1L, "trongdang", "trongdang@test.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, patientUser, "Đặng Tấn Trọng");
            User doctorUser = buildUser(2L, "doctor", "doctor@test.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, doctorUser, "Huỳnh Phong Đạt", "Sản phụ khoa", Doctor.DoctorStatus.ACTIVE);

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", null);
            Appointment savedApt = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(appointmentRepository.findByDoctorAndDate(eq(1L), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());
            when(appointmentRepository.save(any(Appointment.class))).thenReturn(savedApt);
            when(notificationService.createNotification(any(), any(), any(), any(), any())).thenReturn(null);

            AppointmentResponse response = appointmentService.createAppointment(6L, req);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(88L);
            verify(walletService, never()).payForAppointment(any(), any(), any(), any());
        }

        @Test
        @DisplayName("✅ Tạo appointment thành công - thanh toán WALLET")
        void createAppointment_wallet_success() {
            User patientUser = buildUser(1L, "trongdang", "trongdang@test.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, patientUser, "Đặng Tấn Trọng");
            User doctorUser = buildUser(2L, "doctor", "doctor@test.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, doctorUser, "Huỳnh Phong Đạt", "Sản phụ khoa", Doctor.DoctorStatus.ACTIVE);

            CreateAppointmentRequest req = buildCreateRequest(1L, "WALLET", null);
            Appointment pendingSave = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "WALLET");
            Appointment paidSave = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PAID, "WALLET");

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(appointmentRepository.findByDoctorAndDate(eq(1L), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());
            when(appointmentRepository.save(any(Appointment.class)))
                    .thenReturn(pendingSave)   // first save
                    .thenReturn(paidSave);     // second save after wallet payment
            when(walletService.payForAppointment(any(), any(), any(), any())).thenReturn(new WalletTransaction());
            when(notificationService.createNotification(any(), any(), any(), any(), any())).thenReturn(null);

            AppointmentResponse response = appointmentService.createAppointment(6L, req);

            assertThat(response).isNotNull();
            verify(walletService, times(1)).payForAppointment(eq(6L), eq(88L), any(), any());
        }

        @Test
        @DisplayName("❌ Bác sĩ không tồn tại → throw RuntimeException")
        void createAppointment_doctorNotFound_throwsException() {
            User patientUser = buildUser(1L, "trongdang", "trongdang@test.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, patientUser, "Đặng Tấn Trọng");

            CreateAppointmentRequest req = buildCreateRequest(999L, "CASH", null);

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> appointmentService.createAppointment(6L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Doctor not found");
        }

        @Test
        @DisplayName("❌ Bác sĩ không active → throw RuntimeException")
        void createAppointment_doctorNotActive_throwsException() {
            User patientUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, patientUser, "Pat");
            User docUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor inactiveDoc = buildDoctor(1L, docUser, "Dr.", "Nhi", Doctor.DoctorStatus.INACTIVE);

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", null);

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(inactiveDoc));

            assertThatThrownBy(() -> appointmentService.createAppointment(6L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Doctor is not active");
        }

        @Test
        @DisplayName("❌ Slot đã bị book → throw RuntimeException")
        void createAppointment_slotAlreadyTaken_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", null);
            // Existing PENDING appointment at same time
            Appointment existing = buildAppointment(1L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
            existing.setAppointmentTime(LocalTime.of(9, 0)); // Same as req

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(appointmentRepository.findByDoctorAndDate(eq(1L), any()))
                    .thenReturn(List.of(existing));

            assertThatThrownBy(() -> appointmentService.createAppointment(6L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Appointment slot is already taken");
        }

        @Test
        @DisplayName("❌ Đặt lịch trong quá khứ → throw RuntimeException")
        void createAppointment_pastDate_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", null);
            req.setAppointmentDate(LocalDate.now().minusDays(1)); // Quá khứ

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(appointmentRepository.findByDoctorAndDate(any(), any()))
                    .thenReturn(Collections.emptyList());

            assertThatThrownBy(() -> appointmentService.createAppointment(6L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Cannot book appointment in the past");
        }
    }

    // =========================================================
    // cancelAppointment TESTS
    // =========================================================
    @Nested
    @DisplayName("cancelAppointment()")
    class CancelAppointmentTests {

        @Test
        @DisplayName("✅ Hủy appointment PENDING thành công")
        void cancelAppointment_pending_success() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");

            when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
            when(appointmentRepository.save(any())).thenReturn(apt);

            appointmentService.cancelAppointment(88L, 6L);

            assertThat(apt.getStatus()).isEqualTo(Appointment.AppointmentStatus.CANCELLED);
            verify(walletService, never()).refundAppointment(any(), any(), any(), any());
        }

        @Test
        @DisplayName("✅ Hủy appointment thanh toán WALLET → hoàn tiền")
        void cancelAppointment_wallet_refund() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Huỳnh Phong Đạt", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PAID, "WALLET");

            when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
            when(walletService.refundAppointment(any(), any(), any(), any())).thenReturn(new WalletTransaction());
            when(appointmentRepository.save(any())).thenReturn(apt);

            appointmentService.cancelAppointment(88L, 6L);

            assertThat(apt.getStatus()).isEqualTo(Appointment.AppointmentStatus.CANCELLED);
            assertThat(apt.getPaymentStatus()).isEqualTo(Appointment.PaymentStatus.REFUNDED);
            verify(walletService, times(1)).refundAppointment(eq(6L), eq(88L), any(), any());
        }

        @Test
        @DisplayName("❌ Hủy appointment của người khác → throw RuntimeException")
        void cancelAppointment_wrongPatient_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");

            when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));

            // patientId = 99 khác với patient.id = 6
            assertThatThrownBy(() -> appointmentService.cancelAppointment(88L, 99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Appointment does not belong to this patient");
        }

        @Test
        @DisplayName("❌ Hủy appointment đã COMPLETED → throw RuntimeException")
        void cancelAppointment_completed_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(82L, patient, doctor,
                    Appointment.AppointmentStatus.COMPLETED, Appointment.PaymentStatus.PAID, "CASH");

            when(appointmentRepository.findById(82L)).thenReturn(Optional.of(apt));

            assertThatThrownBy(() -> appointmentService.cancelAppointment(82L, 6L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Cannot cancel a completed appointment");
        }

        @Test
        @DisplayName("❌ Hủy appointment đã CANCELLED → throw RuntimeException")
        void cancelAppointment_alreadyCancelled_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(79L, patient, doctor,
                    Appointment.AppointmentStatus.CANCELLED, Appointment.PaymentStatus.REFUNDED, "WALLET");

            when(appointmentRepository.findById(79L)).thenReturn(Optional.of(apt));

            assertThatThrownBy(() -> appointmentService.cancelAppointment(79L, 6L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Appointment is already cancelled");
        }
    }

    // =========================================================
    // confirmAppointment TESTS
    // =========================================================
    @Nested
    @DisplayName("confirmAppointment()")
    class ConfirmAppointmentTests {

        @Test
        @DisplayName("✅ Bác sĩ xác nhận appointment PENDING → CONFIRMED")
        void confirmAppointment_success() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            patient.setPhone("0901111111");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");

            when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
            when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(familyAppointmentRepository.findByAppointmentId(any())).thenReturn(Optional.empty());

            AppointmentResponse response = appointmentService.confirmAppointment(88L, 1L);

            assertThat(response).isNotNull();
            assertThat(apt.getStatus()).isEqualTo(Appointment.AppointmentStatus.CONFIRMED);
        }

        @Test
        @DisplayName("❌ Bác sĩ xác nhận lịch không phải của mình → throw RuntimeException")
        void confirmAppointment_wrongDoctor_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");

            when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));

            // doctorId = 999 khác với doctor.id = 1
            assertThatThrownBy(() -> appointmentService.confirmAppointment(88L, 999L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Appointment does not belong to this doctor");
        }

        @Test
        @DisplayName("❌ Chỉ PENDING mới có thể confirm → throw RuntimeException nếu CONFIRMED rồi")
        void confirmAppointment_notPending_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.CONFIRMED, Appointment.PaymentStatus.PENDING, "CASH");

            when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));

            assertThatThrownBy(() -> appointmentService.confirmAppointment(88L, 1L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Only PENDING appointments can be confirmed");
        }
    }

    // =========================================================
    // getAppointmentsByDate TESTS
    // =========================================================
    @Nested
    @DisplayName("getAppointmentsByDate()")
    class GetAppointmentsByDateTests {

        @Test
        @DisplayName("✅ date=null → trả về tất cả appointments")
        void getByDate_nullDate_returnsAll() {
            when(appointmentRepository.findAll()).thenReturn(Collections.emptyList());

            List<AppointmentResponse> result = appointmentService.getAppointmentsByDate(null);

            assertThat(result).isEmpty();
            verify(appointmentRepository, times(1)).findAll();
            verify(appointmentRepository, never()).findByAppointmentDate(any());
        }

        @Test
        @DisplayName("✅ date không null → lọc theo ngày")
        void getByDate_withDate_filtersCorrectly() {
            LocalDate today = LocalDate.now();
            when(appointmentRepository.findByAppointmentDate(today)).thenReturn(Collections.emptyList());

            List<AppointmentResponse> result = appointmentService.getAppointmentsByDate(today);

            assertThat(result).isEmpty();
            verify(appointmentRepository, times(1)).findByAppointmentDate(today);
        }
    }
}
