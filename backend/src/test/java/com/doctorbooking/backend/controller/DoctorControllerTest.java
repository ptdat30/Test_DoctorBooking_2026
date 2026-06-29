package com.doctorbooking.backend.controller;

import com.doctorbooking.backend.dto.appointment.CancelAppointmentRequest;
import com.doctorbooking.backend.dto.request.*;
import com.doctorbooking.backend.dto.response.*;
import com.doctorbooking.backend.model.Medication;
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

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DoctorController Unit Tests")
class DoctorControllerTest {

    @Mock private DoctorService doctorService;
    @Mock private PatientService patientService;
    @Mock private AppointmentService appointmentService;
    @Mock private TreatmentService treatmentService;
    @Mock private UserService userService;
    @Mock private FeedbackService feedbackService;
    @Mock private MedicationService medicationService;

    @InjectMocks
    private DoctorController controller;

    private DoctorResponse currentDoctor;

    @BeforeEach
    void setUp() {
        User user = new User();
        user.setId(10L);
        user.setUsername("doctor");
        lenient().when(userService.findByUsername("doctor")).thenReturn(user);

        currentDoctor = mock(DoctorResponse.class);
        lenient().when(currentDoctor.getId()).thenReturn(2L);
        lenient().when(doctorService.getDoctorByUserId(10L)).thenReturn(currentDoctor);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("doctor", null));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getProfile_success() {
        assertThat(controller.getProfile().getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getProfile_notFound() {
        when(doctorService.getDoctorByUserId(10L)).thenThrow(new RuntimeException("nf"));
        assertThat(controller.getProfile().getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void updateProfile_success() {
        UpdateProfileRequest req = new UpdateProfileRequest();
        when(doctorService.updateDoctorProfile(10L, req)).thenReturn(currentDoctor);
        assertThat(controller.updateProfile(req).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void updateProfile_badRequest() {
        UpdateProfileRequest req = new UpdateProfileRequest();
        when(doctorService.updateDoctorProfile(10L, req)).thenThrow(new RuntimeException("e"));
        assertThat(controller.updateProfile(req).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void changePassword_success() {
        ChangePasswordRequest req = new ChangePasswordRequest();
        assertThat(controller.changePassword(req).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void changePassword_badRequest() {
        ChangePasswordRequest req = new ChangePasswordRequest();
        doThrow(new RuntimeException("e")).when(doctorService).changePassword(10L, req);
        assertThat(controller.changePassword(req).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getAppointments_byDate() {
        AppointmentResponse apt = mock(AppointmentResponse.class);
        when(apt.getDoctorId()).thenReturn(2L);
        when(appointmentService.getAppointmentsByDate(any())).thenReturn(List.of(apt));
        ResponseEntity<List<AppointmentResponse>> result = controller.getAppointments(LocalDate.now());
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).hasSize(1);
    }

    @Test
    void getAppointments_all() {
        AppointmentResponse apt = mock(AppointmentResponse.class);
        when(apt.getDoctorId()).thenReturn(2L);
        when(apt.getPatientName()).thenReturn("P");
        when(appointmentService.getAllAppointments()).thenReturn(List.of(apt));
        ResponseEntity<List<AppointmentResponse>> result = controller.getAppointments(null);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getAppointments_error() {
        when(appointmentService.getAllAppointments()).thenThrow(new RuntimeException("e"));
        assertThat(controller.getAppointments(null).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getAppointmentById_success() {
        AppointmentResponse apt = mock(AppointmentResponse.class);
        when(apt.getDoctorId()).thenReturn(2L);
        when(appointmentService.getAppointmentById(1L)).thenReturn(apt);
        assertThat(controller.getAppointmentById(1L).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getAppointmentById_forbidden() {
        AppointmentResponse apt = mock(AppointmentResponse.class);
        when(apt.getDoctorId()).thenReturn(99L);
        when(appointmentService.getAppointmentById(1L)).thenReturn(apt);
        assertThat(controller.getAppointmentById(1L).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void getAppointmentById_notFound() {
        when(appointmentService.getAppointmentById(1L)).thenThrow(new RuntimeException("nf"));
        assertThat(controller.getAppointmentById(1L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void confirmAppointment_success() {
        when(appointmentService.confirmAppointment(1L, 2L)).thenReturn(mock(AppointmentResponse.class));
        assertThat(controller.confirmAppointment(1L).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void confirmAppointment_badRequest() {
        when(appointmentService.confirmAppointment(1L, 2L)).thenThrow(new RuntimeException("e"));
        assertThat(controller.confirmAppointment(1L).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void cancelAppointment_success() {
        CancelAppointmentRequest req = new CancelAppointmentRequest();
        ResponseEntity<?> result = controller.cancelAppointment(1L, req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void cancelAppointment_badRequest() {
        CancelAppointmentRequest req = new CancelAppointmentRequest();
        doThrow(new RuntimeException("e")).when(appointmentService)
                .cancelAppointmentByDoctor(eq(1L), eq(2L), any());
        ResponseEntity<?> result = controller.cancelAppointment(1L, req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getTreatments_success() {
        when(treatmentService.getTreatmentsByDoctorId(2L)).thenReturn(List.of());
        assertThat(controller.getTreatments().getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getTreatments_error() {
        when(treatmentService.getTreatmentsByDoctorId(2L)).thenThrow(new RuntimeException("e"));
        assertThat(controller.getTreatments().getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getTreatmentById_success() {
        TreatmentResponse t = mock(TreatmentResponse.class);
        when(t.getDoctorId()).thenReturn(2L);
        when(treatmentService.getTreatmentById(1L)).thenReturn(t);
        assertThat(controller.getTreatmentById(1L).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getTreatmentById_forbidden() {
        TreatmentResponse t = mock(TreatmentResponse.class);
        when(t.getDoctorId()).thenReturn(99L);
        when(treatmentService.getTreatmentById(1L)).thenReturn(t);
        assertThat(controller.getTreatmentById(1L).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void getTreatmentById_notFound() {
        when(treatmentService.getTreatmentById(1L)).thenThrow(new RuntimeException("nf"));
        assertThat(controller.getTreatmentById(1L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void createTreatment_created() {
        CreateTreatmentRequest req = new CreateTreatmentRequest();
        when(treatmentService.createTreatment(2L, req)).thenReturn(mock(TreatmentResponse.class));
        assertThat(controller.createTreatment(req).getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    void createTreatment_badRequest() {
        CreateTreatmentRequest req = new CreateTreatmentRequest();
        when(treatmentService.createTreatment(2L, req)).thenThrow(new RuntimeException("e"));
        assertThat(controller.createTreatment(req).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void updateTreatment_success() {
        UpdateTreatmentRequest req = new UpdateTreatmentRequest();
        TreatmentResponse t = mock(TreatmentResponse.class);
        when(t.getDoctorId()).thenReturn(2L);
        when(treatmentService.getTreatmentById(1L)).thenReturn(t);
        when(treatmentService.updateTreatment(1L, req)).thenReturn(mock(TreatmentResponse.class));
        assertThat(controller.updateTreatment(1L, req).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void updateTreatment_forbidden() {
        UpdateTreatmentRequest req = new UpdateTreatmentRequest();
        TreatmentResponse t = mock(TreatmentResponse.class);
        when(t.getDoctorId()).thenReturn(99L);
        when(treatmentService.getTreatmentById(1L)).thenReturn(t);
        assertThat(controller.updateTreatment(1L, req).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void updateTreatment_notFound() {
        UpdateTreatmentRequest req = new UpdateTreatmentRequest();
        when(treatmentService.getTreatmentById(1L)).thenThrow(new RuntimeException("nf"));
        assertThat(controller.updateTreatment(1L, req).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void deleteTreatment_success() {
        TreatmentResponse t = mock(TreatmentResponse.class);
        when(t.getDoctorId()).thenReturn(2L);
        when(treatmentService.getTreatmentById(1L)).thenReturn(t);
        assertThat(controller.deleteTreatment(1L).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void deleteTreatment_forbidden() {
        TreatmentResponse t = mock(TreatmentResponse.class);
        when(t.getDoctorId()).thenReturn(99L);
        when(treatmentService.getTreatmentById(1L)).thenReturn(t);
        assertThat(controller.deleteTreatment(1L).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void deleteTreatment_notFound() {
        when(treatmentService.getTreatmentById(1L)).thenThrow(new RuntimeException("nf"));
        assertThat(controller.deleteTreatment(1L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void searchPatients_ok() {
        when(patientService.searchPatients("a")).thenReturn(List.of());
        assertThat(controller.searchPatients("a").getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getPatientById_success() {
        when(patientService.getPatientById(1L)).thenReturn(mock(PatientResponse.class));
        assertThat(controller.getPatientById(1L).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getPatientById_notFound() {
        when(patientService.getPatientById(1L)).thenThrow(new RuntimeException("nf"));
        assertThat(controller.getPatientById(1L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void getPatientTreatments_success() {
        when(patientService.getPatientById(1L)).thenReturn(mock(PatientResponse.class));
        when(treatmentService.getTreatmentsByPatientId(1L)).thenReturn(List.of());
        assertThat(controller.getPatientTreatments(1L).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getPatientTreatments_notFound() {
        when(patientService.getPatientById(1L)).thenThrow(new RuntimeException("nf"));
        assertThat(controller.getPatientTreatments(1L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void searchMedications_ok() {
        when(medicationService.searchMedications("para", 5)).thenReturn(List.<Medication>of());
        assertThat(controller.searchMedications("para", 5).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getDoctorFeedbacks_success() {
        when(feedbackService.getDoctorFeedbacks(2L)).thenReturn(List.of());
        assertThat(controller.getDoctorFeedbacks().getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getDoctorFeedbacks_error() {
        when(feedbackService.getDoctorFeedbacks(2L)).thenThrow(new RuntimeException("e"));
        assertThat(controller.getDoctorFeedbacks().getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getFeedbacksByRating_success() {
        when(feedbackService.getDoctorFeedbacksByRating(2L, 5)).thenReturn(List.of());
        assertThat(controller.getFeedbacksByRating(5).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getFeedbacksByRating_error() {
        when(feedbackService.getDoctorFeedbacksByRating(2L, 5)).thenThrow(new RuntimeException("e"));
        assertThat(controller.getFeedbacksByRating(5).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getFeedbackById_success() {
        when(feedbackService.getDoctorFeedbackById(2L, 1L)).thenReturn(mock(FeedbackResponse.class));
        assertThat(controller.getFeedbackById(1L).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getFeedbackById_notFound() {
        when(feedbackService.getDoctorFeedbackById(2L, 1L)).thenThrow(new RuntimeException("nf"));
        assertThat(controller.getFeedbackById(1L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void replyToFeedback_success() {
        ReplyFeedbackRequest req = new ReplyFeedbackRequest();
        when(feedbackService.replyToFeedback(2L, 1L, req)).thenReturn(mock(FeedbackResponse.class));
        assertThat(controller.replyToFeedback(1L, req).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void replyToFeedback_badRequest() {
        ReplyFeedbackRequest req = new ReplyFeedbackRequest();
        when(feedbackService.replyToFeedback(2L, 1L, req)).thenThrow(new RuntimeException("e"));
        assertThat(controller.replyToFeedback(1L, req).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void updateDoctorReply_success() {
        ReplyFeedbackRequest req = new ReplyFeedbackRequest();
        when(feedbackService.updateDoctorReply(2L, 1L, req)).thenReturn(mock(FeedbackResponse.class));
        assertThat(controller.updateDoctorReply(1L, req).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void updateDoctorReply_badRequest() {
        ReplyFeedbackRequest req = new ReplyFeedbackRequest();
        when(feedbackService.updateDoctorReply(2L, 1L, req)).thenThrow(new RuntimeException("e"));
        assertThat(controller.updateDoctorReply(1L, req).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getAverageRating_success() {
        when(feedbackService.getDoctorAverageRating(2L)).thenReturn(4.5);
        ResponseEntity<Double> result = controller.getAverageRating();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(4.5);
    }

    @Test
    void getAverageRating_exception_returnsZero() {
        when(feedbackService.getDoctorAverageRating(2L)).thenThrow(new RuntimeException("e"));
        ResponseEntity<Double> result = controller.getAverageRating();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(0.0);
    }
}
