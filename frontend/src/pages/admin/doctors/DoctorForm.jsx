import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { adminService } from '../../../services/adminService';
import ErrorMessage from '../../../components/common/ErrorMessage';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BtnPrimary, BtnSecondary } from '../../../components/shell/DashboardPrimitives';
import ShellIcon from '../../../components/shell/ShellIcon';

const DoctorForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: '',
    address: '',
    bio: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Danh sách chuyên khoa
  const specializationOptions = [
    'Nội khoa',
    'Ngoại khoa',
    'Nhi khoa',
    'Sản khoa',
    'Phụ khoa',
    'Tim mạch',
    'Da liễu',
    'Tai - Mũi - Họng',
    'Răng - Hàm - Mặt',
    'Mắt',
    'Thần kinh',
    'Chấn thương chỉnh hình',
    'Ung bướu',
    'Hô hấp',
    'Tiết niệu',
    'Nội tiết',
    'Huyết học',
    'Tâm thần',
    'Cơ xương khớp',
    'Dị ứng - Miễn dịch'
  ];

  // Danh sách trình độ
  const qualificationOptions = [
    'Bác sĩ (BS)',
    'Bác sĩ nội trú',
    'Chuyên khoa I (CKI)',
    'Chuyên khoa II (CKII)',
    'Thạc sĩ (ThS)',
    'Tiến sĩ (TS)',
    'Phó giáo sư (PGS)',
    'Giáo sư (GS)'
  ];

  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [customSpecialization, setCustomSpecialization] = useState('');
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false);
  const [customQualification, setCustomQualification] = useState('');
  const [showQualificationDropdown, setShowQualificationDropdown] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadDoctor();
    }
  }, [id]);

  useEffect(() => {
    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.relative')) {
        setShowSpecializationDropdown(false);
        setShowQualificationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadDoctor = async () => {
    try {
      const doctor = await adminService.getDoctorById(id);
      
      // Parse specialization (có thể là string với dấu phảy hoặc array)
      const specializationArray = doctor.specialization 
        ? (typeof doctor.specialization === 'string' 
            ? doctor.specialization.split(',').map(s => s.trim()).filter(s => s) 
            : doctor.specialization)
        : [];
      
      setSelectedSpecializations(specializationArray);
      
      setFormData({
        username: doctor.username,
        email: doctor.email,
        password: '',
        fullName: doctor.fullName,
        phone: doctor.phone || '',
        specialization: doctor.specialization || '',
        qualification: doctor.qualification || '',
        experience: doctor.experience || '',
        address: doctor.address || '',
        bio: doctor.bio || ''
      });
    } catch (err) {
      setError('Không thể tải thông tin bác sĩ');
      console.error(err);
    }
  };

  const handleAddSpecialization = (spec) => {
    if (spec && !selectedSpecializations.includes(spec)) {
      setSelectedSpecializations([...selectedSpecializations, spec]);
    }
    setCustomSpecialization('');
    setShowSpecializationDropdown(false);
  };

  const handleRemoveSpecialization = (spec) => {
    setSelectedSpecializations(selectedSpecializations.filter(s => s !== spec));
  };

  const handleAddCustomSpecialization = () => {
    const trimmed = customSpecialization.trim();
    if (trimmed && !selectedSpecializations.includes(trimmed)) {
      setSelectedSpecializations([...selectedSpecializations, trimmed]);
      setCustomSpecialization('');
    }
  };

  const handleQualificationSelect = (qual) => {
    setFormData({ ...formData, qualification: qual });
    setCustomQualification('');
    setShowQualificationDropdown(false);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username?.trim()) {
      errors.username = 'Tên đăng nhập không được để trống';
    }

    if (!formData.email?.trim()) {
      errors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Định dạng email không hợp lệ';
    }

    if (!isEdit && !formData.password?.trim()) {
      errors.password = 'Mật khẩu không được để trống';
    } else if (!isEdit && formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.fullName?.trim()) {
      errors.fullName = 'Họ và tên không được để trống';
    }

    if (selectedSpecializations.length === 0) {
      errors.specialization = 'Vui lòng chọn ít nhất một chuyên khoa';
    } else {
      // Check total length of specializations string
      const specializationString = selectedSpecializations.join(', ');
      if (specializationString.length > 500) {
        errors.specialization = `Tổng độ dài chuyên khoa vượt quá giới hạn (${specializationString.length}/500 ký tự). Vui lòng bỏ bớt một số chuyên khoa.`;
      }
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
      // Convert selectedSpecializations array to comma-separated string
      const specializationString = selectedSpecializations.join(', ');
      
      // Parse experience safely
      const experienceValue = formData.experience ? parseInt(formData.experience) : 0;
      const finalExperience = isNaN(experienceValue) ? 0 : experienceValue;
      
      if (isEdit) {
        // Update
        const updateData = {
          username: formData.username?.trim(),
          email: formData.email?.trim(),
          fullName: formData.fullName?.trim(),
          specialization: specializationString,
          qualification: formData.qualification?.trim() || customQualification.trim() || '',
          experience: finalExperience,
          phone: formData.phone?.trim() || '',
          address: formData.address?.trim() || '',
          bio: formData.bio?.trim() || '',
        };
        if (formData.password && formData.password.trim() !== '') {
          updateData.password = formData.password.trim();
        } else {
          updateData.password = 'current_password_unchanged';
        }
        
        console.log('Update data:', updateData); // Debug
        await adminService.updateDoctor(id, updateData);
        toast.success('Cập nhật bác sĩ thành công!', { position: 'top-right', autoClose: 3000 });
        setTimeout(() => navigate('/admin/doctors'), 500);
      } else {
        // Create
        const createData = {
          username: formData.username?.trim(),
          email: formData.email?.trim(),
          password: formData.password?.trim(),
          fullName: formData.fullName?.trim(),
          specialization: specializationString,
          qualification: formData.qualification?.trim() || customQualification.trim() || '',
          experience: finalExperience,
          phone: formData.phone?.trim() || '',
          address: formData.address?.trim() || '',
          bio: formData.bio?.trim() || ''
        };
        
        console.log('Create data:', createData); // Debug
        await adminService.createDoctor(createData);
        toast.success('Tạo bác sĩ thành công!', { position: 'top-right', autoClose: 3000 });
        setTimeout(() => navigate('/admin/doctors'), 500);
      }

      setError('');
    } catch (err) {
      console.error('Full error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      const errorMsg = err.response?.data?.message || 
                       err.response?.data || 
                       (typeof err === 'string' ? err : `Không thể ${isEdit ? 'cập nhật' : 'tạo'} bác sĩ`);
      setError(errorMsg);
      toast.error(errorMsg, { position: 'top-right', autoClose: 4000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="app-page space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between app-card p-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Chỉnh Sửa Bác Sĩ' : 'Tạo Bác Sĩ Mới'}
            </h1>
            <p className="text-gray-600 mt-1">Cập nhật thông tin bác sĩ</p>
          </div>
          <button 
            onClick={() => navigate('/admin/doctors')} 
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

        {/* Doctor Form */}
        <div className="app-card p-6">
          <form onSubmit={handleSubmit} className="app-page space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent ${
                    formErrors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập tên đăng nhập"
                />
                {formErrors.username && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập email"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu {!isEdit && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent ${
                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={isEdit ? 'Để trống nếu không đổi mật khẩu' : 'Nhập mật khẩu (tối thiểu 6 ký tự)'}
                />
                {formErrors.password && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent ${
                    formErrors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập họ và tên"
                />
                {formErrors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              {/* Specialization - Multi Select */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chuyên khoa <span className="text-red-500">*</span>
                </label>
                
                {/* Selected Specializations */}
                {selectedSpecializations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedSpecializations.map((spec, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                      >
                        {spec}
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecialization(spec)}
                          className="hover:text-indigo-900 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Input with Dropdown */}
                <div className="relative">
                  <input
                    type="text"
                    value={customSpecialization}
                    onChange={(e) => setCustomSpecialization(e.target.value)}
                    onFocus={() => setShowSpecializationDropdown(true)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSpecialization();
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent ${
                      formErrors.specialization ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Chọn từ danh sách hoặc nhập chuyên khoa mới..."
                  />
                  
                  {/* Dropdown List */}
                  {showSpecializationDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {specializationOptions
                        .filter(opt => !selectedSpecializations.includes(opt))
                        .filter(opt => opt.toLowerCase().includes(customSpecialization.toLowerCase()))
                        .map((option, index) => (
                          <div
                            key={index}
                            onClick={() => handleAddSpecialization(option)}
                            className="px-4 py-2 hover:bg-neutral-50 cursor-pointer text-sm"
                          >
                            {option}
                          </div>
                        ))}
                      
                      {customSpecialization.trim() && (
                        <div
                          onClick={handleAddCustomSpecialization}
                          className="px-4 py-2 hover:bg-green-50 cursor-pointer text-sm border-t border-gray-200 text-green-600 font-medium"
                        >
                          + Thêm "{customSpecialization.trim()}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {formErrors.specialization && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.specialization}</p>
                )}
              </div>

              {/* Qualification - Dropdown with Custom Input */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trình độ
                </label>
                
                {/* Display selected qualification */}
                {formData.qualification && (
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {formData.qualification}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, qualification: '' })}
                        className="hover:text-green-900 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                )}

                {/* Input with Dropdown */}
                <div className="relative">
                  <input
                    type="text"
                    value={customQualification}
                    onChange={(e) => setCustomQualification(e.target.value)}
                    onFocus={() => setShowQualificationDropdown(true)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = customQualification.trim();
                        if (trimmed) {
                          setFormData({ ...formData, qualification: trimmed });
                          setCustomQualification('');
                          setShowQualificationDropdown(false);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    placeholder="Chọn từ danh sách hoặc nhập trình độ mới..."
                  />
                  
                  {/* Dropdown List */}
                  {showQualificationDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {qualificationOptions
                        .filter(opt => opt.toLowerCase().includes(customQualification.toLowerCase()))
                        .map((option, index) => (
                          <div
                            key={index}
                            onClick={() => handleQualificationSelect(option)}
                            className="px-4 py-2 hover:bg-green-50 cursor-pointer text-sm"
                          >
                            {option}
                          </div>
                        ))}
                      
                      {customQualification.trim() && (
                        <div
                          onClick={() => {
                            const trimmed = customQualification.trim();
                            setFormData({ ...formData, qualification: trimmed });
                            setCustomQualification('');
                            setShowQualificationDropdown(false);
                          }}
                          className="px-4 py-2 hover:bg-green-50 cursor-pointer text-sm border-t border-gray-200 text-green-600 font-medium"
                        >
                          + Thêm "{customQualification.trim()}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kinh nghiệm (năm)
                </label>
                <input
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="Nhập số năm kinh nghiệm"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="Nhập địa chỉ"
                />
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiểu sử
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="Nhập tiểu sử bác sĩ"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
              <BtnSecondary type="button" onClick={() => navigate('/admin/doctors')} disabled={submitting} className="flex-1">
                Hủy
              </BtnSecondary>
              <BtnPrimary type="submit" disabled={submitting} className="flex-1">
                {submitting ? (isEdit ? 'Đang cập nhật...' : 'Đang tạo...') : (isEdit ? 'Cập nhật' : 'Tạo mới')}
              </BtnPrimary>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer />
    </AdminLayout>
  );
};

export default DoctorForm;
