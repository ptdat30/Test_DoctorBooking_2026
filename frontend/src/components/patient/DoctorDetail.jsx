import { useNavigate } from 'react-router-dom';
import {
  User,
  Stethoscope,
  Award,
  Clock,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';
import {
  Modal,
  BtnPrimary,
  BtnSecondary,
} from '../shell/DashboardPrimitives';

const InfoField = ({ icon: Icon, label, children }) => (
  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 mb-2">
      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
      {label}
    </p>
    <div className="text-sm font-medium text-neutral-900">{children}</div>
  </div>
);

const DoctorDetail = ({ doctor, onClose }) => {
  const navigate = useNavigate();

  const handleBookAppointment = () => {
    onClose();
    navigate('/patient/booking', { state: { doctorId: doctor.id } });
  };

  const isActive = doctor.status === 'ACTIVE';

  return (
    <Modal
      open
      onClose={onClose}
      title="Hồ sơ bác sĩ"
      footer={
        <>
          <BtnSecondary onClick={onClose}>Đóng</BtnSecondary>
          {isActive && (
            <BtnPrimary onClick={handleBookAppointment}>
              <Calendar className="w-4 h-4" />
              Đặt lịch
            </BtnPrimary>
          )}
        </>
      }
    >
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        <InfoField icon={User} label="Họ và tên">
          BS. {doctor.fullName}
        </InfoField>

        <InfoField icon={Stethoscope} label="Chuyên khoa">
          {doctor.specialization}
        </InfoField>

        {doctor.qualification && (
          <InfoField icon={Award} label="Trình độ">
            {doctor.qualification}
          </InfoField>
        )}

        {doctor.experience > 0 && (
          <InfoField icon={Clock} label="Kinh nghiệm">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-100 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              {doctor.experience} năm
            </span>
          </InfoField>
        )}

        {doctor.phone && (
          <InfoField icon={Phone} label="Số điện thoại">
            {doctor.phone}
          </InfoField>
        )}

        {doctor.address && (
          <InfoField icon={MapPin} label="Địa chỉ phòng khám">
            {doctor.address}
          </InfoField>
        )}

        {doctor.bio && (
          <InfoField icon={FileText} label="Giới thiệu">
            <p className="whitespace-pre-wrap text-neutral-700 leading-relaxed">{doctor.bio}</p>
          </InfoField>
        )}

        <InfoField icon={isActive ? CheckCircle : XCircle} label="Trạng thái">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-neutral-100 text-neutral-500 border-neutral-200'
            }`}
          >
            {isActive ? 'Đang hoạt động' : 'Không hoạt động'}
          </span>
        </InfoField>
      </div>
    </Modal>
  );
};

export default DoctorDetail;
