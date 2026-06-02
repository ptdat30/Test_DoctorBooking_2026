import { useEffect, useState } from 'react';
import PatientLayout from '../../components/patient/PatientLayout';
import { patientService } from '../../services/patientService';
import familyService from '../../services/familyService';
import Loading from '../../components/common/Loading';
import { useNavigate } from 'react-router-dom';
import '../patient/patientPages.css';
import './NewBooking.css';

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
      setError('Unable to load doctors. Please refresh the page.');
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
      errors.patientFor = 'Please select who the appointment is for';
    }
    if (!formData.doctorId) {
      errors.doctorId = 'Please select a doctor';
    }
    if (!formData.appointmentDate) {
      errors.appointmentDate = 'Please choose an appointment date';
    }
    if (!formData.appointmentTime) {
      errors.appointmentTime = 'Please select a time slot';
    }
    const selectedDoctorForValidation = doctors.find(d => d.id === parseInt(formData.doctorId));
    const currentFee = selectedDoctorForValidation?.consultationFee || 0;
    if (currentFee > 0 && !formData.paymentMethod) {
      errors.paymentMethod = 'Please choose a payment method';
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
        const errorMsg = `Insufficient wallet balance. You need ${consultationFee.toLocaleString('en-US')} VND but only have ${walletBalance.toLocaleString('en-US')} VND.`;
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

      setSuccess('Appointment booked successfully!');
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
    ? 'Myself'
    : (familyMembers.find(m => String(m.id) === formData.patientFor)?.fullName || 'Family member');
  const paymentMethodLabel = formData.paymentMethod === 'WALLET' ? 'Health Wallet'
    : formData.paymentMethod === 'VNPAY' ? 'VNPAY'
    : 'Cash';

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
          <h1>New Appointment Booking</h1>
          <p className="booking-subtitle">Choose doctor, date and payment method in one clear flow.</p>
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
              <div className="step-label">Who is this for?</div>
            </div>
            <div className={`form-step ${getCurrentStep() >= 2 ? 'active' : ''} ${getCurrentStep() > 2 ? 'completed' : ''}`}>
              <div className="step-circle">
                {getCurrentStep() > 2 ? '' : '2'}
              </div>
              <div className="step-label">Select doctor</div>
            </div>
            <div className={`form-step ${getCurrentStep() >= 3 ? 'active' : ''} ${getCurrentStep() > 3 ? 'completed' : ''}`}>
              <div className="step-circle">
                {getCurrentStep() > 3 ? '' : '3'}
              </div>
              <div className="step-label">Pick date/time</div>
            </div>
            <div className={`form-step ${getCurrentStep() >= 4 ? 'active' : ''} ${getCurrentStep() > 4 ? 'completed' : ''}`}>
              <div className="step-circle">
                {getCurrentStep() > 4 ? '' : '4'}
              </div>
              <div className="step-label">Payment</div>
            </div>
            <div className={`form-step ${getCurrentStep() >= 5 ? 'active' : ''}`}>
              <div className="step-circle">5</div>
              <div className="step-label">Confirm</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>
            {/* Patient Selection - Cho ai khám */}
            <div className="patient-selection-section">
              <label className="form-label">
                Who is this appointment for?
                <span className="required">*</span>
              </label>
              <div className="form-hint text-slate-500 text-sm mb-3">Select dependent (if any) or choose yourself.</div>
              <div className="patient-options-grid">
                {/* Option: Choose self */}
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
                      <div className="patient-option-name">For myself</div>
                      <div className="patient-option-desc">Book this appointment for you</div>
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
                        <div className="patient-option-name">Loading...</div>
                        <div className="patient-option-desc">Fetching family members</div>
                      </div>
                    </div>
                  </div>
                ) : familyMembers.length === 0 ? (
                  <div className="patient-option-card" style={{ opacity: 0.5, borderStyle: 'dashed' }}>
                    <div className="patient-option-content">
                      <div className="patient-option-icon"></div>
                      <div className="patient-option-info">
                        <div className="patient-option-name">No family members</div>
                        <div className="patient-option-desc">Add dependents in Family Profile</div>
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
                            {member.relationship === 'CHILD' ? 'Dependent' :
                              member.relationship === 'PARENT' ? 'Parent' :
                                member.relationship === 'SPOUSE' ? 'Spouse' : 'Family member'}
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
              {fieldErrors.patientFor && (
                <div className="field-error" style={{ color: '#dc2626', fontSize: '0.9rem', marginTop: '0.75rem' }}>
                  {fieldErrors.patientFor}
                </div>
              )}
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="form-label">
                Select doctor
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
                  <option value="">Choose a doctor...</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.fullName} - {doctor.specialization}
                      {doctor.consultationFee > 0 ? ` • ${Number(doctor.consultationFee).toLocaleString('en-US')} VND` : ' • Free'}
                    </option>
                  ))}
                </select>
              </div>
              {fieldErrors.doctorId && (
                <div className="field-error" style={{ color: '#dc2626', fontSize: '0.9rem', marginTop: '0.75rem' }}>
                  {fieldErrors.doctorId}
                </div>
              )}
            </div>

            {/* Date & Time Selection */}
            <div className="datetime-grid">
              <div>
                <label className="form-label">
                  Expected appointment date
                  <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <i data-feather="calendar" className="input-icon"></i>
                  <input
                    type="date"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleChange}
                    min={getLocalDateString()}
                    required
                    className="with-icon"
                  />
                </div>
                {fieldErrors.appointmentDate && (
                  <div className="field-error" style={{ color: '#dc2626', fontSize: '0.9rem', marginTop: '0.75rem' }}>
                    {fieldErrors.appointmentDate}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">
                  Select appointment time
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
                      <option value="">Loading available times...</option>
                    ) : availableTimeSlots.length === 0 ? (
                      formData.doctorId && formData.appointmentDate ? (
                        <option value="">Doctor is fully booked on this date</option>
                      ) : (
                        <option value="">Choose doctor and date first...</option>
                      )
                    ) : (
                      <>
                        <option value="">Select a time slot...</option>
                        {availableTimeSlots.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {fieldErrors.appointmentTime && (
                    <div className="field-error" style={{ color: '#dc2626', fontSize: '0.9rem', marginTop: '0.75rem' }}>
                      {fieldErrors.appointmentTime}
                    </div>
                  )}
                </div>
                {formData.doctorId && formData.appointmentDate && availableTimeSlots.length > 0 && (
                  <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.5rem' }}>
                    {availableTimeSlots.length} available time slots
                  </div>
                )}
                {formData.doctorId && formData.appointmentDate && availableTimeSlots.length === 0 && !loadingSlots && (
                  <div style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '0.5rem' }}>
                    ✗ No available slots. Please select another date.
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
                    <div className="fee-label-text">Consultation fee</div>
                    <div className="fee-amount-display">
                      {consultationFee.toLocaleString('en-US')} VND
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method Selection */}
            {selectedDoctor && consultationFee > 0 && (
              <div className="payment-section">
                <div className="payment-section-label">
                  Payment method
                  <span className="required">*</span>
                </div>
                {fieldErrors.paymentMethod && (
                  <div className="field-error" style={{ color: '#dc2626', fontSize: '0.9rem', marginTop: '0.75rem' }}>
                    {fieldErrors.paymentMethod}
                  </div>
                )}
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
                        <div className="payment-option-name">Cash</div>
                        <div className="payment-option-desc">Pay directly at the clinic</div>
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
                        <div className="payment-option-desc">Pay online via bank QR or card</div>
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
                        <div className="payment-option-name">Health Wallet</div>
                        <div className="payment-option-desc">
                          Balance: <strong>{walletBalance.toLocaleString('en-US')} VND</strong>
                          {walletBalance < consultationFee && (
                            <span className="insufficient-funds">(Insufficient funds)</span>
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
                Notes (optional)
              </label>
              <div className="textarea-wrapper">
                <i data-feather="file-text" className="textarea-icon"></i>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="notes-textarea with-icon"
                  placeholder="Example: sore throat for 3 days, want ENT specialist…"
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
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-submit"
                style={{ backgroundColor: '#0f766e', color: 'white', minWidth: '220px', borderRadius: '999px', padding: '1rem 1.5rem', fontSize: '1rem' }}
              >
                {submitting ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    {formData.paymentMethod === 'VNPAY' ? 'Redirecting to VNPAY...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '1.2rem' }}></span>
                    Confirm booking
                  </>
                )}
              </button>
            </div>
          </form>

          {showPreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4">
              <div className="w-full max-w-2xl rounded-[32px] bg-white shadow-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
                  <div>
                    <h2 className="text-xl font-bold">Review Booking Details</h2>
                    <p className="text-sm text-slate-500">Confirm the appointment information before submission.</p>
                  </div>
                  <button onClick={() => setShowPreview(false)} className="text-slate-500 hover:text-slate-900">
                    <i data-feather="x"></i>
                  </button>
                </div>
                <div className="space-y-4 px-6 py-5">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-3">Appointment Summary</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
                      <div><span className="font-semibold">Patient:</span> {selectedPatientLabel}</div>
                      <div><span className="font-semibold">Doctor:</span> {selectedDoctor?.fullName || 'Not selected'}</div>
                      <div><span className="font-semibold">Specialty:</span> {selectedDoctor?.specialization || 'N/A'}</div>
                      <div><span className="font-semibold">Date:</span> {formData.appointmentDate}</div>
                      <div><span className="font-semibold">Time:</span> {formData.appointmentTime}</div>
                      <div><span className="font-semibold">Payment:</span> {paymentMethodLabel}</div>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="font-semibold mb-2">Notes</div>
                    <div className="whitespace-pre-wrap text-slate-600">{formData.notes ? formData.notes : 'No notes provided'}</div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 px-6 py-5 bg-slate-50 justify-end">
                  <button onClick={() => setShowPreview(false)} className="w-full sm:w-auto px-5 py-3 text-sm font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition">
                    Edit details
                  </button>
                  <button onClick={handleFinalSubmit} disabled={submitting} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition shadow-lg">
                    {submitting ? 'Submitting...' : 'Confirm booking'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </PatientLayout>
  );
};

export default NewBooking;
