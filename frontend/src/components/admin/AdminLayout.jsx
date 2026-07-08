import {
  LayoutDashboard,
  Users,
  User,
  UserCheck,
  Calendar,
  MessageCircle,
} from 'lucide-react';
import AppShell from '../shell/AppShell';

const menuItems = [
  { path: '/admin/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Người dùng', icon: Users },
  { path: '/admin/doctors', label: 'Bác sĩ', icon: User },
  { path: '/admin/patients', label: 'Bệnh nhân', icon: UserCheck },
  { path: '/admin/appointments', label: 'Lịch hẹn', icon: Calendar },
  { path: '/admin/feedbacks', label: 'Phản hồi', icon: MessageCircle },
];

const AdminLayout = ({ children }) => (
  <AppShell roleLabel="Quản trị" menuItems={menuItems}>
    {children}
  </AppShell>
);

export default AdminLayout;
