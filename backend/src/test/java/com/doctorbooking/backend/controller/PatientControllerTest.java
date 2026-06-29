package com.doctorbooking.backend.controller;

import com.doctorbooking.backend.dto.request.*;
import com.doctorbooking.backend.dto.response.*;
import com.doctorbooking.backend.model.User;
import com.doctorbooking.backend.service.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PatientController Unit Tests")
class PatientControllerTest {

    @Mock private PatientService patientService;
    @Mock private DoctorService doctorService;
    @Mock private AppointmentService appointmentService;
    @Mock private TreatmentService treatmentService;
    @Mock private FeedbackService feedbackService;
    @Mock private UserService userService;
    @Mock private AISymptomService aiSymptomService;
    @Mock private VNPayService vnPayService;

    @InjectMocks
    private PatientController controller;

    private PatientResponse currentPatient;

    @BeforeEach
    void setUp() {
        User user = new User();
        user.setId(10L);
        user.setUsername("patient");
        lenient().when(userService.findByUsername("patient")).thenReturn(user);

        currentPatient = mock(PatientResponse.class);
        lenient().when(currentPatient.getId()).thenReturn(6L);
        lenient().when(patientService.getPatientByUserId(10L)).thenReturn(currentPatient);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("patient", null));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ── Profile ──
    @Test
    void getProfile_success() {
        ResponseEntity<PatientResponse> result = controller.getProfile();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getProfile_notFound() {
        when(patientService.getPatientByUserId(10L)).thenThrow(new RuntimeException("nf"));
        ResponseEntity<PatientResponse> result = controller.getProfile();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void updateProfile_success() {
        UpdatePatientProfileRequest req = new UpdatePatientProfileRequest();
        when(patientService.updatePatientProfile(10L, req)).thenReturn(currentPatient);
        ResponseEntity<PatientResponse> result = controller.updateProfile(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void updateProfile_badRequest() {
        UpdatePatientProfileRequest req = new UpdatePatientProfileRequest();
        when(patientService.updatePatientProfile(10L, req)).thenThrow(new RuntimeException("e"));
        ResponseEntity<PatientResponse> result = controller.updateProfile(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void changePassword_success() {
        ChangePasswordRequest req = new ChangePasswordRequest();
        ResponseEntity<Void> result = controller.changePassword(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void changePassword_badRequest() {
        ChangePasswordRequest req = new ChangePasswordRequest();
        doThrow(new RuntimeException("e")).when(patientService).changePassword(10L, req);
        ResponseEntity<Void> result = controller.changePassword(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    // ── Appointments ──
    @Test
    void createAppointment_cash_created() {
        CreateAppointmentRequest req = new CreateAppointmentRequest();
        req.setPaymentMethod("CASH");
        AppointmentResponse apt = mock(AppointmentResponse.class);
        when(appointmentService.createAppointment(6L, req)).thenReturn(apt);
        ResponseEntity<?> result = controller.createAppointment(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    void createAppointment_vnpay_withPaymentUrl() {
        CreateAppointmentRequest req = new CreateAppointmentRequest();
        req.setPaymentMethod("VNPAY");
        AppointmentResponse apt = mock(AppointmentResponse.class);
        when(apt.getPrice()).thenReturn(new BigDecimal("150000"));
        when(apt.getId()).thenReturn(1L);
        when(apt.getDoctorName()).thenReturn("Dr X");
        when(appointmentService.createAppointment(6L, req)).thenReturn(apt);
        when(vnPayService.createPaymentUrlForAppointment(anyLong(), anyString(), anyString()))
                .thenReturn("http://pay");
        ResponseEntity<?> result = controller.createAppointment(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    void createAppointment_vnpay_urlError_badRequest() {
        CreateAppointmentRequest req = new CreateAppointmentRequest();
        req.setPaymentMethod("VNPAY");
        AppointmentResponse apt = mock(AppointmentResponse.class);
        when(apt.getPrice()).thenReturn(new BigDecimal("150000"));
        when(apt.getId()).thenReturn(1L);
        when(apt.getDoctorName()).thenReturn("Dr X");
        when(appointmentService.createAppointment(6L, req)).thenReturn(apt);
        when(vnPayService.createPaymentUrlForAppointment(anyLong(), anyString(), anyString()))
                .thenThrow(new RuntimeException("vnpay down"));
        ResponseEntity<?> result = controller.createAppointment(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void createAppointment_serviceError_badRequest() {
        CreateAppointmentRequest req = new CreateAppointmentRequest();
        req.setPaymentMethod("CASH");
        when(appointmentService.createAppointment(6L, req)).thenThrow(new RuntimeException("full"));
        ResponseEntity<?> result = controller.createAppointment(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getAppointments_success() {
        when(appointmentService.getPatientAppointments(6L)).thenReturn(List.of());
        ResponseEntity<List<AppointmentResponse>> result = controller.getAppointments();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getAppointments_error() {
        when(appointmentService.getPatientAppointments(6L)).thenThrow(new RuntimeException("e"));
        ResponseEntity<List<AppointmentResponse>> result = controller.getAppointments();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getAppointmentById_success() {
        AppointmentResponse apt = mock(AppointmentResponse.class);
        when(apt.getPatientId()).thenReturn(6L);
        when(appointmentService.getAppointmentById(1L)).thenReturn(apt);
        ResponseEntity<AppointmentResponse> result = controller.getAppointmentById(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getAppointmentById_forbidden() {
        AppointmentResponse apt = mock(AppointmentResponse.class);
        when(apt.getPatientId()).thenReturn(99L);
        when(appointmentService.getAppointmentById(1L)).thenReturn(apt);
        ResponseEntity<AppointmentResponse> result = controller.getAppointmentById(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void getAppointmentById_notFound() {
        when(appointmentService.getAppointmentById(1L)).thenThrow(new RuntimeException("nf"));
        ResponseEntity<AppointmentResponse> result = controller.getAppointmentById(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void cancelAppointment_success() {
        ResponseEntity<Void> result = controller.cancelAppointment(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void cancelAppointment_error() {
        doThrow(new RuntimeException("e")).when(appointmentService).cancelAppointment(1L, 6L);
        ResponseEntity<Void> result = controller.cancelAppointment(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getAvailableTimeSlots_success() {
        when(appointmentService.getAvailableTimeSlots(anyLong(), any())).thenReturn(List.of("08:00"));
        ResponseEntity<List<String>> result = controller.getAvailableTimeSlots(1L, "2030-01-01");
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getAvailableTimeSlots_invalidDate_badRequest() {
        ResponseEntity<List<String>> result = controller.getAvailableTimeSlots(1L, "not-a-date");
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    // ── Doctors ──
    @Test
    void searchDoctors_withSearch() {
        when(doctorService.searchDoctors("tim")).thenReturn(List.of());
        ResponseEntity<List<DoctorResponse>> result = controller.searchDoctors("tim");
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(doctorService).searchDoctors("tim");
    }

    @Test
    void searchDoctors_noSearch() {
        when(doctorService.getActiveDoctors()).thenReturn(List.of());
        controller.searchDoctors(null);
        verify(doctorService).getActiveDoctors();
    }

    @Test
    void getDoctorById_active() {
        DoctorResponse doc = mock(DoctorResponse.class);
        when(doc.getStatus()).thenReturn("ACTIVE");
        when(doctorService.getDoctorById(1L)).thenReturn(doc);
        ResponseEntity<DoctorResponse> result = controller.getDoctorById(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getDoctorById_inactive_notFound() {
        DoctorResponse doc = mock(DoctorResponse.class);
        when(doc.getStatus()).thenReturn("INACTIVE");
        when(doctorService.getDoctorById(1L)).thenReturn(doc);
        ResponseEntity<DoctorResponse> result = controller.getDoctorById(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void getDoctorById_exception_notFound() {
        when(doctorService.getDoctorById(1L)).thenThrow(new RuntimeException("nf"));
        ResponseEntity<DoctorResponse> result = controller.getDoctorById(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ── Treatments ──
    @Test
    void getTreatments_success() {
        when(treatmentService.getTreatmentsByPatientId(6L)).thenReturn(List.of());
        ResponseEntity<List<TreatmentResponse>> result = controller.getTreatments();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getTreatments_error() {
        when(treatmentService.getTreatmentsByPatientId(6L)).thenThrow(new RuntimeException("e"));
        ResponseEntity<List<TreatmentResponse>> result = controller.getTreatments();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getTreatmentById_success() {
        TreatmentResponse t = mock(TreatmentResponse.class);
        when(t.getPatientId()).thenReturn(6L);
        when(treatmentService.getTreatmentById(1L)).thenReturn(t);
        ResponseEntity<TreatmentResponse> result = controller.getTreatmentById(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getTreatmentById_forbidden() {
        TreatmentResponse t = mock(TreatmentResponse.class);
        when(t.getPatientId()).thenReturn(99L);
        when(treatmentService.getTreatmentById(1L)).thenReturn(t);
        ResponseEntity<TreatmentResponse> result = controller.getTreatmentById(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void getTreatmentById_notFound() {
        when(treatmentService.getTreatmentById(1L)).thenThrow(new RuntimeException("nf"));
        ResponseEntity<TreatmentResponse> result = controller.getTreatmentById(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void getTreatmentByAppointmentId_success() {
        AppointmentResponse apt = mock(AppointmentResponse.class);
        when(apt.getPatientId()).thenReturn(6L);
        when(appointmentService.getAppointmentById(1L)).thenReturn(apt);
        when(treatmentService.getTreatmentByAppointmentId(1L)).thenReturn(mock(TreatmentResponse.class));
        ResponseEntity<TreatmentResponse> result = controller.getTreatmentByAppointmentId(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getTreatmentByAppointmentId_forbidden() {
        AppointmentResponse apt = mock(AppointmentResponse.class);
        when(apt.getPatientId()).thenReturn(99L);
        when(appointmentService.getAppointmentById(1L)).thenReturn(apt);
        ResponseEntity<TreatmentResponse> result = controller.getTreatmentByAppointmentId(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void getTreatmentByAppointmentId_treatmentNull_notFound() {
        AppointmentResponse apt = mock(AppointmentResponse.class);
        when(apt.getPatientId()).thenReturn(6L);
        when(appointmentService.getAppointmentById(1L)).thenReturn(apt);
        when(treatmentService.getTreatmentByAppointmentId(1L)).thenReturn(null);
        ResponseEntity<TreatmentResponse> result = controller.getTreatmentByAppointmentId(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void getTreatmentByAppointmentId_exception_notFound() {
        when(appointmentService.getAppointmentById(1L)).thenThrow(new RuntimeException("nf"));
        ResponseEntity<TreatmentResponse> result = controller.getTreatmentByAppointmentId(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ── Feedback ──
    @Test
    void createFeedback_created() {
        CreateFeedbackRequest req = new CreateFeedbackRequest();
        when(feedbackService.createFeedback(6L, req)).thenReturn(mock(FeedbackResponse.class));
        ResponseEntity<FeedbackResponse> result = controller.createFeedback(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    void createFeedback_badRequest() {
        CreateFeedbackRequest req = new CreateFeedbackRequest();
        when(feedbackService.createFeedback(6L, req)).thenThrow(new RuntimeException("e"));
        ResponseEntity<FeedbackResponse> result = controller.createFeedback(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getFeedbacks_success() {
        when(feedbackService.getPatientFeedbacks(6L)).thenReturn(List.of());
        ResponseEntity<List<FeedbackResponse>> result = controller.getFeedbacks();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getFeedbacks_error() {
        when(feedbackService.getPatientFeedbacks(6L)).thenThrow(new RuntimeException("e"));
        ResponseEntity<List<FeedbackResponse>> result = controller.getFeedbacks();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getFeedbackById_success() {
        when(feedbackService.getPatientFeedbackById(6L, 1L)).thenReturn(mock(FeedbackResponse.class));
        ResponseEntity<FeedbackResponse> result = controller.getFeedbackById(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getFeedbackById_notFound() {
        when(feedbackService.getPatientFeedbackById(6L, 1L)).thenThrow(new RuntimeException("nf"));
        ResponseEntity<FeedbackResponse> result = controller.getFeedbackById(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void updateFeedback_success() {
        UpdateFeedbackRequest req = new UpdateFeedbackRequest();
        when(feedbackService.updateFeedback(6L, 1L, req)).thenReturn(mock(FeedbackResponse.class));
        ResponseEntity<FeedbackResponse> result = controller.updateFeedback(1L, req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void updateFeedback_badRequest() {
        UpdateFeedbackRequest req = new UpdateFeedbackRequest();
        when(feedbackService.updateFeedback(6L, 1L, req)).thenThrow(new RuntimeException("e"));
        ResponseEntity<FeedbackResponse> result = controller.updateFeedback(1L, req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    // ── AI Symptom Check ──
    @Test
    void checkSymptoms_emptyInput_badRequest() {
        SymptomCheckRequest req = new SymptomCheckRequest();
        req.setSymptoms("   ");
        ResponseEntity<SymptomCheckResponse> result = controller.checkSymptoms(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void checkSymptoms_success() {
        SymptomCheckRequest req = new SymptomCheckRequest();
        req.setSymptoms("ho sốt");
        when(aiSymptomService.analyzeSymptoms("ho sốt")).thenReturn(mock(SymptomCheckResponse.class));
        ResponseEntity<SymptomCheckResponse> result = controller.checkSymptoms(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void checkSymptoms_illegalArgument_badRequest() {
        SymptomCheckRequest req = new SymptomCheckRequest();
        req.setSymptoms("ho sốt");
        when(aiSymptomService.analyzeSymptoms("ho sốt")).thenThrow(new IllegalArgumentException("bad"));
        ResponseEntity<SymptomCheckResponse> result = controller.checkSymptoms(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void checkSymptoms_genericError_internalError() {
        SymptomCheckRequest req = new SymptomCheckRequest();
        req.setSymptoms("ho sốt");
        when(aiSymptomService.analyzeSymptoms("ho sốt")).thenThrow(new RuntimeException("boom"));
        ResponseEntity<SymptomCheckResponse> result = controller.checkSymptoms(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
