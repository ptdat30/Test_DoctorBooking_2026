import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoImage from '../assets/DoctorBooking-removebg-preview.png';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const desktopRef = useRef(null);
  const mobileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideDesktop = !desktopRef.current || !desktopRef.current.contains(event.target);
      const clickedOutsideMobile = !mobileRef.current || !mobileRef.current.contains(event.target);
      
      if (clickedOutsideDesktop && clickedOutsideMobile) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setDropdownOpen(false);
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'DOCTOR':
        return '/doctor/dashboard';
      case 'PATIENT':
        return '/patient/dashboard';
      default:
        return '/';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const isHomePage = location.pathname === '/';
  const getNavLink = (hash) => {
    return isHomePage ? hash : `/${hash}`;
  };

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-md shadow-md py-3 border-b border-segesta-skyblue/50' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={logoImage} alt="SEGESTA Logo" className="w-10 h-10 object-contain animate-pulse-subtle" />
            <div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-gray-800">SEGESTA</span>
              <span className="block text-[9px] tracking-widest text-segesta-electric uppercase font-bold -mt-1">Doctor Booking</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {['ourstory', 'solutions', 'clients', 'portfolio', 'blog', 'contactus'].map((item) => (
              <a
                key={item}
                href={getNavLink(`#${item}`)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-segesta-slate hover:text-segesta-electric hover:bg-segesta-skyblue/40 transition-all capitalize"
              >
                {item === 'contactus' ? 'Contact Us' : item === 'ourstory' ? 'Our Story' : item}
              </a>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={desktopRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none p-1.5 rounded-xl hover:bg-segesta-skyblue/40 transition-all border border-segesta-skyblue/50 bg-white/40 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-segesta-electric text-white flex items-center justify-center font-bold text-xs border border-segesta-skyblue">
                    {getInitials(user.fullName || user.username)}
                  </div>
                  <span className="text-xs font-bold text-gray-700 max-w-[120px] truncate">
                    {user.fullName || user.username}
                  </span>
                  <i className="fa-solid fa-chevron-down text-[10px] text-gray-400"></i>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-lg border border-gray-200 shadow-md py-2 z-50 text-left animate-slide-in">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tài khoản</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{user.fullName || user.username}</p>
                      <p className="text-[11px] text-segesta-electric font-semibold mt-0.5">{user.email || 'Email chưa cập nhật'}</p>
                    </div>
                    <div className="py-1.5">
                      <button
                        onClick={() => { navigate(getDashboardPath()); setDropdownOpen(false); }}
                        className="w-full flex items-center px-4 py-2 text-xs font-medium text-gray-650 hover:text-segesta-electric hover:bg-segesta-skyblue/30 transition-all cursor-pointer text-left"
                      >
                        <i className="fa-solid fa-gauge mr-2.5 w-4 text-center"></i> Bảng điều khiển
                      </button>
                      <button
                        onClick={() => { 
                          navigate(user.role === 'PATIENT' ? '/patient/profile' : user.role === 'DOCTOR' ? '/doctor/profile' : '/admin/dashboard'); 
                          setDropdownOpen(false); 
                        }}
                        className="w-full flex items-center px-4 py-2 text-xs font-medium text-gray-650 hover:text-segesta-electric hover:bg-segesta-skyblue/30 transition-all cursor-pointer text-left"
                      >
                        <i className="fa-solid fa-circle-user mr-2.5 w-4 text-center"></i> My Profile
                      </button>
                      <button
                        onClick={() => { 
                          navigate(user.role === 'PATIENT' ? '/patient/history' : user.role === 'DOCTOR' ? '/doctor/appointments' : '/admin/appointments'); 
                          setDropdownOpen(false); 
                        }}
                        className="w-full flex items-center px-4 py-2 text-xs font-medium text-gray-650 hover:text-segesta-electric hover:bg-segesta-skyblue/30 transition-all cursor-pointer text-left"
                      >
                        <i className="fa-solid fa-calendar-check mr-2.5 w-4 text-center"></i> My Appointments
                      </button>
                      <button
                        onClick={() => { 
                          navigate(user.role === 'PATIENT' ? '/patient/profile' : user.role === 'DOCTOR' ? '/doctor/profile' : '/admin/dashboard'); 
                          setDropdownOpen(false); 
                        }}
                        className="w-full flex items-center px-4 py-2 text-xs font-medium text-gray-650 hover:text-segesta-electric hover:bg-segesta-skyblue/30 transition-all cursor-pointer text-left"
                      >
                        <i className="fa-solid fa-cog mr-2.5 w-4 text-center"></i> Settings
                      </button>
                    </div>
                    <div className="border-t border-gray-150 pt-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all cursor-pointer text-left"
                      >
                        <i className="fa-solid fa-sign-out-alt mr-2.5 w-4 text-center"></i> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-segesta-slate hover:text-segesta-electric transition-colors">
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-segesta-mint text-segesta-slate text-sm font-semibold border border-segesta-gray/50 hover:bg-segesta-lavender hover:text-segesta-slate transition-all duration-300 shadow-sm"
                >
                  Book Now <i className="fa-solid fa-calendar-check ml-1.5 text-segesta-electric"></i>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <div className="relative" ref={mobileRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center focus:outline-none p-1 rounded-lg hover:bg-segesta-skyblue/40 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-segesta-electric text-white flex items-center justify-center font-bold text-xs border border-segesta-skyblue">
                    {getInitials(user.fullName || user.username)}
                  </div>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 shadow-md py-2 z-50 text-left">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-800 truncate">{user.fullName || user.username}</p>
                    </div>
                    <button
                      onClick={() => { navigate(getDashboardPath()); setDropdownOpen(false); }}
                      className="w-full flex items-center px-4 py-2 text-xs text-gray-650 hover:bg-segesta-skyblue/30 transition-all text-left cursor-pointer"
                    >
                      Bảng điều khiển
                    </button>
                    <button
                      onClick={() => { 
                        navigate(user.role === 'PATIENT' ? '/patient/profile' : user.role === 'DOCTOR' ? '/doctor/profile' : '/admin/dashboard'); 
                        setDropdownOpen(false); 
                      }}
                      className="w-full flex items-center px-4 py-2 text-xs text-gray-650 hover:bg-segesta-skyblue/30 transition-all text-left cursor-pointer"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => { 
                        navigate(user.role === 'PATIENT' ? '/patient/history' : user.role === 'DOCTOR' ? '/doctor/appointments' : '/admin/appointments'); 
                        setDropdownOpen(false); 
                      }}
                      className="w-full flex items-center px-4 py-2 text-xs text-gray-650 hover:bg-segesta-skyblue/30 transition-all text-left cursor-pointer"
                    >
                      My Appointments
                    </button>
                    <button
                      onClick={() => { 
                        navigate(user.role === 'PATIENT' ? '/patient/profile' : user.role === 'DOCTOR' ? '/doctor/profile' : '/admin/dashboard'); 
                        setDropdownOpen(false); 
                      }}
                      className="w-full flex items-center px-4 py-2 text-xs text-gray-650 hover:bg-segesta-skyblue/30 transition-all text-left cursor-pointer"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all text-left cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-segesta-slate hover:text-segesta-electric focus:outline-none p-2 rounded-lg hover:bg-segesta-skyblue/35 transition-all cursor-pointer"
            >
              <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-segesta-skyblue/50 px-4 pt-2 pb-4 space-y-1 shadow-lg animate-slide-in">
          {['ourstory', 'solutions', 'clients', 'portfolio', 'blog', 'contactus'].map((item) => (
            <a
              key={item}
              href={getNavLink(`#${item}`)}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-segesta-slate hover:text-segesta-electric hover:bg-segesta-skyblue/30 transition-all capitalize"
            >
              {item === 'contactus' ? 'Contact Us' : item === 'ourstory' ? 'Our Story' : item}
            </a>
          ))}
          {!user && (
            <div className="pt-4 flex flex-col space-y-2.5 px-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold text-segesta-slate hover:text-segesta-electric transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-segesta-mint text-segesta-slate text-sm font-semibold border border-segesta-gray/50 hover:bg-segesta-lavender transition-all"
              >
                Book Now
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
