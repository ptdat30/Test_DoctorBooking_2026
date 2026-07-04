import {
  LayoutDashboard,
  Calendar,
  Clock,
  Star,
  Search,
  Users,
  CreditCard,
  MessageCircle,
} from 'lucide-react';
import AppShell from '../shell/AppShell';
import ShellNotifications from '../shell/ShellNotifications';

const menuItems = [
  { path: '/patient/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
  { path: '/patient/booking', label: 'Đặt lịch mới', icon: Calendar },
  { path: '/patient/history', label: 'Lịch sử đặt lịch', icon: Clock },
  { path: '/patient/feedbacks', label: 'Đánh giá của tôi', icon: Star },
  { path: '/patient/doctors', label: 'Tìm bác sĩ', icon: Search },
  { path: '/patient/family', label: 'Hồ sơ gia đình', icon: Users },
  { path: '/patient/wallet', label: 'Ví sức khỏe', icon: CreditCard },
  { path: '/patient/healthlyai', label: 'Trợ lý AI', icon: MessageCircle },
];

const PatientLayout = ({ children }) => (
  <AppShell
    roleLabel="Bệnh nhân"
    menuItems={menuItems}
    profilePath="/patient/profile"
    headerActions={<ShellNotifications />}
  >
    {children}
  </AppShell>
);

export default PatientLayout;
