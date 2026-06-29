package com.doctorbooking.backend.service;

import com.doctorbooking.backend.dto.request.ChangePasswordRequest;
import com.doctorbooking.backend.dto.request.UpdateUserRequest;
import com.doctorbooking.backend.dto.request.UserRequest;
import com.doctorbooking.backend.dto.response.UserResponse;
import com.doctorbooking.backend.model.Admin;
import com.doctorbooking.backend.model.User;
import com.doctorbooking.backend.model.Doctor;
import com.doctorbooking.backend.model.Patient;
import com.doctorbooking.backend.repository.AdminRepository;
import com.doctorbooking.backend.repository.UserRepository;
import com.doctorbooking.backend.repository.DoctorRepository;
import com.doctorbooking.backend.repository.PatientRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AdminRepository adminRepository;

    public UserService(UserRepository userRepository, 
                      @Lazy PasswordEncoder passwordEncoder,
                      DoctorRepository doctorRepository,
                      PatientRepository patientRepository,
                      AdminRepository adminRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.adminRepository = adminRepository;
    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        System.out.println("🔵 UserService.loadUserByUsername - Searching for: " + usernameOrEmail);
        
        // Try to find by username first, if not found, try email
        User user = userRepository.findByUsername(usernameOrEmail)
                .orElseGet(() -> userRepository.findByEmail(usernameOrEmail).orElse(null));
        
        if (user != null) {
            System.out.println("✅ UserService.loadUserByUsername - Found user: " + user.getUsername() + " (ID: " + user.getId() + ", Role: " + user.getRole() + ")");
            return user;
        } else {
            System.err.println("❌ UserService.loadUserByUsername - User not found with username or email: " + usernameOrEmail);
            // Debug: List all usernames and emails
            long totalUsers = userRepository.count();
            System.err.println("❌ Total users in database: " + totalUsers);
            if (totalUsers > 0) {
                userRepository.findAll().forEach(u -> 
                    System.err.println("   - Username: '" + u.getUsername() + "', Email: '" + u.getEmail() + "', Role: " + u.getRole())
                );
            }
            throw new UsernameNotFoundException("User not found with username or email: " + usernameOrEmail);
        }
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    // ========== User Management Methods ==========

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
    }

    public List<UserResponse> searchUsers(String search) {
        if (search == null || search.trim().isEmpty()) {
            return getAllUsers();
        }
        String searchLower = search.toLowerCase();
        return userRepository.findAll().stream()
                .filter(user -> user.getUsername().toLowerCase().contains(searchLower) ||
                               user.getEmail().toLowerCase().contains(searchLower))
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return UserResponse.fromUser(user);
    }

    @Transactional
    public UserResponse createUser(UserRequest request) {
        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);

        User savedUser = userRepository.save(user);
        syncRoleProfile(savedUser);
        return UserResponse.fromUser(savedUser);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Check if username is changed and already exists
        if (!user.getUsername().equals(request.getUsername()) &&
            userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        // Check if email is changed and already exists
        if (!user.getEmail().equals(request.getEmail()) &&
            userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }

        User updatedUser = userRepository.save(user);
        syncRoleProfile(updatedUser);
        return UserResponse.fromUser(updatedUser);
    }

    private void syncRoleProfile(User user) {
        Long userId = user.getId();
        switch (user.getRole()) {
            case DOCTOR -> {
                if (doctorRepository.findByUserId(userId).isEmpty()) {
                    Doctor doctor = new Doctor();
                    doctor.setUser(user);
                    doctor.setFullName(user.getUsername());
                    doctor.setSpecialization("General");
                    doctor.setExperience(0);
                    doctor.setStatus(Doctor.DoctorStatus.ACTIVE);
                    doctorRepository.save(doctor);
                }
            }
            case PATIENT -> {
                if (patientRepository.findByUserId(userId).isEmpty()) {
                    Patient patient = new Patient();
                    patient.setUser(user);
                    patient.setFullName(user.getUsername());
                    patientRepository.save(patient);
                }
            }
            case ADMIN -> {
                if (adminRepository.findByUserId(userId).isEmpty()) {
                    Admin admin = new Admin();
                    admin.setUser(user);
                    admin.setFullName(user.getUsername());
                    adminRepository.save(admin);
                }
            }
        }
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        try {
            // Delete associated doctor if exists
            Optional<Doctor> doctor = doctorRepository.findByUserId(id);
            if (doctor.isPresent()) {
                doctorRepository.delete(doctor.get());
            }

            // Delete associated patient if exists
            Optional<Patient> patient = patientRepository.findByUserId(id);
            if (patient.isPresent()) {
                patientRepository.delete(patient.get());
            }

            // Now delete the user
            userRepository.delete(user);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Không thể xóa người dùng này vì vẫn còn dữ liệu liên quan (ví dụ: lịch hẹn, phản hồi, v.v.). Bạn cần xóa hoặc chuyển các dữ liệu liên quan trước khi xóa người dùng này.");
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi xóa người dùng: " + e.getMessage());
        }
    }

    @Transactional
    public UserResponse toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        user.setEnabled(!user.getEnabled());
        User updatedUser = userRepository.save(user);
        return UserResponse.fromUser(updatedUser);
    }

    @Transactional
    public void changeUserPassword(Long id, ChangePasswordRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}

