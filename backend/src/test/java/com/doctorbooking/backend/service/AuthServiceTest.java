package com.doctorbooking.backend.service;

import com.doctorbooking.backend.dto.request.LoginRequest;
import com.doctorbooking.backend.dto.request.RegisterRequest;
import com.doctorbooking.backend.dto.response.AuthResponse;
import com.doctorbooking.backend.exception.BadRequestException;
import com.doctorbooking.backend.model.Admin;
import com.doctorbooking.backend.model.Patient;
import com.doctorbooking.backend.model.User;
import com.doctorbooking.backend.repository.*;
import com.doctorbooking.backend.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PatientRepository patientRepository;
    @Mock DoctorRepository doctorRepository;
    @Mock AdminRepository adminRepository;
    @Mock AuthenticationManager authenticationManager;
    @Mock Authentication authentication;
    @Mock JwtUtil jwtUtil;

    @InjectMocks
    AuthService authService;

    private User user;   // 👈 tạo ở đây

    @BeforeEach
    void setup() {
        user = new User(); // 👈 tạo ở đây
        user.setId(1L);
        user.setUsername("user1");
        user.setEmail("user1@gmail.com");
        user.setPassword("123456");
        user.setRole(User.Role.PATIENT);
        user.setEnabled(true);
    }

    // ===================== REGISTER =====================

    @Test
    void register_success_patient() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("user1");
        req.setEmail("a@a.com");
        req.setPassword("123");
        req.setFullName("Nguyen Van A");
        req.setRole("PATIENT");

        when(userRepository.existsByUsername("user1")).thenReturn(false);
        when(userRepository.existsByEmail("a@a.com")).thenReturn(false);

        when(userRepository.save(any())).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        when(jwtUtil.generateToken(any(), any())).thenReturn("token");
        when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh");

        AuthResponse res = authService.register(req);

        assertEquals("user1", res.getUsername());
        assertEquals("PATIENT", res.getRole());
    }

    @Test
    void register_success_doctor() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("doc1");
        req.setEmail("doc@a.com");
        req.setPassword("123");
        req.setFullName("Dr A");
        req.setRole("DOCTOR");

        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(userRepository.existsByEmail(any())).thenReturn(false);

        when(userRepository.save(any())).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(2L);
            return u;
        });

        when(jwtUtil.generateToken(any(), any())).thenReturn("token");
        when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh");

        AuthResponse res = authService.register(req);

        assertEquals("DOCTOR", res.getRole());
    }

    @Test
    void register_duplicate_username() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("user1");

        when(userRepository.existsByUsername("user1")).thenReturn(true);

        assertThrows(BadRequestException.class,
                () -> authService.register(req));
    }

    @Test
    void register_invalid_role_fallback() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("user2");
        req.setEmail("b@b.com");
        req.setPassword("123");
        req.setFullName("Test");
        req.setRole("INVALID_ROLE");

        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(userRepository.existsByEmail(any())).thenReturn(false);

        when(userRepository.save(any())).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(3L);
            return u;
        });

        when(jwtUtil.generateToken(any(), any())).thenReturn("token");
        when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh");

        AuthResponse res = authService.register(req);

        assertEquals("PATIENT", res.getRole()); // fallback default
    }

    // ===================== LOGIN =====================

    @Test
    void login_success_with_user_principal() {
        LoginRequest req = new LoginRequest();
        req.setUsername("user1");
        req.setPassword("123");

        User user = new User();
        user.setId(1L);
        user.setUsername("user1");
        user.setPassword("123");
        user.setEmail("a@a.com");
        user.setRole(User.Role.PATIENT);

        when(authenticationManager.authenticate(any()))
                .thenReturn(authentication);

        when(authentication.getPrincipal()).thenReturn(user);

        when(jwtUtil.generateToken(any(), any())).thenReturn("token");
        when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh");

        AuthResponse res = authService.login(req);

        assertEquals("user1", res.getUsername());
        assertEquals("PATIENT", res.getRole());
    }

    @Test
    void login_success_with_userdetails_not_user() {

        LoginRequest req = new LoginRequest();
        req.setUsername("user1");
        req.setPassword("123");

        org.springframework.security.core.userdetails.User springUser =
                new org.springframework.security.core.userdetails.User(
                        "user1", "123", List.of()
                );

        when(authenticationManager.authenticate(any()))
                .thenReturn(authentication);

        when(authentication.getPrincipal())
                .thenReturn(springUser);

        when(userRepository.findByUsername("user1"))
                .thenReturn(Optional.of(user));

        when(userRepository.findByEmail("user1"))
                .thenReturn(Optional.of(user));

        when(jwtUtil.generateToken(any(), any()))
                .thenReturn("token");

        when(jwtUtil.generateRefreshToken(any()))
                .thenReturn("refresh");

        AuthResponse res = authService.login(req);

        assertEquals("user1", res.getUsername());
    }
    @Test
    void register_success_admin() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("admin1");
        req.setEmail("admin@a.com");
        req.setPassword("123");
        req.setFullName("Admin");
        req.setRole("ADMIN");

        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(userRepository.existsByEmail(any())).thenReturn(false);

        when(userRepository.save(any())).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(10L);
            return u;
        });

        when(jwtUtil.generateToken(any(), any())).thenReturn("token");
        when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh");

        AuthResponse res = authService.register(req);

        assertEquals("ADMIN", res.getRole());
    }
    @Test
    void register_success_invalid_role_fallback_branch() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("x");
        req.setEmail("x@x.com");
        req.setPassword("123");
        req.setFullName("X");
        req.setRole("SOMETHING_RANDOM");

        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(userRepository.existsByEmail(any())).thenReturn(false);

        when(userRepository.save(any())).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(99L);
            return u;
        });

        when(jwtUtil.generateToken(any(), any())).thenReturn("token");
        when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh");

        AuthResponse res = authService.register(req);

        assertEquals("PATIENT", res.getRole());
    }

    @Test
    void login_fail_exception() {
        LoginRequest req = new LoginRequest();
        req.setUsername("user1");
        req.setPassword("wrong");

        when(authenticationManager.authenticate(any()))
                .thenThrow(new RuntimeException("fail"));

        assertThrows(RuntimeException.class,
                () -> authService.login(req));
    }

    // ===================== FULL NAME BRANCH =====================

    @Test
    void get_fullname_patient() {
        User user = new User();
        user.setId(1L);
        user.setRole(User.Role.PATIENT);

        Patient p = new Patient();
        p.setFullName("Patient A");

        when(patientRepository.findByUserId(1L))
                .thenReturn(Optional.of(p));

        String result = invokePrivate(user);

        assertEquals("Patient A", result);
    }

    @Test
    void get_fullname_doctor_null() {
        User user = new User();
        user.setId(2L);
        user.setRole(User.Role.DOCTOR);

        when(doctorRepository.findByUserId(2L))
                .thenReturn(Optional.empty());

        String result = invokePrivate(user);

        assertNull(result);
    }

    @Test
    void get_fullname_admin_default() {
        User user = new User();
        user.setId(3L);
        user.setRole(User.Role.ADMIN);

        Admin admin =
                new Admin();
        admin.setFullName(null);

        when(adminRepository.findByUserId(3L))
                .thenReturn(Optional.of(admin));

        String result = invokePrivate(user);

        assertNull(result);
    }

    // ===================== helper =====================

    private String invokePrivate(User user) {
        try {
            var method = AuthService.class
                    .getDeclaredMethod("getFullNameByRole", User.class);
            method.setAccessible(true);
            return (String) method.invoke(authService, user);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
