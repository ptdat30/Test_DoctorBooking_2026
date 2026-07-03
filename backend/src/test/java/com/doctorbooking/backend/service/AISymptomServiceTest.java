package com.doctorbooking.backend.service;

import com.doctorbooking.backend.dto.response.SymptomCheckResponse;
import com.doctorbooking.backend.repository.DoctorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AISymptomServiceTest {
    @Test
    void testAnalyzeSymptoms_apiError() throws Exception {

        AISymptomService spy = Mockito.spy(aiSymptomService);

        doThrow(new RuntimeException("API Error"))
                .when(spy)
                .callGroqApi(anyString());

        SymptomCheckResponse result =
                spy.analyzeSymptoms("đau bụng");

        assertNotNull(result);
        assertEquals("Other", result.getSuggestedSpecialization());
    }
    @Test
    void testGreetingFallback() throws Exception {

        AISymptomService spy = Mockito.spy(aiSymptomService);

        doThrow(new RuntimeException())
                .when(spy)
                .callGroqApi(anyString());

        SymptomCheckResponse result =
                spy.analyzeSymptoms("xin chào");

        assertEquals("Low", result.getRiskLevel());
        assertTrue(result.getAdvice().contains("HealthAI"));
    }
    @Test
    void testQuestionFallback() throws Exception {

        AISymptomService spy = Mockito.spy(aiSymptomService);

        doThrow(new RuntimeException())
                .when(spy)
                .callGroqApi(anyString());

        SymptomCheckResponse result =
                spy.analyzeSymptoms("tôi nên khám khoa nào");

        assertEquals("Other", result.getSuggestedSpecialization());
    }
    @Test
    void testInvalidJson() throws Exception {

        AISymptomService spy = Mockito.spy(aiSymptomService);

        doReturn("abcxyz")
                .when(spy)
                .callGroqApi(anyString());

        SymptomCheckResponse result =
                spy.analyzeSymptoms("đau đầu");

        assertNotNull(result);
    }
    @Test
    void testMissingChoices() throws Exception {

        AISymptomService spy = Mockito.spy(aiSymptomService);

        doReturn("{}")
                .when(spy)
                .callGroqApi(anyString());

        SymptomCheckResponse result =
                spy.analyzeSymptoms("đau đầu");

        assertNotNull(result);
    }

    @Test
    void testEmptyField() throws Exception {

        AISymptomService spy = Mockito.spy(aiSymptomService);

        String json = """
    {
      "choices":[
      {
        "message":{
          "content":"{
          \\"suggestedSpecialization\\":\\"\\",
          \\"riskLevel\\":\\"\\",
          \\"advice\\":\\"\\",
          \\"reason\\":null,
          \\"homeRemedies\\":null
          }"
        }
      }]
    }
    """;

        doReturn(json)
                .when(spy)
                .callGroqApi(anyString());

        SymptomCheckResponse result =
                spy.analyzeSymptoms("đau đầu");

        assertEquals("Other", result.getSuggestedSpecialization());
        assertEquals("Low", result.getRiskLevel());
    }
    @Test
    void testApiExceptionFallback() throws Exception {

        AISymptomService spy = Mockito.spy(aiSymptomService);

        doThrow(new RuntimeException())
                .when(spy)
                .callGroqApi(anyString());

        SymptomCheckResponse result =
                spy.analyzeSymptoms("đau ngực");

        assertNotNull(result);
    }
    @Test
    void testGreeting() throws Exception {

        AISymptomService spy = Mockito.spy(aiSymptomService);

        doThrow(new RuntimeException())
                .when(spy)
                .callGroqApi(anyString());

        SymptomCheckResponse result =
                spy.analyzeSymptoms("xin chào");

        assertEquals("Low", result.getRiskLevel());
    }
    @Test
    void testQuestion() throws Exception {

        AISymptomService spy = Mockito.spy(aiSymptomService);

        doThrow(new RuntimeException())
                .when(spy)
                .callGroqApi(anyString());

        SymptomCheckResponse result =
                spy.analyzeSymptoms("tôi nên khám bác sĩ nào");

        assertTrue(result.getAdvice().length() > 10);
    }
    @Test
    void testRandomInput() throws Exception {

        AISymptomService spy = Mockito.spy(aiSymptomService);

        doThrow(new RuntimeException())
                .when(spy)
                .callGroqApi(anyString());

        SymptomCheckResponse result =
                spy.analyzeSymptoms("abcdefxyz");

        assertNotNull(result);
    }
    @Test
    void testNoChoices() throws Exception {

        AISymptomService spy = Mockito.spy(aiSymptomService);

        doReturn("{}")
                .when(spy)
                .callGroqApi(anyString());

        SymptomCheckResponse result =
                spy.analyzeSymptoms("đau đầu");

        assertNotNull(result);
    }
    @Test
    void testEmptyChoices() throws Exception {

        AISymptomService spy = Mockito.spy(aiSymptomService);

        doReturn("""
        {
            "choices":[]
        }
        """)
                .when(spy)
                .callGroqApi(anyString());

        SymptomCheckResponse result =
                spy.analyzeSymptoms("đau đầu");

        assertNotNull(result);
    }
    @Test
    void testMissingContent() throws Exception {

        AISymptomService spy = Mockito.spy(aiSymptomService);

        doReturn("""
        {
            "choices":[
                {
                    "message":{}
                }
            ]
        }
        """)
                .when(spy)
                .callGroqApi(anyString());

        SymptomCheckResponse result =
                spy.analyzeSymptoms("đau đầu");

        assertNotNull(result);
    }
    @Test
    void testAnalyzeSymptoms_success() throws Exception {

        AISymptomService spy = Mockito.spy(aiSymptomService);

        String fakeResponse = """
    {
      "choices":[
        {
          "message":{
            "content":"{\\"suggestedSpecialization\\":\\"Cardiology\\",\\"riskLevel\\":\\"Low\\",\\"advice\\":\\"OK\\",\\"reason\\":\\"\\",\\"homeRemedies\\":[]}"
          }
        }
      ]
    }
    """;

        doReturn(fakeResponse)
                .when(spy)
                .callGroqApi(anyString());

        SymptomCheckResponse result =
                spy.analyzeSymptoms("đau ngực");

        assertNotNull(result);
        assertEquals("Cardiology", result.getSuggestedSpecialization());
        assertEquals("Low", result.getRiskLevel());
    }

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private AISymptomService aiSymptomService;

    @BeforeEach
    void setup() {
        when(doctorRepository.findDistinctSpecializations())
                .thenReturn(List.of("Cardiology", "Neurology", "Gastroenterology"));
    }

    private AISymptomService createSpy() {
        return Mockito.spy(aiSymptomService);
    }
}