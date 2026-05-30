import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ErrorMessage from '../components/common/ErrorMessage';
import Loading from '../components/common/Loading';
import logoImage from '../assets/DoctorBooking-removebg-preview.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Reset body style overrides to avoid conflicts with global theme layout
    document.body.style.background = '';
    document.body.style.overflow = '';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login Submit:', { email, password, rememberMe });
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password);
      
      // Redirect based on role
      if (response.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (response.role === 'DOCTOR') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.');
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Đang đăng nhập..." />;
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-gradient-shift">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-segesta-skyblue/30 blur-[100px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] rounded-full bg-segesta-peach/25 blur-[90px] pointer-events-none -z-10"></div>

      {/* Back to Home Button */}
      <Link to="/" className="absolute top-6 left-6 w-11 h-11 rounded-xl bg-white/60 hover:bg-white/80 border border-segesta-skyblue/50 text-slate-700 flex items-center justify-center transition-all shadow-sm hover:translate-x-[-2px] z-10">
        <i className="fa-solid fa-arrow-left"></i>
      </Link>

      {/* Login Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-lg border border-segesta-skyblue/40 animate-slide-in relative z-10">
        {/* Brand Logo & Header */}
        <div className="text-center mb-8">
          <img src={logoImage} alt="SEGESTA Logo" className="w-16 h-16 object-contain mx-auto mb-3.5" />
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Đăng nhập hệ thống</h2>
          <p className="text-xs text-segesta-electric font-semibold uppercase tracking-wider mt-1">SEGESTA DOCTOR BOOKING</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
            <i className="fa-solid fa-circle-exclamation text-rose-500 text-sm flex-shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full relative z-10" autoComplete="on">
          {/* Email / Username */}
          <div className="flex flex-col gap-2 w-full relative z-10">
            <label htmlFor="linear-login-username" className="text-gray-700 font-medium text-xs sm:text-sm uppercase tracking-wider mb-1">
              EMAIL HOẶC TÊN ĐĂNG NHẬP
            </label>
            <input
              type="text"
              name="username"
              id="linear-login-username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email hoặc tên đăng nhập"
              required
              autoFocus
              autoComplete="username"
              className="w-full p-3 rounded-xl border border-gray-350 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white/80 backdrop-blur-sm text-gray-900 text-sm focus:outline-none transition-all relative z-10 shadow-sm"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2 w-full relative z-10">
            <label htmlFor="linear-login-password" className="text-gray-700 font-medium text-xs sm:text-sm uppercase tracking-wider mb-1">
              MẬT KHẨU
            </label>
            <input
              type="password"
              name="password"
              id="linear-login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              required
              autoComplete="current-password"
              className="w-full p-3 rounded-xl border border-gray-350 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white/80 backdrop-blur-sm text-gray-900 text-sm focus:outline-none transition-all relative z-10 shadow-sm"
            />
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between w-full text-xs sm:text-sm mt-1 relative z-10">
            <label className="flex items-center space-x-2 text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-350 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="select-none font-medium">Ghi nhớ đăng nhập</span>
            </label>
            <Link to="/forgot-password" className="text-segesta-electric font-semibold hover:underline">
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-650 text-white font-bold text-sm transition-all shadow-md active:translate-y-0.5 cursor-pointer flex items-center justify-center relative z-10 border-none"
            disabled={loading}
          >
            <span>Đăng nhập</span>
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 border-t border-segesta-skyblue/30 pt-4 relative z-10">
          <p>
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-segesta-electric font-bold hover:underline ml-1">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
