package com.doctorbooking.backend.controller;

import com.doctorbooking.backend.dto.request.LoginRequest;
import com.doctorbooking.backend.dto.request.RegisterRequest;
import com.doctorbooking.backend.dto.response.AuthResponse;
import com.doctorbooking.backend.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController Unit Tests")
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    @Test
    @DisplayName("register thành công → 201 CREATED")
    void register_success() {
        RegisterRequest req = new RegisterRequest();
        AuthResponse resp = mock(AuthResponse.class);
        when(authService.register(req)).thenReturn(resp);

        ResponseEntity<?> result = authController.register(req);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(resp);
    }

    @Test
    @DisplayName("register lỗi nghiệp vụ → 400 BAD_REQUEST")
    void register_runtimeException_badRequest() {
        RegisterRequest req = new RegisterRequest();
        when(authService.register(req)).thenThrow(new RuntimeException("Username exists"));

        ResponseEntity<?> result = authController.register(req);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("login thành công → 200 OK")
    void login_success() {
        LoginRequest req = new LoginRequest();
        AuthResponse resp = mock(AuthResponse.class);
        when(authService.login(req)).thenReturn(resp);

        ResponseEntity<?> result = authController.login(req);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(resp);
    }

    @Test
    @DisplayName("login sai thông tin → 401 UNAUTHORIZED")
    void login_authenticationException_unauthorized() {
        LoginRequest req = new LoginRequest();
        when(authService.login(req)).thenThrow(new BadCredentialsException("bad"));

        ResponseEntity<?> result = authController.login(req);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("login lỗi hệ thống → 500 INTERNAL_SERVER_ERROR")
    void login_genericException_internalError() {
        LoginRequest req = new LoginRequest();
        when(authService.login(req)).thenThrow(new RuntimeException("boom"));

        ResponseEntity<?> result = authController.login(req);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    @DisplayName("test endpoint → 200 OK")
    void test_endpoint_ok() {
        ResponseEntity<String> result = authController.test();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).contains("working");
    }
}
