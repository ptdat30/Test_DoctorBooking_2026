package com.doctorbooking.backend.controller;

import com.doctorbooking.backend.dto.appointment.CancelAppointmentRequest;
import com.doctorbooking.backend.dto.request.AdminUpdatePatientRequest;
import com.doctorbooking.backend.dto.request.DoctorRequest;
import com.doctorbooking.backend.dto.request.PatientRequest;
import com.doctorbooking.backend.dto.request.UpdateAppointmentRequest;
import com.doctorbooking.backend.dto.response.*;
import com.doctorbooking.backend.service.AdminService;
import com.doctorbooking.backend.service.AppointmentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminController Unit Tests")
class AdminControllerTest {

    @Mock private AdminService adminService;
    @Mock private AppointmentService appointmentService;

    @InjectMocks
    private AdminController controller;

    // ── Doctors ──
    @Test
    void getAllDoctors_withSearch() {
        when(adminService.searchDoctors("a")).thenReturn(List.of());
        controller.getAllDoctors("a");
        verify(adminService).searchDoctors("a");
    }

    @Test
    void getAllDoctors_noSearch() {
        when(adminService.getAllDoctors()).thenReturn(List.of());
        controller.getAllDoctors(null);
        verify(adminService).getAllDoctors();
    }

    @Test
    void getDoctorById_found() {
        when(adminService.getDoctorById(1L)).thenReturn(mock(DoctorResponse.class));
        assertThat(controller.getDoctorById(1L).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getDoctorById_notFound() {
        when(adminService.getDoctorById(1L)).thenThrow(new RuntimeException("nf"));
        assertThat(controller.getDoctorById(1L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void createDoctor_created() {
        DoctorRequest req = new DoctorRequest();
        when(adminService.createDoctor(req)).thenReturn(mock(DoctorResponse.class));
        assertThat(controller.createDoctor(req).getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    void createDoctor_badRequest() {
        DoctorRequest req = new DoctorRequest();
        when(adminService.createDoctor(req)).thenThrow(new RuntimeException("dup"));
        assertThat(controller.createDoctor(req).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void updateDoctor_success() {
        DoctorRequest req = new DoctorRequest();
        when(adminService.updateDoctor(1L, req)).thenReturn(mock(DoctorResponse.class));
        assertThat(controller.updateDoctor(1L, req).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void updateDoctor_badRequest() {
        DoctorRequest req = new DoctorRequest();
        when(adminService.updateDoctor(1L, req)).thenThrow(new RuntimeException("e"));
        assertThat(controller.updateDoctor(1L, req).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void deleteDoctor_success() {
        assertThat(controller.deleteDoctor(1L).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void deleteDoctor_notFound() {
        doThrow(new RuntimeException("nf")).when(adminService).deleteDoctor(1L);
        assertThat(controller.deleteDoctor(1L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ── Patients ──
    @Test
    void searchPatients_ok() {
        when(adminService.searchPatients("a")).thenReturn(List.of());
        assertThat(controller.searchPatients("a").getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getPatientById_found() {
        when(adminService.getPatientById(1L)).thenReturn(mock(PatientResponse.class));
        assertThat(controller.getPatientById(1L).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getPatientById_notFound() {
        when(adminService.getPatientById(1L)).thenThrow(new RuntimeException("nf"));
        assertThat(controller.getPatientById(1L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void createPatient_created() {
        PatientRequest req = new PatientRequest();
        when(adminService.createPatient(req)).thenReturn(mock(PatientResponse.class));
        assertThat(controller.createPatient(req).getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    void createPatient_badRequest() {
        PatientRequest req = new PatientRequest();
        when(adminService.createPatient(req)).thenThrow(new RuntimeException("e"));
        assertThat(controller.createPatient(req).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void updatePatient_success() {
        AdminUpdatePatientRequest req = new AdminUpdatePatientRequest();
        when(adminService.updatePatient(1L, req)).thenReturn(mock(PatientResponse.class));
        assertThat(controller.updatePatient(1L, req).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void updatePatient_badRequest() {
        AdminUpdatePatientRequest req = new AdminUpdatePatientRequest();
        when(adminService.updatePatient(1L, req)).thenThrow(new RuntimeException("e"));
        assertThat(controller.updatePatient(1L, req).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void deletePatient_success() {
        assertThat(controller.deletePatient(1L).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void deletePatient_notFound() {
        doThrow(new RuntimeException("nf")).when(adminService).deletePatient(1L);
        assertThat(controller.deletePatient(1L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ── Appointments ──
    @Test
    void getAllAppointments_ok() {
        when(adminService.getAllAppointments(any())).thenReturn(List.of());
        assertThat(controller.getAllAppointments(null).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getAppointmentById_found() {
        when(adminService.getAppointmentById(1L)).thenReturn(mock(AppointmentResponse.class));
        assertThat(controller.getAppointmentById(1L).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getAppointmentById_notFound() {
        when(adminService.getAppointmentById(1L)).thenThrow(new RuntimeException("nf"));
        assertThat(controller.getAppointmentById(1L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void updateAppointment_success() {
        UpdateAppointmentRequest req = new UpdateAppointmentRequest();
        when(adminService.updateAppointment(1L, req)).thenReturn(mock(AppointmentResponse.class));
        assertThat(controller.updateAppointment(1L, req).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void updateAppointment_badRequest() {
        UpdateAppointmentRequest req = new UpdateAppointmentRequest();
        when(adminService.updateAppointment(1L, req)).thenThrow(new RuntimeException("e"));
        assertThat(controller.updateAppointment(1L, req).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void cancelAppointment_success() {
        CancelAppointmentRequest req = new CancelAppointmentRequest();
        assertThat(controller.cancelAppointment(1L, req).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void cancelAppointment_badRequest() {
        CancelAppointmentRequest req = new CancelAppointmentRequest();
        doThrow(new RuntimeException("e")).when(appointmentService).cancelAppointmentByAdmin(eq(1L), any());
        assertThat(controller.cancelAppointment(1L, req).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void deleteAppointment_success() {
        assertThat(controller.deleteAppointment(1L).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void deleteAppointment_notFound() {
        doThrow(new RuntimeException("nf")).when(adminService).deleteAppointment(1L);
        assertThat(controller.deleteAppointment(1L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ── Feedbacks ──
    @Test
    void getAllFeedbacks_ok() {
        when(adminService.getAllFeedbacks(null)).thenReturn(List.of());
        assertThat(controller.getAllFeedbacks(null).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getFeedbacksByDoctor_ok() {
        when(adminService.getFeedbacksByDoctor(1L)).thenReturn(List.of());
        assertThat(controller.getFeedbacksByDoctor(1L).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getFeedbacksByPatient_ok() {
        when(adminService.getFeedbacksByPatient(1L)).thenReturn(List.of());
        assertThat(controller.getFeedbacksByPatient(1L).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getFeedbackById_found() {
        when(adminService.getFeedbackById(1L)).thenReturn(mock(FeedbackResponse.class));
        assertThat(controller.getFeedbackById(1L).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getFeedbackById_notFound() {
        when(adminService.getFeedbackById(1L)).thenThrow(new RuntimeException("nf"));
        assertThat(controller.getFeedbackById(1L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void hideFeedback_success() {
        when(adminService.hideFeedback(1L)).thenReturn(mock(FeedbackResponse.class));
        assertThat(controller.hideFeedback(1L).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void hideFeedback_notFound() {
        when(adminService.hideFeedback(1L)).thenThrow(new RuntimeException("nf"));
        assertThat(controller.hideFeedback(1L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void unhideFeedback_success() {
        when(adminService.unhideFeedback(1L)).thenReturn(mock(FeedbackResponse.class));
        assertThat(controller.unhideFeedback(1L).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void unhideFeedback_notFound() {
        when(adminService.unhideFeedback(1L)).thenThrow(new RuntimeException("nf"));
        assertThat(controller.unhideFeedback(1L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
