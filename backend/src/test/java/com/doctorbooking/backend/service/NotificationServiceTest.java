package com.doctorbooking.backend.service;

import com.doctorbooking.backend.model.Notification;
import com.doctorbooking.backend.model.Patient;
import com.doctorbooking.backend.repository.NotificationRepository;
import com.doctorbooking.backend.repository.PatientRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService Unit Tests")
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private PatientRepository patientRepository;

    @InjectMocks
    private NotificationService service;

    private final Notification.NotificationType type = Notification.NotificationType.values()[0];

    @Test
    void createNotification_success() {
        Patient patient = mock(Patient.class);
        when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
        when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Notification result = service.createNotification(6L, "t", "m", type, 1L);

        assertThat(result).isNotNull();
        verify(notificationRepository).save(any());
    }

    @Test
    void createNotification_patientNotFound() {
        when(patientRepository.findById(6L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.createNotification(6L, "t", "m", type, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Patient not found");
    }

    @Test
    void getNotificationsByPatientId_returnsList() {
        when(notificationRepository.findByPatientIdOrderByCreatedAtDesc(6L)).thenReturn(List.of());
        assertThat(service.getNotificationsByPatientId(6L)).isEmpty();
    }

    @Test
    void getUnreadCount_returnsCount() {
        when(notificationRepository.countUnreadByPatientId(6L)).thenReturn(5L);
        assertThat(service.getUnreadCount(6L)).isEqualTo(5L);
    }

    @Test
    void markAsRead_success() {
        Notification n = mockNotificationOwnedBy(6L);
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n));
        service.markAsRead(1L, 6L);
        verify(n).setIsRead(true);
        verify(notificationRepository).save(n);
    }

    @Test
    void markAsRead_notFound() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.markAsRead(1L, 6L))
                .hasMessageContaining("Notification not found");
    }

    @Test
    void markAsRead_wrongOwner() {
        Notification n = mockNotificationOwnedBy(99L);
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n));
        assertThatThrownBy(() -> service.markAsRead(1L, 6L))
                .hasMessageContaining("does not belong");
    }

    @Test
    void markAllAsRead_savesAll() {
        Notification n = mock(Notification.class);
        when(notificationRepository.findUnreadByPatientIdOrderByCreatedAtDesc(6L)).thenReturn(List.of(n));
        service.markAllAsRead(6L);
        verify(n).setIsRead(true);
        verify(notificationRepository).saveAll(any());
    }

    @Test
    void deleteNotification_success() {
        Notification n = mockNotificationOwnedBy(6L);
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n));
        service.deleteNotification(1L, 6L);
        verify(notificationRepository).delete(n);
    }

    @Test
    void deleteNotification_notFound() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deleteNotification(1L, 6L))
                .hasMessageContaining("Notification not found");
    }

    @Test
    void deleteNotification_wrongOwner() {
        Notification n = mockNotificationOwnedBy(99L);
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n));
        assertThatThrownBy(() -> service.deleteNotification(1L, 6L))
                .hasMessageContaining("does not belong");
    }

    private Notification mockNotificationOwnedBy(Long ownerId) {
        Notification n = mock(Notification.class);
        Patient p = mock(Patient.class);
        when(p.getId()).thenReturn(ownerId);
        when(n.getPatient()).thenReturn(p);
        return n;
    }
}
