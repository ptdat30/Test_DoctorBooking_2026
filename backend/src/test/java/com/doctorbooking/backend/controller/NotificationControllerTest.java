package com.doctorbooking.backend.controller;

import com.doctorbooking.backend.model.Patient;
import com.doctorbooking.backend.repository.PatientRepository;
import com.doctorbooking.backend.service.NotificationService;
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
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationController Unit Tests")
class NotificationControllerTest {

    @Mock private NotificationService notificationService;
    @Mock private PatientRepository patientRepository;

    @InjectMocks
    private NotificationController controller;

    @BeforeEach
    void setUp() {
        UserDetails userDetails = User.withUsername("patient").password("x").roles("PATIENT").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));

        Patient patient = mock(Patient.class);
        lenient().when(patient.getId()).thenReturn(6L);
        lenient().when(patientRepository.findByUser_Username("patient")).thenReturn(Optional.of(patient));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getNotifications_success() {
        when(notificationService.getNotificationsByPatientId(6L)).thenReturn(List.of());
        ResponseEntity<?> result = controller.getNotifications();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getNotifications_notAuthenticated_badRequest() {
        SecurityContextHolder.clearContext();
        ResponseEntity<?> result = controller.getNotifications();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getNotifications_patientNotFound_badRequest() {
        when(patientRepository.findByUser_Username("patient")).thenReturn(Optional.empty());
        ResponseEntity<?> result = controller.getNotifications();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getUnreadCount_success() {
        when(notificationService.getUnreadCount(6L)).thenReturn(3L);
        ResponseEntity<?> result = controller.getUnreadCount();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getUnreadCount_error() {
        when(notificationService.getUnreadCount(6L)).thenThrow(new RuntimeException("e"));
        ResponseEntity<?> result = controller.getUnreadCount();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void markAsRead_success() {
        ResponseEntity<?> result = controller.markAsRead(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void markAsRead_error() {
        doThrow(new RuntimeException("e")).when(notificationService).markAsRead(1L, 6L);
        ResponseEntity<?> result = controller.markAsRead(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void markAllAsRead_success() {
        ResponseEntity<?> result = controller.markAllAsRead();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void markAllAsRead_error() {
        doThrow(new RuntimeException("e")).when(notificationService).markAllAsRead(6L);
        ResponseEntity<?> result = controller.markAllAsRead();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void deleteNotification_success() {
        ResponseEntity<?> result = controller.deleteNotification(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void deleteNotification_error() {
        doThrow(new RuntimeException("e")).when(notificationService).deleteNotification(1L, 6L);
        ResponseEntity<?> result = controller.deleteNotification(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
