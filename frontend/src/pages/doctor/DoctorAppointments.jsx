import { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, User, Phone, FileText, CheckCircle, XCircle, Plus, X } from 'lucide-react';
import DoctorLayout from '../../components/doctor/DoctorLayout';
import { doctorService } from '../../services/doctorService';
import Loading from '../../components/common/Loading';
import TreatmentForm from '../../components/doctor/TreatmentForm';
import CancelAppointmentModal from '../../components/doctor/CancelAppointmentModal';
import { formatDate } from '../../utils/formatDate';
import { formatTime } from '../../utils/formatTime';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  AppPage,
  PageHeader,
  AlertError,
  StatusBadge,
  EmptyState,
  BtnPrimary,
  BtnSecondary,
  BtnDanger,
  Input,
  FormField,
} from '../../components/shell/DashboardPrimitives';
import { StatTile } from '../../components/shell/PatientPageUI';

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
      const data = await doctorService.getAppointments(filterDate || null);
      setAppointments(data);
      setError('');
    } catch (err) {
      setError('Không thể tải lịch hẹn');
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
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xác nhận lịch hẹn');
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
    await doctorService.cancelAppointment(appointmentToCancel.id, cancellationReason);
    setShowCancelModal(false);
    setAppointmentToCancel(null);
    toast.success('Đã hủy lịch hẹn thành công!', { position: 'top-right', autoClose: 2000 });
    setTimeout(() => loadAppointments(), 300);
  };

  const stats = useMemo(() => ({
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'PENDING').length,
    confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
    completed: appointments.filter((a) => a.status === 'COMPLETED').length,
  }), [appointments]);

  if (loading && appointments.length === 0) {
    return (
      <DoctorLayout>
        <Loading message="Đang tải lịch hẹn..." />
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <AppPage>
        <PageHeader title="Lịch hẹn của tôi" subtitle="Quản lý và theo dõi các cuộc hẹn với bệnh nhân" />

        {error && <AlertError message={error} />}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile icon={Calendar} label="Tổng lịch hẹn" value={stats.total} />
          <StatTile icon={Clock} label="Đang chờ" value={stats.pending} />
          <StatTile icon={CheckCircle} label="Đã xác nhận" value={stats.confirmed} />
          <StatTile icon={CheckCircle} label="Hoàn thành" value={stats.completed} />
        </div>

        <div className="app-card p-4 flex flex-wrap items-end gap-4">
          <FormField label="Lọc theo ngày" className="flex-1 min-w-[200px] mb-0">
            <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </FormField>
          {filterDate && (
            <BtnSecondary onClick={() => setFilterDate('')}>
              <X className="w-4 h-4" />
              Xóa bộ lọc
            </BtnSecondary>
          )}
        </div>

        {loading ? (
          <Loading message="Đang tải..." />
        ) : appointments.length === 0 ? (
          <div className="app-card p-10">
            <EmptyState icon={Calendar} title="Không có lịch hẹn" description={filterDate ? `Không có lịch hẹn ngày ${formatDate(filterDate)}` : 'Chưa có lịch hẹn nào'} />
            {filterDate && (
              <div className="flex justify-center mt-4">
                <BtnSecondary onClick={() => setFilterDate('')}>Xem tất cả</BtnSecondary>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <article key={appointment.id} className="app-card overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-neutral-100 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      {formatDate(appointment.appointmentDate)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(appointment.appointmentTime)}
                    </p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>

                <div className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">{appointment.patientName}</p>
                      {appointment.patientPhone && (
                        <p className="text-sm text-neutral-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3.5 h-3.5" />
                          {appointment.patientPhone}
                        </p>
                      )}
                    </div>
                  </div>
                  {appointment.notes && (
                    <p className="text-sm text-neutral-600 flex gap-2 p-3 rounded-xl bg-neutral-50">
                      <FileText className="w-4 h-4 shrink-0 mt-0.5 text-neutral-400" />
                      {appointment.notes}
                    </p>
                  )}
                </div>

                <div className="px-5 sm:px-6 pb-5 flex flex-wrap gap-2">
                  {appointment.status === 'PENDING' && (
                    <>
                      <BtnPrimary onClick={() => handleConfirm(appointment.id)} disabled={processingId === appointment.id}>
                        <CheckCircle className="w-4 h-4" />
                        {processingId === appointment.id ? 'Đang xác nhận...' : 'Xác nhận'}
                      </BtnPrimary>
                      <BtnDanger onClick={() => handleCancelClick(appointment)}>
                        <XCircle className="w-4 h-4" />
                        Hủy lịch
                      </BtnDanger>
                    </>
                  )}
                  {appointment.status === 'CONFIRMED' && (
                    <>
                      <BtnPrimary onClick={() => handleCreateTreatment(appointment)}>
                        <Plus className="w-4 h-4" />
                        Tạo phiếu điều trị
                      </BtnPrimary>
                      <BtnDanger onClick={() => handleCancelClick(appointment)}>
                        <XCircle className="w-4 h-4" />
                        Hủy lịch
                      </BtnDanger>
                    </>
                  )}
                  {appointment.status === 'COMPLETED' && (
                    <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Đã hoàn thành
                    </span>
                  )}
                  {appointment.status === 'CANCELLED' && (
                    <span className="text-sm text-neutral-400 font-medium flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Đã hủy
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {showTreatmentForm && (
          <TreatmentForm
            treatment={null}
            appointment={selectedAppointment}
            onClose={() => { setShowTreatmentForm(false); setSelectedAppointment(null); }}
            onSuccess={handleTreatmentSuccess}
          />
        )}

        {showCancelModal && (
          <CancelAppointmentModal
            appointment={appointmentToCancel}
            onClose={() => { setShowCancelModal(false); setAppointmentToCancel(null); }}
            onConfirm={handleConfirmCancel}
          />
        )}
      </AppPage>
      <ToastContainer position="top-right" autoClose={3000} />
    </DoctorLayout>
  );
};

export default DoctorAppointments;
