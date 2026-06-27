package com.doctorbooking.backend.util;

import com.doctorbooking.backend.model.Admin;
import com.doctorbooking.backend.model.Doctor;
import com.doctorbooking.backend.model.Patient;
import com.doctorbooking.backend.model.Treatment;
import com.doctorbooking.backend.model.User;

import java.time.LocalDateTime;

/**
 * Object Mother / Test Data Builder for creating mock entities in Unit Tests.
 */
public class TestMockFactory {

    // ==========================================
    // USER MOCKS
    // ==========================================
    
    public static User createValidActiveUser(User.Role role) {
        User user = new User();
        user.setId(1L);
        user.setUsername("test" + role.name().toLowerCase());
        user.setEmail("test" + role.name().toLowerCase() + "@example.com");
        user.setPassword("encodedPassword123");
        user.setRole(role);
        user.setEnabled(true);
        return user;
    }

    public static User createLockedUser() {
        User user = createValidActiveUser(User.Role.PATIENT);
        user.setEnabled(false);
        return user;
    }

    public static User createUserWithEmptyEmail() {
        User user = createValidActiveUser(User.Role.PATIENT);
        user.setEmail("");
        return user;
    }

    // ==========================================
    // PATIENT MOCKS
    // ==========================================

    public static Patient createValidPatient() {
        Patient patient = new Patient();
        patient.setId(100L);
        patient.setFullName("Nguyen Van A");
        patient.setDateOfBirth(java.time.LocalDate.of(1990, 1, 1));
        patient.setGender("Nam");
        patient.setAddress("123 Main St, Hanoi");
        patient.setPhoneNumber("0912345678");
        patient.setBloodType("O+");
        patient.setUser(createValidActiveUser(User.Role.PATIENT));
        return patient;
    }

    // ==========================================
    // DOCTOR MOCKS
    // ==========================================

    public static Doctor createValidActiveDoctor() {
        Doctor doctor = new Doctor();
        doctor.setId(200L);
        doctor.setFullName("Dr. Tran Van B");
        doctor.setSpecialization("Cardiology");
        doctor.setExperience(10);
        doctor.setPhone("0987654321");
        doctor.setDescription("Expert in Cardiology");
        doctor.setConsultationFee(500000.0);
        doctor.setStatus(Doctor.DoctorStatus.ACTIVE);
        doctor.setUser(createValidActiveUser(User.Role.DOCTOR));
        return doctor;
    }

    public static Doctor createInactiveDoctor() {
        Doctor doctor = createValidActiveDoctor();
        doctor.setStatus(Doctor.DoctorStatus.INACTIVE);
        return doctor;
    }

    // ==========================================
    // TREATMENT MOCKS
    // ==========================================

    public static Treatment createValidTreatment() {
        Treatment treatment = new Treatment();
        treatment.setId(300L);
        // Note: appointment setting would be needed depending on the test
        treatment.setDiagnosis("Common Cold");
        treatment.setNotes("Rest and drink water");
        treatment.setFollowUpDate(LocalDateTime.now().plusDays(7));
        treatment.setCreatedAt(LocalDateTime.now());
        treatment.setUpdatedAt(LocalDateTime.now());
        return treatment;
    }
}
