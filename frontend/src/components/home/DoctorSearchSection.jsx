import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { patientService } from '../../services/patientService';
import BookingModals from './BookingModals';

const getLocalDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const DoctorSearchSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [specialtyOpen, setSpecialtyOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState(getLocalDateString());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  const specialtyRef = useRef(null);
  const locationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (specialtyRef.current && !specialtyRef.current.contains(e.target)) setSpecialtyOpen(false);
      if (locationRef.current && !locationRef.current.contains(e.target)) setLocationOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (user?.role === 'PATIENT') {
        setLoadingDoctors(true);
        try {
          const data = await patientService.searchDoctors('');
          setDoctors(data);
          setFilteredDoctors(data);
        } catch (err) {
          console.error('Error fetching doctors on homepage:', err);
        } finally {
          setLoadingDoctors(false);
        }
      }
    };
    fetchDoctors();
  }, [user]);

  const handleSearch = () => {
    if (user?.role !== 'PATIENT') return;
    let filtered = [...doctors];
    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter((d) => d.specialization === selectedSpecialty);
    }
    if (selectedLocation !== 'all') {
      filtered = filtered.filter((d) => {
        const address = (d.address || '').toLowerCase();
        if (selectedLocation === 'HCMC') return address.includes('hcm') || address.includes('ho chi minh') || address.includes('hồ chí minh');
        if (selectedLocation === 'Hanoi') return address.includes('ha noi') || address.includes('hà nội') || address.includes('hanoi');
        if (selectedLocation === 'Danang') return address.includes('da nang') || address.includes('đà nẵng') || address.includes('danang');
        return true;
      });
    }
    setFilteredDoctors(filtered);
  };

  const loadSlotsForDoctorAndDate = async (doctorId, date) => {
    setLoadingSlots(true);
    setAvailableSlots([]);
    try {
      const slots = await patientService.getAvailableTimeSlots(doctorId, date);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error loading time slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const openBooking = async (doctor) => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'PATIENT') {
      alert('Vui lòng đăng nhập với tài khoản Bệnh nhân để đặt lịch khám.');
      return;
    }
    setSelectedDoctor(doctor);
    setSelectedSlot('');
    setBookingDate(getLocalDateString());
    setBookingModalOpen(true);
    await loadSlotsForDoctorAndDate(doctor.id, getLocalDateString());
  };

  const handleDateChange = async (e) => {
    const newDate = e.target.value;
    setBookingDate(newDate);
    if (selectedDoctor && newDate) await loadSlotsForDoctorAndDate(selectedDoctor.id, newDate);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) { alert('Vui lòng chọn khung giờ khám!'); return; }
    if (!patientName.trim()) { alert('Vui lòng nhập tên bệnh nhân!'); return; }
    if (!patientPhone.trim()) { alert('Vui lòng nhập số điện thoại!'); return; }

    setSubmittingBooking(true);
    try {
      const timeValue = selectedSlot.includes(':') && selectedSlot.split(':').length === 2 ? `${selectedSlot}:00` : selectedSlot;
      const response = await patientService.createAppointment({
        doctorId: selectedDoctor.id,
        appointmentDate: bookingDate,
        appointmentTime: timeValue,
        notes: bookingNotes || '',
        paymentMethod: paymentMethod || 'CASH',
      });

      if (paymentMethod === 'VNPAY' && response.paymentUrl) {
        window.location.href = response.paymentUrl;
        return;
      }

      setBookingSuccessData({
        doctorName: selectedDoctor.fullName,
        date: bookingDate,
        time: selectedSlot,
        patientName,
      });
      setBookingModalOpen(false);
      setPatientName('');
      setPatientPhone('');
      setBookingNotes('');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Đặt lịch thất bại, vui lòng thử lại.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">Đặt lịch trực tuyến</p>
        <h3 className="font-display text-2xl sm:text-3xl text-neutral-900 mb-6">Tìm bác sĩ & đặt lịch ngay</h3>

        {!user ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center space-y-4">
            <p className="text-sm text-neutral-600">Đăng nhập bằng tài khoản Bệnh nhân để tra cứu bác sĩ và đặt lịch khám.</p>
            <Link to="/login" className="inline-block px-8 py-3 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors">
              Đăng nhập ngay
            </Link>
          </div>
        ) : user.role !== 'PATIENT' ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center">
            <p className="text-sm text-neutral-600">Chức năng đặt lịch dành cho tài khoản Bệnh nhân.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="relative" ref={specialtyRef}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Chuyên khoa</label>
                <button
                  type="button"
                  onClick={() => setSpecialtyOpen(!specialtyOpen)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm flex items-center justify-between bg-white hover:border-neutral-900 transition-colors text-left"
                >
                  <span>{selectedSpecialty === 'all' ? 'Tất cả chuyên khoa' : selectedSpecialty}</span>
                  <i className="fa-solid fa-chevron-down text-xs text-neutral-400" />
                </button>
                {specialtyOpen && (
                  <div className="absolute left-0 mt-1 w-full bg-white border border-neutral-200 rounded-xl shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
                    {['all', 'Cardiology', 'Dermatology', 'Pediatrics', 'Neurology', 'Orthopedics'].map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => { setSelectedSpecialty(spec); setSpecialtyOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 transition-colors"
                      >
                        {spec === 'all' ? 'Tất cả chuyên khoa' : spec}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={locationRef}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Địa điểm</label>
                <button
                  type="button"
                  onClick={() => setLocationOpen(!locationOpen)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm flex items-center justify-between bg-white hover:border-neutral-900 transition-colors text-left"
                >
                  <span>
                    {selectedLocation === 'all' ? 'Tất cả địa điểm'
                      : selectedLocation === 'HCMC' ? 'Ho Chi Minh City'
                      : selectedLocation === 'Hanoi' ? 'Hanoi'
                      : selectedLocation === 'Danang' ? 'Da Nang' : selectedLocation}
                  </span>
                  <i className="fa-solid fa-chevron-down text-xs text-neutral-400" />
                </button>
                {locationOpen && (
                  <div className="absolute left-0 mt-1 w-full bg-white border border-neutral-200 rounded-xl shadow-lg z-50 py-1">
                    {[
                      { val: 'all', label: 'Tất cả địa điểm' },
                      { val: 'HCMC', label: 'Ho Chi Minh City' },
                      { val: 'Hanoi', label: 'Hanoi' },
                      { val: 'Danang', label: 'Da Nang' },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => { setSelectedLocation(val); setLocationOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full rounded-xl bg-neutral-900 text-white font-semibold py-3 px-6 text-sm hover:bg-neutral-800 transition-colors h-[46px]"
                >
                  Lọc kết quả
                </button>
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-8">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Danh sách bác sĩ ({filteredDoctors.length})
                </h4>
                <button
                  type="button"
                  onClick={() => { setSelectedSpecialty('all'); setSelectedLocation('all'); setFilteredDoctors(doctors); }}
                  className="text-xs text-neutral-900 hover:underline"
                >
                  Xóa bộ lọc
                </button>
              </div>

              {loadingDoctors ? (
                <p className="text-center py-8 text-sm text-neutral-500">Đang tải danh sách bác sĩ...</p>
              ) : filteredDoctors.length === 0 ? (
                <p className="text-center py-8 text-sm text-rose-500">Không tìm thấy bác sĩ phù hợp.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredDoctors.map((doctor) => (
                    <div key={doctor.id} className="rounded-2xl border border-neutral-200 p-5 flex flex-col justify-between hover:border-neutral-900 transition-colors group">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            className="w-12 h-12 rounded-xl object-cover"
                            src={doctor.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150'}
                            alt={doctor.fullName}
                          />
                          <div>
                            <h4 className="font-semibold text-neutral-900 text-sm group-hover:underline">Dr. {doctor.fullName}</h4>
                            <p className="text-xs text-neutral-500">{doctor.specialization}</p>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-600 line-clamp-2">
                          {doctor.description || 'Bác sĩ chuyên khoa giàu kinh nghiệm.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openBooking(doctor)}
                        className="mt-4 w-full py-2.5 rounded-xl text-xs font-semibold border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors"
                      >
                        Đặt lịch hẹn
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <BookingModals
        bookingModalOpen={bookingModalOpen}
        setBookingModalOpen={setBookingModalOpen}
        selectedDoctor={selectedDoctor}
        bookingDate={bookingDate}
        handleDateChange={handleDateChange}
        getLocalDateString={getLocalDateString}
        loadingSlots={loadingSlots}
        availableSlots={availableSlots}
        selectedSlot={selectedSlot}
        setSelectedSlot={setSelectedSlot}
        patientName={patientName}
        setPatientName={setPatientName}
        patientPhone={patientPhone}
        setPatientPhone={setPatientPhone}
        bookingNotes={bookingNotes}
        setBookingNotes={setBookingNotes}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        submittingBooking={submittingBooking}
        handleConfirmBooking={handleConfirmBooking}
        bookingSuccessData={bookingSuccessData}
        setBookingSuccessData={setBookingSuccessData}
      />
    </>
  );
};

export default DoctorSearchSection;
