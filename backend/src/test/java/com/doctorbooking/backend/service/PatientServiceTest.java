package com.doctorbooking.backend.service;

import com.doctorbooking.backend.dto.request.ChangePasswordRequest;
import com.doctorbooking.backend.dto.request.UpdatePatientProfileRequest;
import com.doctorbooking.backend.dto.response.PatientResponse;
import com.doctorbooking.backend.model.Patient;
import com.doctorbooking.backend.model.User;
import com.doctorbooking.backend.repository.PatientRepository;
import com.doctorbooking.backend.repository.TreatmentRepository;
import com.doctorbooking.backend.repository.UserRepository;
import com.doctorbooking.backend.util.TestMockFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private TreatmentRepository treatmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PatientService patientService;

    private Patient mockPatient;
    private User mockUser;

    @BeforeEach
    void setUp() {
        mockPatient = TestMockFactory.createValidPatient();
        mockUser = mockPatient.getUser();
    }

    // ==========================================
    // Test: searchPatients
    // ==========================================

    @Test
    void testSearchPatients_EmptyKeyword_ReturnsAll() {
        when(patientRepository.findAll()).thenReturn(List.of(mockPatient));
        List<PatientResponse> result = patientService.searchPatients("");
        assertEquals(1, result.size());
    }

    @Test
    void testSearchPatients_NullKeyword_ReturnsAll() {
        when(patientRepository.findAll()).thenReturn(List.of(mockPatient));
        List<PatientResponse> result = patientService.searchPatients(null);
        assertEquals(1, result.size());
    }

    @Test
    void testSearchPatients_WithKeyword() {
        when(patientRepository.searchPatients("Nguyen")).thenReturn(List.of(mockPatient));
        List<PatientResponse> result = patientService.searchPatients("Nguyen");
        assertEquals(1, result.size());
    }

    // ==========================================
    // Test: getPatientById
    // ==========================================

    @Test
    void testGetPatientById_Success() {
        when(patientRepository.findById(100L)).thenReturn(Optional.of(mockPatient));
        when(treatmentRepository.findByPatientId(100L)).thenReturn(Collections.emptyList());
        
        PatientResponse response = patientService.getPatientById(100L);
        assertNotNull(response);
        assertEquals(mockPatient.getFullName(), response.getFullName());
    }

    @Test
    void testGetPatientById_NotFound_ThrowsException() {
        when(patientRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> patientService.getPatientById(999L));
    }

    // ==========================================
    // Test: getAllPatients
    // ==========================================

    @Test
    void testGetAllPatients() {
        when(patientRepository.findAll()).thenReturn(List.of(mockPatient));
        List<PatientResponse> result = patientService.getAllPatients();
        assertEquals(1, result.size());
    }

    // ==========================================
    // Test: getPatientByUserId
    // ==========================================

    @Test
    void testGetPatientByUserId_Success() {
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(mockPatient));
        PatientResponse response = patientService.getPatientByUserId(1L);
        assertNotNull(response);
    }

    @Test
    void testGetPatientByUserId_NotFound_ThrowsException() {
        when(patientRepository.findByUserId(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> patientService.getPatientByUserId(999L));
    }

    // ==========================================
    // Test: updatePatientProfile
    // ==========================================

    @Test
    void testUpdatePatientProfile_Success() {
        UpdatePatientProfileRequest request = new UpdatePatientProfileRequest();
        request.setFullName("Updated Name");
        request.setGender("FEMALE");
        request.setPhone("0123456789");
        request.setAddress("New Address");
        request.setEmergencyContact("Wife");
        request.setEmergencyPhone("0987654321");
        
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(mockPatient));
        when(patientRepository.save(any(Patient.class))).thenReturn(mockPatient);
        
        PatientResponse response = patientService.updatePatientProfile(1L, request);
        
        assertEquals("Updated Name", mockPatient.getFullName());
        // assertEquals(Patient.Gender.FEMALE, mockPatient.getGender()); // Assume enum mapped
        assertEquals("0123456789", mockPatient.getPhone());
        assertEquals("New Address", mockPatient.getAddress());
        assertEquals("Wife", mockPatient.getEmergencyContact());
        assertEquals("0987654321", mockPatient.getEmergencyPhone());
        verify(patientRepository, times(1)).save(mockPatient);
    }

    @Test
    void testUpdatePatientProfile_InvalidGender_ThrowsException() {
        UpdatePatientProfileRequest request = new UpdatePatientProfileRequest();
        request.setGender("INVALID_GENDER");
        
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(mockPatient));
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> patientService.updatePatientProfile(1L, request));
        assertTrue(exception.getMessage().contains("Invalid gender"));
        verify(patientRepository, never()).save(any());
    }
    
    @Test
    void testUpdatePatientProfile_PatientNotFound() {
        UpdatePatientProfileRequest request = new UpdatePatientProfileRequest();
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> patientService.updatePatientProfile(1L, request));
    }

    // ==========================================
    // Test: changePassword
    // ==========================================

    @Test
    void testChangePassword_Success() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("encodedPassword123");
        request.setNewPassword("newPass");
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        
        patientService.changePassword(1L, request);
        
        assertEquals("newPass", mockUser.getPassword());
        verify(userRepository, times(1)).save(mockUser);
    }

    @Test
    void testChangePassword_IncorrectCurrentPassword_ThrowsException() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrongPass");
        request.setNewPassword("newPass");
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        
        assertThrows(RuntimeException.class, () -> patientService.changePassword(1L, request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testChangePassword_UserNotFound() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> patientService.changePassword(1L, request));
    }
}
