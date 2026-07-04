import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientLayout from '../../components/patient/PatientLayout';
import { patientService } from '../../services/patientService';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import {
  AppPage,
  PageHeader,
  AlertSuccess,
  FormField,
  Select,
  Textarea,
  StarRating,
  BtnPrimary,
  BtnSecondary,
} from '../../components/shell/DashboardPrimitives';

const FeedbackForm = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ appointmentId: '', rating: 5, comment: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await patientService.getAppointments();
      setAppointments(data.filter((a) => a.status === 'COMPLETED'));
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách lịch hẹn');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await patientService.createFeedback({
        appointmentId: formData.appointmentId ? parseInt(formData.appointmentId, 10) : null,
        rating: formData.rating,
        comment: formData.comment,
      });
      setSuccess('Gửi phản hồi thành công!');
      setTimeout(() => navigate('/patient/feedbacks'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi phản hồi. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PatientLayout>
        <Loading />
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <AppPage>
        <PageHeader title="Gửi phản hồi" subtitle="Chia sẻ trải nghiệm sau lần khám của bạn" />
        <ErrorMessage message={error} onClose={() => setError('')} />
        {success && <AlertSuccess message={success} />}

        <div className="app-card">
          <form onSubmit={handleSubmit} className="app-card-body space-y-5">
            <FormField label="Lịch hẹn liên quan (tùy chọn)">
              <Select
                name="appointmentId"
                value={formData.appointmentId}
                onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
              >
                <option value="">Chọn lịch hẹn (không bắt buộc)</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.doctorName} — {a.appointmentDate}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Đánh giá" required>
              <StarRating
                value={formData.rating}
                onChange={(rating) => setFormData({ ...formData, rating })}
              />
            </FormField>

            <FormField label="Nội dung (tùy chọn)">
              <Textarea
                name="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Chia sẻ trải nghiệm, góp ý hoặc điều cần cải thiện..."
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-2">
              <BtnSecondary type="button" onClick={() => navigate('/patient/dashboard')}>
                Hủy
              </BtnSecondary>
              <BtnPrimary type="submit" disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
              </BtnPrimary>
            </div>
          </form>
        </div>
      </AppPage>
    </PatientLayout>
  );
};

export default FeedbackForm;
