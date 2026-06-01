package com.doctorbooking.backend.service;

import com.doctorbooking.backend.dto.request.LoginRequest;
import com.doctorbooking.backend.dto.request.RegisterRequest;
import com.doctorbooking.backend.dto.response.AuthResponse;
import com.doctorbooking.backend.model.Admin;
import com.doctorbooking.backend.model.Doctor;
import com.doctorbooking.backend.model.Patient;
import com.doctorbooking.backend.model.User;
import com.doctorbooking.backend.repository.AdminRepository;
import com.doctorbooking.backend.repository.DoctorRepository;
import com.doctorbooking.backend.repository.PatientRepository;
import com.doctorbooking.backend.repository.UserRepository;
import com.doctorbooking.backend.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private AdminRepository adminRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    // ---- Helpers ----

    private User buildUser(Long id, String username, String email, User.Role role) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setPassword("plain_password");
        u.setEmail(email);
        u.setRole(role);
        u.setEnabled(true);
        return u;
    }

    private RegisterRequest buildRegisterRequest(String username, String email, String role) {
        RegisterRequest req = new RegisterRequest();
        req.setUsername(username);
        req.setPassword("password123");
        req.setEmail(email);
        req.setFullName("Test User");
        req.setPhone("0901234567");
        req.setRole(role);
        return req;
    }

    // =========================================================
    // REGISTER TESTS
    // =========================================================
    @Nested
    @DisplayName("register()")
    class RegisterTests {

        @Test
        @DisplayName("✅ Đăng ký thành công với role PATIENT")
        void register_success_patient() {
            // Arrange
            RegisterRequest req = buildRegisterRequest("newpatient", "newpatient@test.com", "PATIENT");
            User savedUser = buildUser(1L, "newpatient", "newpatient@test.com", User.Role.PATIENT);

            when(userRepository.existsByUsername("newpatient")).thenReturn(false);
            when(userRepository.existsByEmail("newpatient@test.com")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtUtil.generateToken(any(), any())).thenReturn("mock_access_token");
            when(jwtUtil.generateRefreshToken(any())).thenReturn("mock_refresh_token");

            // Act
            AuthResponse response = authService.register(req);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("mock_access_token");
            assertThat(response.getRefreshToken()).isEqualTo("mock_refresh_token");
            assertThat(response.getUsername()).isEqualTo("newpatient");
            assertThat(response.getEmail()).isEqualTo("newpatient@test.com");
            assertThat(response.getRole()).isEqualTo("PATIENT");

            verify(patientRepository, times(1)).save(any(Patient.class));
            verify(doctorRepository, never()).save(any());
            verify(adminRepository, never()).save(any());
        }

        @Test
        @DisplayName("✅ Đăng ký thành công với role DOCTOR")
        void register_success_doctor() {
            RegisterRequest req = buildRegisterRequest("newdoctor", "newdoctor@test.com", "DOCTOR");
            User savedUser = buildUser(2L, "newdoctor", "newdoctor@test.com", User.Role.DOCTOR);

            when(userRepository.existsByUsername("newdoctor")).thenReturn(false);
            when(userRepository.existsByEmail("newdoctor@test.com")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtUtil.generateToken(any(), any())).thenReturn("mock_token");
            when(jwtUtil.generateRefreshToken(any())).thenReturn("mock_refresh");

            AuthResponse response = authService.register(req);

            assertThat(response.getRole()).isEqualTo("DOCTOR");
            verify(doctorRepository, times(1)).save(any(Doctor.class));
            verify(patientRepository, never()).save(any());
        }

        @Test
        @DisplayName("✅ Đăng ký thành công với role ADMIN")
        void register_success_admin() {
            RegisterRequest req = buildRegisterRequest("newadmin", "newadmin@test.com", "ADMIN");
            User savedUser = buildUser(3L, "newadmin", "newadmin@test.com", User.Role.ADMIN);

            when(userRepository.existsByUsername("newadmin")).thenReturn(false);
            when(userRepository.existsByEmail("newadmin@test.com")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtUtil.generateToken(any(), any())).thenReturn("mock_token");
            when(jwtUtil.generateRefreshToken(any())).thenReturn("mock_refresh");

            AuthResponse response = authService.register(req);

            assertThat(response.getRole()).isEqualTo("ADMIN");
            verify(adminRepository, times(1)).save(any(Admin.class));
        }

        @Test
        @DisplayName("✅ Đăng ký không có role → mặc định PATIENT")
        void register_noRole_defaultsToPatient() {
            RegisterRequest req = buildRegisterRequest("defaultpatient", "dp@test.com", null);
            User savedUser = buildUser(4L, "defaultpatient", "dp@test.com", User.Role.PATIENT);

            when(userRepository.existsByUsername(any())).thenReturn(false);
            when(userRepository.existsByEmail(any())).thenReturn(false);
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtUtil.generateToken(any(), any())).thenReturn("token");
            when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh");

            AuthResponse response = authService.register(req);

            assertThat(response.getRole()).isEqualTo("PATIENT");
            verify(patientRepository, times(1)).save(any(Patient.class));
        }

        @Test
        @DisplayName("❌ Đăng ký thất bại - username đã tồn tại")
        void register_fails_usernameExists() {
            RegisterRequest req = buildRegisterRequest("existinguser", "new@test.com", "PATIENT");
            when(userRepository.existsByUsername("existinguser")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Username already exists");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("❌ Đăng ký thất bại - email đã tồn tại")
        void register_fails_emailExists() {
            RegisterRequest req = buildRegisterRequest("newuser", "existing@test.com", "PATIENT");
            when(userRepository.existsByUsername("newuser")).thenReturn(false);
            when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Email already exists");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("✅ Đăng ký với role không hợp lệ → mặc định PATIENT")
        void register_invalidRole_defaultsToPatient() {
            RegisterRequest req = buildRegisterRequest("testuser", "testuser@test.com", "INVALID_ROLE");
            User savedUser = buildUser(5L, "testuser", "testuser@test.com", User.Role.PATIENT);

            when(userRepository.existsByUsername(any())).thenReturn(false);
            when(userRepository.existsByEmail(any())).thenReturn(false);
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtUtil.generateToken(any(), any())).thenReturn("token");
            when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh");

            // Should not throw
            AuthResponse response = authService.register(req);
            assertThat(response).isNotNull();
        }
    }

    // =========================================================
    // LOGIN TESTS
    // =========================================================
    @Nested
    @DisplayName("login()")
    class LoginTests {

        @Test
        @DisplayName("✅ Đăng nhập thành công - trả về token và thông tin user")
        void login_success() {
            // Arrange
            User user = buildUser(1L, "trongdang", "trongdang@test.com", User.Role.PATIENT);
            Patient patient = new Patient();
            patient.setId(6L);
            patient.setUser(user);
            patient.setFullName("Đặng Tấn Trọng");

            LoginRequest loginReq = new LoginRequest();
            loginReq.setUsername("trongdang");
            loginReq.setPassword("Patient@123");

            Authentication mockAuth = mock(Authentication.class);
            when(mockAuth.getPrincipal()).thenReturn(user);
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(mockAuth);
            when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(patient));
            when(jwtUtil.generateToken(any(), any())).thenReturn("access_token_xyz");
            when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh_token_xyz");

            // Act
            AuthResponse response = authService.login(loginReq);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("access_token_xyz");
            assertThat(response.getRefreshToken()).isEqualTo("refresh_token_xyz");
            assertThat(response.getUsername()).isEqualTo("trongdang");
            assertThat(response.getRole()).isEqualTo("PATIENT");
            assertThat(response.getFullName()).isEqualTo("Đặng Tấn Trọng");
        }

        @Test
        @DisplayName("✅ Đăng nhập thành công với role ADMIN")
        void login_success_admin() {
            User adminUser = buildUser(2L, "admin", "admin@hospital.com", User.Role.ADMIN);
            Admin admin = new Admin();
            admin.setUser(adminUser);
            admin.setFullName("System Administrator");

            LoginRequest req = new LoginRequest();
            req.setUsername("admin");
            req.setPassword("Admin@123");

            Authentication mockAuth = mock(Authentication.class);
            when(mockAuth.getPrincipal()).thenReturn(adminUser);
            when(authenticationManager.authenticate(any())).thenReturn(mockAuth);
            when(adminRepository.findByUserId(2L)).thenReturn(Optional.of(admin));
            when(jwtUtil.generateToken(any(), any())).thenReturn("admin_token");
            when(jwtUtil.generateRefreshToken(any())).thenReturn("admin_refresh");

            AuthResponse response = authService.login(req);

            assertThat(response.getRole()).isEqualTo("ADMIN");
            assertThat(response.getFullName()).isEqualTo("System Administrator");
        }

        @Test
        @DisplayName("❌ Đăng nhập thất bại - sai mật khẩu")
        void login_fails_badCredentials() {
            LoginRequest req = new LoginRequest();
            req.setUsername("trongdang");
            req.setPassword("wrong_password");

            when(authenticationManager.authenticate(any()))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            assertThatThrownBy(() -> authService.login(req))
                    .isInstanceOf(BadCredentialsException.class);
        }

        @Test
        @DisplayName("✅ Đăng nhập - fullName null nếu patient chưa có profile")
        void login_patientWithoutProfile_fullNameNull() {
            User user = buildUser(99L, "noname", "noname@test.com", User.Role.PATIENT);
            LoginRequest req = new LoginRequest();
            req.setUsername("noname");
            req.setPassword("pass");

            Authentication mockAuth = mock(Authentication.class);
            when(mockAuth.getPrincipal()).thenReturn(user);
            when(authenticationManager.authenticate(any())).thenReturn(mockAuth);
            when(patientRepository.findByUserId(99L)).thenReturn(Optional.empty());
            when(jwtUtil.generateToken(any(), any())).thenReturn("token");
            when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh");

            AuthResponse response = authService.login(req);

            assertThat(response).isNotNull();
            assertThat(response.getFullName()).isNull();
        }
    }
}
