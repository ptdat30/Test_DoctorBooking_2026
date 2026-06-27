package com.doctorbooking.backend.service;

import com.doctorbooking.backend.dto.request.ChangePasswordRequest;
import com.doctorbooking.backend.dto.request.DoctorRequest;
import com.doctorbooking.backend.dto.request.UpdateProfileRequest;
import com.doctorbooking.backend.dto.response.DoctorResponse;
import com.doctorbooking.backend.model.Doctor;
import com.doctorbooking.backend.model.User;
import com.doctorbooking.backend.model.User;
import com.doctorbooking.backend.repository.DoctorRepository;
import com.doctorbooking.backend.repository.UserRepository;
import com.doctorbooking.backend.util.TestMockFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private DoctorService doctorService;

    private Doctor mockDoctor;
    private User mockUser;

    @BeforeEach
    void setUp() {
        mockDoctor = TestMockFactory.createValidActiveDoctor();
        mockUser = mockDoctor.getUser();
    }

    // ==========================================
    // Test: getAllDoctors, searchDoctors, getActiveDoctors
    // ==========================================

    @Test
    void testGetAllDoctors() {
        when(doctorRepository.findAll()).thenReturn(List.of(mockDoctor));
        List<DoctorResponse> result = doctorService.getAllDoctors();
        assertEquals(1, result.size());
    }

    @Test
    void testSearchDoctors() {
        when(doctorRepository.searchDoctors("Tran")).thenReturn(List.of(mockDoctor));
        List<DoctorResponse> result = doctorService.searchDoctors("Tran");
        assertEquals(1, result.size());
    }

    @Test
    void testGetActiveDoctors() {
        when(doctorRepository.findByStatus(Doctor.DoctorStatus.ACTIVE)).thenReturn(List.of(mockDoctor));
        List<DoctorResponse> result = doctorService.getActiveDoctors();
        assertEquals(1, result.size());
    }

    // ==========================================
    // Test: getDoctorById
    // ==========================================

    @Test
    void testGetDoctorById_Success() {
        when(doctorRepository.findById(200L)).thenReturn(Optional.of(mockDoctor));
        DoctorResponse result = doctorService.getDoctorById(200L);
        assertNotNull(result);
        assertEquals(mockDoctor.getFullName(), result.getFullName());
    }

    @Test
    void testGetDoctorById_NotFound() {
        when(doctorRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> doctorService.getDoctorById(999L));
    }

    // ==========================================
    // Test: createDoctor
    // ==========================================

    @Test
    void testCreateDoctor_Success() {
        DoctorRequest request = new DoctorRequest();
        request.setUsername("newdr");
        request.setEmail("dr@example.com");
        request.setPassword("pass");
        request.setFullName("Dr. New");
        
        when(userRepository.existsByUsername("newdr")).thenReturn(false);
        when(userRepository.existsByEmail("dr@example.com")).thenReturn(false);
        when(passwordEncoder.encode("pass")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        when(doctorRepository.save(any(Doctor.class))).thenReturn(mockDoctor);

        DoctorResponse response = doctorService.createDoctor(request);
        assertNotNull(response);
        verify(userRepository, times(1)).save(any(User.class));
        verify(doctorRepository, times(1)).save(any(Doctor.class));
    }

    @Test
    void testCreateDoctor_UsernameExists() {
        DoctorRequest request = new DoctorRequest();
        request.setUsername("existing");
        when(userRepository.existsByUsername("existing")).thenReturn(true);
        assertThrows(RuntimeException.class, () -> doctorService.createDoctor(request));
    }

    @Test
    void testCreateDoctor_EmailExists() {
        DoctorRequest request = new DoctorRequest();
        request.setUsername("newdr");
        request.setEmail("existing@example.com");
        when(userRepository.existsByUsername("newdr")).thenReturn(false);
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);
        assertThrows(RuntimeException.class, () -> doctorService.createDoctor(request));
    }

    // ==========================================
    // Test: updateDoctor (Admin)
    // ==========================================

    @Test
    void testUpdateDoctor_Success() {
        DoctorRequest request = new DoctorRequest();
        request.setUsername("newdr");
        request.setEmail("new@example.com");
        request.setPassword("newpass");
        request.setFullName("Dr. Updated");
        request.setExperience(15);
        request.setPhone("0123");
        request.setAddress("Add");
        request.setBio("Bio");
        request.setQualification("MD");
        request.setSpecialization("Neuro");

        when(doctorRepository.findById(200L)).thenReturn(Optional.of(mockDoctor));
        when(userRepository.existsByUsername("newdr")).thenReturn(false);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(doctorRepository.save(any(Doctor.class))).thenReturn(mockDoctor);

        DoctorResponse response = doctorService.updateDoctor(200L, request);
        assertNotNull(response);
        assertEquals("newdr", mockUser.getUsername()); // Assert user updated
        verify(userRepository, times(1)).save(mockUser);
        verify(doctorRepository, times(1)).save(mockDoctor);
    }
    
    @Test
    void testUpdateDoctor_UsernameConflict() {
        DoctorRequest request = new DoctorRequest();
        request.setUsername("conflict"); // Changed
        
        when(doctorRepository.findById(200L)).thenReturn(Optional.of(mockDoctor));
        when(userRepository.existsByUsername("conflict")).thenReturn(true);
        
        assertThrows(RuntimeException.class, () -> doctorService.updateDoctor(200L, request));
    }

    @Test
    void testUpdateDoctor_EmailConflict() {
        DoctorRequest request = new DoctorRequest();
        request.setEmail("conflict@example.com"); // Changed
        
        when(doctorRepository.findById(200L)).thenReturn(Optional.of(mockDoctor));
        when(userRepository.existsByEmail("conflict@example.com")).thenReturn(true);
        
        assertThrows(RuntimeException.class, () -> doctorService.updateDoctor(200L, request));
    }

    // ==========================================
    // Test: ensureDoctorProfile & getDoctorByUserId
    // ==========================================

    @Test
    void testEnsureDoctorProfile_Exists() {
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.of(mockDoctor));
        DoctorResponse response = doctorService.getDoctorByUserId(1L);
        assertNotNull(response);
    }

    @Test
    void testEnsureDoctorProfile_NotExists_CreatesNew() {
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(doctorRepository.save(any(Doctor.class))).thenReturn(mockDoctor);
        
        DoctorResponse response = doctorService.getDoctorByUserId(1L);
        assertNotNull(response);
        verify(doctorRepository, times(1)).save(any(Doctor.class));
    }
    
    @Test
    void testEnsureDoctorProfile_NotExists_UserNotDoctorRole() {
        mockUser.setRole(User.Role.PATIENT);
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        
        assertThrows(RuntimeException.class, () -> doctorService.getDoctorByUserId(1L));
    }

    @Test
    void testEnsureDoctorProfile_UserNotFound() {
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        
        assertThrows(RuntimeException.class, () -> doctorService.getDoctorByUserId(1L));
    }

    // ==========================================
    // Test: updateDoctorProfile
    // ==========================================

    @Test
    void testUpdateDoctorProfile() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("Updated");
        request.setSpecialization("Spec");
        request.setQualification("Qual");
        request.setExperience(5);
        request.setPhone("011");
        request.setAddress("Add");
        request.setBio("Bio");
        
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.of(mockDoctor));
        when(doctorRepository.save(any(Doctor.class))).thenReturn(mockDoctor);
        
        DoctorResponse response = doctorService.updateDoctorProfile(1L, request);
        assertNotNull(response);
        verify(doctorRepository, times(1)).save(mockDoctor);
    }

    // ==========================================
    // Test: changePassword & deleteDoctor
    // ==========================================

    @Test
    void testChangePassword() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("encodedPassword123");
        request.setNewPassword("newPass");
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        
        doctorService.changePassword(1L, request);
        assertEquals("newPass", mockUser.getPassword());
        verify(userRepository, times(1)).save(mockUser);
    }
    
    @Test
    void testChangePassword_IncorrectCurrentPassword() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrong");
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        
        assertThrows(RuntimeException.class, () -> doctorService.changePassword(1L, request));
    }

    @Test
    void testDeleteDoctor() {
        when(doctorRepository.findById(200L)).thenReturn(Optional.of(mockDoctor));
        doctorService.deleteDoctor(200L);
        verify(doctorRepository, times(1)).delete(mockDoctor);
    }
}
