import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/common/Loading';
import logoImage from '../assets/DoctorBooking-removebg-preview.png';
import './AuthUnified.css';

const AuthUnified = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isSignUp, setIsSignUp] = useState(location.pathname === '/register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register, user } = useAuth();

  useEffect(() => {
    // If user is already logged in, redirect them to their dashboard
    if (user) {
      const role = user.role?.toUpperCase();
      if (role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'DOCTOR') {
        navigate('/doctor/dashboard', { replace: true });
      } else {
        navigate('/patient/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    document.body.style.background = '#e0f2ff';
    return () => {
      document.body.style.background = '';
    };
  }, []);

  useEffect(() => {
    const shouldBeSignUp = location.pathname === '/register';
    if (shouldBeSignUp !== isSignUp) {
      setIsSignUp(shouldBeSignUp);
    }
  }, [location.pathname, isSignUp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      // Register validation
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }
      if (password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }

      setLoading(true);
      try {
        const userData = {
          username: username.trim(),
          email: email.trim(),
          password: password,
          fullName: fullName.trim(),
          phone: phone.trim(),
          role: 'PATIENT'
        };
        await register(userData);
        navigate('/patient/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Đăng ký thất bại');
        setLoading(false);
      }
    } else {
      // Login
      setLoading(true);
      try {
        const authResponse = await login(email.trim(), password);
        const role = authResponse?.role?.toUpperCase();
        if (role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (role === 'DOCTOR') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/patient/dashboard');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác');
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    navigate(isSignUp ? '/login' : '/register', { replace: true });
  };

  if (loading) {
    return <Loading message={isSignUp ? 'Đang đăng ký tài khoản...' : 'Đang đăng nhập...'} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-segesta-skyblue via-segesta-lavender/40 to-segesta-peach/30 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-segesta-skyblue/30 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] rounded-full bg-segesta-peach/25 blur-[90px] pointer-events-none"></div>

      {/* Back to Home Button */}
      <Link to="/" className="premium-back-btn">
        <i className="fa-solid fa-arrow-left"></i>
      </Link>

      {/* Auth Card */}
      <div className="auth-glass-card rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-glass border border-segesta-lavender/40 bg-white/70 backdrop-blur-md animate-slide-in relative">
        
        {/* Brand Logo & Header */}
        <div className="text-center mb-8">
          <img src={logoImage} alt="SEGESTA Logo" className="w-16 h-16 object-contain mx-auto mb-3.5 animate-pulse-subtle" />
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            {isSignUp ? 'Đăng ký tài khoản' : 'Đăng nhập hệ thống'}
          </h2>
          <p className="text-xs text-segesta-electric font-semibold uppercase tracking-wider mt-1">
            SEGESTA DOCTOR BOOKING
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="error-message mb-5 bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl flex items-center space-x-2 animate-pulse-subtle">
            <i className="fa-solid fa-circle-exclamation text-rose-500 text-sm flex-shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Full Name (Sign Up Only) */}
          {isSignUp && (
            <div className="premium-input-group">
              <input
                id="register-fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={isSignUp}
                placeholder=" "
                className="premium-input"
              />
              <label className="premium-label">Họ và tên</label>
              <div className="premium-icon">
                <i className="fa-solid fa-user"></i>
              </div>
              <span className="premium-input-glow"></span>
            </div>
          )}

          {/* Username (Sign Up Only) */}
          {isSignUp && (
            <div className="premium-input-group">
              <input
                id="register-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={isSignUp}
                placeholder=" "
                className="premium-input"
              />
              <label className="premium-label">Tên đăng nhập</label>
              <div className="premium-icon">
                <i className="fa-solid fa-at"></i>
              </div>
              <span className="premium-input-glow"></span>
            </div>
          )}

          {/* Email / Username */}
          <div className="premium-input-group">
            <input
              id={isSignUp ? 'register-email' : 'login-username'}
              type={isSignUp ? 'email' : 'text'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus={!isSignUp}
              placeholder=" "
              className="premium-input"
            />
            <label className="premium-label">
              {isSignUp ? 'Địa chỉ Email' : 'Email hoặc Tên đăng nhập'}
            </label>
            <div className="premium-icon">
              <i className="fa-solid fa-envelope"></i>
            </div>
            <span className="premium-input-glow"></span>
          </div>

          {/* Phone (Sign Up Only) */}
          {isSignUp && (
            <div className="premium-input-group">
              <input
                id="register-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={isSignUp}
                placeholder=" "
                className="premium-input"
              />
              <label className="premium-label">Số điện thoại</label>
              <div className="premium-icon">
                <i className="fa-solid fa-phone"></i>
              </div>
              <span className="premium-input-glow"></span>
            </div>
          )}

          {/* Password */}
          <div className="premium-input-group">
            <input
              id={isSignUp ? 'register-password' : 'login-password'}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder=" "
              className="premium-input"
            />
            <label className="premium-label">Mật khẩu</label>
            <div className="premium-icon">
              <i className="fa-solid fa-lock"></i>
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="premium-eye-btn"
              tabIndex="-1"
            >
              <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
            <span className="premium-input-glow"></span>
          </div>

          {/* Confirm Password (Sign Up Only) */}
          {isSignUp && (
            <div className="premium-input-group">
              <input
                id="register-confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={isSignUp}
                placeholder=" "
                className="premium-input"
              />
              <label className="premium-label">Xác nhận mật khẩu</label>
              <div className="premium-icon">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="premium-eye-btn"
                tabIndex="-1"
              >
                <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
              <span className="premium-input-glow"></span>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="premium-btn-submit auth-submit-btn">
            {isSignUp ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center text-xs text-segesta-slate">
          <span>{isSignUp ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}</span>
          <button 
            type="button" 
            onClick={toggleMode}
            className="text-segesta-electric font-bold hover:underline ml-1"
          >
            {isSignUp ? 'Đăng nhập ngay' : 'Đăng ký làm Bệnh nhân'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthUnified;
