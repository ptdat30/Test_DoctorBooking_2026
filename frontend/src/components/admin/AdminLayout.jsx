import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoImage from '../../assets/DoctorBooking.png';
import AnimatedLogoutButton from '../common/AnimatedLogoutButton';
import './AdminLayout.css';
import './AdminDarkOverrides.css';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Initialize Feather Icons
    if (window.feather) {
      window.feather.replace();
    }
  }, [location.pathname, sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Bảng điều khiển', icon: 'layout', route: '/admin/dashboard' },
    { path: '/admin/users', label: 'Người dùng', icon: 'users', route: '/admin/users' },
    { path: '/admin/doctors', label: 'Bác sĩ', icon: 'user', route: '/admin/doctors' },
    { path: '/admin/patients', label: 'Bệnh nhân', icon: 'user-check', route: '/admin/patients' },
    { path: '/admin/appointments', label: 'Lịch hẹn', icon: 'calendar', route: '/admin/appointments' },
    { path: '/admin/feedbacks', label: 'Phản hồi', icon: 'message-circle', route: '/admin/feedbacks' },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="admin-layout">
      {/* Background Video */}
      <video 
        className="admin-background-video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/backgroundfe.mp4" type="video/mp4" />
      </video>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <div className="logo-icon-wrapper">
              <img 
                src={logoImage} 
                alt="Doctor Booking Logo" 
                className="logo-image"
              />
            </div>
            {sidebarOpen && (
              <div className="logo-text-wrapper">
                <span className="logo-brand-name">Quản Trị</span>
              </div>
            )}
          </Link>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.route}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <i data-feather={item.icon}></i>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-avatar">
                {(user?.fullName || user?.username || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <div className="user-name">{user?.fullName || user?.username}</div>
                <div className="user-role">Quản trị viên</div>
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <div className="user-avatar">
                {(user?.fullName || user?.username || 'A').charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          <div className="animated-logout-wrapper">
            <AnimatedLogoutButton 
              onLogout={handleLogout} 
              variant="transparent"
              showText={sidebarOpen}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="main-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i data-feather={sidebarOpen ? 'chevron-left' : 'chevron-right'}></i>
          </button>

          <div className="header-actions">
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="header-search"
            />
            <button className="notification-btn" aria-label="Thông báo">
              <span></span>
              <span className="notification-badge">3</span>
            </button>
          </div>
        </div>

        <div className="main-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
