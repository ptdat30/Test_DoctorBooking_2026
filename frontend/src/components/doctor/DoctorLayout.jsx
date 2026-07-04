import {
  LayoutDashboard,
  User,
  Calendar,
  Search,
  MessageSquare,
} from 'lucide-react';
import AppShell from '../shell/AppShell';

const menuItems = [
  { path: '/doctor/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
  { path: '/doctor/profile', label: 'Hồ sơ của tôi', icon: User },
  { path: '/doctor/appointments', label: 'Lịch hẹn', icon: Calendar },
  { path: '/doctor/patients', label: 'Tìm bệnh nhân', icon: Search },
  { path: '/doctor/feedbacks', label: 'Phản hồi', icon: MessageSquare },
];

const DoctorLayout = ({ children }) => (
  <AppShell
    roleLabel="Bác sĩ"
    menuItems={menuItems}
    profilePath="/doctor/profile"
  >
    {children}
  </AppShell>
);

export default DoctorLayout;
