import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ErrorMessage from '../../components/common/ErrorMessage';
import Loading from '../../components/common/Loading';
import videoBg from '../../assets/625148e1956a6a29189fca52d43d74f576029421.mp4';
import '../Auth.css';
import ShellIcon from '../../components/shell/ShellIcon';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Get role from URL or default to patient
  const role = location.pathname.includes('/admin') ? 'admin' 
    : location.pathname.includes('/doctor') ? 'doctor' 
    : 'patient';
  
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.feather) {
      window.feather.replace();
    }
  }, []);

  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authResponse = await login(loginData.username, loginData.password);
      
      const logPersistent = (msg, data) => {
        console.log(msg, data || '');
        if (!window.debugLogs) window.debugLogs = [];
        window.debugLogs.push({ timestamp: new Date().toISOString(), message: msg, data });
      };
      
      logPersistent(' Login successful - Response:', authResponse);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const userRole = authResponse?.role || JSON.parse(localStorage.getItem('user') || '{}')?.role;
      logPersistent('🔍 Role determined:', userRole);
      
      if (!userRole) {
        logPersistent(' No role found!', { authResponse });
        setError('Login failed: Role information missing');
        return;
      }
      
      // Verify role matches
      const expectedRole = role.toUpperCase();
      if (userRole !== expectedRole && userRole !== 'ADMIN') {
        setError(`Bạn không có quyền đăng nhập với tư cách ${role === 'admin' ? 'Admin' : role === 'doctor' ? 'Bác sĩ' : 'Bệnh nhân'}`);
        return;
      }
      
      // Redirect based on role
      let redirectPath = '/patient/dashboard';
      if (userRole === 'ADMIN') {
        redirectPath = '/admin/dashboard';
      } else if (userRole === 'DOCTOR') {
        redirectPath = '/doctor/dashboard';
      }
      
      logPersistent('🚀 Redirecting to:', redirectPath);
      navigate(redirectPath);
    } catch (err) {
      console.error(' Login error:', err);
      setError(err.response?.data?.message || err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Đang đăng nhập..." />;
  }

  const roleInfo = {
    admin: {
      title: 'Đăng nhập Admin',
      subtitle: 'Quản trị hệ thống',
      icon: 'shield',
      color: '#ef4444'
    },
    doctor: {
      title: 'Đăng nhập Bác sĩ',
      subtitle: 'Quản lý lịch khám',
      icon: 'user-check',
      color: '#16a34a'
    },
    patient: {
      title: 'Đăng nhập Bệnh nhân',
      subtitle: 'Đặt lịch khám bệnh',
      icon: 'heart',
      color: '#6366f1'
    }
  };

  const info = roleInfo[role];

  return (
    <div className="auth-container">
      {/* Video Background */}
      <div className="auth-video-wrapper">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="auth-video"
        >
          <source src={videoBg} type="video/mp4" />
        </video>
        <div className="auth-video-overlay"></div>
      </div>

      {/* Auth Content */}
      <div className="auth-content">
        {/* Back to Home Button */}
        <Link to="/" className="auth-back-home">
          <ion-icon name="arrow-back-circle-outline"></ion-icon>
        </Link>
        
        <div className="auth-card">
          {/* Role Header */}
          <div className="auth-role-header" style={{ '--role-color': info.color }}>
            <div className="role-icon-wrapper">
              <ShellIcon name={info.icon} className="w-8 h-8" />
            </div>
            <h2 className="auth-title">{info.title}</h2>
            <p className="auth-subtitle">{info.subtitle}</p>
          </div>

          {/* Error Message */}
          <ErrorMessage message={error} onClose={() => setError('')} />

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form" autoComplete="on">
            <div className="form-group">
              <label htmlFor="auth-login-username">Tên đăng nhập hoặc Email</label>
              <input
                id="auth-login-username"
                type="text"
                name="username"
                value={loginData.username}
                onChange={handleChange}
                required
                autoComplete="username"
                placeholder="Nhập tên đăng nhập hoặc email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="auth-login-password">Mật khẩu</label>
              <input
                id="auth-login-password"
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading} style={{ background: `linear-gradient(135deg, ${info.color} 0%, ${info.color}dd 100%)` }}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="auth-footer-links">
            {role === 'patient' && (
              <p>
                Chưa có tài khoản? <Link to="/register/patient">Đăng ký ngay</Link>
              </p>
            )}
            <p>
              <Link to="/">Về trang chủ</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

