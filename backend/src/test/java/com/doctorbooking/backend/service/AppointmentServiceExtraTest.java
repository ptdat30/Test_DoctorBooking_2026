package com.doctorbooking.backend.service;

import com.doctorbooking.backend.constant.AppConstants;
import com.doctorbooking.backend.dto.request.CreateAppointmentRequest;
import com.doctorbooking.backend.dto.request.UpdateAppointmentRequest;
import com.doctorbooking.backend.dto.response.AppointmentResponse;
import com.doctorbooking.backend.model.*;
import com.doctorbooking.backend.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AppointmentService Extra Unit Tests (branch coverage)")
class AppointmentServiceExtraTest {

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
    private AppointmentService service;

    private Patient patient;
    private Doctor doctor;

    @BeforeEach
    void setUp() {
        User pUser = new User();
        pUser.setId(1L);
        pUser.setEmail("patient@test.com");
        patient = new Patient();
        patient.setId(6L);
        patient.setUser(pUser);
        patient.setFullName("Bệnh nhân A");
        patient.setPhone("0901234567");

        User dUser = new User();
        dUser.setId(2L);
        dUser.setEmail("doctor@test.com");
        doctor = new Doctor();
        doctor.setId(1L);
        doctor.setUser(dUser);
        doctor.setFullName("BS Tim");
        doctor.setSpecialization("Cardiology");
        doctor.setStatus(Doctor.DoctorStatus.ACTIVE);
        doctor.setConsultationFee(BigDecimal.valueOf(150000));
        doctor.setPhone("0901111111");
        doctor.setAddress("123 Y Khoa");
    }

    private Appointment appointment(Appointment.AppointmentStatus status,
                                    Appointment.PaymentStatus payStatus, String method) {
        Appointment a = new Appointment();
        a.setId(88L);
        a.setPatient(patient);
        a.setDoctor(doctor);
        a.setAppointmentDate(LocalDate.now().plusDays(7));
        a.setAppointmentTime(LocalTime.of(9, 0));
        a.setStatus(status);
        a.setPaymentStatus(payStatus);
        a.setPaymentMethod(method);
        a.setPrice(BigDecimal.valueOf(150000));
        return a;
    }

    // ── getAppointmentById ──
    @Test
    void getAppointmentById_found() {
        Appointment apt = appointment(Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
        when(appointmentRepository.findByIdWithRelations(88L)).thenReturn(Optional.of(apt));
        assertThat(service.getAppointmentById(88L)).isNotNull();
    }

    @Test
    void getAppointmentById_notFound() {
        when(appointmentRepository.findByIdWithRelations(88L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getAppointmentById(88L)).hasMessageContaining("Appointment not found");
    }

    // ── getPatientAppointments ──
    @Test
    void getPatientAppointments_withAndWithoutFeedback() {
        Appointment apt = appointment(Appointment.AppointmentStatus.COMPLETED, Appointment.PaymentStatus.PAID, "CASH");
        when(appointmentRepository.findByPatientIdOrderByDateDesc(6L)).thenReturn(List.of(apt));
        when(feedbackRepository.findByAppointmentId(88L)).thenReturn(Optional.of(new Feedback()));
        List<AppointmentResponse> result = service.getPatientAppointments(6L);
        assertThat(result).hasSize(1);
    }

    // ── updatePaymentStatus ──
    @Test
    void updatePaymentStatus_success() {
        Appointment apt = appointment(Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "VNPAY");
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        service.updatePaymentStatus(88L, Appointment.PaymentStatus.PAID);
        assertThat(apt.getPaymentStatus()).isEqualTo(Appointment.PaymentStatus.PAID);
        verify(appointmentRepository).save(apt);
    }

    @Test
    void updatePaymentStatus_notFound() {
        when(appointmentRepository.findById(88L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updatePaymentStatus(88L, Appointment.PaymentStatus.PAID))
                .hasMessageContaining("Appointment not found");
    }

    // ── cancelAppointmentDueToPaymentFailure ──
    @Test
    void cancelDueToPaymentFailure_success() {
        Appointment apt = appointment(Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "VNPAY");
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        service.cancelAppointmentDueToPaymentFailure(88L);
        assertThat(apt.getStatus()).isEqualTo(Appointment.AppointmentStatus.CANCELLED);
        assertThat(apt.getPaymentStatus()).isEqualTo(Appointment.PaymentStatus.UNPAID);
    }

    @Test
    void cancelDueToPaymentFailure_notFound() {
        when(appointmentRepository.findById(88L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.cancelAppointmentDueToPaymentFailure(88L))
                .hasMessageContaining("Appointment not found");
    }

    // ── completeAppointment ──
    @Test
    void completeAppointment_success() {
        Appointment apt = appointment(Appointment.AppointmentStatus.CONFIRMED, Appointment.PaymentStatus.PAID, "CASH");
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        service.completeAppointment(88L);
        assertThat(apt.getStatus()).isEqualTo(Appointment.AppointmentStatus.COMPLETED);
    }

    @Test
    void completeAppointment_notConfirmed_throws() {
        Appointment apt = appointment(Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        assertThatThrownBy(() -> service.completeAppointment(88L))
                .hasMessageContaining("Only CONFIRMED appointments can be completed");
    }

    @Test
    void completeAppointment_notFound() {
        when(appointmentRepository.findById(88L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.completeAppointment(88L)).hasMessageContaining("Appointment not found");
    }

    // ── deleteAppointment ──
    @Test
    void deleteAppointment_success() {
        Appointment apt = appointment(Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        service.deleteAppointment(88L);
        verify(appointmentRepository).delete(apt);
    }

    @Test
    void deleteAppointment_notFound() {
        when(appointmentRepository.findById(88L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deleteAppointment(88L)).hasMessageContaining("Appointment not found");
    }

    // ── cancelAppointmentByDoctor ──
    @Test
    void cancelByDoctor_success_noRefund() {
        Appointment apt = appointment(Appointment.AppointmentStatus.CONFIRMED, Appointment.PaymentStatus.PENDING, "CASH");
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        service.cancelAppointmentByDoctor(88L, 1L, "Bận đột xuất");
        assertThat(apt.getStatus()).isEqualTo(Appointment.AppointmentStatus.CANCELLED);
        assertThat(apt.getCancellationReason()).isEqualTo("Bận đột xuất");
        verify(walletService, never()).refundAppointment(any(), any(), any(), any());
    }

    @Test
    void cancelByDoctor_walletRefund() {
        Appointment apt = appointment(Appointment.AppointmentStatus.CONFIRMED, Appointment.PaymentStatus.PAID, AppConstants.WALLET);
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        when(walletService.refundAppointment(any(), any(), any(), any())).thenReturn(new WalletTransaction());
        service.cancelAppointmentByDoctor(88L, 1L, "Lý do");
        assertThat(apt.getPaymentStatus()).isEqualTo(Appointment.PaymentStatus.REFUNDED);
        verify(walletService).refundAppointment(eq(6L), eq(88L), any(), anyString());
    }

    @Test
    void cancelByDoctor_wrongDoctor() {
        Appointment apt = appointment(Appointment.AppointmentStatus.CONFIRMED, Appointment.PaymentStatus.PENDING, "CASH");
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        assertThatThrownBy(() -> service.cancelAppointmentByDoctor(88L, 99L, "x"))
                .hasMessageContaining("does not belong to this doctor");
    }

    @Test
    void cancelByDoctor_completed() {
        Appointment apt = appointment(Appointment.AppointmentStatus.COMPLETED, Appointment.PaymentStatus.PAID, "CASH");
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        assertThatThrownBy(() -> service.cancelAppointmentByDoctor(88L, 1L, "x"))
                .hasMessageContaining("Cannot cancel a completed appointment");
    }

    @Test
    void cancelByDoctor_alreadyCancelled() {
        Appointment apt = appointment(Appointment.AppointmentStatus.CANCELLED, Appointment.PaymentStatus.PENDING, "CASH");
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        assertThatThrownBy(() -> service.cancelAppointmentByDoctor(88L, 1L, "x"))
                .hasMessageContaining("already cancelled");
    }

    @Test
    void cancelByDoctor_within24h_throws() {
        Appointment apt = appointment(Appointment.AppointmentStatus.CONFIRMED, Appointment.PaymentStatus.PENDING, "CASH");
        apt.setAppointmentDate(LocalDate.now());
        apt.setAppointmentTime(LocalTime.of(23, 0));
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        assertThatThrownBy(() -> service.cancelAppointmentByDoctor(88L, 1L, "x"))
                .hasMessageContaining("less than 24 hours");
    }

    // ── cancelAppointmentByAdmin ──
    @Test
    void cancelByAdmin_success() {
        Appointment apt = appointment(Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        service.cancelAppointmentByAdmin(88L, "Lý do admin");
        assertThat(apt.getStatus()).isEqualTo(Appointment.AppointmentStatus.CANCELLED);
    }

    @Test
    void cancelByAdmin_walletRefund() {
        Appointment apt = appointment(Appointment.AppointmentStatus.CONFIRMED, Appointment.PaymentStatus.PAID, AppConstants.WALLET);
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        when(walletService.refundAppointment(any(), any(), any(), any())).thenReturn(new WalletTransaction());
        service.cancelAppointmentByAdmin(88L, "x");
        assertThat(apt.getPaymentStatus()).isEqualTo(Appointment.PaymentStatus.REFUNDED);
    }

    @Test
    void cancelByAdmin_completed() {
        Appointment apt = appointment(Appointment.AppointmentStatus.COMPLETED, Appointment.PaymentStatus.PAID, "CASH");
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        assertThatThrownBy(() -> service.cancelAppointmentByAdmin(88L, "x"))
                .hasMessageContaining("Cannot cancel a completed appointment");
    }

    @Test
    void cancelByAdmin_alreadyCancelled() {
        Appointment apt = appointment(Appointment.AppointmentStatus.CANCELLED, Appointment.PaymentStatus.PENDING, "CASH");
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        assertThatThrownBy(() -> service.cancelAppointmentByAdmin(88L, "x"))
                .hasMessageContaining("already cancelled");
    }

    @Test
    void cancelByAdmin_notFound() {
        when(appointmentRepository.findById(88L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.cancelAppointmentByAdmin(88L, "x"))
                .hasMessageContaining("Appointment not found");
    }

    // ── createAppointment WALLET payment paths ──
    @Test
    void createAppointment_walletPaid_success() {
        CreateAppointmentRequest req = baseRequest(AppConstants.WALLET);
        stubCreate();
        when(walletService.payForAppointment(eq(6L), any(), any(), anyString())).thenReturn(new WalletTransaction());

        AppointmentResponse result = service.createAppointment(6L, req);
        assertThat(result).isNotNull();
        verify(walletService).payForAppointment(eq(6L), any(), any(), anyString());
    }

    @Test
    void createAppointment_walletPaymentFails() {
        CreateAppointmentRequest req = baseRequest(AppConstants.WALLET);
        when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.findByDoctorAndDate(any(), any())).thenReturn(List.of());
        when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(walletService.payForAppointment(eq(6L), any(), any(), anyString()))
                .thenThrow(new RuntimeException("Insufficient balance"));

        assertThatThrownBy(() -> service.createAppointment(6L, req))
                .hasMessageContaining("Payment failed");
    }

    @Test
    void createAppointment_walletFreeConsultation_paid() {
        doctor.setConsultationFee(BigDecimal.ZERO);
        CreateAppointmentRequest req = baseRequest(AppConstants.WALLET);
        stubCreate();

        AppointmentResponse result = service.createAppointment(6L, req);
        assertThat(result).isNotNull();
        verify(walletService, never()).payForAppointment(any(), any(), any(), anyString());
    }

    @Test
    void createAppointment_doctorNotActive_throws() {
        doctor.setStatus(Doctor.DoctorStatus.INACTIVE);
        CreateAppointmentRequest req = baseRequest("CASH");
        when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        assertThatThrownBy(() -> service.createAppointment(6L, req))
                .hasMessageContaining("Doctor is not active");
    }

    @Test
    void createAppointment_slotTaken_throws() {
        CreateAppointmentRequest req = baseRequest("CASH");
        Appointment existing = appointment(Appointment.AppointmentStatus.CONFIRMED, Appointment.PaymentStatus.PAID, "CASH");
        existing.setAppointmentTime(req.getAppointmentTime());
        existing.setAppointmentDate(req.getAppointmentDate());
        when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.findByDoctorAndDate(any(), any())).thenReturn(List.of(existing));
        assertThatThrownBy(() -> service.createAppointment(6L, req))
                .hasMessageContaining("already taken");
    }

    @Test
    void createAppointment_forFamilyMember_success() {
        CreateAppointmentRequest req = baseRequest("CASH");
        req.setFamilyMemberId(5L);
        stubCreate();
        FamilyMember fm = mock(FamilyMember.class);
        when(fm.getFullName()).thenReturn("Con A");
        when(fm.getRelationship()).thenReturn(FamilyMember.Relationship.CHILD);
        when(familyMemberRepository.findByIdAndMainPatientId(5L, 6L)).thenReturn(fm);

        AppointmentResponse result = service.createAppointment(6L, req);
        assertThat(result).isNotNull();
        verify(familyAppointmentRepository).save(any());
    }

    @Test
    void createAppointment_familyMemberNotFound_throws() {
        CreateAppointmentRequest req = baseRequest("CASH");
        req.setFamilyMemberId(5L);
        stubCreate();
        when(familyMemberRepository.findByIdAndMainPatientId(5L, 6L)).thenReturn(null);

        assertThatThrownBy(() -> service.createAppointment(6L, req))
                .hasMessageContaining("Failed to create family appointment");
    }

    private CreateAppointmentRequest baseRequest(String method) {
        CreateAppointmentRequest req = new CreateAppointmentRequest();
        req.setDoctorId(1L);
        req.setAppointmentDate(LocalDate.now().plusDays(7));
        req.setAppointmentTime(LocalTime.of(9, 0));
        req.setNotes("Khám");
        req.setPaymentMethod(method);
        return req;
    }

    private void stubCreate() {
        when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.findByDoctorAndDate(any(), any())).thenReturn(List.of());
        when(appointmentRepository.save(any())).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            if (a.getId() == null) {
                a.setId(88L);
            }
            return a;
        });
    }

    // ── getAllAppointments / getAppointmentsByDate ──
    @Test
    void getAllAppointments_returnsList() {
        Appointment apt = appointment(Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
        when(appointmentRepository.findAll()).thenReturn(List.of(apt));
        assertThat(service.getAllAppointments()).hasSize(1);
    }

    @Test
    void getAppointmentsByDate_null_returnsAll() {
        Appointment apt = appointment(Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
        when(appointmentRepository.findAll()).thenReturn(List.of(apt));
        assertThat(service.getAppointmentsByDate(null)).hasSize(1);
    }

    @Test
    void getAppointmentsByDate_withDate() {
        LocalDate date = LocalDate.now().plusDays(3);
        Appointment apt = appointment(Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
        when(appointmentRepository.findByAppointmentDate(date)).thenReturn(List.of(apt));
        assertThat(service.getAppointmentsByDate(date)).hasSize(1);
    }

    // ── getAvailableTimeSlots ──
    @Test
    void getAvailableTimeSlots_futureDate_allSlotsAvailable() {
        when(appointmentRepository.findByDoctorAndDate(eq(1L), any())).thenReturn(List.of());
        List<String> slots = service.getAvailableTimeSlots(1L, LocalDate.now().plusDays(5));
        assertThat(slots).isNotEmpty();
        assertThat(slots).contains("09:00");
    }

    @Test
    void getAvailableTimeSlots_excludesBookedPending() {
        Appointment booked = appointment(Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
        booked.setAppointmentDate(LocalDate.now().plusDays(5));
        booked.setAppointmentTime(LocalTime.of(9, 0));
        when(appointmentRepository.findByDoctorAndDate(eq(1L), any())).thenReturn(List.of(booked));
        List<String> slots = service.getAvailableTimeSlots(1L, LocalDate.now().plusDays(5));
        assertThat(slots).doesNotContain("09:00");
    }

    @Test
    void getAvailableTimeSlots_ignoresCancelledSlots() {
        Appointment cancelled = appointment(Appointment.AppointmentStatus.CANCELLED, Appointment.PaymentStatus.PENDING, "CASH");
        cancelled.setAppointmentTime(LocalTime.of(9, 0));
        when(appointmentRepository.findByDoctorAndDate(eq(1L), any())).thenReturn(List.of(cancelled));
        List<String> slots = service.getAvailableTimeSlots(1L, LocalDate.now().plusDays(5));
        assertThat(slots).contains("09:00");
    }

    // ── createAppointment extra branches ──
    @Test
    void createAppointment_pastDate_throws() {
        CreateAppointmentRequest req = baseRequest("CASH");
        req.setAppointmentDate(LocalDate.now().minusDays(1));
        when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        assertThatThrownBy(() -> service.createAppointment(6L, req))
                .hasMessageContaining("Cannot book appointment in the past");
    }

    @Test
    void createAppointment_reuseCancelledSlot_deletesOld() {
        CreateAppointmentRequest req = baseRequest("CASH");
        Appointment old = appointment(Appointment.AppointmentStatus.CANCELLED, Appointment.PaymentStatus.PENDING, "CASH");
        old.setAppointmentDate(req.getAppointmentDate());
        old.setAppointmentTime(req.getAppointmentTime());
        when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.findByDoctorAndDate(any(), any())).thenReturn(List.of(old));
        when(appointmentRepository.save(any())).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            if (a.getId() == null) a.setId(88L);
            return a;
        });
        service.createAppointment(6L, req);
        verify(appointmentRepository).delete(old);
        verify(entityManager).flush();
    }

    @Test
    void createAppointment_nullConsultationFee_treatedAsZero() {
        doctor.setConsultationFee(null);
        CreateAppointmentRequest req = baseRequest(AppConstants.WALLET);
        stubCreate();
        AppointmentResponse result = service.createAppointment(6L, req);
        assertThat(result).isNotNull();
        verify(walletService, never()).payForAppointment(any(), any(), any(), anyString());
    }

    @Test
    void createAppointment_patientEmailEmpty_skipsEmail() {
        patient.getUser().setEmail("");
        CreateAppointmentRequest req = baseRequest("CASH");
        stubCreate();
        assertThat(service.createAppointment(6L, req)).isNotNull();
        verify(emailService, never()).sendAppointmentConfirmationEmail(
                any(), any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    // ── cancelAppointment (patient) extra ──
    @Test
    void cancelAppointment_walletRefundFails_throws() {
        Appointment apt = appointment(Appointment.AppointmentStatus.CONFIRMED, Appointment.PaymentStatus.PAID, AppConstants.WALLET);
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        when(walletService.refundAppointment(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Wallet error"));
        assertThatThrownBy(() -> service.cancelAppointment(88L, 6L))
                .hasMessageContaining("Failed to process refund");
    }

    @Test
    void cancelAppointment_notFound() {
        when(appointmentRepository.findById(88L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.cancelAppointment(88L, 6L))
                .hasMessageContaining("Appointment not found");
    }

    // ── cancelByDoctor extra ──
    @Test
    void cancelByDoctor_notFound() {
        when(appointmentRepository.findById(88L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.cancelAppointmentByDoctor(88L, 1L, "x"))
                .hasMessageContaining("Appointment not found");
    }

    // ── updateAppointmentByAdmin status → CONFIRMED ──
    @Test
    void updateAppointmentByAdmin_statusToConfirmed_sendsEmail() {
        Appointment apt = appointment(Appointment.AppointmentStatus.PENDING, Appointment.PaymentStatus.PENDING, "CASH");
        when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));
        when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateAppointmentRequest req = new UpdateAppointmentRequest();
        req.setStatus(Appointment.AppointmentStatus.CONFIRMED);
        AppointmentResponse result = service.updateAppointmentByAdmin(88L, req);
        assertThat(result).isNotNull();
        assertThat(apt.getStatus()).isEqualTo(Appointment.AppointmentStatus.CONFIRMED);
    }
}
