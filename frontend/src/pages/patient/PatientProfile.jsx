import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Edit,
  Lock,
  AlertTriangle,
  Heart,
  Activity,
  Pill,
  Eye,
  Users,
  Wallet,
} from 'lucide-react';
import PatientLayout from '../../components/patient/PatientLayout';
import { patientService } from '../../services/patientService';
import { formatDate } from '../../utils/formatDate';
import Loading from '../../components/common/Loading';
import {
  AppPage,
  PageHeader,
  AlertError,
  AlertSuccess,
  BtnPrimary,
  BtnSecondary,
  BtnDanger,
  Modal,
  FormField,
  Input,
  Select,
} from '../../components/shell/DashboardPrimitives';
import { StatTile } from '../../components/shell/PatientPageUI';

const mockVitalStats = {
  bmi: 22.5,
  heartRate: 72,
  weight: 65,
  bloodType: 'O+',
  allergies: ['Penicillin', 'Bụi'],
};

const mockMedicines = [
  { id: 1, name: 'Paracetamol 500mg', daysRemaining: 5, totalDays: 7, schedule: 'Sáng & Tối' },
  { id: 2, name: 'Amoxicillin 250mg', daysRemaining: 2, totalDays: 5, schedule: '3 lần/ngày' },
  { id: 3, name: 'Vitamin D3', daysRemaining: 15, totalDays: 30, schedule: '1 lần/ngày' },
];

const PatientProfile = () => {
  const [profile, setProfile] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showSOSForm, setShowSOSForm] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [sosData, setSosData] = useState({
    emergencyContact: '',
    emergencyPhone: '',
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [profileData, treatmentsData] = await Promise.all([
        patientService.getProfile().catch(() => null),
        patientService.getTreatments().catch(() => []),
      ]);

      setProfile(profileData);
      setTreatments(treatmentsData);

      if (profileData) {
        setFormData({
          fullName: profileData.fullName,
          dateOfBirth: profileData.dateOfBirth || '',
          gender: profileData.gender || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          emergencyContact: profileData.emergencyContact || '',
          emergencyPhone: profileData.emergencyPhone || '',
        });
        setSosData({
          emergencyContact: profileData.emergencyContact || '',
          emergencyPhone: profileData.emergencyPhone || '',
        });
      }
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
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const updated = await patientService.updateProfile(formData);
      setProfile(updated);
      setEditMode(false);
      setSuccess('Cập nhật hồ sơ thành công');
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
      await patientService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Đổi mật khẩu thành công');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đổi mật khẩu');
    }
  };

  const handleUpdateSOS = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const updated = await patientService.updateProfile({
        ...formData,
        emergencyContact: sosData.emergencyContact,
        emergencyPhone: sosData.emergencyPhone,
      });
      setProfile(updated);
      setShowSOSForm(false);
      setSuccess('Cập nhật liên hệ khẩn cấp thành công');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật liên hệ khẩn cấp');
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '—';
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const getQRCodeData = () => {
    if (!profile) return '';
    return JSON.stringify({ patientId: profile.id, name: profile.fullName, timestamp: Date.now() });
  };

  const timelineItems =
    treatments.length > 0
      ? treatments.map((t) => ({
          id: t.id,
          date: t.createdAt || t.appointmentDate,
          doctor: t.doctorName || 'Bác sĩ',
          diagnosis: t.diagnosis || '—',
          prescription: t.prescription || t.notes || '—',
        }))
      : [];

  if (loading) {
    return (
      <PatientLayout>
        <Loading message="Đang tải hồ sơ..." />
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <AppPage>
        <PageHeader title="Hồ sơ cá nhân" subtitle="Thông tin sức khỏe và lịch sử khám bệnh" />

        {error && <AlertError message={error} />}
        {success && <AlertSuccess message={success} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Passport */}
          <aside className="app-card p-6 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-3xl font-bold">
                {profile?.fullName?.charAt(0)?.toUpperCase() || 'B'}
              </div>
              <h2 className="mt-4 text-xl font-bold text-neutral-900">{profile?.fullName || 'Bệnh nhân'}</h2>
              <p className="text-sm text-neutral-500 mt-1">ID: {profile?.id || '—'}</p>
              <div className="flex items-center gap-3 mt-3 text-sm text-neutral-600">
                <span>Tuổi: {calculateAge(profile?.dateOfBirth)}</span>
                <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 font-semibold text-xs">
                  {mockVitalStats.bloodType}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center p-4 rounded-xl border border-neutral-200 bg-neutral-50">
              <QRCodeSVG value={getQRCodeData()} size={112} level="H" />
              <p className="text-xs text-neutral-500 mt-3 font-medium">Quét để check-in</p>
            </div>

            <div className="space-y-2">
              <BtnSecondary onClick={() => setEditMode(true)} className="w-full">
                <Edit className="w-4 h-4" />
                Chỉnh sửa hồ sơ
              </BtnSecondary>
              <BtnSecondary onClick={() => setShowPasswordForm(true)} className="w-full">
                <Lock className="w-4 h-4" />
                Đổi mật khẩu
              </BtnSecondary>
              <BtnDanger onClick={() => setShowSOSForm(true)} className="w-full">
                <AlertTriangle className="w-4 h-4" />
                Liên hệ khẩn cấp
              </BtnDanger>
            </div>

            <div className="pt-4 border-t border-neutral-100 space-y-2">
              <Link
                to="/patient/wallet"
                className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700"
              >
                <Wallet className="w-4 h-4 text-neutral-500" />
                Ví sức khỏe
              </Link>
              <Link
                to="/patient/family"
                className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700"
              >
                <Users className="w-4 h-4 text-neutral-500" />
                Hồ sơ gia đình
              </Link>
            </div>
          </aside>

          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Chỉ số sức khỏe</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatTile icon={Activity} label="BMI" value={mockVitalStats.bmi} />
                <StatTile icon={Heart} label="Nhịp tim (BPM)" value={mockVitalStats.heartRate} />
                <StatTile icon={Activity} label="Cân nặng (kg)" value={mockVitalStats.weight} />
              </div>
              {mockVitalStats.allergies?.length > 0 && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-900">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Dị ứng: {mockVitalStats.allergies.join(', ')}
                </div>
              )}
            </section>

            <section className="app-card p-5 sm:p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">Tủ thuốc</h3>
              <div className="space-y-3">
                {mockMedicines.map((medicine) => {
                  const pct = Math.round((medicine.daysRemaining / medicine.totalDays) * 100);
                  const low = medicine.daysRemaining <= 2;
                  return (
                    <div key={medicine.id} className="p-4 rounded-xl border border-neutral-200">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Pill className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-medium text-sm text-neutral-900 truncate">{medicine.name}</span>
                        </div>
                        {low && (
                          <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg shrink-0">
                            Cần mua thêm
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-neutral-500">
                        <span>{medicine.daysRemaining} / {medicine.totalDays} ngày còn lại</span>
                        <span>{medicine.schedule}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="app-card p-5 sm:p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">Lịch sử khám bệnh</h3>
              {timelineItems.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">Chưa có lịch sử điều trị</p>
              ) : (
                <div className="space-y-0">
                  {timelineItems.map((item, index) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 shrink-0 mt-1.5" />
                        {index < timelineItems.length - 1 && (
                          <div className="w-px flex-1 bg-neutral-200 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-xs text-neutral-400">{formatDate(item.date)}</p>
                        <p className="font-semibold text-neutral-900 text-sm mt-0.5">{item.doctor}</p>
                        <p className="text-sm text-neutral-600 mt-0.5">{item.diagnosis}</p>
                        <BtnSecondary
                          onClick={() => setSelectedTreatment(item)}
                          className="mt-2 !py-1.5 !px-3 !text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem đơn thuốc
                        </BtnSecondary>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        <Modal
          open={editMode}
          onClose={() => setEditMode(false)}
          title="Chỉnh sửa hồ sơ"
          footer={
            <>
              <BtnSecondary onClick={() => setEditMode(false)}>Hủy</BtnSecondary>
              <BtnPrimary type="submit" form="edit-profile-form">Lưu thay đổi</BtnPrimary>
            </>
          }
        >
          <form id="edit-profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
            <FormField label="Họ và tên" required>
              <Input name="fullName" value={formData.fullName || ''} onChange={handleInputChange} required />
            </FormField>
            <FormField label="Ngày sinh">
              <Input type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleInputChange} />
            </FormField>
            <FormField label="Giới tính">
              <Select name="gender" value={formData.gender || ''} onChange={handleInputChange}>
                <option value="">Chọn giới tính</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </Select>
            </FormField>
            <FormField label="Số điện thoại">
              <Input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} />
            </FormField>
            <FormField label="Địa chỉ">
              <Input name="address" value={formData.address || ''} onChange={handleInputChange} />
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
              <BtnPrimary type="submit" form="password-form">Cập nhật</BtnPrimary>
            </>
          }
        >
          <form id="password-form" onSubmit={handleChangePassword} className="space-y-4">
            <FormField label="Mật khẩu hiện tại" required>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Mật khẩu mới" required>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={6}
              />
            </FormField>
            <FormField label="Xác nhận mật khẩu mới" required>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </FormField>
          </form>
        </Modal>

        <Modal
          open={showSOSForm}
          onClose={() => setShowSOSForm(false)}
          title="Liên hệ khẩn cấp"
          footer={
            <>
              <BtnSecondary onClick={() => setShowSOSForm(false)}>Hủy</BtnSecondary>
              <BtnDanger type="submit" form="sos-form">Lưu</BtnDanger>
            </>
          }
        >
          <form id="sos-form" onSubmit={handleUpdateSOS} className="space-y-4">
            <FormField label="Tên người liên hệ" required>
              <Input
                value={sosData.emergencyContact}
                onChange={(e) => setSosData({ ...sosData, emergencyContact: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Số điện thoại khẩn cấp" required>
              <Input
                type="tel"
                value={sosData.emergencyPhone}
                onChange={(e) => setSosData({ ...sosData, emergencyPhone: e.target.value })}
                required
              />
            </FormField>
          </form>
        </Modal>

        <Modal
          open={!!selectedTreatment}
          onClose={() => setSelectedTreatment(null)}
          title="Chi tiết điều trị"
          footer={<BtnSecondary onClick={() => setSelectedTreatment(null)}>Đóng</BtnSecondary>}
        >
          {selectedTreatment && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-neutral-50">
                <div>
                  <span className="text-neutral-500">Bác sĩ</span>
                  <p className="font-semibold">{selectedTreatment.doctor}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Ngày</span>
                  <p className="font-semibold">{formatDate(selectedTreatment.date)}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-neutral-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Chẩn đoán</p>
                <p className="text-neutral-800">{selectedTreatment.diagnosis}</p>
              </div>
              <div className="p-4 rounded-xl border border-neutral-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Đơn thuốc / Ghi chú</p>
                <p className="text-neutral-800 whitespace-pre-wrap">{selectedTreatment.prescription}</p>
              </div>
            </div>
          )}
        </Modal>
      </AppPage>
    </PatientLayout>
  );
};

export default PatientProfile;
