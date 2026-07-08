import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminService } from '../../services/adminService';
import Loading from '../../components/common/Loading';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  PageHeader,
  AlertError,
  StatusBadge,
  QuickActionLink,
} from '../../components/shell/DashboardPrimitives';
import { User, UserCheck, Calendar, MessageCircle, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    pendingFeedbacks: 0,
    recentAppointments: [],
    appointmentsByStatus: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setError('');
      const [doctors, patients, appointments, feedbacks] = await Promise.all([
        adminService.getAllDoctors(),
        adminService.searchPatients(),
        adminService.getAllAppointments(),
        adminService.getAllFeedbacks('PENDING'),
      ]);

      console.log(' Dashboard Data:', { 
        totalAppointments: appointments.length,
        sampleAppointment: appointments[0] 
      });

      // Calculate appointment status breakdown
      const statusCount = appointments.reduce((acc, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {});

      // Analyze time slots - handle different time formats
      const timeSlotData = appointments.reduce((acc, apt) => {
        if (!apt.appointmentTime) return acc;
        // Handle both "HH:mm:ss" and "HH:mm" formats
        const timeStr = typeof apt.appointmentTime === 'string' ? apt.appointmentTime : apt.appointmentTime.toString();
        const hour = timeStr.substring(0, 2);
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});

      // Analyze by specialization - split multiple specializations
      const specializationData = appointments.reduce((acc, apt) => {
        if (!apt.doctorSpecialization) return acc;
        // Split by comma in case doctor has multiple specializations
        const specs = apt.doctorSpecialization.split(',').map(s => s.trim());
        specs.forEach(spec => {
          if (spec) {
            acc[spec] = (acc[spec] || 0) + 1;
          }
        });
        return acc;
      }, {});

      // Analyze revenue by date (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const revenueByDate = last7Days.map(date => {
        const dayAppointments = appointments.filter(apt => apt.appointmentDate === date);
        const revenue = dayAppointments.reduce((sum, apt) => {
          const price = apt.price ? (typeof apt.price === 'number' ? apt.price : parseFloat(apt.price)) : 0;
          return sum + price;
        }, 0);
        return { date, revenue, count: dayAppointments.length };
      });

      // Doctor performance - count completed appointments
      const doctorStats = appointments
        .filter(apt => apt.status === 'COMPLETED')
        .reduce((acc, apt) => {
          const doctorName = apt.doctorName || 'Unknown';
          if (!acc[doctorName]) {
            acc[doctorName] = { completed: 0, revenue: 0 };
          }
          acc[doctorName].completed += 1;
          const price = apt.price ? (typeof apt.price === 'number' ? apt.price : parseFloat(apt.price)) : 0;
          acc[doctorName].revenue += price;
          return acc;
        }, {});

      console.log(' Processed Data:', {
        timeSlotData,
        specializationData,
        revenueByDate,
        doctorStats: Object.keys(doctorStats).length
      });

      setStats({
        totalDoctors: doctors.length,
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        pendingFeedbacks: feedbacks.length,
        recentAppointments: appointments.slice(0, 5),
        appointmentsByStatus: statusCount,
        timeSlotData,
        specializationData,
        revenueByDate,
        doctorStats,
        allAppointments: appointments,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Không thể tải thống kê bảng điều khiển');
    } finally {
      setLoading(false);
    }
  };

  const statCards = useMemo(() => [
    { label: 'Tổng bác sĩ', value: stats.totalDoctors, color: '#0ea5e9' },
    { label: 'Tổng bệnh nhân', value: stats.totalPatients, color: '#10b981' },
    { label: 'Tổng lịch hẹn', value: stats.totalAppointments, color: '#6366f1' },
    { label: 'Phản hồi chờ xử lý', value: stats.pendingFeedbacks, color: '#f59e0b' },
  ], [stats]);

  const quickActions = [
    { label: 'Quản lý bác sĩ', icon: User, path: '/admin/doctors', accent: 'blue' },
    { label: 'Quản lý bệnh nhân', icon: UserCheck, path: '/admin/patients', accent: 'green' },
    { label: 'Quản lý lịch hẹn', icon: Calendar, path: '/admin/appointments', accent: 'violet' },
    { label: 'Quản lý phản hồi', icon: MessageCircle, path: '/admin/feedbacks', accent: 'amber' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="app-page space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader
            badge="Quản trị hệ thống"
            title="Tổng quan"
            subtitle="Chào mừng trở lại — số liệu và hoạt động mới nhất"
          />
          <button
            type="button"
            onClick={loadStats}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>

        {error && <AlertError message={error} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card, index) => (
            <div key={index} className="app-card p-5 sm:p-6 relative overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ backgroundColor: card.color }}
              />
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 pl-2">
                {card.label}
              </p>
              <p className="text-3xl sm:text-4xl font-bold text-neutral-900 mt-2 pl-2">{card.value}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4">
            Thao tác nhanh
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <QuickActionLink
                key={action.path}
                to={action.path}
                icon={action.icon}
                title={action.label}
                description="Mở trang quản lý"
                accent={action.accent}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="app-card">
            <div className="app-card-header">
              <h2 className="font-semibold text-neutral-900">Khung giờ đông khách</h2>
            </div>
            <div className="app-card-body">
              {Object.keys(stats.timeSlotData || {}).length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(stats.timeSlotData || {}).map(([hour, count]) => ({
                      hour: `${hour}:00`,
                      bookings: count,
                    })).sort((a, b) => a.hour.localeCompare(b.hour))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="bookings" fill="#0ea5e9" name="Lịch hẹn" />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-sm text-neutral-500 mt-4">
                    Điều phối nhân sự theo giờ cao điểm.
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-neutral-400">
                  <p className="text-sm">Chưa có dữ liệu lịch hẹn</p>
                </div>
              )}
            </div>
          </div>

          <div className="app-card">
            <div className="app-card-header">
              <h2 className="font-semibold text-neutral-900">Phân bố chuyên khoa</h2>
            </div>
            <div className="app-card-body">
              {Object.keys(stats.specializationData || {}).length > 0 ? (
                <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.specializationData || {}).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(stats.specializationData || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#667eea', '#f5576c', '#4facfe', '#fa709a', '#fee140', '#43e97b'][index % 6]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-sm text-neutral-500 mt-4">
                  Chuyên khoa phổ biến hỗ trợ định hướng tuyển dụng.
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-neutral-400">
                <p className="text-sm">Chưa có dữ liệu chuyên khoa</p>
              </div>
            )}
            </div>
          </div>

          <div className="app-card">
            <div className="app-card-header">
              <h2 className="font-semibold text-neutral-900">Doanh thu 7 ngày</h2>
            </div>
            <div className="app-card-body">
            {(stats.revenueByDate || []).some((d) => d.count > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.revenueByDate || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Doanh thu (VNĐ)') return [`${value.toLocaleString('vi-VN')} VNĐ`, 'Doanh thu'];
                        if (name === 'Số lịch hẹn') return [value, 'Số lịch hẹn'];
                        return [value, name];
                      }}
                      labelFormatter={(date) => new Date(date).toLocaleDateString('vi-VN')}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} name="Doanh thu (VNĐ)" />
                    <Line yAxisId="right" type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Số lịch hẹn" />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-sm text-neutral-500 mt-4">
                  Theo dõi xu hướng doanh thu theo ngày.
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-neutral-400">
                <p className="text-sm">Chưa có dữ liệu doanh thu</p>
              </div>
            )}
            </div>
          </div>

          <div className="app-card">
            <div className="app-card-header">
              <h2 className="font-semibold text-neutral-900">Bác sĩ hiệu suất cao</h2>
            </div>
            <div className="app-card-body">
            {Object.keys(stats.doctorStats || {}).length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={Object.entries(stats.doctorStats || {})
                      .map(([name, data]) => ({ name, completed: data.completed, revenue: data.revenue }))
                      .sort((a, b) => b.completed - a.completed)
                      .slice(0, 5)}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis xAxisId="left" type="number" orientation="bottom" domain={[0, 100]} style={{ fontSize: '14px' }} />
                    <XAxis xAxisId="right" type="number" orientation="top" stroke="#f59e0b" domain={[0, 10000000]} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} style={{ fontSize: '14px' }} />
                    <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '13px' }} />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'Doanh thu (VNĐ)') return [`${value.toLocaleString('vi-VN')} VNĐ`, 'Doanh thu'];
                      if (name === 'Lịch hoàn thành') return [value, 'Lịch hoàn thành'];
                      return [value, name];
                    }} />
                    <Legend />
                    <Bar xAxisId="left" dataKey="completed" fill="#16a34a" name="Lịch hoàn thành" />
                    <Bar xAxisId="right" dataKey="revenue" fill="#f59e0b" name="Doanh thu (VNĐ)" />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-sm text-neutral-500 mt-4">
                  Top 5 bác sĩ theo lịch hoàn thành và doanh thu.
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-neutral-400">
                <p className="text-sm">Chưa có dữ liệu hoàn thành</p>
              </div>
            )}
            </div>
          </div>
        </div>

        <div className="app-card">
          <div className="app-card-header">
            <h2 className="font-semibold text-neutral-900">Trạng thái lịch hẹn</h2>
          </div>
          <div className="app-card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.appointmentsByStatus).map(([status, count]) => {
              const percentage = stats.totalAppointments > 0
                ? ((count / stats.totalAppointments) * 100).toFixed(1)
                : 0;

              return (
                <div key={status} className="rounded-xl border border-neutral-200 p-4 bg-neutral-50">
                  <StatusBadge status={status} />
                  <p className="text-2xl font-bold text-neutral-900 mt-3">{count}</p>
                  <p className="text-xs text-neutral-500 mt-1">{percentage}% tổng</p>
                </div>
              );
            })}
          </div>
          </div>
        </div>

        <div className="app-card overflow-hidden">
          <div className="app-card-header flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Lịch hẹn gần đây</h2>
            <button
              type="button"
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900"
              onClick={() => navigate('/admin/appointments')}
            >
              Xem tất cả →
            </button>
          </div>
          <div className="divide-y divide-neutral-100">
            {stats.recentAppointments.length > 0 ? (
              stats.recentAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-900 truncate">
                      {apt.patientName} → {apt.doctorName}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {new Date(apt.appointmentDate).toLocaleDateString('vi-VN')} · {apt.appointmentTime}
                    </p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-neutral-400 text-sm">
                Không có lịch hẹn gần đây
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

