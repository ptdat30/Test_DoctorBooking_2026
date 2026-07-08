import { useEffect, useState } from 'react';
import { User, Stethoscope, Award, Clock, Phone, MapPin, FileText, Lock, Edit } from 'lucide-react';
import DoctorLayout from '../../components/doctor/DoctorLayout';
import { doctorService } from '../../services/doctorService';
import Loading from '../../components/common/Loading';
import {
  AppPage,
  PageHeader,
  AlertError,
  AlertSuccess,
  BtnPrimary,
  BtnSecondary,
  Modal,
  FormField,
  Input,
  Textarea,
} from '../../components/shell/DashboardPrimitives';
import { StatTile } from '../../components/shell/PatientPageUI';

const InfoField = ({ icon: Icon, label, value }) => (
  <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 mb-1">
      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
      {label}
    </p>
    <p className="text-sm font-medium text-neutral-900 whitespace-pre-wrap">{value || '—'}</p>
  </div>
);

const DoctorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getProfile();
      setProfile(data);
      setFormData({
        fullName: data.fullName,
        specialization: data.specialization,
        qualification: data.qualification || '',
        experience: data.experience || 0,
        phone: data.phone || '',
        address: data.address || '',
        bio: data.bio || '',
      });
      setError('');
    } catch (err) {
      setError('Không thể tải hồ sơ');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'experience' ? parseInt(value) || 0 : value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const updated = await doctorService.updateProfile(formData);
      setProfile(updated);
      setEditMode(false);
      setSuccess('Cập nhật hồ sơ thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật hồ sơ');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Mật khẩu mới không khớp');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    try {
      await doctorService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Đổi mật khẩu thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đổi mật khẩu');
    }
  };

  if (loading) {
    return (
      <DoctorLayout>
        <Loading message="Đang tải hồ sơ..." />
      </DoctorLayout>
    );
  }

  if (!profile) {
    return (
      <DoctorLayout>
        <AppPage>
          <p className="text-neutral-500 text-center py-12">Không tìm thấy hồ sơ</p>
        </AppPage>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <AppPage>
        <PageHeader
          title="Hồ sơ của tôi"
          subtitle="Thông tin chuyên môn và liên hệ"
          actions={
            <>
              <BtnSecondary onClick={() => setShowPasswordForm(true)}>
                <Lock className="w-4 h-4" />
                Đổi mật khẩu
              </BtnSecondary>
              <BtnPrimary onClick={() => setEditMode(true)}>
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </BtnPrimary>
            </>
          }
        />

        {error && <AlertError message={error} />}
        {success && <AlertSuccess message={success} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="app-card p-6 text-center">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-3xl font-bold">
              {profile.fullName?.charAt(0)?.toUpperCase() || 'B'}
            </div>
            <h2 className="mt-4 text-xl font-bold text-neutral-900">BS. {profile.fullName}</h2>
            <p className="text-sm text-neutral-500 mt-1">{profile.specialization}</p>
            <span className={`inline-block mt-3 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
              profile.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-neutral-100 text-neutral-500 border-neutral-200'
            }`}>
              {profile.status === 'ACTIVE' ? 'Đang hoạt động' : 'Không hoạt động'}
            </span>
            <div className="grid grid-cols-2 gap-3 mt-6 text-left">
              <StatTile icon={Award} label="Kinh nghiệm" value={`${profile.experience || 0} năm`} />
              <StatTile icon={Stethoscope} label="Chuyên khoa" value={profile.specialization?.split(',')[0] || '—'} />
            </div>
          </aside>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoField icon={User} label="Họ và tên" value={`BS. ${profile.fullName}`} />
            <InfoField icon={Stethoscope} label="Chuyên khoa" value={profile.specialization} />
            <InfoField icon={Award} label="Trình độ" value={profile.qualification} />
            <InfoField icon={Clock} label="Kinh nghiệm" value={profile.experience ? `${profile.experience} năm` : '—'} />
            <InfoField icon={Phone} label="Số điện thoại" value={profile.phone} />
            <InfoField icon={MapPin} label="Địa chỉ phòng khám" value={profile.address} />
            {profile.bio && (
              <div className="sm:col-span-2">
                <InfoField icon={FileText} label="Giới thiệu" value={profile.bio} />
              </div>
            )}
          </div>
        </div>

        <Modal
          open={editMode}
          onClose={() => setEditMode(false)}
          title="Chỉnh sửa hồ sơ"
          wide
          footer={
            <>
              <BtnSecondary onClick={() => setEditMode(false)}>Hủy</BtnSecondary>
              <BtnPrimary type="submit" form="doctor-profile-form">Lưu</BtnPrimary>
            </>
          }
        >
          <form id="doctor-profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
            <FormField label="Họ và tên" required>
              <Input name="fullName" value={formData.fullName || ''} onChange={handleInputChange} required />
            </FormField>
            <FormField label="Chuyên khoa" required>
              <Input name="specialization" value={formData.specialization || ''} onChange={handleInputChange} required />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Trình độ">
                <Input name="qualification" value={formData.qualification || ''} onChange={handleInputChange} />
              </FormField>
              <FormField label="Số năm kinh nghiệm">
                <Input type="number" name="experience" value={formData.experience || 0} onChange={handleInputChange} min={0} />
              </FormField>
            </div>
            <FormField label="Số điện thoại">
              <Input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} />
            </FormField>
            <FormField label="Địa chỉ phòng khám">
              <Input name="address" value={formData.address || ''} onChange={handleInputChange} />
            </FormField>
            <FormField label="Giới thiệu">
              <Textarea name="bio" value={formData.bio || ''} onChange={handleInputChange} rows={4} />
            </FormField>
          </form>
        </Modal>

        <Modal
          open={showPasswordForm}
          onClose={() => {
            setShowPasswordForm(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          }}
          title="Đổi mật khẩu"
          footer={
            <>
              <BtnSecondary onClick={() => setShowPasswordForm(false)}>Hủy</BtnSecondary>
              <BtnPrimary type="submit" form="doctor-password-form">Cập nhật</BtnPrimary>
            </>
          }
        >
          <form id="doctor-password-form" onSubmit={handleChangePassword} className="space-y-4">
            <FormField label="Mật khẩu hiện tại" required>
              <Input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required />
            </FormField>
            <FormField label="Mật khẩu mới" required>
              <Input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required minLength={6} />
            </FormField>
            <FormField label="Xác nhận mật khẩu mới" required>
              <Input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required minLength={6} />
            </FormField>
          </form>
        </Modal>
      </AppPage>
    </DoctorLayout>
  );
};

export default DoctorProfile;
