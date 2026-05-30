package com.doctorbooking.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── Constants (java:S1192) ─────────────────────────────────────────────────
    private static final String FIELD_TIMESTAMP = "timestamp";
    private static final String FIELD_STATUS    = "status";
    private static final String FIELD_MESSAGE   = "message";

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put(FIELD_TIMESTAMP, LocalDateTime.now());
        response.put(FIELD_STATUS, HttpStatus.BAD_REQUEST.value());
        response.put(FIELD_MESSAGE, "Dữ liệu gửi lên không hợp lệ: " + extractRootCause(ex));
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    private String extractRootCause(HttpMessageNotReadableException ex) {
        String message = ex.getMessage();
        if (message == null) return "Không thể đọc dữ liệu request";
        
        // Extract the most useful part of the error message
        if (message.contains("Cannot deserialize value of type `java.time.LocalTime`")) {
            return "Định dạng giờ hẹn không hợp lệ. Vui lòng dùng format HH:mm:ss (ví dụ: 08:00:00)";
        }
        if (message.contains("Cannot deserialize value of type `java.time.LocalDate`")) {
            return "Định dạng ngày hẹn không hợp lệ. Vui lòng dùng format YYYY-MM-DD (ví dụ: 2026-05-20)";
        }
        if (message.contains("Cannot deserialize")) {
            return "Kiểu dữ liệu không đúng định dạng yêu cầu";
        }
        
        // Truncate long messages
        return message.length() > 200 ? message.substring(0, 200) + "..." : message;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, Object> response = new HashMap<>();
        Map<String, String> errors = new HashMap<>();
        
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        response.put(FIELD_TIMESTAMP, LocalDateTime.now());
        response.put(FIELD_STATUS, HttpStatus.BAD_REQUEST.value());
        response.put("errors", errors);
        response.put(FIELD_MESSAGE, "Validation failed");
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(
            org.springframework.dao.DataIntegrityViolationException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put(FIELD_TIMESTAMP, LocalDateTime.now());
        response.put(FIELD_STATUS, HttpStatus.BAD_REQUEST.value());
        
        String message = ex.getMostSpecificCause().getMessage();
        if (message != null && message.contains("Duplicate entry")) {
            response.put(FIELD_MESSAGE, "Khung giờ này đã có lịch hẹn. Vui lòng chọn giờ khác.");
        } else if (message != null && message.contains("unique constraint") || 
                   (message != null && message.contains("UNIQUE"))) {
            response.put(FIELD_MESSAGE, "Dữ liệu bị trùng lặp. Vui lòng kiểm tra lại.");
        } else {
            response.put(FIELD_MESSAGE, "Lỗi dữ liệu: " + (message != null && message.length() > 200 ? message.substring(0, 200) : message));
        }
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put(FIELD_TIMESTAMP, LocalDateTime.now());
        response.put(FIELD_STATUS, HttpStatus.BAD_REQUEST.value());
        response.put(FIELD_MESSAGE, ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception ex) {
        Map<String, Object> response = new HashMap<>();
        response.put(FIELD_TIMESTAMP, LocalDateTime.now());
        response.put(FIELD_STATUS, HttpStatus.INTERNAL_SERVER_ERROR.value());
        response.put(FIELD_MESSAGE, "An error occurred: " + ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler({org.springframework.security.core.AuthenticationException.class, 
                      org.springframework.security.authentication.BadCredentialsException.class,
                      org.springframework.security.core.userdetails.UsernameNotFoundException.class})
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(Exception ex) {
        Map<String, Object> response = new HashMap<>();
        response.put(FIELD_TIMESTAMP, LocalDateTime.now());
        response.put(FIELD_STATUS, HttpStatus.UNAUTHORIZED.value());
        response.put(FIELD_MESSAGE, "Invalid username or password");
        response.put("error", ex.getClass().getSimpleName());
        response.put("details", ex.getMessage());
        
        // Log for debugging
        ex.printStackTrace();
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }
}
