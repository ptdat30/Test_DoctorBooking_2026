import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoImage from '../assets/DoctorBooking-removebg-preview.png';

const EDITORIAL_NAV = [
  { id: 'about', label: 'Giới thiệu' },
  { id: 'services', label: 'Dịch vụ' },
  { id: 'partners', label: 'Đối tác' },
  { id: 'news', label: 'Tin tức' },
  { id: 'contact', label: 'Liên hệ' },
];

const DEFAULT_NAV = [
  { id: 'ourstory', label: 'Our Story' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'clients', label: 'Clients' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'blog', label: 'Blog' },
  { id: 'contactus', label: 'Contact Us' },
];

const Header = ({ variant = 'default' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const desktopRef = useRef(null);
  const mobileRef = useRef(null);

  const isEditorial = variant === 'editorial';
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const outsideDesktop = !desktopRef.current || !desktopRef.current.contains(event.target);
      const outsideMobile = !mobileRef.current || !mobileRef.current.contains(event.target);
      if (outsideDesktop && outsideMobile) setDropdownOpen(false);
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
      case 'ADMIN': return '/admin/dashboard';
      case 'DOCTOR': return '/doctor/dashboard';
      case 'PATIENT': return '/patient/dashboard';
      default: return '/';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const words = name.trim().split(' ');
    return words.length >= 2
      ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
      : name[0].toUpperCase();
  };

  const getNavLink = (hash) => (isHomePage ? hash : `/${hash}`);
  const navItems = isEditorial ? EDITORIAL_NAV : DEFAULT_NAV;

  const headerBg = isEditorial
    ? isScrolled
      ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200 py-3'
      : 'bg-transparent py-6'
    : isScrolled
      ? 'bg-white/80 backdrop-blur-md shadow-md py-3 border-b border-segesta-skyblue/50'
      : 'bg-transparent py-5';

  const textMuted = isEditorial
    ? isScrolled ? 'text-neutral-600' : 'text-white/70'
    : 'text-segesta-slate';

  const textPrimary = isEditorial
    ? isScrolled ? 'text-neutral-900' : 'text-white'
    : 'text-gray-800';

  const navHover = isEditorial
    ? isScrolled ? 'hover:text-neutral-900' : 'hover:text-white'
    : 'hover:text-segesta-electric hover:bg-segesta-skyblue/40';

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${headerBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={logoImage}
              alt="SEGESTA Logo"
              className={`w-8 h-8 object-contain ${isEditorial && !isScrolled ? 'brightness-0 invert' : ''}`}
            />
            <div>
              <span className={`text-lg font-bold tracking-tight ${textPrimary}`}>SEGESTA</span>
              {isEditorial && (
                <span className={`block text-[8px] tracking-[0.3em] uppercase font-semibold -mt-0.5 ${isScrolled ? 'text-neutral-500' : 'text-white/50'}`}>
                  Doctor Booking
                </span>
              )}
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ id, label }) => (
              <a
                key={id}
                href={getNavLink(`#${id}`)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${textMuted} ${navHover}`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-5">
            {user ? (
              <div className="relative" ref={desktopRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2 p-1.5 rounded-lg transition-all border ${
                    isEditorial && !isScrolled
                      ? 'border-white/20 hover:bg-white/10'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    isEditorial && !isScrolled ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'
                  }`}>
                    {getInitials(user.fullName || user.username)}
                  </div>
                  <span className={`text-xs font-semibold max-w-[100px] truncate ${textPrimary}`}>
                    {user.fullName || user.username}
                  </span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-neutral-200 shadow-xl py-2 z-50 text-left">
                    <div className="px-4 py-2 border-b border-neutral-100">
                      <p className="text-sm font-bold text-neutral-900 truncate">{user.fullName || user.username}</p>
                    </div>
                    <button type="button" onClick={() => { navigate(getDashboardPath()); setDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50">Bảng điều khiển</button>
                    <button type="button" onClick={handleLogout} className="w-full text-left px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50">Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className={`text-sm font-semibold transition-colors ${textMuted} ${navHover}`}>
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isEditorial && !isScrolled
                      ? 'bg-white text-neutral-900 hover:bg-neutral-100'
                      : 'bg-neutral-900 text-white hover:bg-neutral-800'
                  }`}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 transition-colors ${textPrimary}`}
            aria-label="Menu"
          >
            <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`} />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className={`md:hidden border-t px-4 py-4 space-y-1 ${
          isEditorial && !isScrolled ? 'bg-neutral-950/95 border-white/10' : 'bg-white border-neutral-200'
        }`}>
          {navItems.map(({ id, label }) => (
            <a
              key={id}
              href={getNavLink(`#${id}`)}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 text-sm font-medium ${isEditorial && !isScrolled ? 'text-white/80 hover:text-white' : 'text-neutral-700 hover:text-neutral-900'}`}
            >
              {label}
            </a>
          ))}
          {!user && (
            <div className="pt-4 flex flex-col gap-2 px-3">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center py-2.5 text-sm font-semibold text-neutral-700">Đăng nhập</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="text-center py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold">Đăng ký</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
