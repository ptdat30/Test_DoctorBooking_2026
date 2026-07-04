import { useEffect, useState } from 'react';
import PatientLayout from '../../components/patient/PatientLayout';
import { patientService } from '../../services/patientService';
import familyService from '../../services/familyService';
import Loading from '../../components/common/Loading';
import { useNavigate } from 'react-router-dom';
import {
  AppPage,
  PageHeader,
  AlertError,
  AlertSuccess,
  FormField,
  Input,
  Select,
  Textarea,
  BtnPrimary,
  BtnSecondary,
  Modal,
} from '../../components/shell/DashboardPrimitives';
import { StepProgress, ChoiceCard } from '../../components/shell/PatientPageUI';
import ShellIcon from '../../components/shell/ShellIcon';
import { User, Users, Wallet, Banknote, CreditCard } from 'lucide-react';

const RELATIONSHIP_LABELS = {
  CHILD: 'Con cái',
  PARENT: 'Bố/Mẹ',
  SPOUSE: 'Vợ/Chồng',
  SIBLING: 'Anh/Chị/Em',
  OTHER: 'Thành viên',
};

// Helper: Lấy ngày hôm nay theo LOCAL timezone (tránh lỗi UTC vs UTC+7)
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
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
    const today = getLocalDateString();
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
      setError('Không thể tải danh sách bác sĩ. Vui lòng tải lại trang.');
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
    setFieldErrors(prev => ({ ...prev, [name]: '' }));

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

  const validateForm = () => {
    const errors = {};
    if (!formData.patientFor) {
      errors.patientFor = 'Vui lòng chọn người khám';
    }
    if (!formData.doctorId) {
      errors.doctorId = 'Vui lòng chọn bác sĩ';
    }
    if (!formData.appointmentDate) {
      errors.appointmentDate = 'Vui lòng chọn ngày khám';
    }
    if (!formData.appointmentTime) {
      errors.appointmentTime = 'Vui lòng chọn khung giờ';
    }
    const selectedDoctorForValidation = doctors.find(d => d.id === parseInt(formData.doctorId));
    const currentFee = selectedDoctorForValidation?.consultationFee || 0;
    if (currentFee > 0 && !formData.paymentMethod) {
      errors.paymentMethod = 'Vui lòng chọn phương thức thanh toán';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (!validateForm()) {
      setSubmitting(false);
      return;
    }

    setShowPreview(true);
    setSubmitting(false);
  };

  const handleFinalSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const selectedDoctorInfo = doctors.find(d => d.id === parseInt(formData.doctorId));
      const consultationFee = selectedDoctorInfo?.consultationFee || 0;
      console.log('💰 Consultation fee:', consultationFee);
      console.log('💳 Payment method:', formData.paymentMethod);

      if (formData.paymentMethod === 'WALLET' && walletBalance < consultationFee) {
        const errorMsg = `Số dư ví không đủ. Cần ${consultationFee.toLocaleString('vi-VN')} VNĐ nhưng chỉ có ${walletBalance.toLocaleString('vi-VN')} VNĐ.`;
        console.error('❌ Wallet validation failed:', errorMsg);
        setError(errorMsg);
        setSubmitting(false);
        return;
      }

      const timeValue = formData.appointmentTime.includes(':') && formData.appointmentTime.split(':').length === 2
        ? formData.appointmentTime + ':00'
        : formData.appointmentTime;

      const appointmentData = {
        doctorId: parseInt(formData.doctorId),
        appointmentDate: formData.appointmentDate,
        appointmentTime: timeValue,
        notes: formData.notes || '',
        paymentMethod: formData.paymentMethod || 'CASH',
      };

      if (formData.patientFor !== 'self') {
        appointmentData.familyMemberId = parseInt(formData.patientFor);
        console.log('👨‍👩‍👧 Booking for family member:', appointmentData.familyMemberId);
      } else {
        console.log('🧑 Booking for self');
      }

      console.log('📤 Request payload:', JSON.stringify(appointmentData, null, 2));

      const response = await patientService.createAppointment(appointmentData);
      console.log('✅ API response received:', response);

      if (formData.paymentMethod === 'VNPAY' && response.paymentUrl) {
        window.location.href = response.paymentUrl;
        return;
      }

      setSuccess('Đặt lịch thành công!');
      setShowPreview(false);
      setTimeout(() => {
        navigate('/patient/history');
      }, 2000);
    } catch (err) {
      console.error('❌ Error creating appointment:', err);
      console.error('❌ Error response data (JSON):', JSON.stringify(err.response?.data, null, 2));
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error headers:', err.response?.headers);

      let errorMessage = 'Unable to create appointment. Please try again.';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.errors) {
          const errorDetails = Object.entries(data.errors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('; ');
          errorMessage = errorDetails || 'Invalid data';
        } else if (data.error) {
          errorMessage = data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setSubmitting(false);
      console.log('🏁 Submit process finished');
    }
  };

  // Get selected doctor info for rendering
  const selectedDoctor = doctors.find(d => d.id === parseInt(formData.doctorId));
  const consultationFee = selectedDoctor?.consultationFee || 0;
  const selectedPatientLabel = formData.patientFor === 'self'
    ? 'Bản thân'
    : (familyMembers.find(m => String(m.id) === formData.patientFor)?.fullName || 'Thành viên gia đình');
  const paymentMethodLabel = formData.paymentMethod === 'WALLET' ? 'Ví sức khỏe'
    : formData.paymentMethod === 'VNPAY' ? 'VNPAY'
    : 'Tiền mặt';

  const bookingSteps = ['Người khám', 'Bác sĩ', 'Thời gian', 'Thanh toán', 'Xác nhận'];

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
      <AppPage>
        <PageHeader title="Đặt lịch mới" subtitle="Chọn bác sĩ, thời gian và phương thức thanh toán" />

        {error && <AlertError message={error} />}
        {success && <AlertSuccess message={success} />}

        <div className="app-card p-6 sm:p-8">
          <StepProgress steps={bookingSteps} current={getCurrentStep()} />

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Người khám */}
            <section>
              <FormField label="Đặt lịch cho ai?" required>
                <p className="text-sm text-neutral-500 -mt-2 mb-3">Chọn bản thân hoặc thành viên gia đình.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ChoiceCard selected={formData.patientFor === 'self'}>
                    <input
                      type="radio"
                      name="patientFor"
                      value="self"
                      checked={formData.patientFor === 'self'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-neutral-600" strokeWidth={1.75} />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">Bản thân</p>
                        <p className="text-xs text-neutral-500">Đặt lịch cho chính bạn</p>
                      </div>
                    </div>
                  </ChoiceCard>

                  {loadingFamilyMembers ? (
                    <div className="rounded-xl border-2 border-dashed border-neutral-200 p-4 text-sm text-neutral-400">
                      Đang tải thành viên gia đình...
                    </div>
                  ) : familyMembers.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-neutral-200 p-4 text-sm text-neutral-400">
                      Chưa có thành viên. Thêm tại Hồ sơ gia đình.
                    </div>
                  ) : (
                    familyMembers.map((member) => (
                      <ChoiceCard key={member.id} selected={formData.patientFor === String(member.id)}>
                        <input
                          type="radio"
                          name="patientFor"
                          value={String(member.id)}
                          checked={formData.patientFor === String(member.id)}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-neutral-600" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-900 truncate">{member.fullName}</p>
                            <p className="text-xs text-neutral-500">
                              {RELATIONSHIP_LABELS[member.relationship] || 'Thành viên'}
                              {member.medicalHistory && ` · ${member.medicalHistory}`}
                            </p>
                          </div>
                        </div>
                      </ChoiceCard>
                    ))
                  )}
                </div>
                {fieldErrors.patientFor && (
                  <p className="text-sm text-red-600 mt-2">{fieldErrors.patientFor}</p>
                )}
              </FormField>
            </section>

            {/* Bác sĩ */}
            <FormField label="Chọn bác sĩ" required>
              <Select name="doctorId" value={formData.doctorId} onChange={handleChange} required>
                <option value="">Chọn bác sĩ...</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    BS. {doctor.fullName} — {doctor.specialization}
                    {doctor.consultationFee > 0
                      ? ` · ${Number(doctor.consultationFee).toLocaleString('vi-VN')} VNĐ`
                      : ' · Miễn phí'}
                  </option>
                ))}
              </Select>
              {fieldErrors.doctorId && <p className="text-sm text-red-600 mt-2">{fieldErrors.doctorId}</p>}
            </FormField>

            {/* Ngày & giờ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField label="Ngày khám dự kiến" required>
                <Input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  min={getLocalDateString()}
                  required
                />
                {fieldErrors.appointmentDate && (
                  <p className="text-sm text-red-600 mt-2">{fieldErrors.appointmentDate}</p>
                )}
              </FormField>

              <FormField label="Khung giờ" required>
                <Select
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleChange}
                  required
                  disabled={!formData.doctorId || !formData.appointmentDate || loadingSlots}
                >
                  {loadingSlots ? (
                    <option value="">Đang tải khung giờ...</option>
                  ) : availableTimeSlots.length === 0 ? (
                    formData.doctorId && formData.appointmentDate ? (
                      <option value="">Bác sĩ đã kín lịch trong ngày này</option>
                    ) : (
                      <option value="">Chọn bác sĩ và ngày trước...</option>
                    )
                  ) : (
                    <>
                      <option value="">Chọn khung giờ...</option>
                      {availableTimeSlots.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </>
                  )}
                </Select>
                {fieldErrors.appointmentTime && (
                  <p className="text-sm text-red-600 mt-2">{fieldErrors.appointmentTime}</p>
                )}
                {formData.doctorId && formData.appointmentDate && availableTimeSlots.length > 0 && (
                  <p className="text-xs text-emerald-600 mt-2">{availableTimeSlots.length} khung giờ trống</p>
                )}
              </FormField>
            </div>

            {/* Phí khám */}
            {selectedDoctor && consultationFee > 0 && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                <div className="w-11 h-11 rounded-xl bg-white border border-neutral-200 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-neutral-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Phí khám</p>
                  <p className="text-lg font-bold text-neutral-900">
                    {consultationFee.toLocaleString('vi-VN')} VNĐ
                  </p>
                </div>
              </div>
            )}

            {/* Thanh toán */}
            {selectedDoctor && consultationFee > 0 && (
              <section>
                <FormField label="Phương thức thanh toán" required>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <ChoiceCard selected={formData.paymentMethod === 'CASH'}>
                      <input type="radio" name="paymentMethod" value="CASH" checked={formData.paymentMethod === 'CASH'} onChange={handleChange} className="sr-only" />
                      <div className="flex items-center gap-3">
                        <Banknote className="w-5 h-5 text-neutral-600 shrink-0" strokeWidth={1.75} />
                        <div>
                          <p className="font-semibold text-sm">Tiền mặt</p>
                          <p className="text-xs text-neutral-500">Thanh toán tại phòng khám</p>
                        </div>
                      </div>
                    </ChoiceCard>

                    <ChoiceCard selected={formData.paymentMethod === 'VNPAY'}>
                      <input type="radio" name="paymentMethod" value="VNPAY" checked={formData.paymentMethod === 'VNPAY'} onChange={handleChange} className="sr-only" />
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-neutral-600 shrink-0" strokeWidth={1.75} />
                        <div>
                          <p className="font-semibold text-sm">VNPAY</p>
                          <p className="text-xs text-neutral-500">QR / thẻ ngân hàng</p>
                        </div>
                      </div>
                    </ChoiceCard>

                    <ChoiceCard
                      selected={formData.paymentMethod === 'WALLET'}
                      disabled={walletBalance < consultationFee}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="WALLET"
                        checked={formData.paymentMethod === 'WALLET'}
                        onChange={handleChange}
                        disabled={walletBalance < consultationFee}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-neutral-600 shrink-0" strokeWidth={1.75} />
                        <div>
                          <p className="font-semibold text-sm">Ví sức khỏe</p>
                          <p className="text-xs text-neutral-500">
                            Số dư: <strong>{walletBalance.toLocaleString('vi-VN')} VNĐ</strong>
                            {walletBalance < consultationFee && (
                              <span className="text-red-500"> (Không đủ)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </ChoiceCard>
                  </div>
                  {fieldErrors.paymentMethod && (
                    <p className="text-sm text-red-600 mt-2">{fieldErrors.paymentMethod}</p>
                  )}
                </FormField>
              </section>
            )}

            {/* Ghi chú */}
            <FormField label="Ghi chú (tùy chọn)">
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Ví dụ: đau họng 3 ngày, muốn khám Tai Mũi Họng..."
              />
            </FormField>

            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2 border-t border-neutral-100">
              <BtnSecondary type="button" onClick={() => navigate('/patient/dashboard')} disabled={submitting}>
                Hủy
              </BtnSecondary>
              <BtnPrimary type="submit" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
              </BtnPrimary>
            </div>
          </form>
        </div>

        <Modal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          title="Xem lại thông tin"
          footer={
            <>
              <BtnSecondary onClick={() => setShowPreview(false)}>Chỉnh sửa</BtnSecondary>
              <BtnPrimary onClick={handleFinalSubmit} disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Xác nhận đặt lịch'}
              </BtnPrimary>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-neutral-50">
              <div><span className="text-neutral-500">Người khám:</span> <span className="font-semibold">{selectedPatientLabel}</span></div>
              <div><span className="text-neutral-500">Bác sĩ:</span> <span className="font-semibold">{selectedDoctor?.fullName || '—'}</span></div>
              <div><span className="text-neutral-500">Chuyên khoa:</span> <span className="font-semibold">{selectedDoctor?.specialization || '—'}</span></div>
              <div><span className="text-neutral-500">Ngày:</span> <span className="font-semibold">{formData.appointmentDate}</span></div>
              <div><span className="text-neutral-500">Giờ:</span> <span className="font-semibold">{formData.appointmentTime}</span></div>
              <div><span className="text-neutral-500">Thanh toán:</span> <span className="font-semibold">{paymentMethodLabel}</span></div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50">
              <p className="text-neutral-500 mb-1">Ghi chú</p>
              <p className="text-neutral-700 whitespace-pre-wrap">{formData.notes || 'Không có ghi chú'}</p>
            </div>
          </div>
        </Modal>
      </AppPage>
    </PatientLayout>
  );
};

export default NewBooking;
