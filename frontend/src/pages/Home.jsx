import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { patientService } from '../services/patientService';
import UserInfo from '../components/common/UserInfo';
import Header from '../components/Header';
import logoImage from '../assets/DoctorBooking-removebg-preview.png';
import './Home.css';

// Helper: Get local date string format YYYY-MM-DD
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Doctor List States
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [specialtyOpen, setSpecialtyOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Booking Modal States
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

  // Click outside listener for custom dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (specialtyRef.current && !specialtyRef.current.contains(e.target)) {
        setSpecialtyOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setLocationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load doctors if user is logged in
  useEffect(() => {
    const fetchDoctors = async () => {
      if (user && user.role === 'PATIENT') {
        setLoadingDoctors(true);
        try {
          const data = await patientService.searchDoctors('');
          setDoctors(data);
          setFilteredDoctors(data);
          const specs = [...new Set(data.map(d => d.specialization))].filter(Boolean);
          setSpecialties(specs);
        } catch (err) {
          console.error('Error fetching doctors on homepage:', err);
        } finally {
          setLoadingDoctors(false);
        }
      }
    };
    fetchDoctors();
  }, [user]);

  // Handle Search Filtering
  const handleSearch = () => {
    if (!user || user.role !== 'PATIENT') return;

    let filtered = [...doctors];
    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter(d => d.specialization === selectedSpecialty);
    }
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(d => {
        const address = (d.address || '').toLowerCase();
        if (selectedLocation === 'HCMC') {
          return address.includes('hcm') || address.includes('ho chi minh') || address.includes('hồ chí minh');
        }
        if (selectedLocation === 'Hanoi') {
          return address.includes('ha noi') || address.includes('hà nội') || address.includes('hanoi');
        }
        if (selectedLocation === 'Danang') {
          return address.includes('da nang') || address.includes('đà nẵng') || address.includes('danang');
        }
        return true;
      });
    }
    setFilteredDoctors(filtered);
  };

  const handleResetFilter = () => {
    setSelectedSpecialty('all');
    setSelectedLocation('all');
    setFilteredDoctors(doctors);
  };

  // Open booking modal
  const openBooking = async (doctor) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'PATIENT') {
      alert('Vui lòng đăng nhập với tài khoản Bệnh nhân để đặt lịch khám.');
      return;
    }

    setSelectedDoctor(doctor);
    setSelectedSlot('');
    setBookingDate(getLocalDateString());
    setBookingModalOpen(true);

    // Load slots for today
    await loadSlotsForDoctorAndDate(doctor.id, getLocalDateString());
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

  const handleDateChange = async (e) => {
    const newDate = e.target.value;
    setBookingDate(newDate);
    if (selectedDoctor && newDate) {
      await loadSlotsForDoctorAndDate(selectedDoctor.id, newDate);
    }
  };

  // Submit Booking Form
  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      alert('Vui lòng chọn khung giờ khám!');
      return;
    }
    if (!patientName.trim()) {
      alert('Vui lòng nhập tên bệnh nhân!');
      return;
    }
    if (!patientPhone.trim()) {
      alert('Vui lòng nhập số điện thoại liên hệ!');
      return;
    }

    setSubmittingBooking(true);
    try {
      const timeValue = selectedSlot.includes(':') && selectedSlot.split(':').length === 2
        ? selectedSlot + ':00'
        : selectedSlot;

      const appointmentData = {
        doctorId: selectedDoctor.id,
        appointmentDate: bookingDate,
        appointmentTime: timeValue,
        notes: bookingNotes || '',
        paymentMethod: paymentMethod || 'CASH',
      };

      const response = await patientService.createAppointment(appointmentData);

      // If payment is VNPAY, redirect
      if (paymentMethod === 'VNPAY' && response.paymentUrl) {
        window.location.href = response.paymentUrl;
        return;
      }

      // Success for CASH
      setBookingSuccessData({
        doctorName: selectedDoctor.fullName,
        date: bookingDate,
        time: selectedSlot,
        patientName: patientName,
      });

      // Clear states
      setBookingModalOpen(false);
      setPatientName('');
      setPatientPhone('');
      setBookingNotes('');
    } catch (err) {
      console.error('Error creating appointment on homepage:', err);
      alert(err.response?.data?.message || err.message || 'Đặt lịch thất bại, vui lòng thử lại.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="text-segesta-slate min-h-screen relative overflow-hidden bg-transparent">


      {/* HEADER / NAVIGATION */}
      <Header />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-segesta-skyblue/30 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[55%] rounded-full bg-segesta-peach/25 blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Content */}
            <div className="lg:col-span-5 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-segesta-mint/40 border border-segesta-mint text-segesta-slate text-xs font-semibold uppercase tracking-wider animate-pulse-subtle">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-segesta-cyan opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-segesta-electric"></span>
                </span>
                <span>Real-time Doctor Availability</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-800 leading-tight">
                Book the Right <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-segesta-electric to-segesta-cyan">Doctor</span> in Seconds.
              </h1>

              <p className="text-base sm:text-lg text-segesta-slate max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
                Smart Doctor Booking – Compassionate Care. Find trusted specialists, see real-time availability, and manage appointments from anywhere.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a href="#solutions" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-segesta-electric to-segesta-cyan text-gray-900 font-semibold shadow-lg hover:shadow-xl hover:shadow-segesta-cyan/20 hover:-translate-y-0.5 transition-all text-center">
                  Find a Doctor <i className="fa-solid fa-magnifying-glass ml-2"></i>
                </a>
                <a href="#ourstory" className="w-full sm:w-auto px-8 py-4 rounded-xl glass-card text-segesta-slate border border-segesta-skyblue/50 font-semibold hover:bg-segesta-skyblue/30 hover:border-segesta-gray transition-all text-center">
                  Our Story <i className="fa-solid fa-arrow-right ml-2 text-segesta-electric"></i>
                </a>
              </div>
            </div>

            {/* Right Isometric SVG Illustration */}
            <div className="lg:col-span-7 flex justify-center relative">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-segesta-lavender/25 rounded-full blur-3xl -z-10"></div>

              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" className="w-full max-w-[550px] drop-shadow-xl animate-float">
                <defs>
                  <linearGradient id="phone-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F8F9FA" />
                    <stop offset="100%" stopColor="#E0F2FF" />
                  </linearGradient>
                  <linearGradient id="accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4FA9FF" />
                    <stop offset="100%" stopColor="#80DEEA" />
                  </linearGradient>
                  <linearGradient id="mint-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F8F9FA" />
                    <stop offset="100%" stopColor="#B2DFDB" />
                  </linearGradient>
                  <linearGradient id="lavender-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F8F9FA" />
                    <stop offset="100%" stopColor="#D1D1F0" />
                  </linearGradient>
                </defs>

                <g opacity="0.25">
                  <path d="M 0 100 L 600 400" stroke="#4FA9FF" strokeWidth="0.5" strokeDasharray="5 5" />
                  <path d="M 600 100 L 0 400" stroke="#4FA9FF" strokeWidth="0.5" strokeDasharray="5 5" />
                </g>

                {/* Botanicals */}
                <g className="animate-float-slow">
                  <path d="M 120 340 C 90 280, 110 220, 160 210 C 180 250, 160 310, 120 340 Z" fill="#B2DFDB" fillOpacity="0.6" />
                  <path d="M 120 340 C 135 285, 145 240, 160 210" stroke="#B0BEC5" strokeWidth="1.5" strokeOpacity="0.4" />
                  <path d="M 450 320 C 490 270, 520 280, 510 330 C 470 350, 440 340, 450 320 Z" fill="#B2DFDB" fillOpacity="0.5" />
                </g>

                {/* Heart line */}
                <g opacity="0.4" stroke="#4FA9FF" strokeWidth="2" fill="none">
                  <path d="M 50 220 L 120 220 L 130 190 L 140 250 L 150 210 L 160 230 L 170 220 L 250 220" />
                  <circle cx="140" cy="250" r="4" fill="#80DEEA" />
                </g>

                {/* Tablet Base */}
                <g>
                  <polygon points="200,420 380,310 440,360 260,470" fill="#546E7A" fillOpacity="0.2" />
                  <polygon points="200,410 380,300 440,350 260,460" fill="#546E7A" />
                  <polygon points="208,409 372,310 430,350 266,449" fill="url(#phone-grad)" />

                  {/* Mock UI */}
                  <polygon points="255,340 360,277 385,296 280,359" fill="#B0BEC5" fillOpacity="0.3" />
                  <polygon points="245,365 305,329 320,340 260,376" fill="#4FA9FF" fillOpacity="0.8" />
                  <circle cx="280" cy="385" r="4" fill="#B0BEC5" />
                  <circle cx="315" cy="385" r="4" fill="#80DEEA" />

                  <polygon points="325,410 395,368 415,383 345,425" fill="#B2DFDB" fillOpacity="0.9" />
                  <path d="M 360 401 L 368 407 L 385 391" stroke="#546E7A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </g>

                {/* Floating cards */}
                <g className="animate-float">
                  <polygon points="320,240 460,155 520,200 380,285" fill="#F8F9FA" />
                  <polygon points="320,240 460,155 520,200 380,285" fill="url(#lavender-grad)" fillOpacity="0.25" />
                  <polygon points="318,240 320,241 380,286 378,285" fill="#D1D1F0" />
                  <circle cx="375" cy="205" r="18" fill="#D1D1F0" />
                  <circle cx="375" cy="201" r="9" fill="#FCE4EC" />
                  <path d="M 362 218 C 362 208, 388 208, 388 218 Z" fill="#D1D1F0" />
                  <line x1="405" y1="190" x2="480" y2="145" stroke="#546E7A" strokeWidth="4.5" strokeLinecap="round" />
                  <line x1="405" y1="205" x2="465" y2="168" stroke="#4FA9FF" strokeWidth="3" strokeLinecap="round" />
                </g>

                <g className="animate-float-slow">
                  <polygon points="170,200 300,120 360,160 230,240" fill="#F8F9FA" />
                  <polygon points="170,200 300,120 360,160 230,240" fill="url(#mint-grad)" fillOpacity="0.3" />
                  <polygon points="168,200 170,201 230,241 228,240" fill="#B2DFDB" />
                  <circle cx="220" cy="168" r="16" fill="#B2DFDB" />
                  <circle cx="220" cy="164" r="8" fill="#FCE4EC" />
                  <path d="M 209 180 C 209 171, 231 171, 231 180 Z" fill="#B2DFDB" />
                  <line x1="248" y1="152" x2="310" y2="114" stroke="#546E7A" strokeWidth="4.5" strokeLinecap="round" />
                  <circle cx="320" cy="148" r="6" fill="#80DEEA" className="animate-pulse-subtle" />
                </g>

                {/* Available Badge */}
                <g className="animate-float">
                  <polygon points="180,310 280,250 310,270 210,330" fill="#B2DFDB" />
                  <circle cx="205" cy="303" r="8" fill="#F8F9FA" />
                  <path d="M 201 303 L 204 306 L 210 299" stroke="#546E7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <line x1="223" y1="292" x2="270" y2="264" stroke="#546E7A" strokeWidth="3.5" strokeLinecap="round" />
                </g>
              </svg>
            </div>

          </div>
        </div>
      </section>

      {/* OURSTORY SECTION */}
      <section id="ourstory" className="py-20 bg-white/70 backdrop-blur-md relative border-y border-segesta-skyblue/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Photo Collage */}
            <div className="lg:col-span-6 relative">
              <div className="absolute -top-6 -left-6 w-72 h-72 bg-gradient-to-tr from-segesta-skyblue/40 to-segesta-peach/40 rounded-3xl -z-10 opacity-70"></div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden shadow-md transform hover:scale-[1.02] transition-all duration-300">
                    <img className="w-full h-48 object-cover" src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400" alt="Doctor" />
                  </div>
                  <div className="glass-card p-6 rounded-2xl border border-segesta-skyblue/50 shadow-glass flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-segesta-skyblue/30 text-segesta-electric flex items-center justify-center mb-3">
                      <i className="fa-solid fa-user-shield text-xl"></i>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm">HIPAA Secure</h4>
                    <p className="text-xs text-segesta-slate mt-1">Your health data is fully encrypted & safe.</p>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="glass-card p-6 rounded-2xl border border-segesta-skyblue/50 shadow-glass flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-segesta-peach/40 text-segesta-slate flex items-center justify-center mb-3">
                      <i className="fa-solid fa-headset text-xl"></i>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm">24/7 Support</h4>
                    <p className="text-xs text-segesta-slate mt-1">Always available for booking issues.</p>
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-md transform hover:scale-[1.02] transition-all duration-300">
                    <img className="w-full h-48 object-cover" src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400" alt="Consultation" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Text */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-segesta-lavender/50 border border-segesta-lavender text-segesta-slate text-xs font-semibold uppercase tracking-wider">
                <i className="fa-solid fa-history mr-1"></i> Our Mission
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
                Our Story – Bridging Patients & Trusted Doctors.
              </h2>

              <p className="text-segesta-slate font-light leading-relaxed text-sm sm:text-base">
                Segesta was founded with a single mission: to eliminate waiting rooms and make quality healthcare accessible to everyone. We noticed that patients spent hours calling clinics, navigating outdated schedules, and waiting weeks to see specialists.
              </p>

              <p className="text-segesta-slate font-light leading-relaxed text-sm sm:text-base">
                By building an intelligent, real-time doctor booking framework, we bridge the gap between clinics and communities. Today, patients can find the best practitioners, check actual live calendars, and schedule instant telehealth or in-person checkups in under 30 seconds.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-segesta-skyblue/50">
                <div className="space-y-1">
                  <span className="block text-3xl font-extrabold text-segesta-electric tracking-tight">500+</span>
                  <span className="block text-xs uppercase tracking-wider text-segesta-slate/75 font-semibold">Trusted Doctors</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-3xl font-extrabold text-segesta-cyan tracking-tight">10k+</span>
                  <span className="block text-xs uppercase tracking-wider text-segesta-slate/75 font-semibold">Bookings Completed</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-3xl font-extrabold text-segesta-slate tracking-tight">24/7</span>
                  <span className="block text-xs uppercase tracking-wider text-segesta-slate/75 font-semibold">Online Scheduling</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SOLUTIONS SECTION (FEATURES / SEARCH WIDGET) */}
      <section id="solutions" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-segesta-mint/40 border border-segesta-mint text-segesta-slate text-xs font-semibold uppercase tracking-wider">
              <i className="fa-solid fa-toolbox mr-1"></i> Core Offerings
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
              Intelligent Solutions for Easy Booking
            </h2>
            <p className="text-segesta-slate font-light text-sm sm:text-base">
              Explore the features engineered to provide a seamless, stress-free health booking experience.
            </p>
          </div>

          {/* Search Widget */}
          <div className="glass-card border border-segesta-skyblue/50 rounded-3xl p-6 sm:p-8 shadow-glass max-w-4xl mx-auto mb-16 relative overflow-visible bg-white/70 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-segesta-mint/20 rounded-bl-full -z-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-segesta-lavender/20 rounded-tr-full -z-10"></div>

            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2.5 animate-pulse"></span>
              Tìm kiếm bác sĩ & Đặt lịch trực tuyến
            </h3>

            {!user ? (
              <div className="bg-segesta-skyblue/25 border border-segesta-skyblue/60 rounded-2xl p-6 text-center space-y-3">
                <p className="text-sm text-segesta-slate font-medium">
                  Vui lòng đăng nhập bằng tài khoản Bệnh nhân để tra cứu bác sĩ và đặt lịch khám.
                </p>
                <Link to="/login" className="inline-block px-6 py-2.5 bg-gradient-to-r from-segesta-electric to-segesta-cyan text-gray-900 font-bold rounded-xl text-xs hover:shadow-lg hover:shadow-segesta-cyan/20 active:translate-y-0.5 transition-all">
                  Đăng nhập ngay
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Specialty Custom Dropdown */}
                  <div className="relative animate-fade-in" ref={specialtyRef}>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-segesta-slate/60 mb-1.5">Chuyên khoa</label>
                    <div 
                      onClick={() => setSpecialtyOpen(!specialtyOpen)}
                      className="w-full bg-white border border-segesta-skyblue/50 rounded-lg px-4 py-3 text-sm flex items-center justify-between cursor-pointer shadow-md select-none transition-all duration-200 hover:border-segesta-electric"
                    >
                      <span className="text-gray-800 truncate font-medium">
                        {selectedSpecialty === 'all' ? 'Tất cả chuyên khoa' : selectedSpecialty}
                      </span>
                      <i className="fa-solid fa-chevron-down text-xs text-segesta-slate/60 ml-2"></i>
                    </div>
                    
                    {specialtyOpen && (
                      <div className="absolute left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-md z-50 py-1.5 max-h-60 overflow-y-auto transition-all">
                        <div 
                          onClick={() => { setSelectedSpecialty('all'); setSpecialtyOpen(false); }}
                          className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-sky-50 hover:text-segesta-electric transition-colors ${selectedSpecialty === 'all' ? 'bg-sky-50/50 text-segesta-electric font-semibold' : 'text-gray-700'}`}
                        >
                          Tất cả chuyên khoa
                        </div>
                        {['Cardiology', 'Dermatology', 'Pediatrics', 'Neurology', 'Orthopedics'].map(spec => (
                          <div 
                            key={spec}
                            onClick={() => { setSelectedSpecialty(spec); setSpecialtyOpen(false); }}
                            className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-sky-50 hover:text-segesta-electric transition-colors ${selectedSpecialty === spec ? 'bg-sky-50/50 text-segesta-electric font-semibold' : 'text-gray-700'}`}
                          >
                            {spec}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Location Custom Dropdown */}
                  <div className="relative animate-fade-in" ref={locationRef}>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-segesta-slate/60 mb-1.5">Địa điểm</label>
                    <div 
                      onClick={() => setLocationOpen(!locationOpen)}
                      className="w-full bg-white border border-segesta-skyblue/50 rounded-lg px-4 py-3 text-sm flex items-center justify-between cursor-pointer shadow-md select-none transition-all duration-200 hover:border-segesta-electric"
                    >
                      <span className="text-gray-800 truncate font-medium">
                        {selectedLocation === 'all' ? 'Tất cả địa điểm' : selectedLocation}
                      </span>
                      <i className="fa-solid fa-chevron-down text-xs text-segesta-slate/60 ml-2"></i>
                    </div>
                    
                    {locationOpen && (
                      <div className="absolute left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-md z-50 py-1.5 max-h-60 overflow-y-auto transition-all">
                        <div 
                          onClick={() => { setSelectedLocation('all'); setLocationOpen(false); }}
                          className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-sky-50 hover:text-segesta-electric transition-colors ${selectedLocation === 'all' ? 'bg-sky-50/50 text-segesta-electric font-semibold' : 'text-gray-700'}`}
                        >
                          Tất cả địa điểm
                        </div>
                        {['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho'].map(loc => (
                          <div 
                            key={loc}
                            onClick={() => { setSelectedLocation(loc); setLocationOpen(false); }}
                            className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-sky-50 hover:text-segesta-electric transition-colors ${selectedLocation === loc ? 'bg-sky-50/50 text-segesta-electric font-semibold' : 'text-gray-700'}`}
                          >
                            {loc}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Filter Button */}
                  <div className="flex items-end">
                    <button
                      onClick={handleSearch}
                      className="w-full bg-segesta-mint text-gray-900 font-bold rounded-lg py-3 px-6 hover:shadow-lg hover:shadow-segesta-cyan/20 hover:bg-segesta-lavender active:translate-y-0.5 transition-all text-sm h-[46px] flex items-center justify-center cursor-pointer border border-segesta-gray/20 font-bold"
                    >
                      Lọc kết quả <i className="fa-solid fa-magnifying-glass ml-1.5 text-segesta-electric"></i>
                    </button>
                  </div>
                </div>

                {/* Doctor Results */}
                <div className="mt-8 border-t border-segesta-skyblue/30 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-segesta-slate/60">
                      Danh sách bác sĩ ({filteredDoctors.length})
                    </h4>
                    <span onClick={handleResetFilter} className="text-xs text-segesta-electric hover:underline cursor-pointer">
                      Xóa bộ lọc
                    </span>
                  </div>

                  {loadingDoctors ? (
                    <div className="text-center py-6 text-sm text-segesta-slate">
                      Đang tải danh sách bác sĩ...
                    </div>
                  ) : filteredDoctors.length === 0 ? (
                    <div className="text-center py-6 text-sm text-rose-500 font-medium">
                      Không tìm thấy bác sĩ phù hợp.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {filteredDoctors.map(doctor => (
                        <div key={doctor.id} className="bg-white border border-segesta-skyblue/30 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-segesta-skyblue transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex items-center space-x-3.5">
                              <div className="relative">
                                <img
                                  className="w-12 h-12 rounded-xl object-cover"
                                  src={doctor.avatarUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150"}
                                  alt={doctor.fullName}
                                />
                                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800 text-sm">Dr. {doctor.fullName}</h4>
                                <p className="text-xs text-segesta-electric font-medium">{doctor.specialization}</p>
                              </div>
                            </div>
                            <p className="text-xs text-segesta-slate mt-2 line-clamp-2">
                              {doctor.description || "Bác sĩ chuyên khoa giàu kinh nghiệm."}
                            </p>
                          </div>
                          <button
                            onClick={() => openBooking(doctor)}
                            className="mt-4 w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-segesta-mint text-gray-900 hover:bg-segesta-lavender hover:text-gray-900 transition-all border border-segesta-gray/20"
                          >
                            Đặt lịch hẹn ngay
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Feature Cards Grid (4 Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Feature 1 */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-segesta-skyblue/50 hover:border-segesta-electric shadow-glass hover:shadow-glass-hover transform hover:-translate-y-1.5 transition-all duration-300 flex flex-col bg-white/70 backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-segesta-skyblue/40 text-segesta-electric flex items-center justify-center mb-6">
                <i className="fa-solid fa-sliders text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Smart Search & Filter</h3>
              <p className="text-segesta-slate text-sm font-light leading-relaxed flex-grow">
                Instantly search doctors by specialty, medical location, insurance network, and availability criteria.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-segesta-skyblue/50 hover:border-segesta-electric shadow-glass hover:shadow-glass-hover transform hover:-translate-y-1.5 transition-all duration-300 flex flex-col bg-white/70 backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-segesta-mint/40 text-emerald-650 flex items-center justify-center mb-6" style={{ color: '#10b981' }}>
                <i className="fa-solid fa-calendar-days text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Real-time Availability</h3>
              <p className="text-segesta-slate text-sm font-light leading-relaxed flex-grow">
                Check actual real-time calendar openings. Lock in your consultation instantly without any callbacks.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-segesta-skyblue/50 hover:border-segesta-electric shadow-glass hover:shadow-glass-hover transform hover:-translate-y-1.5 transition-all duration-300 flex flex-col bg-white/70 backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-segesta-lavender/40 text-violet-600 flex items-center justify-center mb-6">
                <i className="fa-solid fa-video text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Video Consult Integration</h3>
              <p className="text-segesta-slate text-sm font-light leading-relaxed flex-grow">
                Telehealth ready. Join encrypted high-definition video consultations directly inside the app.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-segesta-skyblue/50 hover:border-segesta-electric shadow-glass hover:shadow-glass-hover transform hover:-translate-y-1.5 transition-all duration-300 flex flex-col bg-white/70 backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-segesta-peach/40 text-rose-500 flex items-center justify-center mb-6">
                <i className="fa-solid fa-star-half-stroke text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Patient Reviews & Ratings</h3>
              <p className="text-segesta-slate text-sm font-light leading-relaxed flex-grow">
                Read verified reviews from real patients. Leave ratings after your consultation to help others.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CLIENTS SECTION */}
      <section id="clients" className="py-16 bg-white/50 border-y border-segesta-skyblue/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-segesta-slate/60">Trusted by Top Clinics & Hospitals</h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-16 opacity-60">
            <div className="flex items-center space-x-2 text-segesta-slate hover:text-segesta-electric transition-colors cursor-default">
              <i className="fa-solid fa-hospital-user text-2xl"></i>
              <span className="font-poppins font-semibold text-lg tracking-tight">City Medical</span>
            </div>
            <div className="flex items-center space-x-2 text-segesta-slate hover:text-segesta-electric transition-colors cursor-default">
              <i className="fa-solid fa-square-plus text-2xl"></i>
              <span className="font-poppins font-semibold text-lg tracking-tight">HealthPlus</span>
            </div>
            <div className="flex items-center space-x-2 text-segesta-slate hover:text-segesta-electric transition-colors cursor-default">
              <i className="fa-solid fa-heart-pulse text-2xl"></i>
              <span className="font-poppins font-semibold text-lg tracking-tight">Wellness Network</span>
            </div>
            <div className="flex items-center space-x-2 text-segesta-slate hover:text-segesta-electric transition-colors cursor-default">
              <i className="fa-solid fa-baby text-2xl"></i>
              <span className="font-poppins font-semibold text-lg tracking-tight">Pediatric Care</span>
            </div>
            <div className="flex items-center space-x-2 text-segesta-slate hover:text-segesta-electric transition-colors cursor-default">
              <i className="fa-solid fa-house-medical text-2xl"></i>
              <span className="font-poppins font-semibold text-lg tracking-tight">Family Clinic</span>
            </div>
          </div>
        </div>
      </section>

      {/* PORTFOLIO SECTION */}
      <section id="portfolio" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-segesta-lavender/50 border border-segesta-lavender text-segesta-slate text-xs font-semibold uppercase tracking-wider">
              <i className="fa-solid fa-folder-open mr-1"></i> Success Stories
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
              Success Stories in Digital Booking
            </h2>
            <p className="text-segesta-slate font-light text-sm sm:text-base">
              See how our platforms and implementations have optimized operations for clinics and changed patient experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Case 1 */}
            <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-segesta-skyblue/50 hover:border-segesta-electric transition-all duration-300 flex flex-col">
              <div className="h-52 overflow-hidden relative">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600" alt="Hospital desk" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-80"></div>
                <span className="absolute bottom-4 left-4 bg-segesta-electric text-white text-xs font-bold px-3 py-1.5 rounded-lg">Case Study</span>
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-segesta-electric transition-colors">Smart Triage System</h3>
                  <p className="text-segesta-slate text-sm font-light leading-relaxed">
                    Implemented AI-driven symptoms check routing. Reduced clinic reception congestion and wait times by 60%.
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-sky-50 flex items-center justify-between text-xs text-segesta-slate/60">
                  <span>Client: City Medical</span>
                  <span className="font-bold text-emerald-500">-60% Wait Time</span>
                </div>
              </div>
            </div>

            {/* Case 2 */}
            <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-segesta-skyblue/50 hover:border-segesta-electric transition-all duration-300 flex flex-col">
              <div className="h-52 overflow-hidden relative">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" src="https://images.unsplash.com/photo-1504813184591-015556c5c50f?auto=format&fit=crop&q=80&w=600" alt="Multi-doctor Office" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-80"></div>
                <span className="absolute bottom-4 left-4 bg-segesta-electric text-white text-xs font-bold px-3 py-1.5 rounded-lg">Case Study</span>
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-segesta-electric transition-colors">Multi-doctor Group Practice</h3>
                  <p className="text-segesta-slate text-sm font-light leading-relaxed">
                    Deployed digital booking for a network of 40+ doctors. Reached 95% online patient scheduling adoption within 3 months.
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-sky-50 flex items-center justify-between text-xs text-segesta-slate/60">
                  <span>Client: Wellness Network</span>
                  <span className="font-bold text-segesta-electric">95% Adoption</span>
                </div>
              </div>
            </div>

            {/* Case 3 */}
            <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-segesta-skyblue/50 hover:border-segesta-electric transition-all duration-300 flex flex-col">
              <div className="h-52 overflow-hidden relative">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=600" alt="EHR server screen" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-80"></div>
                <span className="absolute bottom-4 left-4 bg-segesta-electric text-white text-xs font-bold px-3 py-1.5 rounded-lg">Case Study</span>
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-segesta-electric transition-colors">API Integration with EHR</h3>
                  <p className="text-segesta-slate text-sm font-light leading-relaxed">
                    Created a custom secure API integration linking Segesta calendar grids directly with local EHR hospital records.
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-sky-50 flex items-center justify-between text-xs text-segesta-slate/60">
                  <span>Client: HealthPlus Hospital</span>
                  <span className="font-bold text-segesta-electric">Real-time Sync</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* BLOG SECTION */}
      <section id="blog" className="py-20 bg-white/50 backdrop-blur-md relative border-y border-segesta-skyblue/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-segesta-mint/40 border border-segesta-mint text-segesta-slate text-xs font-semibold uppercase tracking-wider">
              <i className="fa-solid fa-newspaper mr-1"></i> Articles & Tips
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
              Insights for Better Healthcare Access
            </h2>
            <p className="text-segesta-slate font-light text-sm sm:text-base">
              Read professional articles on booking optimizations, telemedicine trends, and smart healthcare habits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Blog 1 */}
            <article className="glass-card rounded-3xl overflow-hidden border border-segesta-skyblue/50 hover:border-segesta-electric shadow-glass hover:shadow-glass-hover transition-all duration-300 flex flex-col justify-between bg-white/70 backdrop-blur-md">
              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between text-xs text-segesta-slate/60 font-medium">
                  <span>Health Guide</span>
                  <span>May 25, 2026</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 hover:text-segesta-electric transition-colors">
                  <a href="#blog">How to Choose the Right Doctor Online</a>
                </h3>
                <p className="text-segesta-slate text-sm font-light leading-relaxed">
                  Tips on filtering by verified qualifications, understanding reviews, and evaluating convenience factors like location.
                </p>
              </div>
              <div className="p-6 sm:p-8 bg-segesta-skyblue/20 border-t border-segesta-skyblue/30 flex items-center justify-between">
                <span className="text-xs font-bold text-segesta-electric uppercase tracking-wider">Read Article</span>
                <i className="fa-solid fa-arrow-up-right-from-square text-xs text-segesta-slate/60"></i>
              </div>
            </article>

            {/* Blog 2 */}
            <article className="glass-card rounded-3xl overflow-hidden border border-segesta-skyblue/50 hover:border-segesta-electric shadow-glass hover:shadow-glass-hover transition-all duration-300 flex flex-col justify-between bg-white/70 backdrop-blur-md">
              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between text-xs text-segesta-slate/60 font-medium">
                  <span>Technology</span>
                  <span>May 18, 2026</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 hover:text-segesta-electric transition-colors">
                  <a href="#blog">The Future of AI in Appointment Scheduling</a>
                </h3>
                <p className="text-segesta-slate text-sm font-light leading-relaxed">
                  How deep learning networks predict appointment cancellation rates and dynamically adjust slot intervals to maximize efficiency.
                </p>
              </div>
              <div className="p-6 sm:p-8 bg-segesta-skyblue/20 border-t border-segesta-skyblue/30 flex items-center justify-between">
                <span className="text-xs font-bold text-segesta-electric uppercase tracking-wider">Read Article</span>
                <i className="fa-solid fa-arrow-up-right-from-square text-xs text-segesta-slate/60"></i>
              </div>
            </article>

            {/* Blog 3 */}
            <article className="glass-card rounded-3xl overflow-hidden border border-segesta-skyblue/50 hover:border-segesta-electric shadow-glass hover:shadow-glass-hover transition-all duration-300 flex flex-col justify-between bg-white/70 backdrop-blur-md">
              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between text-xs text-segesta-slate/60 font-medium">
                  <span>Trends</span>
                  <span>May 10, 2026</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 hover:text-segesta-electric transition-colors">
                  <a href="#blog">Telemedicine vs In-Person: What Patients Prefer</a>
                </h3>
                <p className="text-segesta-slate text-sm font-light leading-relaxed">
                  Analyzing user polling data on digital video consult preference patterns vs standard in-person physical checks.
                </p>
              </div>
              <div className="p-6 sm:p-8 bg-segesta-skyblue/20 border-t border-segesta-skyblue/30 flex items-center justify-between">
                <span className="text-xs font-bold text-segesta-electric uppercase tracking-wider">Read Article</span>
                <i className="fa-solid fa-arrow-up-right-from-square text-xs text-segesta-slate/60"></i>
              </div>
            </article>

          </div>
        </div>
      </section>

      {/* CONTACT US SECTION */}
      <section id="contactus" className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Side: Form */}
            <div className="lg:col-span-7">
              <div className="glass-card p-8 sm:p-10 rounded-3xl border border-segesta-skyblue/50 shadow-glass bg-white/70 backdrop-blur-md">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight mb-2">Have Questions? Let’s Talk.</h2>
                <p className="text-segesta-slate font-light text-sm mb-6">Drop us a line and our clinic relations team will get back to you within 24 hours.</p>

                <form className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-segesta-slate/60 mb-1.5">Full Name</label>
                      <input type="text" required className="w-full bg-white border border-segesta-skyblue/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-segesta-electric" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-segesta-slate/60 mb-1.5">Email Address</label>
                      <input type="email" required className="w-full bg-white border border-segesta-skyblue/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-segesta-electric" placeholder="john@example.com" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-segesta-slate/60 mb-1.5">Message</label>
                    <textarea required rows="4" className="w-full bg-white border border-segesta-skyblue/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-segesta-electric" placeholder="Tell us how we can help..."></textarea>
                  </div>

                  <button type="submit" className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-segesta-electric to-segesta-cyan text-gray-900 font-bold rounded-xl hover:shadow-lg hover:shadow-segesta-cyan/20 active:translate-y-0.5 transition-all text-sm">
                    Send Message <i className="fa-solid fa-paper-plane ml-1.5"></i>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Side: Info */}
            <div className="lg:col-span-5 space-y-8 lg:pl-6 text-center lg:text-left">
              <div className="flex justify-center lg:justify-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-40 h-40 animate-float">
                  <polygon points="50,140 120,95 160,120 90,165" fill="#E0F2FF" />
                  <polygon points="50,140 120,95 130,101 60,146" fill="#4FA9FF" />
                  <polygon points="80,90 140,50 170,70 110,110" fill="#ffffff" filter="url(#shadow)" />
                  <polygon points="78,90 80,90 110,110 108,110" fill="#B2DFDB" />
                  <circle cx="115" cy="78" r="10" fill="#B2DFDB" />
                  <path d="M 112 78 Q 115 81 118 78" stroke="#546E7A" strokeWidth="1.5" fill="none" />
                </svg>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800">Support & Business Contacts</h3>
                <p className="text-segesta-slate font-light text-sm leading-relaxed">
                  Are you a clinic owner or hospital administrator looking to integrate Segesta's real-time booking grid? Contact our partnerships division directly.
                </p>
              </div>

              <div className="space-y-3.5 text-sm flex flex-col items-center lg:items-start text-segesta-slate">
                <a href="mailto:support@segesta.com" className="flex items-center space-x-2.5 hover:text-segesta-electric transition-colors">
                  <i className="fa-solid fa-envelope text-segesta-electric text-base w-5"></i>
                  <span>support@segesta.com</span>
                </a>
                <div className="flex items-center space-x-2.5">
                  <i className="fa-solid fa-phone text-emerald-500 text-base w-5"></i>
                  <span>+1 (800) 555-0199</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <i className="fa-solid fa-location-dot text-violet-500 text-base w-5"></i>
                  <span>100 Health Plaza, Suite 400, San Francisco</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-segesta-slate text-white pt-16 pb-8 border-t border-segesta-gray/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-segesta-gray/20">

            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <img src={logoImage} alt="SEGESTA Logo" className="w-8 h-8 object-contain" />
                <span className="text-xl font-bold tracking-tight">SEGESTA</span>
              </div>
              <p className="text-segesta-gray text-xs sm:text-sm font-light leading-relaxed max-w-sm">
                Modern, intelligent doctor scheduling framework designed to bridge patients and trusted clinic specialists in seconds. Built with privacy and ease in mind.
              </p>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs uppercase tracking-widest text-segesta-gray font-bold font-poppins">Quick Links</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-segesta-gray">
                <li><a href="#ourstory" className="hover:text-white transition-colors">Our Story</a></li>
                <li><a href="#solutions" className="hover:text-white transition-colors">Solutions</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">Success Portfolio</a></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs uppercase tracking-widest text-segesta-gray font-bold font-poppins">Legal</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-segesta-gray">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs uppercase tracking-widest text-segesta-gray font-bold font-poppins">Socials</h4>
              <div className="flex space-x-3">
                <a href="#" className="w-8 h-8 rounded-lg bg-segesta-gray/30 hover:bg-segesta-electric flex items-center justify-center text-segesta-gray hover:text-white transition-colors" aria-label="Facebook">
                  <i className="fa-brands fa-facebook-f text-sm"></i>
                </a>
                <a href="#" className="w-8 h-8 rounded-lg bg-segesta-gray/30 hover:bg-segesta-electric flex items-center justify-center text-segesta-gray hover:text-white transition-colors" aria-label="Twitter">
                  <i className="fa-brands fa-twitter text-sm"></i>
                </a>
              </div>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-segesta-gray/80">
            <p>© 2026 Segesta – Doctor Booking. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">Designed for modern clinics & smart healthcare access.</p>
          </div>
        </div>
      </footer>

      {/* BOOKING MODAL */}
      {bookingModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div onClick={() => setBookingModalOpen(false)} className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-segesta-skyblue/50">

              {/* Header */}
              <div className="bg-gradient-to-r from-segesta-electric to-segesta-cyan px-6 py-5 text-gray-900 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold font-poppins">Dr. {selectedDoctor.fullName}</h3>
                  <p className="text-xs text-segesta-slate">{selectedDoctor.specialization}</p>
                </div>
                <button onClick={() => setBookingModalOpen(false)} className="text-gray-900/80 hover:text-gray-900 focus:outline-none p-1 rounded-full hover:bg-black/5">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>

              {/* Body Form */}
              <div className="p-6 space-y-5">
                {/* Choose Date */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-segesta-slate/75 mb-2">1. Chọn ngày khám</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={handleDateChange}
                    min={getLocalDateString()}
                    required
                    className="w-full bg-segesta-skyblue/20 border border-segesta-skyblue/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-segesta-electric cursor-pointer"
                  />
                </div>

                {/* Choose Time Slot */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-segesta-slate/75 mb-2">2. Khung giờ khám khả dụng</label>
                  {loadingSlots ? (
                    <div className="text-xs text-segesta-slate py-2">Đang tải khung giờ khám từ bác sĩ...</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-xs text-rose-500 py-2 font-medium">Bác sĩ không có lịch trống trong ngày này. Vui lòng chọn ngày khác.</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2.5">
                      {availableSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${selectedSlot === slot ? 'bg-segesta-electric text-white border-segesta-electric shadow-sm' : 'border-segesta-skyblue bg-white text-segesta-slate hover:text-segesta-electric hover:bg-segesta-skyblue/20'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Info */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-segesta-slate/75">3. Thông tin bệnh nhân</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                    placeholder="Họ và tên bệnh nhân"
                    className="w-full bg-white border border-segesta-skyblue/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-segesta-electric"
                  />
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    required
                    placeholder="Số điện thoại liên hệ"
                    className="w-full bg-white border border-segesta-skyblue/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-segesta-electric"
                  />
                  <textarea
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Ghi chú triệu chứng (tùy chọn)..."
                    className="w-full bg-white border border-segesta-skyblue/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-segesta-electric"
                    rows="2"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-segesta-slate/75 mb-2">4. Phương thức thanh toán</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-3 rounded-2xl border text-left flex flex-col transition-all ${paymentMethod === 'CASH' ? 'border-segesta-electric bg-segesta-skyblue/30 shadow-sm' : 'border-segesta-skyblue bg-white'}`}
                    >
                      <span className="text-sm font-semibold text-gray-800">💵 Tiền mặt</span>
                      <span className="text-[10px] text-segesta-slate mt-1">Thanh toán tại phòng khám</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('VNPAY')}
                      className={`p-3 rounded-2xl border text-left flex flex-col transition-all ${paymentMethod === 'VNPAY' ? 'border-segesta-electric bg-segesta-skyblue/30 shadow-sm' : 'border-segesta-skyblue bg-white'}`}
                    >
                      <span className="text-sm font-semibold text-gray-800">🏦 VNPAY</span>
                      <span className="text-[10px] text-segesta-slate mt-1">Thanh toán online (ATM/QR)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-segesta-white px-6 py-4 flex flex-col sm:flex-row-reverse gap-3 border-t border-segesta-skyblue/35">
                <button
                  onClick={handleConfirmBooking}
                  disabled={submittingBooking}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-segesta-electric to-segesta-cyan text-gray-900 font-semibold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
                >
                  {submittingBooking ? 'Đang đặt...' : 'Xác nhận đặt lịch'}
                </button>
                <button
                  onClick={() => setBookingModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-white border border-segesta-gray/40 text-segesta-slate font-semibold rounded-xl text-sm hover:bg-gray-50 transition-all"
                >
                  Hủy
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* BOOKING SUCCESS MODAL */}
      {bookingSuccessData && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div onClick={() => setBookingSuccessData(null)} className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-middle bg-white rounded-3xl p-6 sm:p-8 text-center overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-segesta-skyblue/50">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <i className="fa-solid fa-calendar-check text-2xl"></i>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">Đặt lịch thành công!</h3>
              <p className="text-gray-500 text-sm font-light mb-6">
                Yêu cầu đặt lịch khám của bạn đã được ghi nhận. Vui lòng kiểm tra email hoặc dashboard để xem chi tiết.
              </p>

              <div className="bg-segesta-skyblue/20 rounded-2xl p-4 mb-6 text-left text-sm space-y-2 border border-segesta-skyblue/40">
                <p className="text-gray-700"><span className="font-semibold text-gray-500">Bác sĩ:</span> Dr. {bookingSuccessData.doctorName}</p>
                <p className="text-gray-700"><span className="font-semibold text-gray-500">Ngày khám:</span> {bookingSuccessData.date}</p>
                <p className="text-gray-700"><span className="font-semibold text-gray-500">Khung giờ:</span> {bookingSuccessData.time}</p>
                <p className="text-gray-700"><span className="font-semibold text-gray-500">Bệnh nhân:</span> {bookingSuccessData.patientName}</p>
              </div>

              <button onClick={() => setBookingSuccessData(null)} className="w-full py-3 bg-gradient-to-r from-segesta-electric to-segesta-cyan text-gray-900 font-bold rounded-xl text-sm transition-all shadow-md">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;