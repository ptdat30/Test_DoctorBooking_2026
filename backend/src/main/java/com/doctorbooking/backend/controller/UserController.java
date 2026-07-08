package com.doctorbooking.backend.controller;

import com.doctorbooking.backend.dto.request.ChangePasswordRequest;
import com.doctorbooking.backend.dto.request.UpdateUserRequest;
import com.doctorbooking.backend.dto.request.UserRequest;
import com.doctorbooking.backend.dto.response.UserResponse;
import com.doctorbooking.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.doctorbooking.backend.exception.ResourceNotFoundException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.ZoneId;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    // ── Constants (java:S1192) ─────────────────────────────────────────────────
    private static final String FIELD_MESSAGE   = "message";
    private static final String FIELD_STATUS    = "status";
    private static final String FIELD_TIMESTAMP = "timestamp";
    private static final String ASIA_HO_CHI_MINH_ZONE = "Asia/Ho_Chi_Minh";

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestParam(required = false) String search) {
        if (search != null && !search.trim().isEmpty()) {
            return ResponseEntity.ok(userService.searchUsers(search));
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        try {
            UserResponse user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody UserRequest request) {
        try {
            UserResponse user = userService.createUser(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(user);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        try {
            UserResponse user = userService.updateUser(id, request);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(FIELD_MESSAGE, "Không thể xóa người dùng này vì vẫn còn dữ liệu liên quan (ví dụ: lịch hẹn, phản hồi, v.v.). Bạn cần xóa hoặc chuyển các dữ liệu liên quan trước khi xóa người dùng này.");
            errorResponse.put(FIELD_STATUS, HttpStatus.CONFLICT.value());
            errorResponse.put(FIELD_TIMESTAMP, LocalDateTime.now(ZoneId.of(ASIA_HO_CHI_MINH_ZONE)));
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
        } catch (ResourceNotFoundException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(FIELD_MESSAGE, e.getMessage());
            errorResponse.put(FIELD_STATUS, HttpStatus.NOT_FOUND.value());
            errorResponse.put(FIELD_TIMESTAMP, LocalDateTime.now(ZoneId.of(ASIA_HO_CHI_MINH_ZONE)));
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(FIELD_MESSAGE, e.getMessage());
            errorResponse.put(FIELD_STATUS, HttpStatus.BAD_REQUEST.value());
            errorResponse.put(FIELD_TIMESTAMP, LocalDateTime.now(ZoneId.of(ASIA_HO_CHI_MINH_ZONE)));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<UserResponse> toggleUserStatus(@PathVariable Long id) {
        try {
            UserResponse user = userService.toggleUserStatus(id);
            return ResponseEntity.ok(user);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/change-password")
    public ResponseEntity<String> changePassword(
            @PathVariable Long id,
            @Valid @RequestBody ChangePasswordRequest request) {
        try {
            userService.changeUserPassword(id, request);
            return ResponseEntity.ok("Password changed successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
