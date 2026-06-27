package com.doctorbooking.backend.service;

import com.doctorbooking.backend.dto.request.ChangePasswordRequest;
import com.doctorbooking.backend.dto.request.UpdateUserRequest;
import com.doctorbooking.backend.dto.request.UserRequest;
import com.doctorbooking.backend.dto.response.UserResponse;
import com.doctorbooking.backend.model.User;
import com.doctorbooking.backend.repository.AdminRepository;
import com.doctorbooking.backend.repository.DoctorRepository;
import com.doctorbooking.backend.repository.PatientRepository;
import com.doctorbooking.backend.repository.UserRepository;
import com.doctorbooking.backend.util.TestMockFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private AdminRepository adminRepository;

    @InjectMocks
    private UserService userService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = TestMockFactory.createValidActiveUser(User.Role.PATIENT);
    }

    // ==========================================
    // Test: loadUserByUsername
    // ==========================================

    @Test
    void testLoadUserByUsername_SuccessByUsername() {
        when(userRepository.findByUsername(mockUser.getUsername())).thenReturn(Optional.of(mockUser));
        
        UserDetails result = userService.loadUserByUsername(mockUser.getUsername());
        
        assertNotNull(result);
        assertEquals(mockUser.getUsername(), result.getUsername());
        verify(userRepository, times(1)).findByUsername(mockUser.getUsername());
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    void testLoadUserByUsername_SuccessByEmail() {
        when(userRepository.findByUsername(mockUser.getEmail())).thenReturn(Optional.empty());
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        
        UserDetails result = userService.loadUserByUsername(mockUser.getEmail());
        
        assertNotNull(result);
        assertEquals(mockUser.getUsername(), result.getUsername());
        verify(userRepository, times(1)).findByUsername(mockUser.getEmail());
        verify(userRepository, times(1)).findByEmail(mockUser.getEmail());
    }

    @Test
    void testLoadUserByUsername_NotFound_ThrowsException() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("unknown")).thenReturn(Optional.empty());
        when(userRepository.count()).thenReturn(0L);
        
        assertThrows(UsernameNotFoundException.class, () -> userService.loadUserByUsername("unknown"));
    }

    // ==========================================
    // Test: Basic Find Methods
    // ==========================================

    @Test
    void testFindById_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        User result = userService.findById(1L);
        assertEquals(1L, result.getId());
    }

    @Test
    void testFindById_NotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> userService.findById(99L));
    }
    
    @Test
    void testFindByUsername_NotFound() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        assertThrows(UsernameNotFoundException.class, () -> userService.findByUsername("unknown"));
    }

    // ==========================================
    // Test: createUser
    // ==========================================

    @Test
    void testCreateUser_Success_PatientRole() {
        UserRequest request = new UserRequest();
        request.setUsername("newuser");
        request.setEmail("new@example.com");
        request.setPassword("password123");
        request.setRole(User.Role.PATIENT);
        request.setEnabled(true);

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        
        User savedUser = new User();
        savedUser.setId(10L);
        savedUser.setUsername("newuser");
        savedUser.setRole(User.Role.PATIENT);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(patientRepository.findByUserId(10L)).thenReturn(Optional.empty());

        UserResponse response = userService.createUser(request);

        assertNotNull(response);
        assertEquals("newuser", response.getUsername());
        verify(userRepository, times(1)).save(any(User.class));
        verify(patientRepository, times(1)).save(any());
    }

    @Test
    void testCreateUser_UsernameExists_ThrowsException() {
        UserRequest request = new UserRequest();
        request.setUsername("existing");
        
        when(userRepository.existsByUsername("existing")).thenReturn(true);
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> userService.createUser(request));
        assertEquals("Username already exists", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testCreateUser_EmailExists_ThrowsException() {
        UserRequest request = new UserRequest();
        request.setUsername("newuser");
        request.setEmail("existing@example.com");
        
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> userService.createUser(request));
        assertEquals("Email already exists", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    // ==========================================
    // Test: updateUser
    // ==========================================

    @Test
    void testUpdateUser_Success() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setUsername("updated");
        request.setEmail("updated@example.com");
        request.setRole(User.Role.PATIENT);
        request.setEnabled(false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(userRepository.existsByUsername("updated")).thenReturn(false);
        when(userRepository.existsByEmail("updated@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(new com.doctorbooking.backend.model.Patient()));

        UserResponse response = userService.updateUser(1L, request);

        assertNotNull(response);
        assertFalse(mockUser.getEnabled()); // It was updated
        assertEquals("updated", mockUser.getUsername());
        verify(userRepository, times(1)).save(mockUser);
    }
    
    @Test
    void testUpdateUser_EmailConflict_ThrowsException() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setUsername(mockUser.getUsername()); // Same username
        request.setEmail("conflict@example.com"); // New email
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(userRepository.existsByEmail("conflict@example.com")).thenReturn(true);
        
        assertThrows(RuntimeException.class, () -> userService.updateUser(1L, request));
    }

    // ==========================================
    // Test: deleteUser
    // ==========================================

    @Test
    void testDeleteUser_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.empty());
        
        assertDoesNotThrow(() -> userService.deleteUser(1L));
        
        verify(userRepository, times(1)).delete(mockUser);
    }

    @Test
    void testDeleteUser_DataIntegrityViolation_ThrowsException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        doThrow(new DataIntegrityViolationException("Constraint violation")).when(userRepository).delete(mockUser);
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> userService.deleteUser(1L));
        assertTrue(exception.getMessage().contains("Không thể xóa người dùng này vì vẫn còn dữ liệu liên quan"));
    }

    // ==========================================
    // Test: toggleUserStatus
    // ==========================================

    @Test
    void testToggleUserStatus() {
        assertTrue(mockUser.getEnabled());
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(userRepository.save(mockUser)).thenReturn(mockUser);
        
        UserResponse response = userService.toggleUserStatus(1L);
        
        assertFalse(response.getEnabled());
        verify(userRepository, times(1)).save(mockUser);
    }

    // ==========================================
    // Test: changeUserPassword
    // ==========================================

    @Test
    void testChangeUserPassword() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setNewPassword("newPass");
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.encode("newPass")).thenReturn("encodedNewPass");
        
        userService.changeUserPassword(1L, request);
        
        assertEquals("encodedNewPass", mockUser.getPassword());
        verify(userRepository, times(1)).save(mockUser);
    }
    
    // ==========================================
    // Test: searchUsers
    // ==========================================

    @Test
    void testSearchUsers_EmptySearch_ReturnsAll() {
        when(userRepository.findAll()).thenReturn(List.of(mockUser));
        List<UserResponse> responses = userService.searchUsers("");
        assertEquals(1, responses.size());
    }

    @Test
    void testSearchUsers_WithQuery() {
        when(userRepository.findAll()).thenReturn(List.of(mockUser));
        List<UserResponse> responses = userService.searchUsers("test");
        assertEquals(1, responses.size());
        
        List<UserResponse> noMatch = userService.searchUsers("nomatch");
        assertEquals(0, noMatch.size());
    }
}
