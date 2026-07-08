import React, { useState, useEffect } from 'react';
import PatientLayout from '../../components/patient/PatientLayout';
import familyService from '../../services/familyService';
import ShellIcon from '../../components/shell/ShellIcon';
import { AppPage, PageHeader, BtnPrimary, BtnSecondary, BtnDanger, Modal, FormField, Input, Select, Textarea, AlertError } from '../../components/shell/DashboardPrimitives';
import { StatTile } from '../../components/shell/PatientPageUI';
import { Users, UserCheck, Heart, Pencil, Trash2 } from 'lucide-react';

const FamilyProfilePage = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    mainAccounts: 0,
    membersWithMedicalHistory: 0
  });

  const [formData, setFormData] = useState({
    fullName: '',
    relationship: 'CHILD',
    dateOfBirth: '',
    gender: 'MALE',
    medicalHistory: ''
  });

  // Load dữ liệu khi component mount
  useEffect(() => {
    loadFamilyData();
  }, []);

  // Load danh sách thành viên và stats
  const loadFamilyData = async (showLoadingScreen = true) => {
    try {
      if (showLoadingScreen) {
        setLoading(true);
      }
      setError(null);
      
      console.log(' Loading family data...');
      const [membersData, statsData] = await Promise.all([
        familyService.getFamilyMembers(),
        familyService.getFamilyStats()
      ]);
      
      console.log(' Family members loaded:', membersData);
      console.log(' Stats loaded:', statsData);
      
      setFamilyMembers(membersData);
      setStats(statsData);
    } catch (err) {
      console.error(' Error loading family data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      if (showLoadingScreen) {
        setLoading(false);
      }
    }
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setFormData({
      fullName: '',
      relationship: 'CHILD',
      dateOfBirth: '',
      gender: 'MALE',
      medicalHistory: ''
    });
    setShowAddModal(true);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setFormData({
      fullName: member.fullName,
      relationship: member.relationship,
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      medicalHistory: member.medicalHistory || ''
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingMember(null);
    setFormData({
      fullName: '',
      relationship: 'CHILD',
      dateOfBirth: '',
      gender: 'MALE',
      medicalHistory: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submitting) return; // Prevent multiple submits
    
    try {
      setSubmitting(true);
      console.log('📤 Submitting form:', formData);
      
      if (editingMember) {
        // Update existing member
        await familyService.updateFamilyMember(editingMember.id, formData);
        console.log(' Member updated successfully');
      } else {
        // Create new member
        await familyService.createFamilyMember(formData);
        console.log(' Member created successfully');
      }
      
      // Reload data (KHÔNG hiện loading screen)
      await loadFamilyData(false);
      
      // Close modal
      handleCloseModal();
      
      // Đợi một chút để React hoàn tất render trước khi clear submitting
      // (để useEffect có thời gian xử lý icons trước khi state thay đổi)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      alert(editingMember ? 'Cập nhật thành công!' : 'Thêm thành viên thành công!');
    } catch (err) {
      console.error(' Error submitting form:', err);
      alert(err.response?.data || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      // Clear submitting sau khi đã đợi React render xong
      setTimeout(() => {
        setSubmitting(false);
      }, 200);
    }
  };

  const handleDeleteMember = async (member) => {
    if (deletingMemberId) return; // Prevent multiple deletes
    
    // Không cho phép xóa tài khoản chính
    if (member.isMainAccount) {
      alert('Không thể xóa tài khoản chính. Tài khoản chính là bắt buộc và không thể xóa.');
      return;
    }
    
    // Xác nhận xóa cho thành viên khác
    if (!window.confirm(`Bạn có chắc muốn xóa hồ sơ của ${member.fullName}?`)) {
      return;
    }
    
    try {
      setDeletingMemberId(member.id);
      console.log('🗑️ Deleting member:', member.id);
      
      await familyService.deleteFamilyMember(member.id);
      console.log(' Member deleted successfully');
      
      // Reload data (KHÔNG hiện loading screen)
      await loadFamilyData(false);
      
      // Đợi một chút để React hoàn tất render trước khi clear deletingMemberId
      // (để useEffect có thời gian xử lý icons trước khi state thay đổi)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      alert('Xóa thành công!');
    } catch (err) {
      console.error(' Error deleting member:', err);
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || 'Không thể xóa. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      // Clear deletingMemberId sau khi đã đợi React render xong
      setTimeout(() => {
        setDeletingMemberId(null);
      }, 200);
    }
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Map relationship từ backend (SELF, CHILD...) sang tiếng Việt
  const getRelationshipLabel = (relationship) => {
    const map = {
      'SELF': 'Bản thân',
      'CHILD': 'Con cái',
      'PARENT': 'Bố/Mẹ',
      'SPOUSE': 'Vợ/Chồng',
      'SIBLING': 'Anh/Chị/Em',
      'OTHER': 'Khác'
    };
    return map[relationship] || relationship;
  };

  // Map gender từ backend (MALE, FEMALE...) sang tiếng Việt
  const getGenderLabel = (gender) => {
    const map = {
      'MALE': 'Nam',
      'FEMALE': 'Nữ',
      'OTHER': 'Khác'
    };
    return map[gender] || gender;
  };

  const getRelationshipIconName = (relationship) => {
    const map = { SELF: 'user', CHILD: 'user', PARENT: 'users', SPOUSE: 'heart', SIBLING: 'users' };
    return map[relationship] || 'user';
  };

  return (
    <PatientLayout>
      <AppPage>
        <PageHeader
          title="Hồ sơ gia đình"
          subtitle="Quản lý thông tin sức khỏe các thành viên"
          actions={
            <BtnPrimary onClick={handleAddMember}>
              <ShellIcon name="user-plus" className="w-4 h-4" />
              Thêm thành viên
            </BtnPrimary>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile icon={Users} label="Thành viên" value={stats.totalMembers} />
          <StatTile icon={UserCheck} label="Tài khoản chính" value={stats.mainAccounts} />
          <StatTile icon={Heart} label="Có tiền sử bệnh" value={stats.membersWithMedicalHistory} />
        </div>

        {loading && (
          <div className="app-card p-10 text-center text-neutral-400 text-sm">Đang tải dữ liệu...</div>
        )}

        {error && (
          <div className="app-card p-6">
            <AlertError message={error} />
            <BtnSecondary onClick={() => loadFamilyData(true)} className="mt-4">
              <ShellIcon name="refresh-cw" className="w-4 h-4" />
              Thử lại
            </BtnSecondary>
          </div>
        )}

        {!loading && !error && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900">Danh sách thành viên</h2>
              <span className="text-sm text-neutral-500">{familyMembers.length} người</span>
            </div>

            {familyMembers.length === 0 ? (
              <div className="app-card p-10 text-center">
                <ShellIcon name="users" className="w-10 h-10 mx-auto text-neutral-300 mb-3" />
                <h3 className="font-semibold text-neutral-900">Chưa có thành viên nào</h3>
                <p className="text-sm text-neutral-500 mt-1 mb-6">Thêm thành viên gia đình để quản lý hồ sơ sức khỏe</p>
                <BtnPrimary onClick={handleAddMember}>
                  <ShellIcon name="user-plus" className="w-4 h-4" />
                  Thêm thành viên đầu tiên
                </BtnPrimary>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {familyMembers.map((member) => (
                  <article
                    key={member.id}
                    className={`app-card p-5 ${member.isMainAccount ? 'ring-2 ring-neutral-900/10' : ''}`}
                  >
                    {member.isMainAccount && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-lg mb-4">
                        <ShellIcon name="star" className="w-3.5 h-3.5" />
                        Tài khoản chính
                      </span>
                    )}

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                        <ShellIcon name={getRelationshipIconName(member.relationship)} className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-neutral-900 truncate">{member.fullName}</h3>
                        <p className="text-sm text-neutral-500">{getRelationshipLabel(member.relationship)}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-neutral-600">
                      <div className="flex items-center gap-1.5">
                        <ShellIcon name="calendar" className="w-3.5 h-3.5 text-neutral-400" />
                        {new Date(member.dateOfBirth).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShellIcon name="gift" className="w-3.5 h-3.5 text-neutral-400" />
                        {calculateAge(member.dateOfBirth)} tuổi
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <ShellIcon name="user" className="w-3.5 h-3.5 text-neutral-400" />
                        {getGenderLabel(member.gender)}
                      </div>
                    </div>

                    {member.medicalHistory && (
                      <div className="mt-4 p-3 rounded-xl bg-neutral-50 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1 flex items-center gap-1">
                          <ShellIcon name="file-text" className="w-3.5 h-3.5" />
                          Tiền sử bệnh
                        </p>
                        <p className="text-neutral-700">{member.medicalHistory}</p>
                      </div>
                    )}

                    {!member.isMainAccount && (
                      <div className="mt-4 flex gap-2 pt-4 border-t border-neutral-100">
                        <BtnSecondary
                          onClick={() => handleEditMember(member)}
                          disabled={deletingMemberId || submitting}
                          className="flex-1"
                        >
                          <Pencil className="w-4 h-4" />
                          Sửa
                        </BtnSecondary>
                        <BtnDanger
                          onClick={() => handleDeleteMember(member)}
                          disabled={deletingMemberId || submitting}
                          className="flex-1"
                        >
                          {deletingMemberId === member.id ? (
                            'Đang xóa...'
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              Xóa
                            </>
                          )}
                        </BtnDanger>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <Modal
          open={showAddModal}
          onClose={handleCloseModal}
          title={editingMember ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
          footer={
            <>
              <BtnSecondary onClick={handleCloseModal} disabled={submitting}>Hủy</BtnSecondary>
              <BtnPrimary type="submit" form="family-member-form" disabled={submitting}>
                {submitting ? (editingMember ? 'Đang cập nhật...' : 'Đang thêm...') : (editingMember ? 'Cập nhật' : 'Thêm thành viên')}
              </BtnPrimary>
            </>
          }
        >
          <form id="family-member-form" onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Họ và tên" required>
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Nhập họ và tên"
                required
                disabled={submitting}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Quan hệ" required>
                <Select
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  required
                  disabled={submitting}
                >
                  <option value="CHILD">Con cái</option>
                  <option value="PARENT">Bố/Mẹ</option>
                  <option value="SPOUSE">Vợ/Chồng</option>
                  <option value="SIBLING">Anh/Chị/Em</option>
                  <option value="OTHER">Khác</option>
                </Select>
              </FormField>

              <FormField label="Giới tính" required>
                <Select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  required
                  disabled={submitting}
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </Select>
              </FormField>
            </div>

            <FormField label="Ngày sinh" required>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
                disabled={submitting}
              />
            </FormField>

            <FormField label="Tiền sử bệnh">
              <Textarea
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="Nhập tiền sử bệnh (nếu có)..."
                rows={4}
                disabled={submitting}
              />
              <p className="text-xs text-neutral-400 mt-1">Ví dụ: Cao huyết áp, Tiểu đường, Dị ứng thuốc...</p>
            </FormField>
          </form>
        </Modal>
      </AppPage>
    </PatientLayout>
  );
};

export default FamilyProfilePage;

