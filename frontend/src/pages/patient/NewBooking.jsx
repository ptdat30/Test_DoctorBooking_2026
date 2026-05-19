import { useEffect, useState } from 'react';
import PatientLayout from '../../components/patient/PatientLayout';
import { patientService } from '../../services/patientService';
import familyService from '../../services/familyService';
import Loading from '../../components/common/Loading';
import { useNavigate } from 'react-router-dom';
import '../patient/patientPages.css';
import './NewBooking.css';

const NewBooking = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    patientFor: 'self', // 'self' hoặc family member ID
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
    paymentMethod: 'CASH', // CASH, VNPAY, WALLET
  });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loadingFamilyMembers, setLoadingFamilyMembers] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDoctors();
    loadWalletBalance();
    loadFamilyMembers();
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, appointmentDate: today }));
  }, []);

  const loadFamilyMembers = async () => {
    try {
      setLoadingFamilyMembers(true);
      const members = await familyService.getFamilyMembers();
      console.log(' Family members loaded:', members);

      // Filter ra main account (isMainAccount = true hoặc relationship = 'SELF')
      // Vì "Cho bản thân tôi" đã đại diện cho main account rồi
      const familyMembersOnly = members.filter(member =>
        !member.isMainAccount && member.relationship !== 'SELF'
      );

      console.log(' Filtered family members (excluding main account):', familyMembersOnly);
      setFamilyMembers(familyMembersOnly);
    } catch (err) {
      console.error(' Error loading family members:', err);
      // Không hiển thị error vì có thể user chưa có thành viên nào
      setFamilyMembers([]);
    } finally {
      setLoadingFamilyMembers(false);
    }
  };

  useEffect(() => {
    // Initialize Feather Icons ONCE sau khi doctors load xong
    if (!loading && doctors.length > 0 && window.feather) {
      const timer = setTimeout(() => {
        try {
          window.feather.replace();
          console.log(' Feather icons initialized');
        } catch (e) {
          console.log(' Feather icons error (ignored):', e.message);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, doctors.length]);

  const loadWalletBalance = async () => {
    try {
      const wallet = await patientService.getWallet();
      setWalletBalance(wallet.balance || 0);
    } catch (err) {
      console.error('Error loading wallet:', err);
      setWalletBalance(0);
    }
  };

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const data = await patientService.searchDoctors('');
      setDoctors(data);
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách bác sĩ');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Khi chọn bác sĩ hoặc đổi ngày, load available slots
    if ((name === 'doctorId' || name === 'appointmentDate') && value) {
      const doctorId = name === 'doctorId' ? value : formData.doctorId;
      const date = name === 'appointmentDate' ? value : formData.appointmentDate;

      if (doctorId && date) {
        await loadAvailableSlots(doctorId, date);
      }
    }
  };

  const loadAvailableSlots = async (doctorId, date) => {
    console.log('🔍 Loading available slots for doctor:', doctorId, 'date:', date);
    setLoadingSlots(true);
    setAvailableTimeSlots([]);
    setFormData(prev => ({ ...prev, appointmentTime: '' })); // Reset time selection

    try {
      const slots = await patientService.getAvailableTimeSlots(doctorId, date);
      console.log(' Available slots loaded:', slots);
      setAvailableTimeSlots(slots);
    } catch (error) {
      console.error(' Error loading slots:', error);
      setAvailableTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 Form submitted');
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Get selected doctor info
      const selectedDoctor = doctors.find(d => d.id === parseInt(formData.doctorId));
      const consultationFee = selectedDoctor?.consultationFee || 0;
      console.log(' Consultation fee:', consultationFee);
      console.log(' Payment method:', formData.paymentMethod);

      // Validate payment method với wallet balance
      if (formData.paymentMethod === 'WALLET' && walletBalance < consultationFee) {
        const errorMsg = `Số dư ví không đủ. Bạn cần ${consultationFee.toLocaleString('vi-VN')} VNĐ nhưng chỉ có ${walletBalance.toLocaleString('vi-VN')} VNĐ`;
        console.error(' Wallet validation failed:', errorMsg);
        setError(errorMsg);
        setSubmitting(false);
        return;
      }

      console.log('📤 Calling API to create appointment...');

      // Chuẩn bị request data
      const appointmentData = {
        doctorId: parseInt(formData.doctorId),
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime + ':00',
        notes: formData.notes,
        paymentMethod: formData.paymentMethod,
      };

      // Nếu đặt cho người nhà (không phải 'self'), thêm familyMemberId
      if (formData.patientFor !== 'self') {
        appointmentData.familyMemberId = parseInt(formData.patientFor);
        console.log(' Booking for family member:', appointmentData.familyMemberId);
      } else {
        console.log(' Booking for self');
      }

      const response = await patientService.createAppointment(appointmentData);

      console.log(' API response received:', response);

      // Nếu chọn VNPAY, redirect sang trang thanh toán
      if (formData.paymentMethod === 'VNPAY' && response.paymentUrl) {
        console.log('🏦 VNPAY payment URL received, redirecting...');
        console.log('🔗 Payment URL:', response.paymentUrl);
        // Redirect NGAY LẬP TỨC - không delay
        window.location.href = response.paymentUrl;
        return;
      }

      console.log(' Appointment created successfully (non-VNPAY)');
      setSuccess('Đặt lịch hẹn thành công!');
      setTimeout(() => {
        navigate('/patient/history');
      }, 2000);
    } catch (err) {
      console.error(' Error creating appointment:', err);
      console.error(' Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể đặt lịch hẹn. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
      console.log('🏁 Submit process finished');
    }
  };

  // Get selected doctor info for rendering
  const selectedDoctor = doctors.find(d => d.id === parseInt(formData.doctorId));
  const consultationFee = selectedDoctor?.consultationFee || 0;

  if (loading) {
    return (
      <PatientLayout>
        <Loading />
      </PatientLayout>
    );
  }

  // Calculate current step based on form completion
  const getCurrentStep = () => {
    if (!formData.patientFor) return 1;
    if (!formData.doctorId) return 2;
    if (!formData.appointmentDate || !formData.appointmentTime) return 3;
    if (consultationFee > 0 && !formData.paymentMethod) return 4;
    return 5;
  };

  return (
    <PatientLayout>
      <div className="new-booking-page">
        <div className="booking-header">
          <h1>Đặt Lịch Khám Mới</h1>
          <p className="booking-subtitle">Chọn bác sĩ, thời gian và phương thức thanh toán</p>
        </div>

        {error && (
          <div className="booking-alert error">
            <i data-feather="alert-circle"></i>
            {error}
          </div>
        )}
        {success && (
          <div className="booking-alert success">
            <i data-feather="check-circle"></i>
            {success}
          </div>
        )}

        <div className="booking-form-card">
          {/* Progress Steps */}
          <div className="form-steps">
            <div className={`form-step ${getCurrentStep() >= 1 ? 'active' : ''} ${getCurrentStep() > 1 ? 'completed' : ''}`}>
              <div className="step-circle">
                {getCurrentStep() > 1 ? '' : '1'}
              </div>
              <div className="step-label">Chọn người khám</div>
            </div>
            <div className={`form-step ${getCurrentStep() >= 2 ? 'active' : ''} ${getCurrentStep() > 2 ? 'completed' : ''}`}>
              <div className="step-circle">
                {getCurrentStep() > 2 ? '' : '2'}
              </div>
              <div className="step-label">Chọn bác sĩ</div>
            </div>
            <div className={`form-step ${getCurrentStep() >= 3 ? 'active' : ''} ${getCurrentStep() > 3 ? 'completed' : ''}`}>
              <div className="step-circle">
                {getCurrentStep() > 3 ? '' : '3'}
              </div>
              <div className="step-label">Chọn thời gian</div>
            </div>
            <div className={`form-step ${getCurrentStep() >= 4 ? 'active' : ''} ${getCurrentStep() > 4 ? 'completed' : ''}`}>
              <div className="step-circle">
                {getCurrentStep() > 4 ? '' : '4'}
              </div>
              <div className="step-label">Thanh toán</div>
            </div>
            <div className={`form-step ${getCurrentStep() >= 5 ? 'active' : ''}`}>
              <div className="step-circle">5</div>
              <div className="step-label">Xác nhận</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>
            {/* Patient Selection - Cho ai khám */}
            <div className="patient-selection-section">
              <label className="form-label">
                Bạn đặt lịch cho ai?
                <span className="required">*</span>
              </label>
              <div className="patient-options-grid">
                {/* Option: Cho bản thân */}
                <label className={`patient-option-card ${formData.patientFor === 'self' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="patientFor"
                    value="self"
                    checked={formData.patientFor === 'self'}
                    onChange={handleChange}
                  />
                  <div className="patient-option-content">
                    <div className="patient-option-icon"></div>
                    <div className="patient-option-info">
                      <div className="patient-option-name">Cho bản thân tôi</div>
                      <div className="patient-option-desc">Đặt lịch cho chính bạn</div>
                    </div>
                  </div>
                  <div className="patient-check-icon">
                    <span style={{ fontSize: '1.2rem' }}></span>
                  </div>
                </label>

                {/* Options: Cho thành viên gia đình */}
                {loadingFamilyMembers ? (
                  <div className="patient-option-card" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                    <div className="patient-option-content">
                      <div className="patient-option-icon"></div>
                      <div className="patient-option-info">
                        <div className="patient-option-name">Đang tải...</div>
                        <div className="patient-option-desc">Đang tải danh sách thành viên</div>
                      </div>
                    </div>
                  </div>
                ) : familyMembers.length === 0 ? (
                  <div className="patient-option-card" style={{ opacity: 0.5, borderStyle: 'dashed' }}>
                    <div className="patient-option-content">
                      <div className="patient-option-icon"></div>
                      <div className="patient-option-info">
                        <div className="patient-option-name">Chưa có thành viên</div>
                        <div className="patient-option-desc">Vào "Hồ sơ Gia đình" để thêm thành viên</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  familyMembers.map((member) => (
                    <label
                      key={member.id}
                      className={`patient-option-card ${formData.patientFor === String(member.id) ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="patientFor"
                        value={String(member.id)}
                        checked={formData.patientFor === String(member.id)}
                        onChange={handleChange}
                      />
                      <div className="patient-option-content">
                        <div className="patient-option-icon">
                          {member.relationship === 'CHILD' ? '👶' :
                            member.relationship === 'PARENT' ? '👨‍👩' :
                              member.relationship === 'SPOUSE' ? '💑' : ''}
                        </div>
                        <div className="patient-option-info">
                          <div className="patient-option-name">{member.fullName}</div>
                          <div className="patient-option-desc">
                            {member.relationship === 'CHILD' ? 'Con cái' :
                              member.relationship === 'PARENT' ? 'Bố/Mẹ' :
                                member.relationship === 'SPOUSE' ? 'Vợ/Chồng' : 'Thành viên'}
                            {member.medicalHistory && (
                              <span className="medical-history-badge"> • {member.medicalHistory}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="patient-check-icon">
                        <span style={{ fontSize: '1.2rem' }}></span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="form-label">
                Chọn Bác Sĩ
                <span className="required">*</span>
              </label>
              <div className="doctor-select-wrapper">
                <i data-feather="user-check" className="input-icon"></i>
                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  required
                  className="with-icon"
                >
                  <option value="">Chọn bác sĩ chuyên khoa...</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.fullName} - {doctor.specialization}
                      {doctor.consultationFee > 0 ? ` • ${Number(doctor.consultationFee).toLocaleString('vi-VN')} VNĐ` : ' • Miễn phí'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Time Selection */}
            <div className="datetime-grid">
              <div>
                <label className="form-label">
                  Ngày Hẹn
                  <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <i data-feather="calendar" className="input-icon"></i>
                  <input
                    type="date"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="with-icon"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">
                  Giờ Hẹn
                  <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <i data-feather="clock" className="input-icon"></i>
                  <select
                    name="appointmentTime"
                    value={formData.appointmentTime}
                    onChange={handleChange}
                    required
                    disabled={!formData.doctorId || !formData.appointmentDate || loadingSlots}
                    className="with-icon"
                  >
                    {loadingSlots ? (
                      <option value="">Đang tải khung giờ...</option>
                    ) : availableTimeSlots.length === 0 ? (
                      formData.doctorId && formData.appointmentDate ? (
                        <option value="">Lịch bác sĩ đã full trong ngày này</option>
                      ) : (
                        <option value="">Chọn bác sĩ và ngày trước...</option>
                      )
                    ) : (
                      <>
                        <option value="">Chọn giờ khám...</option>
                        {availableTimeSlots.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                {formData.doctorId && formData.appointmentDate && availableTimeSlots.length > 0 && (
                  <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.5rem' }}>
                     Có {availableTimeSlots.length} khung giờ trống
                  </div>
                )}
                {formData.doctorId && formData.appointmentDate && availableTimeSlots.length === 0 && !loadingSlots && (
                  <div style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '0.5rem' }}>
                    ✗ Không còn khung giờ trống. Vui lòng chọn ngày khác.
                  </div>
                )}
              </div>
            </div>

            {/* Consultation Fee Display */}
            {selectedDoctor && consultationFee > 0 && (
              <div className="consultation-fee-display">
                <div className="fee-info">
                  <div className="fee-icon-wrapper">
                    <i data-feather="credit-card"></i>
                  </div>
                  <div className="fee-text">
                    <div className="fee-label-text">Phí khám bệnh</div>
                    <div className="fee-amount-display">
                      {consultationFee.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method Selection */}
            {selectedDoctor && consultationFee > 0 && (
              <div className="payment-section">
                <div className="payment-section-label">
                  Phương thức thanh toán
                  <span className="required">*</span>
                </div>
                <div className="payment-options-grid">

                  {/* CASH */}
                  <label className={`payment-option-card ${formData.paymentMethod === 'CASH' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH"
                      checked={formData.paymentMethod === 'CASH'}
                      onChange={handleChange}
                    />
                    <div className="payment-option-content">
                      <div className="payment-option-icon">💵</div>
                      <div className="payment-option-info">
                        <div className="payment-option-name">Tiền mặt</div>
                        <div className="payment-option-desc">Thanh toán trực tiếp tại phòng khám</div>
                      </div>
                    </div>
                    <div className="payment-check-icon">
                      <i data-feather="check-circle"></i>
                    </div>
                  </label>

                  {/* VNPAY */}
                  <label className={`payment-option-card ${formData.paymentMethod === 'VNPAY' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="VNPAY"
                      checked={formData.paymentMethod === 'VNPAY'}
                      onChange={handleChange}
                    />
                    <div className="payment-option-content">
                      <div className="payment-option-icon">🏦</div>
                      <div className="payment-option-info">
                        <div className="payment-option-name">VNPAY</div>
                        <div className="payment-option-desc">Thanh toán online qua thẻ ATM / QR Code ngân hàng</div>
                      </div>
                    </div>
                    <div className="payment-check-icon">
                      <i data-feather="check-circle"></i>
                    </div>
                  </label>

                  {/* WALLET */}
                  <label className={`payment-option-card ${formData.paymentMethod === 'WALLET' ? 'selected' : ''} ${walletBalance < consultationFee ? 'disabled' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="WALLET"
                      checked={formData.paymentMethod === 'WALLET'}
                      onChange={handleChange}
                      disabled={walletBalance < consultationFee}
                    />
                    <div className="payment-option-content">
                      <div className="payment-option-icon"></div>
                      <div className="payment-option-info">
                        <div className="payment-option-name">Ví Sức khỏe</div>
                        <div className="payment-option-desc">
                          Số dư: <strong>{walletBalance.toLocaleString('vi-VN')} VNĐ</strong>
                          {walletBalance < consultationFee && (
                            <span className="insufficient-funds">(Không đủ số dư)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="payment-check-icon">
                      <i data-feather="check-circle"></i>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="form-label">
                Ghi Chú (Tùy chọn)
              </label>
              <div className="textarea-wrapper">
                <i data-feather="file-text" className="textarea-icon"></i>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="notes-textarea with-icon"
                  placeholder="Mô tả triệu chứng, yêu cầu đặc biệt hoặc thông tin bổ sung..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/patient/dashboard')}
                className="btn-cancel"
                disabled={submitting}
              >
                <span style={{ fontSize: '1.2rem' }}>✕</span>
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-submit"
              >
                {submitting ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    {formData.paymentMethod === 'VNPAY' ? 'Đang chuyển sang VNPAY...' : 'Đang xử lý...'}
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '1.2rem' }}></span>
                    Xác nhận đặt lịch
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

    </PatientLayout>
  );
};

export default NewBooking;
