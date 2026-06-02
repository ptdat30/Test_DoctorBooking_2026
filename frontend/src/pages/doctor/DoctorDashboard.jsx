import { useEffect, useState, useMemo } from 'react';
import DoctorLayout from '../../components/doctor/DoctorLayout';
import { doctorService } from '../../services/doctorService';
import Loading from '../../components/common/Loading';
import StatCard from '../../components/common/StatCard';
import QuickActionCard from '../../components/common/QuickActionCard';
import SimpleChart from '../../components/common/SimpleChart';
import { formatDate } from '../../utils/formatDate';
import { formatTime } from '../../utils/formatTime';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingAppointments: 0,
    totalTreatments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    appsTrendValue: 0,
    treatmentsTrendValue: 0,
  });
  const [appointments, setAppointments] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setError('');
      const today = new Date().toISOString().split('T')[0];
      const [todayApps, allApps, allTreatments] = await Promise.all([
        doctorService.getAppointments(today),
        doctorService.getAppointments(),
        doctorService.getTreatments(),
      ]);

      const pending = allApps.filter(a => a.status === 'PENDING');
      const completed = allApps.filter(a => a.status === 'COMPLETED');
      const cancelled = allApps.filter(a => a.status === 'CANCELLED');
      const upcoming = allApps
        .filter(a =>
          a.status !== 'CANCELLED' &&
          a.status !== 'COMPLETED' &&
          new Date(a.appointmentDate + 'T' + a.appointmentTime) >= new Date()
        )
        .sort((a, b) => {
          const dateA = new Date(a.appointmentDate + 'T' + a.appointmentTime);
          const dateB = new Date(b.appointmentDate + 'T' + b.appointmentTime);
          return dateA - dateB;
        })
        .slice(0, 5);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayAppsCount = allApps.filter(a => a.appointmentDate === yesterdayStr).length;
      const todayAppsCount = todayApps.length;
      
      let appsTrendValue = 0;
      if (yesterdayAppsCount > 0) {
          appsTrendValue = Math.round(((todayAppsCount - yesterdayAppsCount) / yesterdayAppsCount) * 100);
      } else if (todayAppsCount > 0) {
          appsTrendValue = 100;
      }

      const todayDate = new Date();
      const currentMonthStr = todayDate.toISOString().substring(0, 7);
      const lastMonthDate = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1);
      const lastMonthStr = lastMonthDate.toISOString().substring(0, 7);

      const currentMonthTreatments = allTreatments.filter(t => t.createdAt && t.createdAt.startsWith(currentMonthStr)).length;
      const lastMonthTreatments = allTreatments.filter(t => t.createdAt && t.createdAt.startsWith(lastMonthStr)).length;
      
      let treatmentsTrendValue = 0;
      if (lastMonthTreatments > 0) {
          treatmentsTrendValue = Math.round(((currentMonthTreatments - lastMonthTreatments) / lastMonthTreatments) * 100);
      } else if (currentMonthTreatments > 0) {
          treatmentsTrendValue = 100;
      }

      setStats({
        todayAppointments: todayAppsCount,
        pendingAppointments: pending.length,
        totalTreatments: allTreatments.length,
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
        cancelledAppointments: cancelled.length,
        appsTrendValue,
        treatmentsTrendValue
      });
      setAppointments(allApps);
      setTreatments(allTreatments);
      setUpcomingAppointments(upcoming);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Không thể tải thống kê bảng điều khiển');
    } finally {
      setLoading(false);
    }
  };

  // Prepare combined chart data for appointments and treatments (last 7 days)
  const combined7DaysData = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const appsCount = appointments.filter(a => a.appointmentDate === dateStr).length;
      const treatmentsCount = treatments.filter(t => {
        if (!t.createdAt) return false;
        const createdDate = new Date(t.createdAt).toISOString().split('T')[0];
        return createdDate === dateStr;
      }).length;
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      days.push({ label: dayName, appointments: appsCount, treatments: treatmentsCount });
    }
    return days;
  }, [appointments, treatments]);

  // Prepare monthly stats
  const monthlyStats = useMemo(() => {
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = date.toISOString().substring(0, 7);
      const appsCount = appointments.filter(a => a.appointmentDate?.startsWith(monthStr)).length;
      const treatmentsCount = treatments.filter(t => {
        if (!t.createdAt) return false;
        return t.createdAt.startsWith(monthStr);
      }).length;
      const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
      months.push({
        label: `${monthName} '${date.getFullYear().toString().slice(-2)}`,
        appointments: appsCount,
        treatments: treatmentsCount
      });
    }
    return months;
  }, [appointments, treatments]);

  const statCards = useMemo(() => [
    {
      label: "Today's Appointments",
      value: stats.todayAppointments,
      color: '#3b82f6',
      chartType: 'wave',
      trend: { value: Math.abs(stats.appsTrendValue), isPositive: stats.appsTrendValue >= 0 },
      chartData: combined7DaysData.map(d => ({ value: d.appointments, label: d.label })),
      onClick: () => window.location.href = '/doctor/appointments'
    },
    {
      label: 'Pending Appointments',
      value: stats.pendingAppointments,
      color: '#f59e0b',
      chartType: 'bars',
      trend: { value: 0, isNeutral: true },
      chartData: combined7DaysData.map(d => ({ value: 0, label: d.label })),
      onClick: () => window.location.href = '/doctor/appointments?status=PENDING'
    },
    {
      label: 'Total Treatments',
      value: stats.totalTreatments,
      color: '#10b981',
      chartType: 'line',
      trend: { value: Math.abs(stats.treatmentsTrendValue), isPositive: stats.treatmentsTrendValue >= 0 },
      chartData: combined7DaysData.map(d => ({ value: d.treatments, label: d.label })),
      onClick: () => window.location.href = '/doctor/treatments'
    },
    {
      label: 'Completed',
      value: stats.completedAppointments,
      color: '#8b5cf6',
      chartType: 'dots',
      trend: { value: 0, isNeutral: true },
      chartData: combined7DaysData.map(d => ({ value: 0, label: d.label })),
      onClick: () => window.location.href = '/doctor/appointments?status=COMPLETED'
    },
  ], [stats, combined7DaysData]);

  if (loading) {
    return (
      <DoctorLayout>
        <div className="doctor-dashboard p-6 animate-pulse">
          <div className="h-8 bg-slate-200/50 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-slate-200/50 rounded w-1/3 mb-8"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-36 bg-slate-200/50 rounded-2xl"></div>
            ))}
          </div>
          
          <div className="h-[300px] bg-slate-200/50 rounded-2xl mb-8"></div>
          <div className="h-[350px] bg-slate-200/50 rounded-2xl"></div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="doctor-dashboard text-slate-800">
        <div className="dashboard-header">
          {/* Injected keyframes for gradient-flow */}
          <style>{`
            @keyframes gradient-flow {
              0%   { background-position: 0% center; }
              100% { background-position: 300% center; }
            }
          `}</style>

          {/* Live indicator badge */}
          <div className="dashboard-header-badge">
            <span className="dashboard-header-badge-dot"></span>
            Hệ thống hoạt động
          </div>

          <h1
            className="dashboard-title"
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #10b981, #3b82f6, #8b5cf6)',
              backgroundSize: '300% auto',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              animation: 'gradient-flow 5s linear infinite',
            }}
          >
            Doctor Dashboard
          </h1>

          <p className="dashboard-subtitle">
            Tổng quan hoạt động và thống kê của bạn
            <span className="dashboard-subtitle-date">
              📅&nbsp;
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </p>
        </div>

        {error && (
          <div className="error-message bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-center justify-between mb-8 shadow-sm">
            <div className="flex items-center gap-3">
              <i data-feather="alert-circle"></i>
              <span className="font-medium">{error}</span>
            </div>
            <button 
              onClick={loadStats} 
              className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          {statCards.map((card, index) => (
            <StatCard key={index} {...card} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="charts-section" style={{ gridTemplateColumns: '1fr' }}>
          <div className="chart-card glass-card">
            <div className="chart-header">
              <h3 className="chart-title">Activity Overview (Last 7 Days)</h3>
              <span className="chart-subtitle">Appointments & Treatments</span>
            </div>
            <SimpleChart
              data={combined7DaysData}
              type="area"
              series={[
                { key: 'appointments', name: 'Appointments', color: '#3b82f6' },
                { key: 'treatments', name: 'Treatments', color: '#10b981' }
              ]}
              height={260}
            />
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="chart-card glass-card monthly-stats-card">
          <h3 className="section-title">Last 6 Months Statistics</h3>
          <div className="monthly-stats-content">
            <div className="monthly-chart" style={{ flex: 1, minWidth: '100%' }}>
              <SimpleChart
                data={monthlyStats}
                type="stacked-bar"
                series={[
                  { key: 'appointments', name: 'Appointments', color: '#8b5cf6' },
                  { key: 'treatments', name: 'Treatments', color: '#f59e0b' }
                ]}
                height={280}
              />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Upcoming Appointments */}
          <div className="chart-card glass-card upcoming-appointments-card">
            <div className="card-header">
              <h3 className="card-title">Upcoming Appointments</h3>
              <a href="/doctor/appointments" className="card-link">View all →</a>
            </div>
            <div className="appointments-grid">
              {upcomingAppointments.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <i data-feather="calendar" className="w-8 h-8 text-slate-300"></i>
                  </div>
                  <h4 className="text-lg font-medium text-slate-600 mb-1">Chưa có dữ liệu</h4>
                  <p className="text-sm">Hiện tại không có lịch hẹn nào sắp tới.</p>
                </div>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="appointment-card">
                    <div className="appointment-card-header">
                      <div className="appointment-date-badge">
                        <span className="appointment-day">{new Date(appointment.appointmentDate).getDate()}</span>
                        <span className="appointment-month">
                          {['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'][new Date(appointment.appointmentDate).getMonth()]}
                        </span>
                      </div>
                      <div className={`appointment-status-badge status-${appointment.status.toLowerCase()}`}>
                        {appointment.status === 'PENDING' ? 'Pending' :
                          appointment.status === 'CONFIRMED' ? 'Confirmed' : appointment.status}
                      </div>
                    </div>
                    <div className="appointment-card-body">
                      <div className="appointment-time-display">
                        <i data-feather="clock" style={{ width: '16px', height: '16px', marginRight: '8px' }}></i>
                        <span className="time-text">{formatTime(appointment.appointmentTime)}</span>
                      </div>
                      <div className="appointment-patient">
                        <div className="patient-name">{appointment.patientName}</div>
                        {appointment.patientPhone && (
                          <div className="patient-phone">{appointment.patientPhone}</div>
                        )}
                      </div>
                    </div>
                    <div className="appointment-card-footer">
                      <button
                        className="view-appointment-btn"
                        onClick={() => window.location.href = `/doctor/appointments`}
                      >
                        Xem chi tiết →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="chart-card glass-card quick-actions-card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div className="quick-actions-grid">
              <QuickActionCard
                to="/doctor/appointments"
                icon="plus-circle"
                title="New Appointment"
                description="Schedule a new patient visit"
                color="#3b82f6"
              />
              <QuickActionCard
                to="/messages"
                icon="message-square"
                title="Send Message"
                description="Chat with patients or staff"
                color="#10b981"
              />
              <QuickActionCard
                to="/doctor/patients"
                icon="file-text"
                title="Medical Records"
                description="View and update patient records"
                color="#8b5cf6"
              />
              <QuickActionCard
                to="/doctor/profile"
                icon="settings"
                title="Settings"
                description="Manage your profile and hours"
                color="#f59e0b"
              />
            </div>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
