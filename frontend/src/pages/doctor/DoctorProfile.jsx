import { useEffect, useState } from 'react';
import DoctorLayout from '../../components/doctor/DoctorLayout';
import { doctorService } from '../../services/doctorService';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import './DoctorProfile.css';

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
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'experience' ? parseInt(value) || 0 : value,
    });
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
        <Loading />
      </DoctorLayout>
    );
  }

  if (!profile) {
    return (
      <DoctorLayout>
        <div className="doctor-profile-page">
          <div className="error-state">
            <p>Không tìm thấy hồ sơ</p>
          </div>
        </div>
      </DoctorLayout>
    );
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DoctorLayout>
      <div className="doctor-profile-page">
        {/* Header Section */}
        <div className="profile-header-section">
          <div className="profile-header-content">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                <span className="avatar-initials">{getInitials(profile.fullName)}</span>
              </div>
              <div className="avatar-badge">
                <span className="badge-icon"></span>
              </div>
            </div>
            <div className="profile-header-info">
              <h1 className="profile-name">{profile.fullName}</h1>
              <p className="profile-specialization">{profile.specialization}</p>
              <div className="profile-meta">
                <span className="meta-item">
                  <span className="meta-icon">📧</span>
                  {profile.email}
                </span>
                {profile.phone && (
                  <span className="meta-item">
                    <span className="meta-icon">📞</span>
                    {profile.phone}
                  </span>
                )}
              </div>
            </div>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="edit-profile-btn"
              >
                <span className="btn-icon">✏️</span>
                Chỉnh sửa hồ sơ
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <ErrorMessage message={error} onClose={() => setError('')} />
        {success && (
          <div className="success-message">
            <span className="success-icon"></span>
            {success}
          </div>
        )}

        {/* Main Content */}
        <div className="profile-content-grid">
          {/* Profile Information Card */}
          <div className="profile-section-card">
            <div className="section-card-header">
              <div className="section-header-left">
                <span className="section-icon"></span>
                <h2 className="section-title">Thông tin cá nhân</h2>
              </div>
              {editMode && (
                <button
                  onClick={() => {
                    setEditMode(false);
                    loadProfile();
                  }}
                  className="cancel-edit-btn"
                >
                  ✕ Hủy
                </button>
              )}
            </div>

            {!editMode ? (
              <div className="profile-info-display">
                <div className="info-row">
                  <div className="info-label">
                    <span className="label-icon"></span>
                    Họ và tên
                  </div>
                  <div className="info-value">{profile.fullName}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">
                    <span className="label-icon"></span>
                    Chuyên khoa
                  </div>
                  <div className="info-value">{profile.specialization}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">
                    <span className="label-icon">🎓</span>
                    Bằng cấp
                  </div>
                  <div className="info-value">{profile.qualification || 'Chưa cập nhật'}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">
                    <span className="label-icon">★</span>
                    Kinh nghiệm
                  </div>
                  <div className="info-value">
                    {profile.experience} {profile.experience === 1 ? 'năm' : 'năm'}
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-label">
                    <span className="label-icon">📧</span>
                    Email
                  </div>
                  <div className="info-value">{profile.email}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">
                    <span className="label-icon">📞</span>
                    Số điện thoại
                  </div>
                  <div className="info-value">{profile.phone || 'Chưa cập nhật'}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">
                    <span className="label-icon">📍</span>
                    Địa chỉ
                  </div>
                  <div className="info-value">{profile.address || 'Chưa cập nhật'}</div>
                </div>
                {profile.bio && (
                  <div className="info-row info-row-full">
                    <div className="info-label">
                      <span className="label-icon">📝</span>
                      Giới thiệu
                    </div>
                    <div className="info-value info-bio">{profile.bio}</div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="profile-edit-form">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon"></span>
                    Họ và tên <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon"></span>
                    Chuyên khoa <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    placeholder="VD: Tim mạch, Nội khoa..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">🎓</span>
                      Bằng cấp
                    </label>
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="VD: Tiến sĩ Y khoa"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">★</span>
                      Kinh nghiệm (năm)
                    </label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      min="0"
                      className="form-input"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📞</span>
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="VD: 0901234567"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📍</span>
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📝</span>
                    Giới thiệu
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    className="form-textarea"
                    placeholder="Viết giới thiệu về bản thân..."
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    <span className="btn-icon">💾</span>
                    Lưu thay đổi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      loadProfile();
                    }}
                    className="btn-secondary"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Change Password Card */}
          <div className="profile-section-card">
            <div className="section-card-header">
              <div className="section-header-left">
                <span className="section-icon">🔒</span>
                <h2 className="section-title">Bảo mật</h2>
              </div>
            </div>

            {!showPasswordForm ? (
              <div className="password-section-content">
                <div className="password-info">
                  <p className="password-description">
                    Để bảo vệ tài khoản của bạn, hãy đảm bảo mật khẩu của bạn mạnh và không chia sẻ với người khác.
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="btn-change-password"
                >
                  <span className="btn-icon">🔑</span>
                  Đổi mật khẩu
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🔒</span>
                    Mật khẩu hiện tại <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                    className="form-input"
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🔑</span>
                    Mật khẩu mới <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength={6}
                    className="form-input"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon"></span>
                    Xác nhận mật khẩu mới <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    className="form-input"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    <span className="btn-icon">💾</span>
                    Cập nhật mật khẩu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="btn-secondary"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorProfile;
