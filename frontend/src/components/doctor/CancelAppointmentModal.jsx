import { useState } from 'react';
import {
  Modal,
  BtnSecondary,
  BtnDanger,
  AlertError,
  FormField,
  Textarea,
} from '../shell/DashboardPrimitives';

const PREDEFINED_REASONS = [
  'Bận công việc đột xuất',
  'Lý do sức khỏe',
  'Thay đổi lịch trình',
  'Khác',
];

const CancelAppointmentModal = ({ appointment, onClose, onConfirm, isAdmin = false }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const cancellationReason = selectedReason === 'Khác' ? customReason.trim() : selectedReason;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cancellationReason) {
      setError('Vui lòng nhập lý do hủy');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onConfirm(cancellationReason);
      onClose();
    } catch (err) {
      setError(err.message || 'Không thể hủy lịch hẹn');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={!!appointment}
      onClose={onClose}
      title="Hủy lịch hẹn"
      footer={
        <>
          <BtnSecondary onClick={onClose} disabled={submitting}>Đóng</BtnSecondary>
          <BtnDanger type="submit" form="cancel-appointment-form" disabled={submitting || !cancellationReason}>
            {submitting ? 'Đang hủy...' : 'Xác nhận hủy'}
          </BtnDanger>
        </>
      }
    >
      {appointment && (
        <form id="cancel-appointment-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-900 space-y-1">
            <p><span className="text-amber-700">Bệnh nhân:</span> <strong>{appointment.patientName}</strong></p>
            <p><span className="text-amber-700">Ngày:</span> {appointment.appointmentDate}</p>
            <p><span className="text-amber-700">Giờ:</span> {appointment.appointmentTime}</p>
            {!isAdmin && (
              <p className="text-xs text-amber-800 pt-2 border-t border-amber-200/60 mt-2">
                Lưu ý: Chỉ hủy được trước giờ khám tối thiểu 24 giờ.
              </p>
            )}
          </div>

          {error && <AlertError message={error} />}

          <FormField label="Chọn lý do hủy" required>
            <div className="space-y-2">
              {PREDEFINED_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedReason === reason ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="accent-neutral-900"
                  />
                  <span className="text-sm text-neutral-800">{reason}</span>
                </label>
              ))}
            </div>
          </FormField>

          {selectedReason === 'Khác' && (
            <FormField label="Lý do cụ thể" required>
              <Textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
                placeholder="Nhập lý do hủy lịch hẹn..."
                required
              />
            </FormField>
          )}
        </form>
      )}
    </Modal>
  );
};

export default CancelAppointmentModal;
