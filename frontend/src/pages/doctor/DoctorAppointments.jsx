import { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, User, Phone, FileText, CheckCircle, XCircle, AlertCircle, Filter, X, Plus } from 'lucide-react';
import DoctorLayout from '../../components/doctor/DoctorLayout';
import { doctorService } from '../../services/doctorService';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import TreatmentForm from '../../components/doctor/TreatmentForm';
import CancelAppointmentModal from '../../components/doctor/CancelAppointmentModal';
import StatCard from '../../components/common/StatCard';
import { formatDate } from '../../utils/formatDate';
import { formatTime } from '../../utils/formatTime';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './DoctorAppointments.css';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, [filterDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      console.log(' Loading doctor appointments...', { filterDate });
      const data = await doctorService.getAppointments(filterDate || null);
      console.log(' Appointments loaded:', data);
      setAppointments(data);
      setError('');
    } catch (err) {
      console.error(' Error loading appointments:', err);
      console.error('Error response:', err.response?.data);
      setError('Failed to load appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (appointmentId) => {
    try {
      setProcessingId(appointmentId);
      await doctorService.confirmAppointment(appointmentId);
      await loadAppointments();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm appointment');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateTreatment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowTreatmentForm(true);
  };

  const handleTreatmentSuccess = () => {
    setShowTreatmentForm(false);
    setSelectedAppointment(null);
    loadAppointments();
  };

  const handleCancelClick = (appointment) => {
    setAppointmentToCancel(appointment);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (cancellationReason) => {
    try {
      await doctorService.cancelAppointment(appointmentToCancel.id, cancellationReason);
      setShowCancelModal(false);
      setAppointmentToCancel(null);
      setError('');
      toast.success('Đã hủy lịch hẹn thành công!', {
        position: "top-right",
        autoClose: 2000
      });
      // Delay reload để toast kịp hiển thị
      setTimeout(() => {
        loadAppointments();
      }, 300);
    } catch (err) {
      // Let the modal handle the error display
      throw err;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#f39c12';
      case 'CONFIRMED':
        return '#3498db';
      case 'COMPLETED':
        return '#2ecc71';
      case 'CANCELLED':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <AlertCircle size={16} />;
      case 'CONFIRMED':
        return <CheckCircle size={16} />;
      case 'COMPLETED':
        return <CheckCircle size={16} />;
      case 'CANCELLED':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Đang chờ';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter(a => a.status === 'PENDING').length,
      confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
      completed: appointments.filter(a => a.status === 'COMPLETED').length,
      cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
    };
  }, [appointments]);

  // Helper function to format date for display
  const formatAppointmentDate = (dateString) => {
    if (!dateString) return { day: '--', month: '--', year: '----', fullDate: '--/--/----', dayOfWeek: '' };
    try {
      let date;
      // Parse date string (YYYY-MM-DD format)
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in Date
        const day = parseInt(parts[2], 10);
        date = new Date(year, month, day);
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) return { day: '--', month: '--', year: '----', fullDate: '--/--/----', dayOfWeek: '' };

      const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
      const monthNamesShort = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
      const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
      const dayNamesShort = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appointmentDate = new Date(date);
      appointmentDate.setHours(0, 0, 0, 0);

      const diffTime = appointmentDate - today;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let relativeDate = '';
      if (diffDays === 0) {
        relativeDate = 'Hôm nay';
      } else if (diffDays === 1) {
        relativeDate = 'Ngày mai';
      } else if (diffDays === -1) {
        relativeDate = 'Hôm qua';
      } else if (diffDays > 1 && diffDays <= 7) {
        relativeDate = `${diffDays} ngày nữa`;
      } else if (diffDays < -1 && diffDays >= -7) {
        relativeDate = `${Math.abs(diffDays)} ngày trước`;
      }

      return {
        day: date.getDate().toString().padStart(2, '0'),
        month: date.getMonth() + 1,
        monthName: monthNames[date.getMonth()],
        monthNameShort: monthNamesShort[date.getMonth()],
        year: date.getFullYear(),
        dayOfWeek: dayNames[date.getDay()],
        dayOfWeekShort: dayNamesShort[date.getDay()],
        fullDate: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`,
        relativeDate: relativeDate
      };
    } catch (error) {
      console.error('Error parsing date:', error);
      return { day: '--', month: '--', year: '----', fullDate: '--/--/----', dayOfWeek: '' };
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <DoctorLayout>
        <Loading />
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="doctor-appointments">
        <div className="appointments-header">
          <div className="header-content">
            <h1 className="page-title">
              <Calendar size={32} />
              Lịch hẹn của tôi
            </h1>
            <p className="page-subtitle">Quản lý và theo dõi các cuộc hẹn với bệnh nhân</p>
          </div>
        </div>

        <ErrorMessage message={error} onClose={() => setError('')} />

        {/* Statistics Cards */}
        <div className="stats-grid">
          <StatCard
            label="Tổng số lịch hẹn"
            value={stats.total}
            color="#3B82F6"
            icon={<Calendar size={24} />}
          />
          <StatCard
            label="Đang chờ xác nhận"
            value={stats.pending}
            color="#f39c12"
            icon={<AlertCircle size={24} />}
          />
          <StatCard
            label="Đã xác nhận"
            value={stats.confirmed}
            color="#3498db"
            icon={<CheckCircle size={24} />}
          />
          <StatCard
            label="Hoàn thành"
            value={stats.completed}
            color="#2ecc71"
            icon={<CheckCircle size={24} />}
          />
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-wrapper">
            <div className="filter-icon-wrapper">
              <Filter size={20} />
            </div>
            <label className="filter-label">Lọc theo ngày:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="filter-input"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="clear-filter-btn"
                title="Xóa bộ lọc"
              >
                <X size={16} />
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Appointments List */}
        {loading && appointments.length === 0 ? (
          <div className="loading-container">
            <Loading />
          </div>
        ) : appointments.length === 0 ? (
          <div className="empty-state">
            <Calendar size={64} className="empty-icon" />
            <h3 className="empty-title">Không có lịch hẹn</h3>
            <p className="empty-description">
              {filterDate
                ? `Không có lịch hẹn nào vào ngày ${formatDate(filterDate)}`
                : 'Chưa có lịch hẹn nào được đặt'}
            </p>
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="empty-action-btn"
              >
                Xem tất cả lịch hẹn
              </button>
            )}
          </div>
        ) : (
          <div className="appointments-grid">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-card-header">
                  <div className="appointment-date-badge">
                    <Calendar size={18} className="date-icon" />
                    <div className="date-content">
                      <div className="date-primary">
                        <span className="date-day-name">{formatAppointmentDate(appointment.appointmentDate).dayOfWeek}</span>
                        {formatAppointmentDate(appointment.appointmentDate).relativeDate && (
                          <span className="date-relative-badge">{formatAppointmentDate(appointment.appointmentDate).relativeDate}</span>
                        )}
                      </div>
                      <div className="date-secondary">
                        {formatAppointmentDate(appointment.appointmentDate).day} {formatAppointmentDate(appointment.appointmentDate).monthName} {formatAppointmentDate(appointment.appointmentDate).year}
                      </div>
                    </div>
                  </div>
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: getStatusColor(appointment.status) + '20',
                      color: getStatusColor(appointment.status),
                    }}
                  >
                    {getStatusIcon(appointment.status)}
                    {getStatusText(appointment.status)}
                  </span>
                </div>

                <div className="appointment-card-body">
                  <div className="appointment-time">
                    <Clock size={18} />
                    <span>{formatTime(appointment.appointmentTime)}</span>
                  </div>

                  <div className="appointment-patient">
                    <div className="patient-avatar">
                      <User size={20} />
                    </div>
                    <div className="patient-details">
                      <div className="patient-name">{appointment.patientName}</div>
                      {appointment.patientPhone && (
                        <div className="patient-contact">
                          <Phone size={14} />
                          <span>{appointment.patientPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="appointment-notes">
                      <FileText size={16} />
                      <span>{appointment.notes}</span>
                    </div>
                  )}
                </div>

                <div className="appointment-card-footer">
                  {appointment.status === 'PENDING' && (
                    <div className="action-buttons-group">
                      <button
                        onClick={() => handleConfirm(appointment.id)}
                        disabled={processingId === appointment.id}
                        className="action-btn confirm-btn"
                      >
                        <CheckCircle size={16} />
                        {processingId === appointment.id ? 'Đang xác nhận...' : 'Xác nhận'}
                      </button>
                      <button
                        onClick={() => handleCancelClick(appointment)}
                        className="action-btn cancel-btn"
                      >
                        <XCircle size={16} />
                        Hủy lịch
                      </button>
                    </div>
                  )}
                  {appointment.status === 'CONFIRMED' && (
                    <div className="action-buttons-group">
                      <button
                        onClick={() => handleCreateTreatment(appointment)}
                        className="action-btn treatment-btn"
                      >
                        <Plus size={16} />
                        Tạo phiếu điều trị
                      </button>
                      <button
                        onClick={() => handleCancelClick(appointment)}
                        className="action-btn cancel-btn"
                      >
                        <XCircle size={16} />
                        Hủy lịch
                      </button>
                    </div>
                  )}
                  {appointment.status === 'COMPLETED' && (
                    <div className="completed-indicator">
                      <CheckCircle size={18} />
                      <span>Đã hoàn thành</span>
                    </div>
                  )}
                  {appointment.status === 'CANCELLED' && (
                    <div className="cancelled-indicator">
                      <XCircle size={18} />
                      <span>Đã hủy</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showTreatmentForm && (
          <TreatmentForm
            treatment={null}
            appointment={selectedAppointment}
            onClose={() => {
              setShowTreatmentForm(false);
              setSelectedAppointment(null);
            }}
            onSuccess={handleTreatmentSuccess}
          />
        )}

        {showCancelModal && appointmentToCancel && (
          <CancelAppointmentModal
            appointment={appointmentToCancel}
            onClose={() => {
              setShowCancelModal(false);
              setAppointmentToCancel(null);
            }}
            onConfirm={handleConfirmCancel}
          />
        )}
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </DoctorLayout>
  );
};

export default DoctorAppointments;