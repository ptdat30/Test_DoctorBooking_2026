import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PatientLayout from '../../components/patient/PatientLayout';
import { patientService } from '../../services/patientService';
import Loading from '../../components/common/Loading';
import { formatDate } from '../../utils/formatDate';
import { formatTime } from '../../utils/formatTime';
import {
  AppPage,
  PageHeader,
  AlertError,
  AlertSuccess,
  StatusBadge,
  EmptyState,
  BtnPrimary,
  BtnSecondary,
  BtnDanger,
  Modal,
  FormField,
  Textarea,
  StarRating,
} from '../../components/shell/DashboardPrimitives';
import ShellIcon from '../../components/shell/ShellIcon';
import { Calendar } from 'lucide-react';

const PAYMENT_LABELS = {
  CASH: 'Tiền mặt',
  VNPAY: 'VNPAY',
  WALLET: 'Ví sức khỏe',
};

const PAYMENT_STATUS_LABELS = {
  PAID: 'Đã thanh toán',
  PENDING: 'Chờ thanh toán',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
      <ShellIcon name={icon} className="w-3.5 h-3.5" />
      {label}
    </span>
    <span className="text-sm font-semibold text-neutral-900">{value}</span>
  </div>
);

const BookingHistory = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [treatment, setTreatment] = useState(null);
  const [loadingTreatment, setLoadingTreatment] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await patientService.getAppointments();
      setAppointments(data);
      setError('');
    } catch (err) {
      setError('Không thể tải lịch hẹn');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;
    try {
      await patientService.cancelAppointment(id);
      setSuccess('Hủy lịch hẹn thành công');
      setTimeout(() => setSuccess(''), 3000);
      loadAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể hủy lịch hẹn');
    }
  };

  const handleViewDetails = async (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
    setLoadingTreatment(true);
    setTreatment(null);

    if (appointment.status === 'COMPLETED') {
      try {
        const treatmentData = await patientService.getTreatmentByAppointmentId(appointment.id);
        setTreatment(treatmentData);
      } catch {
        console.log('No treatment found for this appointment');
      } finally {
        setLoadingTreatment(false);
      }
    } else {
      setLoadingTreatment(false);
    }
  };

  const handleSendFeedback = (appointment) => {
    setSelectedAppointment(appointment);
    setShowFeedbackModal(true);
    setError('');
  };

  const handleFeedbackSuccess = () => {
    setShowFeedbackModal(false);
    setSelectedAppointment(null);
    setSuccess('Gửi đánh giá thành công!');
    setTimeout(() => setSuccess(''), 3000);
    loadAppointments();
  };

  const canCancel = (appointment) =>
    appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED';

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
        <PageHeader title="Lịch sử đặt lịch" subtitle="Quản lý và theo dõi các lịch hẹn của bạn" />

        {error && <AlertError message={error} />}
        {success && <AlertSuccess message={success} />}

        {appointments.length === 0 ? (
          <div className="app-card p-10">
            <EmptyState
              icon={Calendar}
              title="Chưa có lịch hẹn nào"
              description="Bắt đầu đặt lịch khám bệnh với bác sĩ ngay bây giờ"
            />
            <div className="flex justify-center mt-6">
              <Link to="/patient/booking">
                <BtnPrimary>
                  <ShellIcon name="calendar" className="w-4 h-4" />
                  Đặt lịch mới
                </BtnPrimary>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <article key={appointment.id} className="app-card overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-neutral-100">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                        <ShellIcon name="user" className="w-4 h-4 text-neutral-400 shrink-0" />
                        BS. {appointment.doctorName}
                      </h3>
                      <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1.5">
                        <ShellIcon name="heart" className="w-3.5 h-3.5" />
                        {appointment.doctorSpecialization}
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                </div>

                <div className="p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <InfoRow icon="calendar" label="Ngày khám" value={formatDate(appointment.appointmentDate)} />
                  <InfoRow icon="clock" label="Giờ khám" value={formatTime(appointment.appointmentTime)} />
                  {appointment.price > 0 && (
                    <>
                      <InfoRow
                        icon="credit-card"
                        label="Phí khám"
                        value={`${Number(appointment.price).toLocaleString('vi-VN')} VNĐ`}
                      />
                      <InfoRow
                        icon="credit-card"
                        label="Thanh toán"
                        value={PAYMENT_LABELS[appointment.paymentMethod] || appointment.paymentMethod || '—'}
                      />
                    </>
                  )}
                </div>

                {appointment.price > 0 && appointment.paymentStatus && (
                  <div className="px-5 sm:px-6 pb-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-600">
                      <ShellIcon
                        name={appointment.paymentStatus === 'PAID' ? 'check-circle' : 'clock'}
                        className="w-3.5 h-3.5"
                      />
                      {PAYMENT_STATUS_LABELS[appointment.paymentStatus] || appointment.paymentStatus}
                    </span>
                  </div>
                )}

                {appointment.notes && (
                  <div className="mx-5 sm:mx-6 mb-4 p-3 rounded-xl bg-neutral-50 text-sm text-neutral-600 flex gap-2">
                    <ShellIcon name="message-circle" className="w-4 h-4 shrink-0 mt-0.5 text-neutral-400" />
                    {appointment.notes}
                  </div>
                )}

                <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex flex-wrap gap-2">
                  {canCancel(appointment) && (
                    <BtnDanger onClick={() => handleCancel(appointment.id)}>
                      <ShellIcon name="x-circle" className="w-4 h-4" />
                      Hủy lịch hẹn
                    </BtnDanger>
                  )}
                  {appointment.status === 'COMPLETED' && (
                    <>
                      <BtnSecondary onClick={() => handleViewDetails(appointment)}>
                        <ShellIcon name="file-text" className="w-4 h-4" />
                        Xem kết quả khám
                      </BtnSecondary>
                      {!appointment.hasFeedback ? (
                        <BtnPrimary onClick={() => handleSendFeedback(appointment)}>
                          <ShellIcon name="star" className="w-4 h-4" />
                          Gửi đánh giá
                        </BtnPrimary>
                      ) : (
                        <BtnSecondary disabled className="opacity-50">
                          <ShellIcon name="check-circle" className="w-4 h-4" />
                          Đã đánh giá
                        </BtnSecondary>
                      )}
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <AppointmentDetailsModal
          open={showDetailsModal}
          appointment={selectedAppointment}
          treatment={treatment}
          loadingTreatment={loadingTreatment}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAppointment(null);
            setTreatment(null);
          }}
        />

        <FeedbackModal
          open={showFeedbackModal}
          appointment={selectedAppointment}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedAppointment(null);
          }}
          onSuccess={handleFeedbackSuccess}
        />
      </AppPage>
    </PatientLayout>
  );
};

const AppointmentDetailsModal = ({ open, appointment, treatment, loadingTreatment, onClose }) => {
  if (!open || !appointment) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kết quả khám bệnh"
      footer={
        <BtnSecondary onClick={onClose} className="w-full sm:w-auto">
          Đóng
        </BtnSecondary>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-neutral-50 text-sm">
          <div>
            <span className="text-neutral-500">Bác sĩ</span>
            <p className="font-semibold text-neutral-900">BS. {appointment.doctorName}</p>
          </div>
          <div>
            <span className="text-neutral-500">Chuyên khoa</span>
            <p className="font-semibold text-neutral-900">{appointment.doctorSpecialization}</p>
          </div>
          <div>
            <span className="text-neutral-500">Ngày khám</span>
            <p className="font-semibold text-neutral-900">{formatDate(appointment.appointmentDate)}</p>
          </div>
          <div>
            <span className="text-neutral-500">Giờ khám</span>
            <p className="font-semibold text-neutral-900">{formatTime(appointment.appointmentTime)}</p>
          </div>
        </div>

        {loadingTreatment ? (
          <div className="flex items-center justify-center py-8 text-neutral-400 text-sm">Đang tải kết quả...</div>
        ) : treatment ? (
          <div className="space-y-4">
            {treatment.diagnosis && (
              <div className="p-4 rounded-xl border border-neutral-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Chẩn đoán</p>
                <p className="text-sm text-neutral-800">{treatment.diagnosis}</p>
              </div>
            )}
            {treatment.prescription && (
              <div className="p-4 rounded-xl border border-neutral-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Đơn thuốc</p>
                <p className="text-sm text-neutral-800 whitespace-pre-wrap">{treatment.prescription}</p>
              </div>
            )}
            {treatment.notes && (
              <div className="p-4 rounded-xl border border-neutral-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Ghi chú</p>
                <p className="text-sm text-neutral-800 whitespace-pre-wrap">{treatment.notes}</p>
              </div>
            )}
            {treatment.createdAt && (
              <p className="text-xs text-neutral-400">
                Tạo lúc:{' '}
                {new Date(treatment.createdAt).toLocaleString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
            Chưa có thông tin điều trị cho lịch hẹn này.
          </div>
        )}
      </div>
    </Modal>
  );
};

const FeedbackModal = ({ open, appointment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({ rating: 5, comment: '' });
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await patientService.createFeedback({
        appointmentId: appointment.id,
        rating: formData.rating,
        comment: formData.comment,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !appointment) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gửi đánh giá"
      footer={
        <>
          <BtnSecondary onClick={onClose} disabled={submitting}>
            Hủy
          </BtnSecondary>
          <BtnPrimary type="submit" form="feedback-form" disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </BtnPrimary>
        </>
      }
    >
      <form id="feedback-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="p-4 rounded-xl bg-neutral-50 text-sm space-y-1">
          <p>
            <span className="text-neutral-500">Bác sĩ:</span>{' '}
            <span className="font-semibold">BS. {appointment.doctorName}</span>
          </p>
          <p>
            <span className="text-neutral-500">Ngày:</span>{' '}
            <span className="font-semibold">{formatDate(appointment.appointmentDate)}</span>
          </p>
          <p>
            <span className="text-neutral-500">Giờ:</span>{' '}
            <span className="font-semibold">{formatTime(appointment.appointmentTime)}</span>
          </p>
        </div>

        {error && <AlertError message={error} />}

        <FormField label="Đánh giá" required>
          <StarRating value={formData.rating} onChange={(rating) => setFormData({ ...formData, rating })} />
          <p className="text-xs text-neutral-400 mt-2">{formData.rating}/5 sao</p>
        </FormField>

        <FormField label="Nhận xét (tùy chọn)">
          <Textarea
            name="comment"
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            rows={4}
            placeholder="Chia sẻ trải nghiệm của bạn..."
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default BookingHistory;
