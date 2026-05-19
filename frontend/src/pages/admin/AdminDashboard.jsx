import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminService } from '../../services/adminService';
import Loading from '../../components/common/Loading';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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
    { 
      label: 'Tổng bác sĩ', 
      value: stats.totalDoctors, 
      icon: '',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      change: '+12%',
      trend: 'up'
    },
    { 
      label: 'Tổng bệnh nhân', 
      value: stats.totalPatients, 
      icon: '',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      change: '+8%',
      trend: 'up'
    },
    { 
      label: 'Tổng lịch hẹn', 
      value: stats.totalAppointments, 
      icon: '',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      change: '+23%',
      trend: 'up'
    },
    { 
      label: 'Phản hồi chờ xử lý', 
      value: stats.pendingFeedbacks, 
      icon: '',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      change: stats.pendingFeedbacks > 0 ? 'Cần xử lý' : 'Đã xong',
      trend: stats.pendingFeedbacks > 0 ? 'warning' : 'good'
    },
  ], [stats]);

  const quickActions = [
    { label: 'Quản lý bác sĩ', icon: '', path: '/admin/doctors', color: '#667eea' },
    { label: 'Quản lý bệnh nhân', icon: '', path: '/admin/patients', color: '#f5576c' },
    { label: 'Quản lý lịch hẹn', icon: '', path: '/admin/appointments', color: '#00f2fe' },
    { label: 'Quản lý phản hồi', icon: '', path: '/admin/feedbacks', color: '#fee140' },
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">Chào mừng trở lại! Đây là những gì đang diễn ra hôm nay.</p>
          </div>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium text-gray-700"
            onClick={loadStats}
          >
            <span></span>
            Làm mới
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <span className="text-lg"></span>
            <span className="flex-1">{error}</span>
            <button 
              className="text-red-800 hover:text-red-900 font-bold text-xl leading-none"
              onClick={() => setError('')}
            >
              ×
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <div 
              key={index} 
              className="relative overflow-hidden rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-200"
              style={{ background: card.gradient }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-white/80 text-sm font-medium mb-1">{card.label}</p>
                  <p className="text-4xl font-bold mb-2">{card.value}</p>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    {card.trend === 'up' && <span></span>}
                    {card.trend === 'warning' && <span></span>}
                    {card.trend === 'good' && <span></span>}
                    <span>{card.change}</span>
                  </div>
                </div>
                <div className="text-5xl opacity-30">{card.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(action.path)}
              >
                <span className="text-4xl group-hover:scale-110 transition-transform duration-200">{action.icon}</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Peak Hours Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span></span>
              Khung giờ đông khách nhất
            </h2>
            {Object.keys(stats.timeSlotData || {}).length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(stats.timeSlotData || {}).map(([hour, count]) => ({
                    hour: `${hour}:00`,
                    bookings: count
                  })).sort((a, b) => a.hour.localeCompare(b.hour))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookings" fill="#667eea" name="Lịch hẹn" />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-600 mt-4">
                   <strong>Insight:</strong> Sử dụng dữ liệu này để điều phối nhân sự vào giờ cao điểm
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                <span className="text-6xl mb-3"></span>
                <p className="text-lg font-medium">Chưa có dữ liệu lịch hẹn</p>
                <p className="text-sm mt-1">Dữ liệu sẽ xuất hiện khi có lịch hẹn</p>
              </div>
            )}
          </div>

          {/* Specialization Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span></span>
              Phân bố theo chuyên khoa
            </h2>
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
                <p className="text-sm text-gray-600 mt-4">
                   <strong>Insight:</strong> Chuyên khoa phổ biến giúp định hướng tuyển dụng bác sĩ
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                <span className="text-6xl mb-3"></span>
                <p className="text-lg font-medium">Chưa có dữ liệu chuyên khoa</p>
                <p className="text-sm mt-1">Dữ liệu sẽ xuất hiện khi có lịch hẹn</p>
              </div>
            )}
          </div>

          {/* Revenue Trend */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span></span>
              Doanh thu 7 ngày gần đây
            </h2>
            {(stats.revenueByDate || []).some(d => d.count > 0) ? (
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
                <p className="text-sm text-gray-600 mt-4">
                   <strong>Insight:</strong> Theo dõi xu hướng doanh thu để lập kế hoạch kinh doanh
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                <span className="text-6xl mb-3"></span>
                <p className="text-lg font-medium">Chưa có dữ liệu doanh thu</p>
                <p className="text-sm mt-1">Dữ liệu sẽ xuất hiện khi có lịch hẹn trong 7 ngày gần đây</p>
              </div>
            )}
          </div>

          {/* Top Doctors Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span></span>
              Bác sĩ có hiệu suất cao nhất
            </h2>
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
                <p className="text-sm text-gray-600 mt-4">
                   <strong>Insight:</strong> Bác sĩ có tỷ lệ hoàn thành cao đáng được khen thưởng
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                <span className="text-6xl mb-3"></span>
                <p className="text-lg font-medium">Chưa có dữ liệu hoàn thành</p>
                <p className="text-sm mt-1">Dữ liệu sẽ xuất hiện khi có lịch hẹn hoàn thành</p>
              </div>
            )}
          </div>
        </div>

        {/* Appointment Status Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span></span>
            Tổng quan trạng thái lịch hẹn
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.appointmentsByStatus).map(([status, count]) => {
              const configs = {
                PENDING: { icon: '', label: 'Chờ xác nhận', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
                CONFIRMED: { icon: '', label: 'Đã xác nhận', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
                COMPLETED: { icon: '', label: 'Hoàn thành', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
                CANCELLED: { icon: '', label: 'Đã hủy', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
              };
              const config = configs[status] || { icon: '', label: status, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
              const percentage = stats.totalAppointments > 0 ? ((count / stats.totalAppointments) * 100).toFixed(1) : 0;
              
              return (
                <div 
                  key={status} 
                  className="relative overflow-hidden rounded-xl p-5 text-white shadow-lg"
                  style={{ background: config.gradient }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white/80 text-xs font-medium mb-1 uppercase tracking-wide">{config.label}</p>
                      <p className="text-3xl font-bold mb-1">{count}</p>
                      <p className="text-sm font-medium">{percentage}% của tổng</p>
                    </div>
                    <div className="text-4xl opacity-30">{config.icon}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Appointments</h2>
            <button 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
              onClick={() => navigate('/admin/appointments')}
            >
              View All →
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentAppointments.length > 0 ? (
              stats.recentAppointments.map((apt) => {
                const statusColors = {
                  pending: 'bg-yellow-100 text-yellow-800',
                  confirmed: 'bg-blue-100 text-blue-800',
                  completed: 'bg-green-100 text-green-800',
                  cancelled: 'bg-red-100 text-red-800',
                };
                const statusClass = statusColors[apt.status.toLowerCase()] || 'bg-gray-100 text-gray-800';
                
                return (
                  <div key={apt.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">
                      
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {apt.patientName} → {apt.doctorName}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${statusClass}`}>
                      {apt.status}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <span className="text-5xl mb-3"></span>
                <p>Không có lịch hẹn gần đây</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

