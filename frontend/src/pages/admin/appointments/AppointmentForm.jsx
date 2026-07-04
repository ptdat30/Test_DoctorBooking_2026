import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { adminService } from '../../../services/adminService';
import Loading from '../../../components/common/Loading';
import ErrorMessage from '../../../components/common/ErrorMessage';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ShellIcon from '../../../components/shell/ShellIcon';
import { BtnPrimary, BtnSecondary } from '../../../components/shell/DashboardPrimitives';

const AppointmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
    appointmentDate: '',
    appointmentTime: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAppointmentById(id);
      setFormData({
        status: data.status || '',
        notes: data.notes || '',
        appointmentDate: data.appointmentDate || '',
        appointmentTime: data.appointmentTime || ''
      });
      setError('');
    } catch (err) {
      setError('Không thể tải thông tin lịch hẹn');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.status) {
      errors.status = 'Vui lòng chọn trạng thái';
    }

    if (!formData.appointmentDate) {
      errors.appointmentDate = 'Ngày hẹn không được để trống';
    }

    if (!formData.appointmentTime) {
      errors.appointmentTime = 'Giờ hẹn không được để trống';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');
    setFormErrors({});

    try {
      const updateData = {
        id: parseInt(id),
        status: formData.status,
        notes: formData.notes.trim(),
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime
      };

      await adminService.updateAppointment(id, updateData);
      toast.success('Cập nhật lịch hẹn thành công!', { position: 'top-right', autoClose: 3000 });
      setTimeout(() => navigate('/admin/appointments'), 500);
    } catch (err) {
      const errorMsg = 'Không thể cập nhật lịch hẹn';
      setError(errorMsg);
      toast.error(errorMsg, { position: 'top-right', autoClose: 4000 });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="app-page space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between app-card p-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chỉnh Sửa Lịch Hẹn</h1>
            <p className="text-gray-600 mt-1">Cập nhật thông tin lịch hẹn</p>
          </div>
          <button 
            onClick={() => navigate('/admin/appointments')} 
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <ShellIcon name="arrow-left" className="w-5 h-5" />
            Quay lại danh sách
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <ErrorMessage 
            message={error} 
            onClose={() => setError('')} 
          />
        )}

        {/* Appointment Form */}
        <div className="app-card p-6">
          <form onSubmit={handleSubmit} className="app-page space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent ${
                    formErrors.status ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Chọn trạng thái</option>
                  <option value="PENDING">Đang chờ</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
                {formErrors.status && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.status}</p>
                )}
              </div>

              {/* Appointment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày hẹn <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent ${
                    formErrors.appointmentDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.appointmentDate && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.appointmentDate}</p>
                )}
              </div>

              {/* Appointment Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giờ hẹn <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent ${
                    formErrors.appointmentTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.appointmentTime && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.appointmentTime}</p>
                )}
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="Nhập ghi chú cho lịch hẹn..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
              <BtnSecondary type="button" onClick={() => navigate('/admin/appointments')} disabled={submitting} className="flex-1">Hủy</BtnSecondary>
              <BtnPrimary type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
              </BtnPrimary>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer />
    </AdminLayout>
  );
};

export default AppointmentForm;
