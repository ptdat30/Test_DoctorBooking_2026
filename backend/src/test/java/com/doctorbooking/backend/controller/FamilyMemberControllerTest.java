package com.doctorbooking.backend.controller;

import com.doctorbooking.backend.dto.request.CreateFamilyMemberRequest;
import com.doctorbooking.backend.dto.request.UpdateFamilyMemberRequest;
import com.doctorbooking.backend.dto.response.FamilyMemberResponse;
import com.doctorbooking.backend.model.Patient;
import com.doctorbooking.backend.repository.PatientRepository;
import com.doctorbooking.backend.service.FamilyMemberService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FamilyMemberController Unit Tests")
class FamilyMemberControllerTest {

    @Mock private FamilyMemberService familyMemberService;
    @Mock private PatientRepository patientRepository;

    @InjectMocks
    private FamilyMemberController controller;

    private final UserDetails userDetails =
            User.withUsername("patient").password("x").roles("PATIENT").build();

    @BeforeEach
    void setUp() {
        Patient patient = mock(Patient.class);
        lenient().when(patient.getId()).thenReturn(6L);
        lenient().when(patientRepository.findByUser_Username("patient")).thenReturn(Optional.of(patient));
    }

    @Test
    void getFamilyMembers_success() {
        when(familyMemberService.getFamilyMembers(6L)).thenReturn(List.of());
        ResponseEntity<List<FamilyMemberResponse>> result = controller.getFamilyMembers(userDetails);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getFamilyMembers_error_internalServerError() {
        when(patientRepository.findByUser_Username("patient")).thenReturn(Optional.empty());
        ResponseEntity<List<FamilyMemberResponse>> result = controller.getFamilyMembers(userDetails);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void getFamilyStats_success() {
        when(familyMemberService.getFamilyStats(6L))
                .thenReturn(mock(FamilyMemberService.FamilyStatsResponse.class));
        ResponseEntity<FamilyMemberService.FamilyStatsResponse> result = controller.getFamilyStats(userDetails);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getFamilyStats_error_internalServerError() {
        when(patientRepository.findByUser_Username("patient")).thenReturn(Optional.empty());
        ResponseEntity<FamilyMemberService.FamilyStatsResponse> result = controller.getFamilyStats(userDetails);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void createFamilyMember_created() {
        CreateFamilyMemberRequest req = new CreateFamilyMemberRequest();
        when(familyMemberService.createFamilyMember(6L, req)).thenReturn(mock(FamilyMemberResponse.class));
        ResponseEntity<?> result = controller.createFamilyMember(userDetails, req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    void createFamilyMember_runtimeException_badRequest() {
        CreateFamilyMemberRequest req = new CreateFamilyMemberRequest();
        when(familyMemberService.createFamilyMember(6L, req)).thenThrow(new RuntimeException("dup"));
        ResponseEntity<?> result = controller.createFamilyMember(userDetails, req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void updateFamilyMember_success() {
        UpdateFamilyMemberRequest req = new UpdateFamilyMemberRequest();
        when(familyMemberService.updateFamilyMember(6L, 1L, req)).thenReturn(mock(FamilyMemberResponse.class));
        ResponseEntity<?> result = controller.updateFamilyMember(userDetails, 1L, req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void updateFamilyMember_runtimeException_badRequest() {
        UpdateFamilyMemberRequest req = new UpdateFamilyMemberRequest();
        when(familyMemberService.updateFamilyMember(6L, 1L, req)).thenThrow(new RuntimeException("e"));
        ResponseEntity<?> result = controller.updateFamilyMember(userDetails, 1L, req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void deleteFamilyMember_success() {
        ResponseEntity<?> result = controller.deleteFamilyMember(userDetails, 1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void deleteFamilyMember_runtimeException_badRequest() {
        doThrow(new RuntimeException("e")).when(familyMemberService).deleteFamilyMember(6L, 1L);
        ResponseEntity<?> result = controller.deleteFamilyMember(userDetails, 1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
