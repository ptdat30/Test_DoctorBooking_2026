package com.doctorbooking.backend.service;

import com.doctorbooking.backend.dto.response.SymptomCheckResponse;
import com.doctorbooking.backend.repository.DoctorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Vì Groq API được gọi qua HttpClient nội bộ (không inject được), các test này
 * xác minh nhánh fallback khi không gọi được API: toàn bộ logic build prompt,
 * retry và createFallbackResponse (chào hỏi / câu hỏi / triệu chứng).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AISymptomService Unit Tests (fallback path)")
class AISymptomServiceTest {

    @Mock private DoctorRepository doctorRepository;

    @InjectMocks
    private AISymptomService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "apiKey", "invalid-test-key");
        lenient().when(doctorRepository.findDistinctSpecializations())
                .thenReturn(List.of("Cardiology", "Neurology", "Gastroenterology"));
    }

    @Test
    @DisplayName("Lời chào → fallback thân thiện, riskLevel Low")
    void analyzeSymptoms_greeting_fallback() {
        SymptomCheckResponse result = service.analyzeSymptoms("xin chào");
        assertThat(result).isNotNull();
        assertThat(result.getSuggestedSpecialization()).isEqualTo("Other");
        assertThat(result.getRiskLevel()).isEqualTo("Low");
        assertThat(result.getAdvice()).isNotBlank();
    }

    @Test
    @DisplayName("Câu hỏi khám khoa nào → fallback có gợi ý")
    void analyzeSymptoms_question_fallback() {
        SymptomCheckResponse result = service.analyzeSymptoms("tôi nên khám khoa nào");
        assertThat(result).isNotNull();
        assertThat(result.getSuggestedSpecialization()).isEqualTo("Other");
        assertThat(result.getReason()).isNotNull();
    }

    @Test
    @DisplayName("Mô tả triệu chứng → fallback chung")
    void analyzeSymptoms_symptom_fallback() {
        SymptomCheckResponse result = service.analyzeSymptoms("đau bụng dữ dội");
        assertThat(result).isNotNull();
        assertThat(result.getAdvice()).isNotBlank();
    }
}
