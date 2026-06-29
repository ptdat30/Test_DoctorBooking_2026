package com.doctorbooking.backend.service;

import com.doctorbooking.backend.dto.request.CreateFamilyMemberRequest;
import com.doctorbooking.backend.dto.request.UpdateFamilyMemberRequest;
import com.doctorbooking.backend.model.FamilyMember;
import com.doctorbooking.backend.model.Patient;
import com.doctorbooking.backend.repository.FamilyMemberRepository;
import com.doctorbooking.backend.repository.PatientRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FamilyMemberService Unit Tests")
class FamilyMemberServiceTest {

    @Mock private FamilyMemberRepository familyMemberRepository;
    @Mock private PatientRepository patientRepository;

    @InjectMocks
    private FamilyMemberService service;

    // ── getFamilyMembers ──
    @Test
    void getFamilyMembers_returnsList() {
        when(familyMemberRepository.findByMainPatientId(6L)).thenReturn(List.of());
        assertThat(service.getFamilyMembers(6L)).isEmpty();
    }

    // ── createFamilyMember ──
    @Test
    void createFamilyMember_nonSelf_success() {
        CreateFamilyMemberRequest req = mock(CreateFamilyMemberRequest.class);
        when(req.getRelationship()).thenReturn(FamilyMember.Relationship.CHILD);
        when(req.getMedicalHistory()).thenReturn("Hen suyễn");
        when(patientRepository.findById(6L)).thenReturn(Optional.of(mock(Patient.class)));
        when(familyMemberRepository.save(any())).thenReturn(mock(FamilyMember.class));

        assertThat(service.createFamilyMember(6L, req)).isNotNull();
    }

    @Test
    void createFamilyMember_self_success() {
        CreateFamilyMemberRequest req = mock(CreateFamilyMemberRequest.class);
        when(req.getRelationship()).thenReturn(FamilyMember.Relationship.SELF);
        when(patientRepository.findById(6L)).thenReturn(Optional.of(mock(Patient.class)));
        when(familyMemberRepository.countMainAccountByPatientId(6L)).thenReturn(0L);
        when(familyMemberRepository.save(any())).thenReturn(mock(FamilyMember.class));

        assertThat(service.createFamilyMember(6L, req)).isNotNull();
    }

    @Test
    void createFamilyMember_self_mainExists() {
        CreateFamilyMemberRequest req = mock(CreateFamilyMemberRequest.class);
        when(req.getRelationship()).thenReturn(FamilyMember.Relationship.SELF);
        when(patientRepository.findById(6L)).thenReturn(Optional.of(mock(Patient.class)));
        when(familyMemberRepository.countMainAccountByPatientId(6L)).thenReturn(1L);

        assertThatThrownBy(() -> service.createFamilyMember(6L, req))
                .hasMessageContaining("Main account already exists");
    }

    @Test
    void createFamilyMember_patientNotFound() {
        CreateFamilyMemberRequest req = mock(CreateFamilyMemberRequest.class);
        when(patientRepository.findById(6L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.createFamilyMember(6L, req))
                .hasMessageContaining("Patient not found");
    }

    // ── updateFamilyMember ──
    @Test
    void updateFamilyMember_notFound() {
        UpdateFamilyMemberRequest req = mock(UpdateFamilyMemberRequest.class);
        when(familyMemberRepository.findByIdAndMainPatientId(1L, 6L)).thenReturn(null);
        assertThatThrownBy(() -> service.updateFamilyMember(6L, 1L, req))
                .hasMessageContaining("not found or access denied");
    }

    @Test
    void updateFamilyMember_mainAccount_throws() {
        UpdateFamilyMemberRequest req = mock(UpdateFamilyMemberRequest.class);
        FamilyMember member = mock(FamilyMember.class);
        when(member.getIsMainAccount()).thenReturn(true);
        when(familyMemberRepository.findByIdAndMainPatientId(1L, 6L)).thenReturn(member);
        assertThatThrownBy(() -> service.updateFamilyMember(6L, 1L, req))
                .hasMessageContaining("Cannot update main account");
    }

    @Test
    void updateFamilyMember_relationshipSelf_throws() {
        UpdateFamilyMemberRequest req = mock(UpdateFamilyMemberRequest.class);
        when(req.getRelationship()).thenReturn(FamilyMember.Relationship.SELF);
        FamilyMember member = mock(FamilyMember.class);
        when(member.getIsMainAccount()).thenReturn(false);
        when(familyMemberRepository.findByIdAndMainPatientId(1L, 6L)).thenReturn(member);
        assertThatThrownBy(() -> service.updateFamilyMember(6L, 1L, req))
                .hasMessageContaining("Cannot update relationship to SELF");
    }

    @Test
    void updateFamilyMember_allFields_success() {
        UpdateFamilyMemberRequest req = mock(UpdateFamilyMemberRequest.class);
        when(req.getFullName()).thenReturn("Nguyen Van A");
        when(req.getRelationship()).thenReturn(FamilyMember.Relationship.CHILD);
        when(req.getPhone()).thenReturn("0900000000");
        when(req.getAddress()).thenReturn("HCM");
        when(req.getBloodType()).thenReturn("O");
        when(req.getMedicalHistory()).thenReturn("Tiểu đường");
        FamilyMember member = mock(FamilyMember.class);
        when(member.getIsMainAccount()).thenReturn(false);
        when(familyMemberRepository.findByIdAndMainPatientId(1L, 6L)).thenReturn(member);
        when(familyMemberRepository.save(member)).thenReturn(member);

        assertThat(service.updateFamilyMember(6L, 1L, req)).isNotNull();
        verify(member).setFullName("Nguyen Van A");
        verify(member).setRelationship(FamilyMember.Relationship.CHILD);
    }

    @Test
    void updateFamilyMember_emptyMedicalHistory_setsNull() {
        UpdateFamilyMemberRequest req = mock(UpdateFamilyMemberRequest.class);
        when(req.getMedicalHistory()).thenReturn("   ");
        FamilyMember member = mock(FamilyMember.class);
        when(member.getIsMainAccount()).thenReturn(false);
        when(familyMemberRepository.findByIdAndMainPatientId(1L, 6L)).thenReturn(member);
        when(familyMemberRepository.save(member)).thenReturn(member);

        service.updateFamilyMember(6L, 1L, req);
        verify(member).setAllergies(null);
    }

    // ── deleteFamilyMember ──
    @Test
    void deleteFamilyMember_notFound() {
        when(familyMemberRepository.findByIdAndMainPatientId(1L, 6L)).thenReturn(null);
        assertThatThrownBy(() -> service.deleteFamilyMember(6L, 1L))
                .hasMessageContaining("not found or access denied");
    }

    @Test
    void deleteFamilyMember_nonMain_success() {
        FamilyMember member = mock(FamilyMember.class);
        when(member.getIsMainAccount()).thenReturn(false);
        when(familyMemberRepository.findByIdAndMainPatientId(1L, 6L)).thenReturn(member);
        service.deleteFamilyMember(6L, 1L);
        verify(familyMemberRepository).delete(member);
    }

    @Test
    void deleteFamilyMember_onlyMainAccount_throws() {
        FamilyMember member = mock(FamilyMember.class);
        when(member.getIsMainAccount()).thenReturn(true);
        when(familyMemberRepository.findByIdAndMainPatientId(1L, 6L)).thenReturn(member);
        when(familyMemberRepository.countMainAccountByPatientId(6L)).thenReturn(1L);
        assertThatThrownBy(() -> service.deleteFamilyMember(6L, 1L))
                .hasMessageContaining("Cannot delete the only main account");
    }

    @Test
    void deleteFamilyMember_mainAccount_multiple_success() {
        FamilyMember member = mock(FamilyMember.class);
        when(member.getIsMainAccount()).thenReturn(true);
        when(familyMemberRepository.findByIdAndMainPatientId(1L, 6L)).thenReturn(member);
        when(familyMemberRepository.countMainAccountByPatientId(6L)).thenReturn(2L);
        service.deleteFamilyMember(6L, 1L);
        verify(familyMemberRepository).delete(member);
    }

    // ── getFamilyStats ──
    @Test
    void getFamilyStats_returnsStats() {
        when(familyMemberRepository.findByMainPatientId(6L)).thenReturn(List.of());
        when(familyMemberRepository.countMainAccountByPatientId(6L)).thenReturn(1L);
        when(familyMemberRepository.countMembersWithMedicalHistory(6L)).thenReturn(0L);

        FamilyMemberService.FamilyStatsResponse stats = service.getFamilyStats(6L);
        assertThat(stats.getMainAccounts()).isEqualTo(1L);
    }
}
