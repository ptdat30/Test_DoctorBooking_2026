package com.doctorbooking.backend.service;

import com.doctorbooking.backend.dto.request.CreateFeedbackRequest;
import com.doctorbooking.backend.dto.request.ReplyFeedbackRequest;
import com.doctorbooking.backend.dto.request.UpdateFeedbackRequest;
import com.doctorbooking.backend.dto.response.FeedbackResponse;
import com.doctorbooking.backend.model.*;
import com.doctorbooking.backend.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FeedbackService Unit Tests")
class FeedbackServiceTest {

    @Mock private FeedbackRepository feedbackRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private DoctorRepository doctorRepository;
    @Mock private AppointmentRepository appointmentRepository;

    @InjectMocks
    private FeedbackService feedbackService;

    // ---- Helpers ----

    private User buildUser(Long id, String username, User.Role role) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setEmail(username + "@test.com");
        u.setPassword("password");
        u.setRole(role);
        u.setEnabled(true);
        return u;
    }

    private Patient buildPatient(Long id, User user, String fullName) {
        Patient p = new Patient();
        p.setId(id);
        p.setUser(user);
        p.setFullName(fullName);
        return p;
    }

    private Doctor buildDoctor(Long id, User user, String fullName) {
        Doctor d = new Doctor();
        d.setId(id);
        d.setUser(user);
        d.setFullName(fullName);
        d.setStatus(Doctor.DoctorStatus.ACTIVE);
        return d;
    }

    private Appointment buildAppointment(Long id, Patient patient, Doctor doctor,
                                          Appointment.AppointmentStatus status) {
        Appointment a = new Appointment();
        a.setId(id);
        a.setPatient(patient);
        a.setDoctor(doctor);
        a.setAppointmentDate(LocalDate.now().minusDays(1));
        a.setAppointmentTime(LocalTime.of(9, 0));
        a.setStatus(status);
        return a;
    }

    private Feedback buildFeedback(Long id, Patient patient, Doctor doctor,
                                    Appointment appointment, int rating,
                                    Feedback.FeedbackStatus status, Boolean isHidden) {
        Feedback f = new Feedback();
        f.setId(id);
        f.setPatient(patient);
        f.setDoctor(doctor);
        f.setAppointment(appointment);
        f.setRating(rating);
        f.setComment("Test comment");
        f.setStatus(status);
        f.setIsHidden(isHidden);
        f.setCreatedAt(LocalDateTime.now());
        return f;
    }

    // =========================================================
    // createFeedback TESTS
    // =========================================================
    @Nested
    @DisplayName("createFeedback()")
    class CreateFeedbackTests {

        @Test
        @DisplayName("✅ Tạo feedback thành công cho appointment COMPLETED")
        void createFeedback_success() {
            Patient patient = buildPatient(6L, buildUser(1L, "trongdang", User.Role.PATIENT), "Đặng Tấn Trọng");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "doctor", User.Role.DOCTOR), "Huỳnh Phong Đạt");
            Appointment apt = buildAppointment(82L, patient, doctor, Appointment.AppointmentStatus.COMPLETED);

            CreateFeedbackRequest req = new CreateFeedbackRequest();
            req.setAppointmentId(82L);
            req.setRating(5);
            req.setComment("Bác sĩ rất tận tâm!");

            Feedback saved = buildFeedback(1L, patient, doctor, apt, 5, Feedback.FeedbackStatus.PENDING, false);

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(appointmentRepository.findById(82L)).thenReturn(Optional.of(apt));
            when(feedbackRepository.findByAppointmentId(82L)).thenReturn(Optional.empty());
            when(feedbackRepository.save(any(Feedback.class))).thenReturn(saved);

            FeedbackResponse response = feedbackService.createFeedback(6L, req);

            assertThat(response).isNotNull();
            assertThat(response.getRating()).isEqualTo(5);
            verify(feedbackRepository, times(1)).save(any(Feedback.class));
        }

        @Test
        @DisplayName("❌ Appointment chưa COMPLETED → throw RuntimeException")
        void createFeedback_appointmentNotCompleted_throwsException() {
            Patient patient = buildPatient(6L, buildUser(1L, "p", User.Role.PATIENT), "Pat");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "d", User.Role.DOCTOR), "Dr");
            Appointment apt = buildAppointment(88L, patient, doctor, Appointment.AppointmentStatus.PENDING);

            CreateFeedbackRequest req = new CreateFeedbackRequest();
            req.setAppointmentId(88L);
            req.setRating(5);
            req.setComment("Good");

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(appointmentRepository.findById(88L)).thenReturn(Optional.of(apt));

            assertThatThrownBy(() -> feedbackService.createFeedback(6L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Can only create feedback for completed appointments");
        }

        @Test
        @DisplayName("❌ Appointment không thuộc về patient này → throw RuntimeException")
        void createFeedback_appointmentNotBelongToPatient_throwsException() {
            Patient patient = buildPatient(6L, buildUser(1L, "p", User.Role.PATIENT), "Pat");
            Patient otherPatient = buildPatient(99L, buildUser(99L, "other", User.Role.PATIENT), "Other");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "d", User.Role.DOCTOR), "Dr");

            // Appointment thuộc otherPatient
            Appointment apt = buildAppointment(82L, otherPatient, doctor, Appointment.AppointmentStatus.COMPLETED);

            CreateFeedbackRequest req = new CreateFeedbackRequest();
            req.setAppointmentId(82L);
            req.setRating(5);
            req.setComment("Good");

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(appointmentRepository.findById(82L)).thenReturn(Optional.of(apt));

            assertThatThrownBy(() -> feedbackService.createFeedback(6L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Appointment does not belong to this patient");
        }

        @Test
        @DisplayName("❌ Đã có feedback cho appointment này → throw RuntimeException")
        void createFeedback_alreadyExists_throwsException() {
            Patient patient = buildPatient(6L, buildUser(1L, "p", User.Role.PATIENT), "Pat");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "d", User.Role.DOCTOR), "Dr");
            Appointment apt = buildAppointment(82L, patient, doctor, Appointment.AppointmentStatus.COMPLETED);
            Feedback existing = buildFeedback(1L, patient, doctor, apt, 5, Feedback.FeedbackStatus.REPLIED, false);

            CreateFeedbackRequest req = new CreateFeedbackRequest();
            req.setAppointmentId(82L);
            req.setRating(4);
            req.setComment("Updated");

            when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
            when(appointmentRepository.findById(82L)).thenReturn(Optional.of(apt));
            when(feedbackRepository.findByAppointmentId(82L)).thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> feedbackService.createFeedback(6L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Feedback already exists for this appointment");
        }
    }

    // =========================================================
    // updateFeedback TESTS
    // =========================================================
    @Nested
    @DisplayName("updateFeedback()")
    class UpdateFeedbackTests {

        @Test
        @DisplayName("✅ Cập nhật feedback thành công trong 24 giờ, chưa có doctor reply")
        void updateFeedback_success() {
            Patient patient = buildPatient(6L, buildUser(1L, "p", User.Role.PATIENT), "Pat");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "d", User.Role.DOCTOR), "Dr");
            Appointment apt = buildAppointment(82L, patient, doctor, Appointment.AppointmentStatus.COMPLETED);
            Feedback feedback = buildFeedback(1L, patient, doctor, apt, 5, Feedback.FeedbackStatus.PENDING, false);
            feedback.setCreatedAt(LocalDateTime.now().minusHours(1)); // 1 giờ trước

            UpdateFeedbackRequest req = new UpdateFeedbackRequest();
            req.setRating(4);
            req.setComment("Updated comment");

            when(feedbackRepository.findById(1L)).thenReturn(Optional.of(feedback));
            when(feedbackRepository.save(any(Feedback.class))).thenReturn(feedback);

            FeedbackResponse response = feedbackService.updateFeedback(6L, 1L, req);

            assertThat(response).isNotNull();
            assertThat(feedback.getRating()).isEqualTo(4);
            assertThat(feedback.getComment()).isEqualTo("Updated comment");
        }

        @Test
        @DisplayName("❌ Feedback không thuộc về patient → throw RuntimeException")
        void updateFeedback_wrongPatient_throwsException() {
            Patient patient = buildPatient(6L, buildUser(1L, "p", User.Role.PATIENT), "Pat");
            Patient otherPatient = buildPatient(99L, buildUser(99L, "other", User.Role.PATIENT), "Other");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "d", User.Role.DOCTOR), "Dr");
            Appointment apt = buildAppointment(82L, patient, doctor, Appointment.AppointmentStatus.COMPLETED);
            Feedback feedback = buildFeedback(1L, patient, doctor, apt, 5, Feedback.FeedbackStatus.PENDING, false);

            UpdateFeedbackRequest req = new UpdateFeedbackRequest();
            req.setRating(3);
            req.setComment("Hmm");

            when(feedbackRepository.findById(1L)).thenReturn(Optional.of(feedback));

            // patientId = 99, nhưng feedback thuộc patient 6
            assertThatThrownBy(() -> feedbackService.updateFeedback(99L, 1L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("This feedback does not belong to you");
        }

        @Test
        @DisplayName("❌ Đã có doctor reply → không thể edit")
        void updateFeedback_afterDoctorReply_throwsException() {
            Patient patient = buildPatient(6L, buildUser(1L, "p", User.Role.PATIENT), "Pat");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "d", User.Role.DOCTOR), "Dr");
            Appointment apt = buildAppointment(82L, patient, doctor, Appointment.AppointmentStatus.COMPLETED);
            Feedback feedback = buildFeedback(1L, patient, doctor, apt, 5, Feedback.FeedbackStatus.REPLIED, false);
            feedback.setDoctorReply("Cảm ơn bạn đã đánh giá!"); // Doctor đã reply

            UpdateFeedbackRequest req = new UpdateFeedbackRequest();
            req.setRating(3);
            req.setComment("Changed");

            when(feedbackRepository.findById(1L)).thenReturn(Optional.of(feedback));

            assertThatThrownBy(() -> feedbackService.updateFeedback(6L, 1L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Cannot edit feedback after doctor has replied");
        }

        @Test
        @DisplayName("❌ Quá 24 giờ → không thể edit")
        void updateFeedback_after24Hours_throwsException() {
            Patient patient = buildPatient(6L, buildUser(1L, "p", User.Role.PATIENT), "Pat");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "d", User.Role.DOCTOR), "Dr");
            Appointment apt = buildAppointment(82L, patient, doctor, Appointment.AppointmentStatus.COMPLETED);
            Feedback feedback = buildFeedback(1L, patient, doctor, apt, 5, Feedback.FeedbackStatus.PENDING, false);
            feedback.setCreatedAt(LocalDateTime.now().minusHours(25)); // 25 giờ trước

            UpdateFeedbackRequest req = new UpdateFeedbackRequest();
            req.setRating(3);
            req.setComment("Late update");

            when(feedbackRepository.findById(1L)).thenReturn(Optional.of(feedback));

            assertThatThrownBy(() -> feedbackService.updateFeedback(6L, 1L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Feedback can only be edited within 24 hours");
        }
    }

    // =========================================================
    // replyToFeedback TESTS
    // =========================================================
    @Nested
    @DisplayName("replyToFeedback()")
    class ReplyToFeedbackTests {

        @Test
        @DisplayName("✅ Bác sĩ reply thành công")
        void replyToFeedback_success() {
            Patient patient = buildPatient(6L, buildUser(1L, "p", User.Role.PATIENT), "Pat");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "d", User.Role.DOCTOR), "Dr");
            Appointment apt = buildAppointment(82L, patient, doctor, Appointment.AppointmentStatus.COMPLETED);
            Feedback feedback = buildFeedback(8L, patient, doctor, apt, 5, Feedback.FeedbackStatus.PENDING, false);

            ReplyFeedbackRequest req = new ReplyFeedbackRequest();
            req.setDoctorReply("Cảm ơn bệnh nhân đã tin tưởng!");

            when(feedbackRepository.findById(8L)).thenReturn(Optional.of(feedback));
            when(feedbackRepository.save(any(Feedback.class))).thenReturn(feedback);

            FeedbackResponse response = feedbackService.replyToFeedback(1L, 8L, req);

            assertThat(response).isNotNull();
            assertThat(feedback.getDoctorReply()).isEqualTo("Cảm ơn bệnh nhân đã tin tưởng!");
            assertThat(feedback.getStatus()).isEqualTo(Feedback.FeedbackStatus.REPLIED);
            assertThat(feedback.getDoctorRepliedAt()).isNotNull();
        }

        @Test
        @DisplayName("❌ Feedback không phải của bác sĩ này → throw RuntimeException")
        void replyToFeedback_wrongDoctor_throwsException() {
            Patient patient = buildPatient(6L, buildUser(1L, "p", User.Role.PATIENT), "Pat");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "d", User.Role.DOCTOR), "Dr");
            Appointment apt = buildAppointment(82L, patient, doctor, Appointment.AppointmentStatus.COMPLETED);
            Feedback feedback = buildFeedback(8L, patient, doctor, apt, 5, Feedback.FeedbackStatus.PENDING, false);

            ReplyFeedbackRequest req = new ReplyFeedbackRequest();
            req.setDoctorReply("Reply");

            when(feedbackRepository.findById(8L)).thenReturn(Optional.of(feedback));

            // doctorId = 999 khác với doctor.id = 1
            assertThatThrownBy(() -> feedbackService.replyToFeedback(999L, 8L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("This feedback is not for you");
        }
    }

    // =========================================================
    // getDoctorAverageRating TESTS
    // =========================================================
    @Nested
    @DisplayName("getDoctorAverageRating()")
    class GetDoctorAverageRatingTests {

        @Test
        @DisplayName("✅ Trả về 0.0 khi không có feedback")
        void averageRating_noFeedbacks_returnsZero() {
            when(feedbackRepository.findByDoctorIdOrderByCreatedAtDesc(1L))
                    .thenReturn(Collections.emptyList());

            Double avg = feedbackService.getDoctorAverageRating(1L);

            assertThat(avg).isEqualTo(0.0);
        }

        @Test
        @DisplayName("✅ Tính trung bình đúng, bỏ qua hidden feedbacks")
        void averageRating_withHiddenFeedbacks_ignoresHidden() {
            Patient patient = buildPatient(6L, buildUser(1L, "p", User.Role.PATIENT), "Pat");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "d", User.Role.DOCTOR), "Dr");
            Appointment apt = buildAppointment(82L, patient, doctor, Appointment.AppointmentStatus.COMPLETED);

            Feedback f1 = buildFeedback(1L, patient, doctor, apt, 5, Feedback.FeedbackStatus.REPLIED, false);
            Feedback f2 = buildFeedback(2L, patient, doctor, apt, 3, Feedback.FeedbackStatus.PENDING, false);
            Feedback f3 = buildFeedback(3L, patient, doctor, apt, 1, Feedback.FeedbackStatus.PENDING, true); // hidden

            when(feedbackRepository.findByDoctorIdOrderByCreatedAtDesc(1L))
                    .thenReturn(List.of(f1, f2, f3));

            Double avg = feedbackService.getDoctorAverageRating(1L);

            // (5 + 3) / 2 = 4.0 (bỏ qua f3 vì isHidden=true)
            assertThat(avg).isEqualTo(4.0);
        }

        @Test
        @DisplayName("✅ Tất cả feedbacks bị ẩn → trả về 0.0")
        void averageRating_allHidden_returnsZero() {
            Patient patient = buildPatient(6L, buildUser(1L, "p", User.Role.PATIENT), "Pat");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "d", User.Role.DOCTOR), "Dr");
            Appointment apt = buildAppointment(82L, patient, doctor, Appointment.AppointmentStatus.COMPLETED);

            Feedback f1 = buildFeedback(1L, patient, doctor, apt, 5, Feedback.FeedbackStatus.REPLIED, true);
            Feedback f2 = buildFeedback(2L, patient, doctor, apt, 4, Feedback.FeedbackStatus.PENDING, true);

            when(feedbackRepository.findByDoctorIdOrderByCreatedAtDesc(1L))
                    .thenReturn(List.of(f1, f2));

            Double avg = feedbackService.getDoctorAverageRating(1L);

            assertThat(avg).isEqualTo(0.0);
        }
    }

    // =========================================================
    // hideFeedback / unhideFeedback TESTS (Admin)
    // =========================================================
    @Nested
    @DisplayName("hideFeedback() & unhideFeedback()")
    class HideUnhideFeedbackTests {

        @Test
        @DisplayName("✅ Admin ẩn feedback thành công")
        void hideFeedback_success() {
            Patient patient = buildPatient(6L, buildUser(1L, "p", User.Role.PATIENT), "Pat");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "d", User.Role.DOCTOR), "Dr");
            Appointment apt = buildAppointment(82L, patient, doctor, Appointment.AppointmentStatus.COMPLETED);
            Feedback feedback = buildFeedback(1L, patient, doctor, apt, 1, Feedback.FeedbackStatus.PENDING, false);

            when(feedbackRepository.findById(1L)).thenReturn(Optional.of(feedback));
            when(feedbackRepository.save(any())).thenReturn(feedback);

            FeedbackResponse response = feedbackService.hideFeedback(1L);

            assertThat(feedback.getIsHidden()).isTrue();
        }

        @Test
        @DisplayName("✅ Admin bỏ ẩn feedback thành công")
        void unhideFeedback_success() {
            Patient patient = buildPatient(6L, buildUser(1L, "p", User.Role.PATIENT), "Pat");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "d", User.Role.DOCTOR), "Dr");
            Appointment apt = buildAppointment(82L, patient, doctor, Appointment.AppointmentStatus.COMPLETED);
            Feedback feedback = buildFeedback(1L, patient, doctor, apt, 5, Feedback.FeedbackStatus.PENDING, true);

            when(feedbackRepository.findById(1L)).thenReturn(Optional.of(feedback));
            when(feedbackRepository.save(any())).thenReturn(feedback);

            feedbackService.unhideFeedback(1L);

            assertThat(feedback.getIsHidden()).isFalse();
        }
    }

    // =========================================================
    // getDoctorFeedbacks TESTS
    // =========================================================
    @Nested
    @DisplayName("getDoctorFeedbacks()")
    class GetDoctorFeedbacksTests {

        @Test
        @DisplayName("✅ Lọc bỏ hidden feedbacks")
        void getDoctorFeedbacks_filtersHidden() {
            Patient patient = buildPatient(6L, buildUser(1L, "p", User.Role.PATIENT), "Pat");
            Doctor doctor = buildDoctor(1L, buildUser(2L, "d", User.Role.DOCTOR), "Dr");
            Appointment apt = buildAppointment(82L, patient, doctor, Appointment.AppointmentStatus.COMPLETED);

            Feedback visible = buildFeedback(1L, patient, doctor, apt, 5, Feedback.FeedbackStatus.REPLIED, false);
            Feedback hidden = buildFeedback(2L, patient, doctor, apt, 1, Feedback.FeedbackStatus.PENDING, true);

            when(feedbackRepository.findByDoctorIdOrderByCreatedAtDesc(1L))
                    .thenReturn(List.of(visible, hidden));

            List<FeedbackResponse> result = feedbackService.getDoctorFeedbacks(1L);

            assertThat(result).hasSize(1);
        }
    }

    // =========================================================
    // getFeedbacksByStatus TESTS (Admin)
    // =========================================================
    @Nested
    @DisplayName("getFeedbacksByStatus()")
    class GetFeedbacksByStatusTests {

        @Test
        @DisplayName("✅ Status null → trả về tất cả")
        void getByStatus_nullStatus_returnsAll() {
            when(feedbackRepository.findAllByOrderByCreatedAtDesc())
                    .thenReturn(Collections.emptyList());

            List<FeedbackResponse> result = feedbackService.getFeedbacksByStatus(null);

            assertThat(result).isEmpty();
            verify(feedbackRepository, times(1)).findAllByOrderByCreatedAtDesc();
        }

        @Test
        @DisplayName("✅ Status hợp lệ → lọc theo status")
        void getByStatus_validStatus_filters() {
            when(feedbackRepository.findByStatusOrderByCreatedAtDesc(Feedback.FeedbackStatus.PENDING))
                    .thenReturn(Collections.emptyList());

            List<FeedbackResponse> result = feedbackService.getFeedbacksByStatus("PENDING");

            assertThat(result).isEmpty();
            verify(feedbackRepository, times(1))
                    .findByStatusOrderByCreatedAtDesc(Feedback.FeedbackStatus.PENDING);
        }

        @Test
        @DisplayName("✅ Status không hợp lệ → trả về tất cả")
        void getByStatus_invalidStatus_returnsAll() {
            when(feedbackRepository.findAllByOrderByCreatedAtDesc())
                    .thenReturn(Collections.emptyList());

            List<FeedbackResponse> result = feedbackService.getFeedbacksByStatus("INVALID_STATUS");

            verify(feedbackRepository, times(1)).findAllByOrderByCreatedAtDesc();
        }
    }
}
