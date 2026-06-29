package com.doctorbooking.backend.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("PublicController Unit Tests")
class PublicControllerTest {

    private final PublicController controller = new PublicController();

    @Test
    @DisplayName("health check → 200 OK với status UP")
    void healthCheck_ok() {
        ResponseEntity<Map<String, String>> result = controller.healthCheck();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsEntry("status", "UP");
        assertThat(result.getBody()).containsKey("message");
    }
}
