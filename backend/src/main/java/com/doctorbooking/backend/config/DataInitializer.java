package com.doctorbooking.backend.config;

import com.doctorbooking.backend.model.Admin;
import com.doctorbooking.backend.model.User;
import com.doctorbooking.backend.model.Patient;
import com.doctorbooking.backend.model.Doctor;
import com.doctorbooking.backend.repository.AdminRepository;
import com.doctorbooking.backend.repository.UserRepository;
import com.doctorbooking.backend.repository.PatientRepository;
import com.doctorbooking.backend.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initializeAdminUser();
        if ("true".equalsIgnoreCase(System.getenv("SEED_TEST_DATA"))) {
            initializeTestData();
        }
    }

    private void initializeAdminUser() {
        String adminUsername = "admin";
        String adminPassword = "admin123";
        String adminEmail = "admin@hospital.com";

        try {
            User adminUser = userRepository.findByUsername(adminUsername).orElse(null);
            boolean needsUpdate = false;

            if (adminUser == null) {
                // Tạo User mới với role ADMIN
                log.info("Creating default admin user...");
                adminUser = new User();
                adminUser.setUsername(adminUsername);
                adminUser.setEmail(adminEmail);
                adminUser.setRole(User.Role.ADMIN);
                adminUser.setEnabled(true);
                adminUser.setCreatedAt(LocalDateTime.now());
                adminUser.setPassword(passwordEncoder.encode(adminPassword));
                needsUpdate = true;
            } else {
                // Kiểm tra và update password nếu cần
                log.info("Admin user exists. Verifying password...");
                
                // Kiểm tra password hiện tại có đúng không (plain text comparison)
                if (!adminPassword.equals(adminUser.getPassword())) {
                    log.warn("Admin password mismatch. Resetting to default password...");
                    // Tạm thời dùng plain text password (KHÔNG hash)
                    adminUser.setPassword(adminPassword); // Plain text
                    // adminUser.setPassword(passwordEncoder.encode(adminPassword)); // BCrypt - uncomment sau khi test xong
                    adminUser.setUpdatedAt(LocalDateTime.now());
                    needsUpdate = true;
                }
                
                // Đảm bảo role là ADMIN
                if (adminUser.getRole() != User.Role.ADMIN) {
                    log.warn("Admin user role incorrect. Fixing role...");
                    adminUser.setRole(User.Role.ADMIN);
                    adminUser.setUpdatedAt(LocalDateTime.now());
                    needsUpdate = true;
                }
                
                // Đảm bảo enabled
                if (!adminUser.getEnabled()) {
                    log.warn("Admin user disabled. Enabling...");
                    adminUser.setEnabled(true);
                    adminUser.setUpdatedAt(LocalDateTime.now());
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                adminUser = userRepository.save(adminUser);
                log.info("Admin user saved/updated.");
            }

            // Kiểm tra và tạo Admin record nếu chưa có
            if (adminRepository.findByUserId(adminUser.getId()).isEmpty()) {
                log.info("Creating admin profile...");
                Admin admin = new Admin();
                admin.setUser(adminUser);
                admin.setFullName("System Administrator");
                admin.setPhone("0123456789");
                admin.setCreatedAt(LocalDateTime.now());
                admin.setUpdatedAt(LocalDateTime.now());
                adminRepository.save(admin);
                log.info("Admin profile created successfully!");
            } else {
                log.info("Admin profile already exists.");
            }

            // Verify user was saved correctly
            User verifiedUser = userRepository.findByUsername(adminUsername)
                    .orElse(userRepository.findByEmail(adminEmail).orElse(null));
            
            if (verifiedUser != null) {
                log.info("✅ Admin user verified in database!");
                log.info("   ID: {}", verifiedUser.getId());
                log.info("   Username: {}", verifiedUser.getUsername());
                log.info("   Email: {}", verifiedUser.getEmail());
                log.info("   Role: {}", verifiedUser.getRole());
                log.info("   Enabled: {}", verifiedUser.getEnabled());
            } else {
                log.error("❌ CRITICAL: Admin user was saved but cannot be retrieved from database!");
            }
            
            log.info("✅ Admin user ready!");
            log.info("   Username: {}", adminUsername);
            log.info("   Email: {}", adminEmail);
            log.info("   Password: {}", adminPassword);

        } catch (Exception e) {
            log.error("❌ Failed to initialize admin user: {}", e.getMessage(), e);
            e.printStackTrace();
        }
    }

    private void initializeTestData() {
        log.info("Seeding test data for integration/E2E tests...");
        
        // Seed Patient: patient1
        String patientUsername = "patient1";
        String patientPassword = "password123";
        String patientEmail = "patient1@test.local";
        
        try {
            User patientUser = userRepository.findByUsername(patientUsername).orElse(null);
            if (patientUser == null) {
                log.info("Creating test patient user...");
                patientUser = new User();
                patientUser.setUsername(patientUsername);
                patientUser.setEmail(patientEmail);
                patientUser.setRole(User.Role.PATIENT);
                patientUser.setEnabled(true);
                patientUser.setCreatedAt(LocalDateTime.now());
                patientUser.setPassword(passwordEncoder.encode(patientPassword));
                patientUser = userRepository.save(patientUser);
                
                Patient patient = new Patient();
                patient.setUser(patientUser);
                patient.setFullName("Patient One");
                patient.setPhone("0901111222");
                patient.setAddress("123 Test Street");
                patient.setWalletBalance(new java.math.BigDecimal("1000000.00"));
                patient.setLoyaltyPoints(0);
                patient.setLoyaltyTier("BRONZE");
                patient.setCreatedAt(LocalDateTime.now());
                patient.setUpdatedAt(LocalDateTime.now());
                patientRepository.save(patient);
                log.info("Patient profile created successfully!");
            } else {
                log.info("Test patient user already exists.");
            }
        } catch (Exception e) {
            log.error("❌ Failed to seed patient test data: {}", e.getMessage(), e);
        }

        // Seed Doctor: doctor1
        String doctorUsername = "doctor1";
        String doctorPassword = "password123";
        String doctorEmail = "doctor1@test.local";
        
        try {
            User doctorUser = userRepository.findByUsername(doctorUsername).orElse(null);
            if (doctorUser == null) {
                log.info("Creating test doctor user...");
                doctorUser = new User();
                doctorUser.setUsername(doctorUsername);
                doctorUser.setEmail(doctorEmail);
                doctorUser.setRole(User.Role.DOCTOR);
                doctorUser.setEnabled(true);
                doctorUser.setCreatedAt(LocalDateTime.now());
                doctorUser.setPassword(passwordEncoder.encode(doctorPassword));
                doctorUser = userRepository.save(doctorUser);
                
                Doctor doctor = new Doctor();
                doctor.setUser(doctorUser);
                doctor.setFullName("Doctor One");
                doctor.setSpecialization("Cardiology");
                doctor.setExperience(10);
                doctor.setPhone("0903333444");
                doctor.setAddress("456 Hospital Blvd");
                doctor.setConsultationFee(new java.math.BigDecimal("150000.00"));
                doctor.setStatus(Doctor.DoctorStatus.ACTIVE);
                doctor.setBufferTime(15);
                doctor.setCreatedAt(LocalDateTime.now());
                doctor.setUpdatedAt(LocalDateTime.now());
                doctorRepository.save(doctor);
                log.info("Doctor profile created successfully!");
            } else {
                log.info("Test doctor user already exists.");
            }
        } catch (Exception e) {
            log.error("❌ Failed to seed doctor test data: {}", e.getMessage(), e);
        }
    }
}

