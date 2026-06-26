package com.doctorbooking.backend.service;

import com.doctorbooking.backend.dto.request.CreateTreatmentRequest;
import com.doctorbooking.backend.dto.request.TreatmentMedicationRequest;
import com.doctorbooking.backend.dto.request.UpdateTreatmentRequest;
import com.doctorbooking.backend.dto.response.TreatmentResponse;
import com.doctorbooking.backend.model.Appointment;
import com.doctorbooking.backend.model.Doctor;
import com.doctorbooking.backend.model.Medication;
import com.doctorbooking.backend.model.Patient;
import com.doctorbooking.backend.model.PrescriptionMedication;
import com.doctorbooking.backend.model.Treatment;
import com.doctorbooking.backend.repository.AppointmentRepository;
import com.doctorbooking.backend.repository.DoctorRepository;
import com.doctorbooking.backend.repository.MedicationRepository;
import com.doctorbooking.backend.repository.PatientRepository;
import com.doctorbooking.backend.repository.PrescriptionMedicationRepository;
import com.doctorbooking.backend.repository.TreatmentRepository;
import com.doctorbooking.backend.util.TestMockFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TreatmentServiceTest {

    @Mock
    private TreatmentRepository treatmentRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private MedicationRepository medicationRepository;

    @Mock
    private PrescriptionMedicationRepository prescriptionMedicationRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private TreatmentService treatmentService;

    private Treatment mockTreatment;
    private Doctor mockDoctor;
    private Patient mockPatient;

    @BeforeEach
    void setUp() {
        mockTreatment = TestMockFactory.createValidTreatment();
        mockDoctor = TestMockFactory.createValidActiveDoctor();
        mockPatient = TestMockFactory.createValidPatient();
        
        mockTreatment.setDoctor(mockDoctor);
        mockTreatment.setPatient(mockPatient);
    }

    // ==========================================
    // Test: getTreatments
    // ==========================================

    @Test
    void testGetAllTreatments() {
        when(treatmentRepository.findAll()).thenReturn(List.of(mockTreatment));
        List<TreatmentResponse> result = treatmentService.getAllTreatments();
        assertEquals(1, result.size());
    }

    @Test
    void testGetTreatmentsByDoctorId() {
        when(treatmentRepository.findByDoctorId(200L)).thenReturn(List.of(mockTreatment));
        List<TreatmentResponse> result = treatmentService.getTreatmentsByDoctorId(200L);
        assertEquals(1, result.size());
    }

    @Test
    void testGetTreatmentsByPatientId() {
        when(treatmentRepository.findByPatientId(100L)).thenReturn(List.of(mockTreatment));
        List<TreatmentResponse> result = treatmentService.getTreatmentsByPatientId(100L);
        assertEquals(1, result.size());
    }

    @Test
    void testGetTreatmentById_Success() {
        when(treatmentRepository.findById(300L)).thenReturn(Optional.of(mockTreatment));
        TreatmentResponse result = treatmentService.getTreatmentById(300L);
        assertNotNull(result);
    }

    @Test
    void testGetTreatmentById_NotFound() {
        when(treatmentRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> treatmentService.getTreatmentById(999L));
    }

    @Test
    void testGetTreatmentByAppointmentId() {
        when(treatmentRepository.findByAppointmentId(1L)).thenReturn(List.of(mockTreatment));
        TreatmentResponse result = treatmentService.getTreatmentByAppointmentId(1L);
        assertNotNull(result);
        
        when(treatmentRepository.findByAppointmentId(2L)).thenReturn(Collections.emptyList());
        assertNull(treatmentService.getTreatmentByAppointmentId(2L));
    }

    // ==========================================
    // Test: createTreatment
    // ==========================================

    @Test
    void testCreateTreatment_Success() {
        CreateTreatmentRequest request = new CreateTreatmentRequest();
        request.setPatientId(100L);
        request.setAppointmentId(1L);
        request.setDiagnosis("Flu");
        
        TreatmentMedicationRequest medReq = new TreatmentMedicationRequest();
        medReq.setMedicationName("Paracetamol");
        medReq.setQuantity(10);
        request.setMedications(List.of(medReq));

        Appointment appointment = new Appointment();
        appointment.setId(1L);
        appointment.setStatus(Appointment.AppointmentStatus.CONFIRMED);

        when(doctorRepository.findById(200L)).thenReturn(Optional.of(mockDoctor));
        when(patientRepository.findById(100L)).thenReturn(Optional.of(mockPatient));
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        
        when(treatmentRepository.save(any(Treatment.class))).thenAnswer(i -> {
            Treatment t = i.getArgument(0);
            t.setId(300L);
            t.setMedications(new ArrayList<>());
            return t;
        });

        TreatmentResponse response = treatmentService.createTreatment(200L, request);
        
        assertNotNull(response);
        assertEquals(Appointment.AppointmentStatus.COMPLETED, appointment.getStatus());
        verify(appointmentRepository, times(1)).save(appointment);
        verify(prescriptionMedicationRepository, times(1)).save(any(PrescriptionMedication.class));
        verify(emailService, times(1)).sendPrescriptionEmailHtml(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), nullable(String.class), anyString(), nullable(String.class), anyString(), anyString(), anyList());
    }

    @Test
    void testCreateTreatment_DoctorNotFound() {
        CreateTreatmentRequest request = new CreateTreatmentRequest();
        when(doctorRepository.findById(200L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> treatmentService.createTreatment(200L, request));
    }

    @Test
    void testCreateTreatment_PatientNotFound() {
        CreateTreatmentRequest request = new CreateTreatmentRequest();
        request.setPatientId(100L);
        when(doctorRepository.findById(200L)).thenReturn(Optional.of(mockDoctor));
        when(patientRepository.findById(100L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> treatmentService.createTreatment(200L, request));
    }

    // ==========================================
    // Test: updateTreatment
    // ==========================================

    @Test
    void testUpdateTreatment_Success() {
        UpdateTreatmentRequest request = new UpdateTreatmentRequest();
        request.setDiagnosis("Updated Flu");
        
        TreatmentMedicationRequest medReq = new TreatmentMedicationRequest();
        medReq.setMedicationId(10L);
        medReq.setMedicationName("Aspirin");
        medReq.setQuantity(5);
        request.setMedications(List.of(medReq));

        mockTreatment.setMedications(new ArrayList<>());
        
        when(treatmentRepository.findById(300L)).thenReturn(Optional.of(mockTreatment));
        when(treatmentRepository.save(any(Treatment.class))).thenReturn(mockTreatment);
        when(medicationRepository.findById(10L)).thenReturn(Optional.of(new Medication()));

        TreatmentResponse response = treatmentService.updateTreatment(300L, request);
        
        assertNotNull(response);
        assertEquals("Updated Flu", mockTreatment.getDiagnosis());
        verify(prescriptionMedicationRepository, times(1)).deleteByTreatmentId(300L);
        verify(prescriptionMedicationRepository, times(1)).save(any(PrescriptionMedication.class));
        verify(emailService, times(1)).sendPrescriptionEmailHtml(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), nullable(String.class), anyString(), nullable(String.class), anyString(), anyString(), anyList());
    }

    // ==========================================
    // Test: deleteTreatment
    // ==========================================

    @Test
    void testDeleteTreatment_Success() {
        when(treatmentRepository.findById(300L)).thenReturn(Optional.of(mockTreatment));
        treatmentService.deleteTreatment(300L);
        verify(treatmentRepository, times(1)).delete(mockTreatment);
    }
}
