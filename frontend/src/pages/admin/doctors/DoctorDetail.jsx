import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { adminService } from '../../../services/adminService';
import Loading from '../../../components/common/Loading';
import ShellIcon from '../../../components/shell/ShellIcon';
import {
  AppPage,
  PageHeader,
  BackLink,
  AlertError,
  BtnPrimary,
} from '../../../components/shell/DashboardPrimitives';

const DetailField = ({ label, children }) => (
  <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">{label}</p>
    <div className="text-sm font-medium text-neutral-900">{children}</div>
  </div>
);

const DoctorDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDoctor();
  }, [id]);

  const loadDoctor = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDoctorById(id);
      setDoctor(data);
      setError('');
    } catch (err) {
      setError('Không thể tải thông tin bác sĩ');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loading message="Đang tải..." />
      </AdminLayout>
    );
  }

  if (error || !doctor) {
    return (
      <AdminLayout>
        <AppPage>
          <AlertError message={error || 'Không tìm thấy bác sĩ'} />
          <BackLink to="/admin/doctors" />
        </AppPage>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AppPage>
        <BackLink to="/admin/doctors" />
        <PageHeader
          title="Chi tiết bác sĩ"
          subtitle={doctor.email}
          actions={
            <BtnPrimary onClick={() => navigate(`/admin/doctors/${id}/edit`)}>
              <ShellIcon name="edit-2" className="w-4 h-4" />
              Chỉnh sửa
            </BtnPrimary>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailField label="ID">{doctor.id}</DetailField>
          <DetailField label="Họ và tên">{doctor.fullName}</DetailField>
          <DetailField label="Email">{doctor.email}</DetailField>
          <DetailField label="Số điện thoại">{doctor.phone || '—'}</DetailField>
          <DetailField label="Chuyên khoa">{doctor.specialization || '—'}</DetailField>
          <DetailField label="Bằng cấp">{doctor.qualification || '—'}</DetailField>
          <DetailField label="Kinh nghiệm">{doctor.experience ? `${doctor.experience} năm` : '—'}</DetailField>
          <DetailField label="Trạng thái">
            <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${
              doctor.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {doctor.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
            </span>
          </DetailField>
          <div className="sm:col-span-2">
            <DetailField label="Địa chỉ">{doctor.address || '—'}</DetailField>
          </div>
          {doctor.bio && (
            <div className="sm:col-span-2">
              <DetailField label="Tiểu sử"><p className="whitespace-pre-wrap">{doctor.bio}</p></DetailField>
            </div>
          )}
        </div>
      </AppPage>
    </AdminLayout>
  );
};

export default DoctorDetail;
