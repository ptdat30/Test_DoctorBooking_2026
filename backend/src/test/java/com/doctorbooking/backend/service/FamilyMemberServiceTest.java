package com.doctorbooking.backend.service;

import com.doctorbooking.backend.dto.request.UpdateFamilyMemberRequest;
import com.doctorbooking.backend.model.FamilyMember;
import com.doctorbooking.backend.repository.FamilyMemberRepository;
import com.doctorbooking.backend.repository.PatientRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FamilyMemberService Unit Tests")
class FamilyMemberServiceTest {

    @Mock
    private FamilyMemberRepository familyMemberRepository;

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private FamilyMemberService familyMemberService;

    @Test
    @DisplayName("❌ Update thất bại khi đổi relationship sang SELF")
    void updateFamilyMember_fails_whenChangingToSelf() {

        Long patientId = 1L;
        Long memberId = 2L;

        FamilyMember member = new FamilyMember();
        member.setId(memberId);
        member.setIsMainAccount(false);
        member.setRelationship(FamilyMember.Relationship.SPOUSE);

        UpdateFamilyMemberRequest request = new UpdateFamilyMemberRequest();
        request.setRelationship(FamilyMember.Relationship.SELF);

        when(familyMemberRepository.findByIdAndMainPatientId(memberId, patientId))
                .thenReturn(member);

        assertThatThrownBy(() ->
                familyMemberService.updateFamilyMember(patientId, memberId, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot update relationship to SELF");

        verify(familyMemberRepository, never()).countMainAccountByPatientId(anyLong());
        verify(familyMemberRepository, never()).save(any());
    }
}