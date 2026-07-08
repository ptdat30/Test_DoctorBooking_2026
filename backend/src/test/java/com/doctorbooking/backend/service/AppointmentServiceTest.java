package com.doctorbooking.backend.service;

import com.doctorbooking.backend.constant.AppConstants;
import com.doctorbooking.backend.dto.request.CreateAppointmentRequest;
import com.doctorbooking.backend.dto.request.UpdateAppointmentRequest;
import com.doctorbooking.backend.dto.response.AppointmentResponse;
import com.doctorbooking.backend.exception.BadRequestException;
import com.doctorbooking.backend.model.*;
import com.doctorbooking.backend.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.Mockito;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.*;
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

    // Các slot khám hợp lệ theo VALID_APPOINTMENT_SLOTS trong AppointmentService.
    private static final List<String> STANDARD_SLOTS = List.of(
            "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
            "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
            "15:00", "15:30", "16:00", "16:30", "17:00"
    );

    // Slot chuẩn đầu tiên còn nằm trong tương lai của hôm nay (so với giờ chạy test).
    // Trả về empty khi test chạy quá muộn (sau slot cuối) → dùng để skip an toàn,
    // tránh test phụ thuộc đồng hồ thực bị fail vào buổi tối.
    private static Optional<LocalTime> firstFutureSlotToday() {
        LocalTime now = LocalTime.now();
        return STANDARD_SLOTS.stream()
                .map(LocalTime::parse)
                .filter(slot -> slot.isAfter(now))
                .findFirst();
    }

    // Slot chuẩn cuối cùng đã trôi qua so với giờ hiện tại của hôm nay.
    // Trả về empty khi test chạy trước slot đầu tiên (sáng sớm) → skip an toàn.
    private static Optional<LocalTime> lastPastSlotToday() {
        LocalTime now = LocalTime.now();
        return STANDARD_SLOTS.stream()
                .map(LocalTime::parse)
                .filter(slot -> slot.isBefore(now))
                .reduce((first, second) -> second);
    }

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

    private LocalTime getValidSlotAfterNow() {
        List<LocalTime> slots = List.of(
                LocalTime.of(8, 0), LocalTime.of(8, 30), LocalTime.of(9, 0), LocalTime.of(9, 30),
                LocalTime.of(10, 0), LocalTime.of(10, 30), LocalTime.of(11, 0), LocalTime.of(11, 30),
                LocalTime.of(13, 0), LocalTime.of(13, 30), LocalTime.of(14, 0), LocalTime.of(14, 30),
                LocalTime.of(15, 0), LocalTime.of(15, 30), LocalTime.of(16, 0), LocalTime.of(16, 30),
                LocalTime.of(17, 0)
        );
        return slots.stream()
                .filter(slot -> slot.isAfter(LocalTime.now()))
                .findFirst()
                .orElse(LocalTime.of(17, 0));
    }

    private LocalTime getValidSlotBeforeNow() {
        List<LocalTime> slots = List.of(
                LocalTime.of(8, 0), LocalTime.of(8, 30), LocalTime.of(9, 0), LocalTime.of(9, 30),
                LocalTime.of(10, 0), LocalTime.of(10, 30), LocalTime.of(11, 0), LocalTime.of(11, 30),
                LocalTime.of(13, 0), LocalTime.of(13, 30), LocalTime.of(14, 0), LocalTime.of(14, 30),
                LocalTime.of(15, 0), LocalTime.of(15, 30), LocalTime.of(16, 0), LocalTime.of(16, 30),
                LocalTime.of(17, 0)
        );
        return slots.stream()
                .filter(slot -> slot.isBefore(LocalTime.now()))
                .reduce((first, second) -> second)
                .orElse(LocalTime.of(8, 0));
    }

    // =========================================================
    // getAvailableTimeSlots TESTS
    // =========================================================
    @Nested
    @DisplayName("getAvailableTimeSlots()")
    class GetAvailableTimeSlotsTests {

        @Test
        void buildBookingNotificationMessage_family() throws Exception {

            Method m = AppointmentService.class
                    .getDeclaredMethod(
                            "buildBookingNotificationMessage",
                            String.class,
                            String.class,
                            LocalDate.class,
                            LocalTime.class);

            m.setAccessible(true);

            String result=(String)m.invoke(
                    appointmentService,
                    "An",
                    "Doctor A",
                    LocalDate.of(2026,1,1),
                    LocalTime.of(8,0));

            assertTrue(result.contains("An"));
        }
        @Test
        void validateAppointmentTime_invalid() throws Exception {
            Method m = AppointmentService.class
                    .getDeclaredMethod("validateAppointmentTime", LocalTime.class);
            m.setAccessible(true);

            InvocationTargetException ex = assertThrows(
                    InvocationTargetException.class,
                    () -> m.invoke(appointmentService,
                            LocalTime.of(7,15)));

            assertTrue(ex.getCause() instanceof BadRequestException);
        }

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
        void validateAppointmentTime_valid() throws Exception {
            Method m = AppointmentService.class
                    .getDeclaredMethod("validateAppointmentTime", LocalTime.class);
            m.setAccessible(true);

            assertDoesNotThrow(() ->
                    m.invoke(appointmentService,
                            LocalTime.of(8,0)));
        }

        @Test
        void buildBookingNotificationMessage_normal() throws Exception {

            Method m = AppointmentService.class
                    .getDeclaredMethod(
                            "buildBookingNotificationMessage",
                            String.class,
                            String.class,
                            LocalDate.class,
                            LocalTime.class);

            m.setAccessible(true);

            String result=(String)m.invoke(
                    appointmentService,
                    null,
                    "Doctor A",
                    LocalDate.of(2026,1,1),
                    LocalTime.of(8,0));

            assertFalse(result.contains("cho An"));
        }
        @Test
        void duplicateAppointment_throw() throws Exception {

            Appointment a=new Appointment();
            a.setAppointmentTime(LocalTime.of(8,0));
            a.setStatus(Appointment.AppointmentStatus.PENDING);

            Method m=AppointmentService.class
                    .getDeclaredMethod(
                            "checkForDuplicateAppointment",
                            List.class,
                            LocalTime.class);

            m.setAccessible(true);

            InvocationTargetException ex=
                    assertThrows(
                            InvocationTargetException.class,
                            ()->m.invoke(
                                    appointmentService,
                                    List.of(a),
                                    LocalTime.of(8,0)));

            assertTrue(ex.getCause() instanceof BadRequestException);
        }
        @Test
        void duplicateAppointment_ok() throws Exception {

            Appointment a=new Appointment();
            a.setAppointmentTime(LocalTime.of(8,0));
            a.setStatus(Appointment.AppointmentStatus.CANCELLED);

            Method m=AppointmentService.class
                    .getDeclaredMethod(
                            "checkForDuplicateAppointment",
                            List.class,
                            LocalTime.class);

            m.setAccessible(true);

            assertDoesNotThrow(()->
                    m.invoke(
                            appointmentService,
                            List.of(a),
                            LocalTime.of(8,0)));
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
                    Appointment.AppointmentStatus.CANCELLED, Appointment.PaymentStatus.REFUNDED, AppConstants.WALLET);
            cancelled.setAppointmentTime(LocalTime.of(10, 0)); // CANCELLED → vẫn còn

            LocalDate date = LocalDate.now().plusDays(1);
            when(appointmentRepository.findByDoctorAndDate(1L, date))
                    .thenReturn(List.of(confirmed, cancelled));

            List<String> slots = appointmentService.getAvailableTimeSlots(1L, date);

            assertThat(slots).doesNotContain("09:00"); // CONFIRMED bị loại
            assertThat(slots).contains("10:00");       // CANCELLED vẫn available
        }

        @Test
        @DisplayName("✅ Giữ lại slot COMPLETED")
        void getAvailableSlots_completedAppointment_kept() {
            Patient p = buildPatient(1L, buildUser(1L, "p", "p@t.com", User.Role.PATIENT), "Pat");
            Doctor d = buildDoctor(1L, buildUser(2L, "d", "d@t.com", User.Role.DOCTOR), "Dr", "Nhi", Doctor.DoctorStatus.ACTIVE);

            Appointment completed = buildAppointment(3L, p, d,
                    Appointment.AppointmentStatus.COMPLETED, Appointment.PaymentStatus.PAID, "CASH");
            completed.setAppointmentTime(LocalTime.of(11, 0)); // COMPLETED → vẫn còn

            LocalDate date = LocalDate.now().plusDays(1);
            when(appointmentRepository.findByDoctorAndDate(1L, date))
                    .thenReturn(List.of(completed));

            List<String> slots = appointmentService.getAvailableTimeSlots(1L, date);

            assertThat(slots).contains("11:00"); // COMPLETED vẫn available
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

            CreateAppointmentRequest req = buildCreateRequest(1L, AppConstants.WALLET, null);
            Appointment pendingSave = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, AppConstants.WALLET);
            Appointment paidSave = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PAID, AppConstants.WALLET);

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
        @DisplayName("❌ Slot không hợp lệ như 08:15 → throw RuntimeException")
        void createAppointment_invalidTimeSlot_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", null);
            req.setAppointmentTime(LocalTime.of(8, 15));

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));

            assertThatThrownBy(() -> appointmentService.createAppointment(6L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Invalid appointment time slot");
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

        @ParameterizedTest(name = "[{index}] date={0}, expectedOutcome={1}")
        @CsvSource({
                "-1, Cannot book appointment in the past",
                "0, Cannot book appointment in the past",
                "1, VALID"
        })
        @DisplayName("Boundary tests for appointment date relative to today (must be after today)")
        void createAppointment_dateBoundaryTests(int dayOffset, String expectedOutcome) {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", null);
            req.setAppointmentDate(LocalDate.now().plusDays(dayOffset));

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(appointmentRepository.findByDoctorAndDate(eq(1L), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());

            if ("VALID".equals(expectedOutcome)) {
                when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
                    Appointment apt = inv.getArgument(0);
                    apt.setId(99L);
                    return apt;
                });
                when(notificationService.createNotification(any(), any(), any(), any(), any())).thenReturn(null);
                AppointmentResponse response = appointmentService.createAppointment(6L, req);
                assertThat(response).isNotNull();
                assertThat(response.getAppointmentDate()).isEqualTo(req.getAppointmentDate());
            } else {
                assertThatThrownBy(() -> appointmentService.createAppointment(6L, req))
                        .isInstanceOf(RuntimeException.class)
                        .hasMessageContaining(expectedOutcome);
            }
        }

        @Test
        @DisplayName("❌ Thời gian không hợp lệ 08:15 → throw RuntimeException")
        void shouldRejectInvalidTimeSlot() {
            User patientUser = buildUser(1L, "trongdang", "trongdang@test.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, patientUser, "Đặng Tấn Trọng");
            User doctorUser = buildUser(2L, "doctor", "doctor@test.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, doctorUser, "Huỳnh Phong Đạt", "Sản phụ khoa", Doctor.DoctorStatus.ACTIVE);

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", null);
            req.setAppointmentTime(LocalTime.of(8, 15));

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));

            assertThatThrownBy(() -> appointmentService.createAppointment(6L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Invalid appointment time");
        }

        @Test
        @DisplayName("✅ Thời gian hợp lệ 14:30 → Tạo appointment thành công")
        void shouldAcceptValidTimeSlot() {
            User patientUser = buildUser(1L, "trongdang", "trongdang@test.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, patientUser, "Đặng Tấn Trọng");
            User doctorUser = buildUser(2L, "doctor", "doctor@test.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, doctorUser, "Huỳnh Phong Đạt", "Sản phụ khoa", Doctor.DoctorStatus.ACTIVE);

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", null);
            req.setAppointmentTime(LocalTime.of(14, 30));

            Appointment savedApt = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
            savedApt.setAppointmentTime(LocalTime.of(14, 30));

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(appointmentRepository.findByDoctorAndDate(eq(1L), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());
            when(appointmentRepository.save(any(Appointment.class))).thenReturn(savedApt);
            when(notificationService.createNotification(any(), any(), any(), any(), any())).thenReturn(null);

            AppointmentResponse response = appointmentService.createAppointment(6L, req);

            assertThat(response).isNotNull();
            assertThat(response.getAppointmentTime()).isEqualTo(LocalTime.of(14, 30));
            assertThat(response.getAppointmentDate()).isEqualTo(req.getAppointmentDate());
        }

        @Test
        @DisplayName("✅ Thời gian hợp lệ 08:00 → Tạo appointment thành công")
        void shouldAcceptEightOClockSlot() {
            User patientUser = buildUser(1L, "trongdang", "trongdang@test.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, patientUser, "Đặng Tấn Trọng");
            User doctorUser = buildUser(2L, "doctor", "doctor@test.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, doctorUser, "Huỳnh Phong Đạt", "Sản phụ khoa", Doctor.DoctorStatus.ACTIVE);

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", null);
            req.setAppointmentTime(LocalTime.of(8, 0));

            Appointment savedApt = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
            savedApt.setAppointmentTime(LocalTime.of(8, 0));

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(appointmentRepository.findByDoctorAndDate(eq(1L), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());
            when(appointmentRepository.save(any(Appointment.class))).thenReturn(savedApt);
            when(notificationService.createNotification(any(), any(), any(), any(), any())).thenReturn(null);

            AppointmentResponse response = appointmentService.createAppointment(6L, req);

            assertThat(response).isNotNull();
            assertThat(response.getAppointmentTime()).isEqualTo(LocalTime.of(8, 0));
            assertThat(response.getAppointmentDate()).isEqualTo(req.getAppointmentDate());
        }

        @Test
        @DisplayName("✅ Thời gian hợp lệ 17:00 → Tạo appointment thành công")
        void shouldAcceptFivePmSlot() {
            User patientUser = buildUser(1L, "trongdang", "trongdang@test.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, patientUser, "Đặng Tấn Trọng");
            User doctorUser = buildUser(2L, "doctor", "doctor@test.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, doctorUser, "Huỳnh Phong Đạt", "Sản phụ khoa", Doctor.DoctorStatus.ACTIVE);

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", null);
            req.setAppointmentTime(LocalTime.of(17, 0));

            Appointment savedApt = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
            savedApt.setAppointmentTime(LocalTime.of(17, 0));

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(appointmentRepository.findByDoctorAndDate(eq(1L), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());
            when(appointmentRepository.save(any(Appointment.class))).thenReturn(savedApt);
            when(notificationService.createNotification(any(), any(), any(), any(), any())).thenReturn(null);

            AppointmentResponse response = appointmentService.createAppointment(6L, req);

            assertThat(response).isNotNull();
            assertThat(response.getAppointmentTime()).isEqualTo(LocalTime.of(17, 0));
            assertThat(response.getAppointmentDate()).isEqualTo(req.getAppointmentDate());
        }

        @Test
        @DisplayName("❌ Thời gian lunch break 12:00 → throw RuntimeException")
        void shouldRejectLunchBreakTimeSlot() {
            User patientUser = buildUser(1L, "trongdang", "trongdang@test.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, patientUser, "Đặng Tấn Trọng");
            User doctorUser = buildUser(2L, "doctor", "doctor@test.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, doctorUser, "Huỳnh Phong Đạt", "Sản phụ khoa", Doctor.DoctorStatus.ACTIVE);

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", null);
            req.setAppointmentTime(LocalTime.of(12, 0));

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));

            assertThatThrownBy(() -> appointmentService.createAppointment(6L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Invalid appointment time");
        }

        @Test
        @DisplayName("❌ Sau giờ làm 17:30 → throw RuntimeException")
        void shouldRejectAfterWorkingHours() {
            User patientUser = buildUser(1L, "trongdang", "trongdang@test.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, patientUser, "Đặng Tấn Trọng");
            User doctorUser = buildUser(2L, "doctor", "doctor@test.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, doctorUser, "Huỳnh Phong Đạt", "Sản phụ khoa", Doctor.DoctorStatus.ACTIVE);

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", null);
            req.setAppointmentTime(LocalTime.of(17, 30));

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));

            assertThatThrownBy(() -> appointmentService.createAppointment(6L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Invalid appointment time");
        }

        @Test
        @DisplayName("❌ Đặt hôm nay giờ đã qua → throw RuntimeException")
        void createAppointment_pastTimeToday_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            // Chọn slot chuẩn đã trôi qua trong hôm nay; nếu chạy quá sớm thì skip.
            Optional<LocalTime> pastSlot = lastPastSlotToday();
            Assumptions.assumeTrue(pastSlot.isPresent(),
                    "Chưa qua slot khám nào trong hôm nay (test chạy trước slot đầu tiên)");

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", null);
            req.setAppointmentDate(LocalDate.now());
            req.setAppointmentTime(pastSlot.get());

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(appointmentRepository.findByDoctorAndDate(any(), any()))
                    .thenReturn(Collections.emptyList());

            assertThatThrownBy(() -> appointmentService.createAppointment(6L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Cannot book appointment in the past");
        }

        @Test
        @DisplayName("✅ Đặt ngày mai thành công")
        void createAppointment_tomorrow_success() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", null);
            req.setAppointmentDate(LocalDate.now().plusDays(1));
            req.setAppointmentTime(LocalTime.of(9, 0));

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(appointmentRepository.findByDoctorAndDate(eq(1L), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());
            when(appointmentRepository.save(any())).thenAnswer(inv -> {
                Appointment saved = inv.getArgument(0);
                saved.setId(99L);
                return saved;
            });
            when(notificationService.createNotification(any(), any(), any(), any(), any())).thenReturn(null);

            AppointmentResponse result = appointmentService.createAppointment(6L, req);

            assertThat(result).isNotNull();
            assertThat(result.getAppointmentDate()).isEqualTo(LocalDate.now().plusDays(1));
            assertThat(result.getAppointmentTime()).isEqualTo(req.getAppointmentTime());
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
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PAID, AppConstants.WALLET);

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
                    Appointment.AppointmentStatus.CANCELLED, Appointment.PaymentStatus.REFUNDED, AppConstants.WALLET);

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

    // =========================================================
    // updateAppointmentByAdmin TESTS
    // =========================================================
    @Nested
    @DisplayName("updateAppointmentByAdmin()")
    class UpdateAppointmentByAdminTests {

        @Test
        @DisplayName("❌ Admin update ngày trong quá khứ → throw RuntimeException")
        void updateAppointmentByAdmin_pastDate_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
            apt.setAppointmentDate(LocalDate.now().plusDays(1));
            apt.setAppointmentTime(LocalTime.of(10, 0));

            UpdateAppointmentRequest req = new UpdateAppointmentRequest();
            req.setAppointmentDate(LocalDate.now().minusDays(1)); // Ngày quá khứ

            when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));

            assertThatThrownBy(() -> appointmentService.updateAppointmentByAdmin(88L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Cannot update appointment to a past date");
        }

        @Test
        @DisplayName("❌ Admin update hôm nay giờ đã qua → throw RuntimeException")
        void updateAppointmentByAdmin_pastTimeToday_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
            apt.setAppointmentDate(LocalDate.now().plusDays(1));
            apt.setAppointmentTime(LocalTime.of(10, 0));

            // Chọn slot chuẩn đã trôi qua trong hôm nay; tránh now.minusMinutes() wrap qua nửa đêm.
            Optional<LocalTime> pastSlot = lastPastSlotToday();
            Assumptions.assumeTrue(pastSlot.isPresent(),
                    "Chưa qua slot khám nào trong hôm nay (test chạy trước slot đầu tiên)");

            UpdateAppointmentRequest req = new UpdateAppointmentRequest();
            req.setAppointmentDate(LocalDate.now());
            req.setAppointmentTime(pastSlot.get());

            when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));

            assertThatThrownBy(() -> appointmentService.updateAppointmentByAdmin(88L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Cannot update appointment to a time slot that has already passed today");
        }

        @Test
        @DisplayName("✅ Admin update hôm nay giờ trong tương lai → thành công")
        void updateAppointmentByAdmin_futureTimeToday_success() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
            apt.setAppointmentDate(LocalDate.now().plusDays(1));
            apt.setAppointmentTime(LocalTime.of(10, 0));

            // Chọn slot chuẩn còn ở tương lai trong hôm nay; tránh LocalTime.now().plusHours()
            // bị "wrap" qua nửa đêm khi chạy buổi tối. Nếu quá muộn thì skip.
            Optional<LocalTime> futureSlot = firstFutureSlotToday();
            Assumptions.assumeTrue(futureSlot.isPresent(),
                    "Không còn slot khám tương lai trong hôm nay (test chạy sau slot cuối)");

            UpdateAppointmentRequest req = new UpdateAppointmentRequest();
            req.setAppointmentDate(LocalDate.now());
            req.setAppointmentTime(futureSlot.get());

            when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
            when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            AppointmentResponse result = appointmentService.updateAppointmentByAdmin(88L, req);

            assertThat(result).isNotNull();
            assertThat(result.getAppointmentDate()).isEqualTo(LocalDate.now());
        }
        @Test
        @DisplayName("✅ Admin update status PENDING → CONFIRMED → gửi email")
        void updateAppointmentByAdmin_statusToConfirmed_sendsEmail() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr. A", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
            apt.setAppointmentDate(LocalDate.now().plusDays(3));
            apt.setAppointmentTime(LocalTime.of(9, 0));

            UpdateAppointmentRequest req = new UpdateAppointmentRequest();
            req.setStatus(Appointment.AppointmentStatus.CONFIRMED);

            when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
            when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(familyAppointmentRepository.findByAppointmentId(any())).thenReturn(Optional.empty());

            AppointmentResponse result = appointmentService.updateAppointmentByAdmin(88L, req);

            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(Appointment.AppointmentStatus.CONFIRMED.name());
        }

        @Test
        @DisplayName("✅ Admin update chỉ ghi chú (notes) → thành công")
        void updateAppointmentByAdmin_updateNotesOnly_success() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(88L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
            apt.setAppointmentDate(LocalDate.now().plusDays(2));
            apt.setAppointmentTime(LocalTime.of(9, 0));

            UpdateAppointmentRequest req = new UpdateAppointmentRequest();
            req.setNotes("Ghi chú mới");

            when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
            when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            AppointmentResponse result = appointmentService.updateAppointmentByAdmin(88L, req);

            assertThat(result).isNotNull();
            assertThat(result.getNotes()).isEqualTo("Ghi chú mới");
        }

        @Test
        @DisplayName("❌ Appointment không tồn tại → throw ResourceNotFoundException")
        void updateAppointmentByAdmin_notFound_throwsException() {
            when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

            UpdateAppointmentRequest req = new UpdateAppointmentRequest();

            assertThatThrownBy(() -> appointmentService.updateAppointmentByAdmin(999L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Appointment not found");
        }
    }

    // =========================================================
    // getAllAppointments TESTS
    // =========================================================
    @Nested
    @DisplayName("getAllAppointments()")
    class GetAllAppointmentsTests {

        @Test
        @DisplayName("✅ Trả về danh sách rỗng khi không có appointment")
        void getAllAppointments_empty_returnsEmptyList() {
            when(appointmentRepository.findAll()).thenReturn(Collections.emptyList());

            List<AppointmentResponse> result = appointmentService.getAllAppointments();

            assertThat(result).isEmpty();
            verify(appointmentRepository, times(1)).findAll();
        }

        @Test
        @DisplayName("✅ Trả về danh sách appointments khi có dữ liệu")
        void getAllAppointments_withData_returnsList() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(1L, pUser, "Pat A");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr. A", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt1 = buildAppointment(1L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
            Appointment apt2 = buildAppointment(2L, patient, doctor,
                    Appointment.AppointmentStatus.CONFIRMED, Appointment.PaymentStatus.PAID, AppConstants.WALLET);

            when(appointmentRepository.findAll()).thenReturn(List.of(apt1, apt2));

            List<AppointmentResponse> result = appointmentService.getAllAppointments();

            assertThat(result).hasSize(2);
        }
    }

    // =========================================================
    // getAppointmentById TESTS
    // =========================================================
    @Nested
    @DisplayName("getAppointmentById()")
    class GetAppointmentByIdTests {

        @Test
        @DisplayName("✅ Tìm thấy appointment → trả về response")
        void getAppointmentById_found_returnsResponse() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(1L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr. A", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(10L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");

            when(appointmentRepository.findByIdWithRelations(10L)).thenReturn(Optional.of(apt));

            AppointmentResponse result = appointmentService.getAppointmentById(10L);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(10L);
        }

        @Test
        @DisplayName("❌ Không tìm thấy appointment → throw ResourceNotFoundException")
        void getAppointmentById_notFound_throwsException() {
            when(appointmentRepository.findByIdWithRelations(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> appointmentService.getAppointmentById(999L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Appointment not found");
        }
    }

    // =========================================================
    // getPatientAppointments TESTS
    // =========================================================
    @Nested
    @DisplayName("getPatientAppointments()")
    class GetPatientAppointmentsTests {

        @Test
        @DisplayName("✅ Bệnh nhân chưa có lịch hẹn → danh sách rỗng")
        void getPatientAppointments_noAppointments_returnsEmpty() {
            when(appointmentRepository.findByPatientIdOrderByDateDesc(5L))
                    .thenReturn(Collections.emptyList());

            List<AppointmentResponse> result = appointmentService.getPatientAppointments(5L);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("✅ getHasFeedback() = true khi đã có feedback")
        void getPatientAppointments_hasFeedback_true() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(5L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr. A", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(20L, patient, doctor,
                    Appointment.AppointmentStatus.COMPLETED, Appointment.PaymentStatus.PAID, "CASH");

            when(appointmentRepository.findByPatientIdOrderByDateDesc(5L))
                    .thenReturn(List.of(apt));
            when(feedbackRepository.findByAppointmentId(20L))
                    .thenReturn(Optional.of(new Feedback()));

            List<AppointmentResponse> result = appointmentService.getPatientAppointments(5L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getHasFeedback()).isTrue();
        }

        @Test
        @DisplayName("✅ getHasFeedback() = false khi chưa có feedback")
        void getPatientAppointments_hasFeedback_false() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(5L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr. A", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(21L, patient, doctor,
                    Appointment.AppointmentStatus.COMPLETED, Appointment.PaymentStatus.PAID, "CASH");

            when(appointmentRepository.findByPatientIdOrderByDateDesc(5L))
                    .thenReturn(List.of(apt));
            when(feedbackRepository.findByAppointmentId(21L))
                    .thenReturn(Optional.empty());

            List<AppointmentResponse> result = appointmentService.getPatientAppointments(5L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getHasFeedback()).isFalse();
        }
    }

    // =========================================================
    // completeAppointment TESTS
    // =========================================================
    @Nested
    @DisplayName("completeAppointment()")
    class CompleteAppointmentTests {

        @Test
        @DisplayName("✅ Hoàn thành appointment CONFIRMED → COMPLETED")
        void completeAppointment_confirmed_success() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(1L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(30L, patient, doctor,
                    Appointment.AppointmentStatus.CONFIRMED, Appointment.PaymentStatus.PAID, "CASH");

            when(appointmentRepository.findById(30L)).thenReturn(Optional.of(apt));
            when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            appointmentService.completeAppointment(30L);

            assertThat(apt.getStatus()).isEqualTo(Appointment.AppointmentStatus.COMPLETED);
            verify(appointmentRepository, times(1)).save(apt);
        }

        @Test
        @DisplayName("❌ Appointment PENDING không thể complete → throw BadRequestException")
        void completeAppointment_pendingStatus_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(1L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(31L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");

            when(appointmentRepository.findById(31L)).thenReturn(Optional.of(apt));

            assertThatThrownBy(() -> appointmentService.completeAppointment(31L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Only CONFIRMED appointments can be completed");
        }

        @Test
        @DisplayName("❌ Appointment CANCELLED không thể complete → throw BadRequestException")
        void completeAppointment_cancelledStatus_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(1L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(32L, patient, doctor,
                    Appointment.AppointmentStatus.CANCELLED, Appointment.PaymentStatus.REFUNDED, AppConstants.WALLET);

            when(appointmentRepository.findById(32L)).thenReturn(Optional.of(apt));

            assertThatThrownBy(() -> appointmentService.completeAppointment(32L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Only CONFIRMED appointments can be completed");
        }

        @Test
        @DisplayName("❌ Appointment không tồn tại → throw ResourceNotFoundException")
        void completeAppointment_notFound_throwsException() {
            when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> appointmentService.completeAppointment(999L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Appointment not found");
        }
    }

    // =========================================================
    // cancelAppointmentByDoctor TESTS
    // =========================================================
    @Nested
    @DisplayName("cancelAppointmentByDoctor()")
    class CancelAppointmentByDoctorTests {

        @Test
        @DisplayName("✅ Bác sĩ hủy appointment PENDING hơn 24h → thành công")
        void cancelByDoctor_pending_moreThan24h_success() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(5L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr. B", "Tim", Doctor.DoctorStatus.ACTIVE);

            // Lịch hẹn sau 3 ngày → hơn 24h
            Appointment apt = buildAppointment(40L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
            apt.setAppointmentDate(LocalDate.now().plusDays(3));
            apt.setAppointmentTime(LocalTime.of(9, 0));

            when(appointmentRepository.findById(40L)).thenReturn(Optional.of(apt));
            when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            appointmentService.cancelAppointmentByDoctor(40L, 1L, "Lý do cá nhân");

            assertThat(apt.getStatus()).isEqualTo(Appointment.AppointmentStatus.CANCELLED);
            assertThat(apt.getCancellationReason()).isEqualTo("Lý do cá nhân");
        }

        @Test
        @DisplayName("✅ Bác sĩ hủy appointment CONFIRMED hơn 24h với WALLET → hoàn tiền")
        void cancelByDoctor_confirmed_walletPaid_refundsWallet() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(5L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr. B", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(41L, patient, doctor,
                    Appointment.AppointmentStatus.CONFIRMED, Appointment.PaymentStatus.PAID, AppConstants.WALLET);
            apt.setAppointmentDate(LocalDate.now().plusDays(3));
            apt.setAppointmentTime(LocalTime.of(9, 0));

            when(appointmentRepository.findById(41L)).thenReturn(Optional.of(apt));
            when(walletService.refundAppointment(any(), any(), any(), any())).thenReturn(new WalletTransaction());
            when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            appointmentService.cancelAppointmentByDoctor(41L, 1L, "Bận đột xuất");

            assertThat(apt.getStatus()).isEqualTo(Appointment.AppointmentStatus.CANCELLED);
            assertThat(apt.getPaymentStatus()).isEqualTo(Appointment.PaymentStatus.REFUNDED);
            verify(walletService, times(1)).refundAppointment(eq(5L), eq(41L), any(), any());
        }

        @Test
        @DisplayName("❌ Bác sĩ hủy lịch không phải của mình → throw BadRequestException")
        void cancelByDoctor_wrongDoctor_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(5L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(42L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");

            when(appointmentRepository.findById(42L)).thenReturn(Optional.of(apt));

            // doctorId = 999 ≠ doctor.id = 1
            assertThatThrownBy(() -> appointmentService.cancelAppointmentByDoctor(42L, 999L, "reason"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Appointment does not belong to this doctor");
        }

        @Test
        @DisplayName("❌ Bác sĩ hủy appointment đã COMPLETED → throw BadRequestException")
        void cancelByDoctor_completed_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(5L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(43L, patient, doctor,
                    Appointment.AppointmentStatus.COMPLETED, Appointment.PaymentStatus.PAID, "CASH");

            when(appointmentRepository.findById(43L)).thenReturn(Optional.of(apt));

            assertThatThrownBy(() -> appointmentService.cancelAppointmentByDoctor(43L, 1L, "reason"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Cannot cancel a completed appointment");
        }

        @Test
        @DisplayName("❌ Bác sĩ hủy appointment đã CANCELLED → throw BadRequestException")
        void cancelByDoctor_alreadyCancelled_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(5L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(44L, patient, doctor,
                    Appointment.AppointmentStatus.CANCELLED, Appointment.PaymentStatus.REFUNDED, AppConstants.WALLET);

            when(appointmentRepository.findById(44L)).thenReturn(Optional.of(apt));

            assertThatThrownBy(() -> appointmentService.cancelAppointmentByDoctor(44L, 1L, "reason"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Appointment is already cancelled");
        }

        @Test
        @DisplayName("❌ Hủy appointment trong vòng 24h → throw BadRequestException")
        void cancelByDoctor_within24h_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(5L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            // Lịch hẹn trong vòng 1 giờ tới → nhỏ hơn 24h
            Appointment apt = buildAppointment(45L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
            apt.setAppointmentDate(LocalDate.now());
            // Đặt giờ trong tương lai gần (nếu giờ hiện tại < 23:00)
            LocalTime nearFuture = LocalTime.now().plusMinutes(30);
            if (nearFuture.isAfter(LocalTime.of(23, 59))) {
                nearFuture = LocalTime.of(23, 59);
            }
            apt.setAppointmentTime(nearFuture);

            when(appointmentRepository.findById(45L)).thenReturn(Optional.of(apt));

            assertThatThrownBy(() -> appointmentService.cancelAppointmentByDoctor(45L, 1L, "reason"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Cannot cancel appointment less than 24 hours before scheduled time");
        }
    }

    // =========================================================
    // cancelAppointmentByAdmin TESTS
    // =========================================================
    @Nested
    @DisplayName("cancelAppointmentByAdmin()")
    class CancelAppointmentByAdminTests {

        @Test
        @DisplayName("✅ Admin hủy appointment PENDING thành công")
        void cancelByAdmin_pending_success() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(5L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(50L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");

            when(appointmentRepository.findById(50L)).thenReturn(Optional.of(apt));
            when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            appointmentService.cancelAppointmentByAdmin(50L, "Hệ thống bảo trì");

            assertThat(apt.getStatus()).isEqualTo(Appointment.AppointmentStatus.CANCELLED);
            assertThat(apt.getCancellationReason()).isEqualTo("Hệ thống bảo trì");
        }

        @Test
        @DisplayName("✅ Admin hủy appointment WALLET đã thanh toán → hoàn tiền")
        void cancelByAdmin_walletPaid_refund() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(5L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr. X", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(51L, patient, doctor,
                    Appointment.AppointmentStatus.CONFIRMED, Appointment.PaymentStatus.PAID, AppConstants.WALLET);

            when(appointmentRepository.findById(51L)).thenReturn(Optional.of(apt));
            when(walletService.refundAppointment(any(), any(), any(), any())).thenReturn(new WalletTransaction());
            when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            appointmentService.cancelAppointmentByAdmin(51L, "Bác sĩ nghỉ đột xuất");

            assertThat(apt.getStatus()).isEqualTo(Appointment.AppointmentStatus.CANCELLED);
            assertThat(apt.getPaymentStatus()).isEqualTo(Appointment.PaymentStatus.REFUNDED);
            verify(walletService, times(1)).refundAppointment(eq(5L), eq(51L), any(), any());
        }

        @Test
        @DisplayName("❌ Admin hủy appointment đã COMPLETED → throw BadRequestException")
        void cancelByAdmin_completed_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(5L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(52L, patient, doctor,
                    Appointment.AppointmentStatus.COMPLETED, Appointment.PaymentStatus.PAID, "CASH");

            when(appointmentRepository.findById(52L)).thenReturn(Optional.of(apt));

            assertThatThrownBy(() -> appointmentService.cancelAppointmentByAdmin(52L, "reason"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Cannot cancel a completed appointment");
        }

        @Test
        @DisplayName("❌ Admin hủy appointment đã CANCELLED → throw BadRequestException")
        void cancelByAdmin_alreadyCancelled_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(5L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(53L, patient, doctor,
                    Appointment.AppointmentStatus.CANCELLED, Appointment.PaymentStatus.REFUNDED, AppConstants.WALLET);

            when(appointmentRepository.findById(53L)).thenReturn(Optional.of(apt));

            assertThatThrownBy(() -> appointmentService.cancelAppointmentByAdmin(53L, "reason"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Appointment is already cancelled");
        }

        @Test
        @DisplayName("❌ Appointment không tồn tại → throw ResourceNotFoundException")
        void cancelByAdmin_notFound_throwsException() {
            when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> appointmentService.cancelAppointmentByAdmin(999L, "reason"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Appointment not found");
        }
    }

    // =========================================================
    // updatePaymentStatus TESTS
    // =========================================================
    @Nested
    @DisplayName("updatePaymentStatus()")
    class UpdatePaymentStatusTests {

        @Test
        @DisplayName("✅ Cập nhật payment status thành công")
        void updatePaymentStatus_success() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(1L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(60L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");

            when(appointmentRepository.findById(60L)).thenReturn(Optional.of(apt));
            when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            appointmentService.updatePaymentStatus(60L, Appointment.PaymentStatus.PAID);

            assertThat(apt.getPaymentStatus()).isEqualTo(Appointment.PaymentStatus.PAID);
            verify(appointmentRepository, times(1)).save(apt);
        }

        @Test
        @DisplayName("❌ Appointment không tồn tại → throw ResourceNotFoundException")
        void updatePaymentStatus_notFound_throwsException() {
            when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> appointmentService.updatePaymentStatus(999L, Appointment.PaymentStatus.PAID))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Appointment not found");
        }
    }

    // =========================================================
    // cancelAppointmentDueToPaymentFailure TESTS
    // =========================================================
    @Nested
    @DisplayName("cancelAppointmentDueToPaymentFailure()")
    class CancelDueToPaymentFailureTests {

        @Test
        @DisplayName("✅ Hủy appointment khi thanh toán thất bại → status CANCELLED, payment UNPAID")
        void cancelDueToPaymentFailure_success() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(1L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(70L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, AppConstants.WALLET);

            when(appointmentRepository.findById(70L)).thenReturn(Optional.of(apt));
            when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            appointmentService.cancelAppointmentDueToPaymentFailure(70L);

            assertThat(apt.getStatus()).isEqualTo(Appointment.AppointmentStatus.CANCELLED);
            assertThat(apt.getPaymentStatus()).isEqualTo(Appointment.PaymentStatus.UNPAID);
            verify(appointmentRepository, times(1)).save(apt);
        }

        @Test
        @DisplayName("❌ Appointment không tồn tại → throw ResourceNotFoundException")
        void cancelDueToPaymentFailure_notFound_throwsException() {
            when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> appointmentService.cancelAppointmentDueToPaymentFailure(999L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Appointment not found");
        }
    }

    // =========================================================
    // deleteAppointment TESTS
    // =========================================================
    @Nested
    @DisplayName("deleteAppointment()")
    class DeleteAppointmentTests {

        @Test
        @DisplayName("✅ Xóa appointment thành công")
        void deleteAppointment_success() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(1L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment apt = buildAppointment(80L, patient, doctor,
                    Appointment.AppointmentStatus.CANCELLED, Appointment.PaymentStatus.REFUNDED, AppConstants.WALLET);

            when(appointmentRepository.findById(80L)).thenReturn(Optional.of(apt));

            appointmentService.deleteAppointment(80L);

            verify(appointmentRepository, times(1)).delete(apt);
        }

        @Test
        @DisplayName("❌ Appointment không tồn tại → throw ResourceNotFoundException")
        void deleteAppointment_notFound_throwsException() {
            when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> appointmentService.deleteAppointment(999L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Appointment not found");
        }
    }

    // =========================================================
    // createAppointment với FamilyMember TESTS
    // =========================================================
    @Nested
    @DisplayName("createAppointment() - Family Member")
    class CreateAppointmentFamilyMemberTests {

        @Test
        @DisplayName("✅ Đặt lịch cho người nhà (familyMemberId hợp lệ) → thành công")
        void createAppointment_withFamilyMember_success() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat A");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr. A", "Tim", Doctor.DoctorStatus.ACTIVE);

            FamilyMember familyMember = new FamilyMember();
            familyMember.setId(10L);
            familyMember.setFullName("Nguyễn Văn B");
            familyMember.setRelationship(FamilyMember.Relationship.CHILD);

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", 10L);
            Appointment savedApt = buildAppointment(90L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(appointmentRepository.findByDoctorAndDate(eq(1L), any())).thenReturn(Collections.emptyList());
            when(appointmentRepository.save(any())).thenReturn(savedApt);
            when(familyMemberRepository.findByIdAndMainPatientId(10L, 6L)).thenReturn(familyMember);
            when(familyAppointmentRepository.save(any())).thenReturn(new FamilyAppointment());
            when(notificationService.createNotification(any(), any(), any(), any(), any())).thenReturn(null);

            AppointmentResponse response = appointmentService.createAppointment(6L, req);

            assertThat(response).isNotNull();
            verify(familyAppointmentRepository, times(1)).save(any(FamilyAppointment.class));
        }

        @Test
        @DisplayName("❌ FamilyMember không thuộc bệnh nhân → throw BadRequestException")
        void createAppointment_familyMemberNotBelongsToPatient_throwsException() {
            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(6L, pUser, "Pat A");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr. A", "Tim", Doctor.DoctorStatus.ACTIVE);

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", 99L);
            Appointment savedApt = buildAppointment(91L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(appointmentRepository.findByDoctorAndDate(eq(1L), any())).thenReturn(Collections.emptyList());
            when(appointmentRepository.save(any())).thenReturn(savedApt);
            // familyMember không tồn tại → trả về null
            when(familyMemberRepository.findByIdAndMainPatientId(99L, 6L)).thenReturn(null);

            assertThatThrownBy(() -> appointmentService.createAppointment(6L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Family member not found");
        }

        @Test
        @DisplayName("❌ Patient không tồn tại → throw ResourceNotFoundException")
        void createAppointment_patientNotFound_throwsException() {
            when(patientRepository.findById(999L)).thenReturn(Optional.empty());

            CreateAppointmentRequest req = buildCreateRequest(1L, "CASH", null);

            assertThatThrownBy(() -> appointmentService.createAppointment(999L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Patient not found");
        }
    }

    // =========================================================
    // getAvailableTimeSlots - Filter hôm nay TESTS
    // =========================================================
    @Nested
    @DisplayName("getAvailableTimeSlots() - Today Filtering")
    class GetAvailableTimeSlotsForTodayTests {

        @Test
        @DisplayName("✅ Hôm nay: chỉ trả về các slot trong tương lai")
        void getAvailableSlots_today_onlyFutureSlots() {
            LocalDate today = LocalDate.now();
            when(appointmentRepository.findByDoctorAndDate(1L, today))
                    .thenReturn(Collections.emptyList());

            List<String> slots = appointmentService.getAvailableTimeSlots(1L, today);

            // Tất cả slot trả về phải ở sau thời điểm hiện tại
            LocalTime now = LocalTime.now();
            slots.forEach(slot ->
                assertThat(LocalTime.parse(slot)).isAfter(now)
            );
        }

        @Test
        @DisplayName("✅ Ngày mai: trả về đủ 17 slots (không lọc theo giờ hiện tại)")
        void getAvailableSlots_tomorrow_returns17Slots() {
            LocalDate tomorrow = LocalDate.now().plusDays(1);
            when(appointmentRepository.findByDoctorAndDate(1L, tomorrow))
                    .thenReturn(Collections.emptyList());

            List<String> slots = appointmentService.getAvailableTimeSlots(1L, tomorrow);

            assertThat(slots).hasSize(17);
        }

        @Test
        @DisplayName("✅ Hôm nay với slot PENDING đã book: loại bỏ slot đó và các slot quá khứ")
        void getAvailableSlots_today_bookedAndPastSlotsRemoved() {
            LocalDate today = LocalDate.now();

            // Tìm slot trong tương lai để đặt PENDING
            Optional<LocalTime> futureSlot = firstFutureSlotToday();
            Assumptions.assumeTrue(futureSlot.isPresent(), "Không có slot tương lai hôm nay");

            User pUser = buildUser(1L, "p", "p@t.com", User.Role.PATIENT);
            Patient patient = buildPatient(1L, pUser, "Pat");
            User dUser = buildUser(2L, "d", "d@t.com", User.Role.DOCTOR);
            Doctor doctor = buildDoctor(1L, dUser, "Dr.", "Tim", Doctor.DoctorStatus.ACTIVE);

            Appointment pending = buildAppointment(1L, patient, doctor,
                    Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
            pending.setAppointmentTime(futureSlot.get());

            when(appointmentRepository.findByDoctorAndDate(1L, today)).thenReturn(List.of(pending));

            List<String> slots = appointmentService.getAvailableTimeSlots(1L, today);

            assertThat(slots).doesNotContain(futureSlot.get().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")));
        }
    }
}

