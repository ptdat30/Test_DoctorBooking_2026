import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/common/Loading';
import logoImage from '../assets/DoctorBooking-removebg-preview.png';
import './AuthUnified.css';

const AuthField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required = true,
  autoFocus = false,
  icon: Icon,
  trailing,
}) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" strokeWidth={1.5} />
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoFocus={autoFocus}
        className={`auth-input w-full rounded-xl border border-neutral-200 bg-white py-3 pr-11 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow ${Icon ? 'pl-11' : 'px-4'}`}
      />
      {trailing}
    </div>
  </div>
);

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
    if (user) {
      const role = user.role?.toUpperCase();
      if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
      else if (role === 'DOCTOR') navigate('/doctor/dashboard', { replace: true });
      else navigate('/patient/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const shouldBeSignUp = location.pathname === '/register';
    if (shouldBeSignUp !== isSignUp) setIsSignUp(shouldBeSignUp);
  }, [location.pathname, isSignUp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
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
        await register({
          username: username.trim(),
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phone: phone.trim(),
          role: 'PATIENT',
        });
        navigate('/patient/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Đăng ký thất bại');
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const authResponse = await login(email.trim(), password);
        const role = authResponse?.role?.toUpperCase();
        if (role === 'ADMIN') navigate('/admin/dashboard');
        else if (role === 'DOCTOR') navigate('/doctor/dashboard');
        else navigate('/patient/dashboard');
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

  const passwordToggle = (visible, setVisible) => (
    <button
      type="button"
      onClick={() => setVisible(!visible)}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
      tabIndex={-1}
      aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
    >
      {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="auth-page min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Brand panel — matches home hero */}
      <div className="auth-brand-panel hidden lg:flex relative flex-col justify-end overflow-hidden bg-neutral-950">
        <div className="absolute inset-0 auth-brand-bg" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-neutral-950/40" />
        <div className="relative px-12 xl:px-16 pb-16 pt-24">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-16 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Về trang chủ
          </Link>
          <img src={logoImage} alt="Segesta" className="w-12 h-12 object-contain brightness-0 invert mb-8 rounded-xl" />
          <h1 className="font-display text-5xl xl:text-6xl text-white leading-[1.05] tracking-tight">
            Make.<br />
            Every Day.<br />
            <span className="text-segesta-electric">Healthier.</span>
          </h1>
          <p className="mt-6 text-white/60 max-w-md text-sm leading-relaxed">
            Nền tảng đặt lịch thông minh — kết nối bệnh nhân với bác sĩ tin cậy trong vài giây.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20 relative">
        <Link
          to="/"
          className="lg:hidden inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Về trang chủ
        </Link>

        <div className="w-full max-w-md mx-auto animate-auth-in">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <img src={logoImage} alt="Segesta" className="w-10 h-10 object-contain rounded-lg" />
              <div>
                <p className="font-bold text-neutral-900 tracking-tight">SEGESTA</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Doctor Booking</p>
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-2">
              {isSignUp ? 'Tạo tài khoản' : 'Chào mừng trở lại'}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 leading-snug">
              {isSignUp ? 'Đăng ký tài khoản' : 'Đăng nhập hệ thống'}
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              {isSignUp
                ? 'Đăng ký làm bệnh nhân để đặt lịch khám trực tuyến.'
                : 'Nhập thông tin để truy cập bảng điều khiển của bạn.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <AuthField
                id="register-fullName"
                label="Họ và tên"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={User}
              />
            )}

            {isSignUp && (
              <AuthField
                id="register-username"
                label="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={AtSign}
              />
            )}

            <AuthField
              id={isSignUp ? 'register-email' : 'login-username'}
              label={isSignUp ? 'Địa chỉ email' : 'Email hoặc tên đăng nhập'}
              type={isSignUp ? 'email' : 'text'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus={!isSignUp}
              icon={Mail}
            />

            {isSignUp && (
              <AuthField
                id="register-phone"
                label="Số điện thoại"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={Phone}
              />
            )}

            <AuthField
              id={isSignUp ? 'register-password' : 'login-password'}
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              trailing={passwordToggle(showPassword, setShowPassword)}
            />

            {isSignUp && (
              <AuthField
                id="register-confirmPassword"
                label="Xác nhận mật khẩu"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={ShieldCheck}
                trailing={passwordToggle(showConfirmPassword, setShowConfirmPassword)}
              />
            )}

            <button
              type="submit"
              className="auth-submit-btn w-full mt-6 rounded-xl bg-neutral-900 text-white py-3.5 text-sm font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
            >
              {isSignUp ? 'Đăng ký ngay' : 'Đăng nhập'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-100 text-center text-sm text-neutral-500">
            <span>{isSignUp ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}</span>
            <button
              type="button"
              onClick={toggleMode}
              className="font-semibold text-neutral-900 hover:underline underline-offset-4"
            >
              {isSignUp ? 'Đăng nhập ngay' : 'Đăng ký làm Bệnh nhân'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthUnified;
