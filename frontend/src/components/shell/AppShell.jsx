import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import logoImage from '../../assets/DoctorBooking-removebg-preview.png';
import './app-shell.css';
import './app-shell-legacy.css';

const AppShell = ({
  roleLabel,
  menuItems,
  profilePath,
  headerActions,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.fullName || user?.username || 'U')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="app-shell min-h-screen bg-neutral-50 text-neutral-900 flex">
      <aside
        className={`app-shell-sidebar shrink-0 flex flex-col border-r border-neutral-200 bg-white transition-[width] duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="h-16 flex items-center gap-3 px-4 border-b border-neutral-100">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img src={logoImage} alt="Segesta" className="w-9 h-9 object-contain shrink-0 rounded-lg" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-bold text-sm tracking-tight truncate">SEGESTA</p>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 truncate">{roleLabel}</p>
              </div>
            )}
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(path)
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-neutral-100 space-y-2">
          {profilePath && (
            <Link
              to={profilePath}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive(profilePath)
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-50'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-700 shrink-0">
                {initials}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-neutral-400">Hồ sơ</p>
                </div>
              )}
              {!collapsed && <User className="w-4 h-4 text-neutral-400" />}
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-rose-50 hover:text-rose-700 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 flex items-center justify-between gap-4 px-4 sm:px-6 border-b border-neutral-200 bg-white">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors"
            aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          {headerActions ? (
            <div className="flex items-center gap-3 ml-auto">{headerActions}</div>
          ) : (
            <div className="flex-1" />
          )}
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
