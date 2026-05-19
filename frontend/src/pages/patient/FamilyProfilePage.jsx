import React, { useState, useEffect } from 'react';
import PatientLayout from '../../components/patient/PatientLayout';
import familyService from '../../services/familyService';
import feather from 'feather-icons';
import './FamilyProfilePage.css';

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

  // Initialize Feather Icons sau khi DOM được update (tránh lỗi removeChild)
  useEffect(() => {
    // CHỈ initialize khi:
    // 1. Không đang loading
    // 2. Không đang submitting (tránh xung đột với React render)
    // 3. Không đang deleting
    // 4. Modal KHÔNG đang mở (tránh replace icons trong modal khi đang submit)
    if (!loading && !submitting && !deletingMemberId && !showAddModal) {
      // Dùng requestAnimationFrame + setTimeout để đảm bảo chạy SAU KHI React đã hoàn tất render/unmount
      const timer = setTimeout(() => {
        // Dùng requestAnimationFrame để đảm bảo chạy trong next frame (sau khi React đã cleanup)
        requestAnimationFrame(() => {
          setTimeout(() => {
            try {
              // Double-check: vẫn không đang submit/delete và modal không mở (tránh race condition)
              if (!submitting && !deletingMemberId && !showAddModal) {
                // Replace icons (chỉ các icons còn tồn tại trong DOM)
                const icons = document.querySelectorAll('[data-feather]');
                if (icons.length > 0) {
                  feather.replace();
                  console.log(' Feather icons initialized/replaced');
                }
              }
            } catch (e) {
              // Ignore errors (có thể do removeChild nhưng không ảnh hưởng UX)
              console.log(' Feather icons error (ignored):', e.message);
            }
          }, 100); // Thêm delay nhỏ trong requestAnimationFrame
        });
      }, 500); // Delay ban đầu 500ms
      
      return () => clearTimeout(timer);
    }
  }, [loading, familyMembers, showAddModal, submitting, deletingMemberId]); // Thêm submitting và deletingMemberId vào dependencies

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

  const getRelationshipIcon = (relationship) => {
    switch (relationship) {
      case 'SELF': return '';
      case 'CHILD': return '👶';
      case 'PARENT': return '👨‍👩';
      case 'SPOUSE': return '💑';
      case 'SIBLING': return '👫';
      default: return '';
    }
  };

  const getRelationshipColor = (relationship) => {
    switch (relationship) {
      case 'SELF': return '#667eea';
      case 'CHILD': return '#48bb78';
      case 'PARENT': return '#ed8936';
      case 'SPOUSE': return '#ec4899';
      case 'SIBLING': return '#4299e1';
      default: return '#718096';
    }
  };

  return (
    <PatientLayout>
      <div className="family-profile-page">
      {/* Header */}
      <div className="family-header">
        <div className="header-content">
          <h1>
            <span className="header-icon"></span>
            Hồ sơ Gia đình
          </h1>
          <p className="header-subtitle">
            Quản lý thông tin sức khỏe của các thành viên trong gia đình
          </p>
        </div>
        <button className="btn-add-member" onClick={handleAddMember}>
          <i data-feather="user-plus"></i>
          Thêm thành viên
        </button>
      </div>

      {/* Stats */}
      <div className="family-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i data-feather="users"></i>
          </div>
          <div className="stat-info">
            <div className="stat-label">Thành viên</div>
            <div className="stat-value">{stats.totalMembers}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i data-feather="user-check"></i>
          </div>
          <div className="stat-info">
            <div className="stat-label">Tài khoản chính</div>
            <div className="stat-value">{stats.mainAccounts}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i data-feather="heart"></i>
          </div>
          <div className="stat-info">
            <div className="stat-label">Có tiền sử bệnh</div>
            <div className="stat-value">{stats.membersWithMedicalHistory}</div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="error-message">
          <i data-feather="alert-circle"></i>
          <p>{error}</p>
          <button onClick={() => loadFamilyData(true)} className="btn-retry">
            <i data-feather="refresh-cw"></i>
            Thử lại
          </button>
        </div>
      )}

      {/* Members List */}
      {!loading && !error && (
        <div className="members-section">
          <div className="section-header">
            <h2>Danh sách thành viên</h2>
            <span className="member-count">{familyMembers.length} người</span>
          </div>

          {familyMembers.length === 0 ? (
            <div className="empty-state">
              <i data-feather="users"></i>
              <h3>Chưa có thành viên nào</h3>
              <p>Thêm thành viên gia đình để bắt đầu quản lý hồ sơ sức khỏe</p>
              <button className="btn-add-member" onClick={handleAddMember}>
                <i data-feather="user-plus"></i>
                Thêm thành viên đầu tiên
              </button>
            </div>
          ) : (
            <div className="members-grid">
          {familyMembers.map(member => (
            <div 
              key={member.id} 
              className={`member-card ${member.isMainAccount ? 'main-account' : ''}`}
            >
              {member.isMainAccount && (
                <div className="main-badge">
                  <i data-feather="star"></i> Tài khoản chính
                </div>
              )}

              <div className="member-header">
                <div className="member-avatar" style={{ 
                  background: `linear-gradient(135deg, ${getRelationshipColor(member.relationship)}33, ${getRelationshipColor(member.relationship)}66)`
                }}>
                  <span className="avatar-icon">{getRelationshipIcon(member.relationship)}</span>
                </div>
                <div className="member-basic-info">
                  <h3 className="member-name">{member.fullName}</h3>
                  <span 
                    className="member-relationship"
                    style={{ color: getRelationshipColor(member.relationship) }}
                  >
                    {getRelationshipLabel(member.relationship)}
                  </span>
                </div>
              </div>

              <div className="member-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <i data-feather="calendar"></i>
                    <span>{new Date(member.dateOfBirth).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="detail-item">
                    <i data-feather="gift"></i>
                    <span>{calculateAge(member.dateOfBirth)} tuổi</span>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-item">
                    <i data-feather={member.gender === 'MALE' ? 'user' : 'user'}></i>
                    <span>{getGenderLabel(member.gender)}</span>
                  </div>
                </div>
                {member.medicalHistory && (
                  <div className="medical-history">
                    <div className="history-label">
                      <i data-feather="file-text"></i>
                      Tiền sử bệnh:
                    </div>
                    <div className="history-content">{member.medicalHistory}</div>
                  </div>
                )}
              </div>

              {/* Chỉ hiển thị nút Sửa và Xóa nếu KHÔNG phải tài khoản chính */}
              {!member.isMainAccount && (
                <div className="member-actions">
                  <button 
                    className="btn-action btn-edit"
                    onClick={() => handleEditMember(member)}
                    disabled={deletingMemberId || submitting}
                  >
                    <span style={{ marginRight: '6px', fontSize: '14px' }}>✏️</span>
                    Sửa
                  </button>
                  <button 
                    className="btn-action btn-delete"
                    onClick={() => handleDeleteMember(member)}
                    disabled={deletingMemberId || submitting}
                    title="Xóa thành viên này"
                  >
                    {deletingMemberId === member.id ? (
                      <>
                        <div className="loading-spinner-small"></div>
                        Đang xóa...
                      </>
                    ) : (
                      <>
                        <span style={{ marginRight: '6px', fontSize: '14px' }}>🗑️</span>
                        Xóa
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={submitting ? null : handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMember ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}</h2>
              <button className="btn-close" onClick={handleCloseModal} disabled={submitting}>
                <span style={{ fontSize: '20px', lineHeight: '1' }}>×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="member-form">
              <div className="form-group">
                <label className="form-label">
                  Họ và tên <span className="required">*</span>
                </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nhập họ và tên"
                    required
                    disabled={submitting}
                  />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Quan hệ <span className="required">*</span>
                  </label>
                  <select
                    className="form-input"
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
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Giới tính <span className="required">*</span>
                  </label>
                  <select
                    className="form-input"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    required
                    disabled={submitting}
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Ngày sinh <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tiền sử bệnh</label>
                <textarea
                  className="form-textarea"
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  placeholder="Nhập tiền sử bệnh (nếu có)..."
                  rows="4"
                  disabled={submitting}
                />
                <div className="form-hint">
                  Ví dụ: Cao huyết áp, Tiểu đường, Dị ứng thuốc...
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      {editingMember ? 'Đang cập nhật...' : 'Đang thêm...'}
                    </>
                  ) : (
                    <>
                      <span style={{ marginRight: '6px', fontSize: '16px' }}></span>
                      {editingMember ? 'Cập nhật' : 'Thêm thành viên'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </PatientLayout>
  );
};

export default FamilyProfilePage;

