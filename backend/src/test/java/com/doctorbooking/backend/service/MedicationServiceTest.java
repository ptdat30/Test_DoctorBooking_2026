package com.doctorbooking.backend.service;

import com.doctorbooking.backend.model.Medication;
import com.doctorbooking.backend.repository.MedicationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("MedicationService Unit Tests")
class MedicationServiceTest {

    @Mock private MedicationRepository medicationRepository;

    @InjectMocks
    private MedicationService service;

    @Test
    void searchMedications_underLimit_returnsAll() {
        when(medicationRepository.search("para")).thenReturn(List.of(mock(), mock()));
        List<Medication> result = service.searchMedications("para", 5);
        assertThat(result).hasSize(2);
    }

    @Test
    void searchMedications_overLimit_truncates() {
        when(medicationRepository.search("para")).thenReturn(List.of(mock(), mock(), mock()));
        List<Medication> result = service.searchMedications("para", 2);
        assertThat(result).hasSize(2);
    }

    @Test
    void searchMedications_nullLimit_returnsAll() {
        when(medicationRepository.search("para")).thenReturn(List.of(mock(), mock(), mock()));
        List<Medication> result = service.searchMedications("para", null);
        assertThat(result).hasSize(3);
    }

    @Test
    void searchMedications_zeroLimit_returnsAll() {
        when(medicationRepository.search("para")).thenReturn(List.of(mock(), mock()));
        List<Medication> result = service.searchMedications("para", 0);
        assertThat(result).hasSize(2);
    }

    private static Medication mock() {
        return new Medication();
    }
}
