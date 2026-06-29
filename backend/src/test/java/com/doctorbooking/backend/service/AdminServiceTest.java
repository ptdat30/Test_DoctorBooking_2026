package com.doctorbooking.backend.service;

import com.doctorbooking.backend.dto.request.AdminUpdatePatientRequest;
import com.doctorbooking.backend.dto.request.DoctorRequest;
import com.doctorbooking.backend.dto.request.PatientRequest;
import com.doctorbooking.backend.dto.request.UpdateAppointmentRequest;
import com.doctorbooking.backend.dto.response.*;
import com.doctorbooking.backend.model.Patient;
import com.doctorbooking.backend.model.User;
import com.doctorbooking.backend.repository.PatientRepository;
import com.doctorbooking.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminService Unit Tests")
class AdminServiceTest {

    @Mock private DoctorService doctorService;
    @Mock private PatientService patientService;
    @Mock private AppointmentService appointmentService;
    @Mock private FeedbackService feedbackService;
    @Mock private PatientRepository patientRepository;
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminService service;

    // ── Doctor delegation ──
    @Test
    void getAllDoctors_delegates() {
        when(doctorService.getAllDoctors()).thenReturn(List.of());
        assertThat(service.getAllDoctors()).isEmpty();
    }

    @Test
    void searchDoctors_blank_returnsAll() {
        when(doctorService.getAllDoctors()).thenReturn(List.of());
        service.searchDoctors("  ");
        verify(doctorService).getAllDoctors();
    }

    @Test
    void searchDoctors_keyword_delegates() {
        when(doctorService.searchDoctors("tim")).thenReturn(List.of());
        service.searchDoctors("tim");
        verify(doctorService).searchDoctors("tim");
    }

    @Test
    void getDoctorById_delegates() {
        when(doctorService.getDoctorById(1L)).thenReturn(mock(DoctorResponse.class));
        assertThat(service.getDoctorById(1L)).isNotNull();
    }

    @Test
    void createDoctor_delegates() {
        DoctorRequest req = new DoctorRequest();
        when(doctorService.createDoctor(req)).thenReturn(mock(DoctorResponse.class));
        assertThat(service.createDoctor(req)).isNotNull();
    }

    @Test
    void updateDoctor_delegates() {
        DoctorRequest req = new DoctorRequest();
        when(doctorService.updateDoctor(1L, req)).thenReturn(mock(DoctorResponse.class));
        assertThat(service.updateDoctor(1L, req)).isNotNull();
    }

    @Test
    void deleteDoctor_delegates() {
        service.deleteDoctor(1L);
        verify(doctorService).deleteDoctor(1L);
    }

    // ── Patient management ──
    @Test
    void searchPatients_delegates() {
        when(patientService.searchPatients("a")).thenReturn(List.of());
        assertThat(service.searchPatients("a")).isEmpty();
    }

    @Test
    void getPatientById_delegates() {
        when(patientService.getPatientById(1L)).thenReturn(mock(PatientResponse.class));
        assertThat(service.getPatientById(1L)).isNotNull();
    }

    @Test
    void createPatient_success() {
        PatientRequest req = mock(PatientRequest.class);
        when(req.getUsername()).thenReturn("john");
        when(req.getEmail()).thenReturn("john@x.com");
        when(userRepository.existsByUsername("john")).thenReturn(false);
        when(userRepository.existsByEmail("john@x.com")).thenReturn(false);
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        Patient saved = mock(Patient.class);
        when(saved.getId()).thenReturn(6L);
        when(patientRepository.save(any())).thenReturn(saved);
        when(patientService.getPatientById(6L)).thenReturn(mock(PatientResponse.class));

        assertThat(service.createPatient(req)).isNotNull();
    }

    @Test
    void createPatient_usernameExists() {
        PatientRequest req = mock(PatientRequest.class);
        when(req.getUsername()).thenReturn("john");
        when(userRepository.existsByUsername("john")).thenReturn(true);
        assertThatThrownBy(() -> service.createPatient(req)).hasMessageContaining("Username already exists");
    }

    @Test
    void createPatient_emailExists() {
        PatientRequest req = mock(PatientRequest.class);
        when(req.getUsername()).thenReturn("john");
        when(req.getEmail()).thenReturn("john@x.com");
        when(userRepository.existsByUsername("john")).thenReturn(false);
        when(userRepository.existsByEmail("john@x.com")).thenReturn(true);
        assertThatThrownBy(() -> service.createPatient(req)).hasMessageContaining("Email already exists");
    }

    @Test
    void updatePatient_emailUnchanged_success() {
        AdminUpdatePatientRequest req = mock(AdminUpdatePatientRequest.class);
        when(req.getEmail()).thenReturn("same@x.com");
        Patient patient = mock(Patient.class);
        User user = mock(User.class);
        when(user.getEmail()).thenReturn("same@x.com");
        when(patient.getUser()).thenReturn(user);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        Patient updated = mock(Patient.class);
        when(updated.getId()).thenReturn(1L);
        when(patientRepository.save(patient)).thenReturn(updated);
        when(patientService.getPatientById(1L)).thenReturn(mock(PatientResponse.class));

        assertThat(service.updatePatient(1L, req)).isNotNull();
        verify(userRepository, never()).save(any());
    }

    @Test
    void updatePatient_emailChanged_success() {
        AdminUpdatePatientRequest req = mock(AdminUpdatePatientRequest.class);
        when(req.getEmail()).thenReturn("new@x.com");
        Patient patient = mock(Patient.class);
        User user = mock(User.class);
        when(user.getEmail()).thenReturn("old@x.com");
        when(patient.getUser()).thenReturn(user);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(userRepository.existsByEmail("new@x.com")).thenReturn(false);
        Patient updated = mock(Patient.class);
        when(updated.getId()).thenReturn(1L);
        when(patientRepository.save(patient)).thenReturn(updated);
        when(patientService.getPatientById(1L)).thenReturn(mock(PatientResponse.class));

        assertThat(service.updatePatient(1L, req)).isNotNull();
        verify(userRepository).save(user);
    }

    @Test
    void updatePatient_emailChanged_alreadyExists() {
        AdminUpdatePatientRequest req = mock(AdminUpdatePatientRequest.class);
        when(req.getEmail()).thenReturn("new@x.com");
        Patient patient = mock(Patient.class);
        User user = mock(User.class);
        when(user.getEmail()).thenReturn("old@x.com");
        when(patient.getUser()).thenReturn(user);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(userRepository.existsByEmail("new@x.com")).thenReturn(true);

        assertThatThrownBy(() -> service.updatePatient(1L, req)).hasMessageContaining("Email already exists");
    }

    @Test
    void updatePatient_notFound() {
        AdminUpdatePatientRequest req = mock(AdminUpdatePatientRequest.class);
        when(patientRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updatePatient(1L, req)).hasMessageContaining("Patient not found");
    }

    @Test
    void deletePatient_success() {
        Patient patient = mock(Patient.class);
        User user = mock(User.class);
        when(patient.getUser()).thenReturn(user);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        service.deletePatient(1L);
        verify(patientRepository).delete(patient);
        verify(userRepository).delete(user);
    }

    @Test
    void deletePatient_notFound() {
        when(patientRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deletePatient(1L)).hasMessageContaining("Patient not found");
    }

    // ── Appointment management ──
    @Test
    void getAllAppointments_withDate() {
        when(appointmentService.getAppointmentsByDate(any())).thenReturn(List.of());
        service.getAllAppointments(LocalDate.now());
        verify(appointmentService).getAppointmentsByDate(any());
    }

    @Test
    void getAllAppointments_noDate() {
        when(appointmentService.getAllAppointments()).thenReturn(List.of());
        service.getAllAppointments(null);
        verify(appointmentService).getAllAppointments();
    }

    @Test
    void getAppointmentById_delegates() {
        when(appointmentService.getAppointmentById(1L)).thenReturn(mock(AppointmentResponse.class));
        assertThat(service.getAppointmentById(1L)).isNotNull();
    }

    @Test
    void updateAppointment_delegates() {
        UpdateAppointmentRequest req = new UpdateAppointmentRequest();
        when(appointmentService.updateAppointmentByAdmin(1L, req)).thenReturn(mock(AppointmentResponse.class));
        assertThat(service.updateAppointment(1L, req)).isNotNull();
    }

    @Test
    void deleteAppointment_delegates() {
        service.deleteAppointment(1L);
        verify(appointmentService).deleteAppointment(1L);
    }

    // ── Feedback management ──
    @Test
    void getAllFeedbacks_delegates() {
        when(feedbackService.getFeedbacksByStatus("PENDING")).thenReturn(List.of());
        assertThat(service.getAllFeedbacks("PENDING")).isEmpty();
    }

    @Test
    void getFeedbacksByDoctor_delegates() {
        when(feedbackService.getFeedbacksByDoctor(1L)).thenReturn(List.of());
        assertThat(service.getFeedbacksByDoctor(1L)).isEmpty();
    }

    @Test
    void getFeedbacksByPatient_delegates() {
        when(feedbackService.getFeedbacksByPatient(1L)).thenReturn(List.of());
        assertThat(service.getFeedbacksByPatient(1L)).isEmpty();
    }

    @Test
    void getFeedbackById_delegates() {
        when(feedbackService.getFeedbackById(1L)).thenReturn(mock(FeedbackResponse.class));
        assertThat(service.getFeedbackById(1L)).isNotNull();
    }

    @Test
    void hideFeedback_delegates() {
        when(feedbackService.hideFeedback(1L)).thenReturn(mock(FeedbackResponse.class));
        assertThat(service.hideFeedback(1L)).isNotNull();
    }

    @Test
    void unhideFeedback_delegates() {
        when(feedbackService.unhideFeedback(1L)).thenReturn(mock(FeedbackResponse.class));
        assertThat(service.unhideFeedback(1L)).isNotNull();
    }
}
