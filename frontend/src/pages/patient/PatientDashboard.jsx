import { useEffect, useState, useMemo } from 'react';
import PatientLayout from '../../components/patient/PatientLayout';
import { patientService } from '../../services/patientService';
import Loading from '../../components/common/Loading';
import StatCard from '../../components/common/StatCard';
import SimpleChart from '../../components/common/SimpleChart';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalAppointments: 0,
    totalTreatments: 0,
    pendingAppointments: 0,
    appsTrendValue: 0,
    treatmentsTrendValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [allTreatments, setAllTreatments] = useState([]);

  useEffect(() => {
    loadStats();
    loadRecentActivity();
    
    // Initialize Feather Icons
    if (window.feather) {
      window.feather.replace();
    }
  }, []);

  const loadStats = async () => {
    try {
      setError('');
      const [appointments, treatments] = await Promise.all([
        patientService.getAppointments(),
        patientService.getTreatments(),
      ]);

      setAllAppointments(appointments);
      setAllTreatments(treatments);

      const upcoming = appointments.filter(a => 
        a.status !== 'CANCELLED' && 
        a.status !== 'COMPLETED' &&
        new Date(a.appointmentDate) >= new Date()
      );

      const pending = appointments.filter(a => a.status === 'PENDING');

      // Calculate apps trend: today vs yesterday
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayAppsCount = appointments.filter(a => a.appointmentDate === yesterdayStr).length;
      const todayAppsCount = appointments.filter(a => a.appointmentDate === todayStr).length;
      let appsTrendValue = 0;
      if (yesterdayAppsCount > 0) {
        appsTrendValue = Math.round(((todayAppsCount - yesterdayAppsCount) / yesterdayAppsCount) * 100);
      } else if (todayAppsCount > 0) {
        appsTrendValue = 100;
      }

      // Calculate treatments trend: this month vs last month
      const todayDate = new Date();
      const currentMonthStr = todayDate.toISOString().substring(0, 7);
      const lastMonthDate = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1);
      const lastMonthStr = lastMonthDate.toISOString().substring(0, 7);

      const currentMonthTreatments = treatments.filter(t => t.createdAt && t.createdAt.startsWith(currentMonthStr)).length;
      const lastMonthTreatments = treatments.filter(t => t.createdAt && t.createdAt.startsWith(lastMonthStr)).length;
      let treatmentsTrendValue = 0;
      if (lastMonthTreatments > 0) {
        treatmentsTrendValue = Math.round(((currentMonthTreatments - lastMonthTreatments) / lastMonthTreatments) * 100);
      } else if (currentMonthTreatments > 0) {
        treatmentsTrendValue = 100;
      }

      setStats({
        upcomingAppointments: upcoming.length,
        totalAppointments: appointments.length,
        totalTreatments: treatments.length,
        pendingAppointments: pending.length,
        appsTrendValue,
        treatmentsTrendValue,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Không thể tải thống kê bảng điều khiển');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const appointments = await patientService.getAppointments();
      const recent = appointments
        .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
        .slice(0, 5);
      setRecentActivity(recent);
    } catch (err) {
      console.error('Error loading recent activity:', err);
    }
  };

  // Prepare chart data for last 7 days (same pattern as Doctor Dashboard)
  const combined7DaysData = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const appsCount = allAppointments.filter(a => a.appointmentDate === dateStr).length;
      const treatmentsCount = allTreatments.filter(t => {
        if (!t.createdAt) return false;
        const createdDate = new Date(t.createdAt).toISOString().split('T')[0];
        return createdDate === dateStr;
      }).length;
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      days.push({ label: dayName, appointments: appsCount, treatments: treatmentsCount });
    }
    return days;
  }, [allAppointments, allTreatments]);

  const statCards = useMemo(() => [
    {
      label: 'Lịch hẹn sắp tới',
      value: stats.upcomingAppointments,
      color: '#3b82f6',
      chartType: 'wave',
      trend: { value: 0, isNeutral: true },
      chartData: combined7DaysData.map(d => ({ value: d.appointments, label: d.label })),
      onClick: () => window.location.href = '/patient/booking'
    },
    {
      label: 'Tổng lịch hẹn',
      value: stats.totalAppointments,
      color: '#10b981',
      chartType: 'line',
      trend: { value: Math.abs(stats.appsTrendValue || 0), isPositive: (stats.appsTrendValue || 0) >= 0 },
      chartData: combined7DaysData.map(d => ({ value: d.appointments, label: d.label })),
      onClick: () => window.location.href = '/patient/history'
    },
    {
      label: 'Điều trị của tôi',
      value: stats.totalTreatments,
      color: '#8b5cf6',
      chartType: 'bars',
      trend: { value: Math.abs(stats.treatmentsTrendValue || 0), isPositive: (stats.treatmentsTrendValue || 0) >= 0 },
      chartData: combined7DaysData.map(d => ({ value: d.treatments, label: d.label })),
      onClick: () => window.location.href = '/patient/treatments'
    },
    {
      label: 'Đang chờ',
      value: stats.pendingAppointments,
      color: '#f59e0b',
      chartType: 'line',
      trend: { value: 0, isNeutral: true },
      chartData: combined7DaysData.map(d => ({ value: 0, label: d.label })),
      onClick: () => window.location.href = '/patient/history'
    },
  ], [stats, combined7DaysData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return '#10B981';
      case 'PENDING':
        return '#F59E0B';
      case 'COMPLETED':
        return '#3B82F6';
      case 'CANCELLED':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'PENDING':
        return 'Đang chờ';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <PatientLayout>
        <Loading />
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="futuristic-dashboard text-slate-800">
        {/* Header Section */}
        <div className="dashboard-header" style={{ display: 'block', padding: '36px 40px' }}>
          {/* Injected keyframes for gradient-flow */}
          <style>{`
            @keyframes gradient-flow {
              0%   { background-position: 0% center; }
              100% { background-position: 300% center; }
            }
          `}</style>

          {/* Live indicator badge */}
          <div className="dashboard-header-badge" style={{ marginBottom: '14px' }}>
            <span className="dashboard-header-badge-dot"></span>
            Hệ thống hoạt động
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div className="header-left">
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
                  fontSize: '3rem',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.1
                }}
              >
                Patient Dashboard
              </h1>
              <p className="dashboard-subtitle">
                Phân tích & Thông tin Sức khỏe của bạn
                <span className="dashboard-subtitle-date" style={{ marginLeft: '10px' }}>
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
            <div className="header-right">
              <div className="search-container">
                <i data-feather="search" className="search-icon"></i>
                <input 
                  type="text" 
                  placeholder="Tìm lịch hẹn, bác sĩ..." 
                  className="global-search"
                />
              </div>
              <div className="notification-bell">
                <i data-feather="bell"></i>
                <span className="notification-dot"></span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert-error">
            <i data-feather="alert-circle"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Stats Cards - same as Doctor Dashboard */}
        <div className="stats-grid">
          {statCards.map((card, index) => (
            <StatCard key={index} {...card} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Line Chart Section */}
          <div className="chart-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Xu hướng hoạt động</h3>
                <p className="card-subtitle">7 ngày qua</p>
              </div>
            </div>
            <div className="chart-container" style={{ height: '260px' }}>
              <SimpleChart
                data={combined7DaysData}
                type="area"
                series={[
                  { key: 'appointments', name: 'Lịch hẹn', color: '#3b82f6' },
                  { key: 'treatments', name: 'Điều trị', color: '#8b5cf6' }
                ]}
                height={260}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Hoạt động gần đây</h3>
                <p className="card-subtitle">Lịch hẹn mới nhất</p>
              </div>
            </div>
            <div className="activity-list">
              {recentActivity.length === 0 ? (
                <div className="empty-state">
                  <i data-feather="inbox"></i>
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-indicator" style={{ background: getStatusColor(activity.status) }}></div>
                    <div className="activity-content">
                      <div className="activity-title">{activity.doctorName}</div>
                      <div className="activity-meta">
                        {new Date(activity.appointmentDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })} • {activity.appointmentTime}
                      </div>
                    </div>
                    <div className="activity-status" style={{ color: getStatusColor(activity.status) }}>
                      {getStatusLabel(activity.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Appointment History</h3>
              <p className="card-subtitle">Complete appointment records</p>
            </div>
            <div className="card-actions">
              <button className="icon-btn">
                <i data-feather="download"></i>
              </button>
              <button className="icon-btn">
                <i data-feather="filter"></i>
              </button>
            </div>
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Specialization</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-table">
                      <i data-feather="inbox"></i>
                      <span>No appointments found</span>
                    </td>
                  </tr>
                ) : (
                  recentActivity.map((appointment, index) => (
                    <tr key={index} className="table-row">
                      <td>
                        <div className="table-cell-content">
                          <div className="table-primary">{appointment.doctorName}</div>
                        </div>
                      </td>
                      <td>
                        <div className="table-cell-content">
                          {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="table-cell-content">
                          <span className="monospace">{appointment.appointmentTime}</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-cell-content">
                          <span 
                            className="status-badge" 
                            style={{ 
                              background: `${getStatusColor(appointment.status)}20`,
                              color: getStatusColor(appointment.status),
                              borderColor: getStatusColor(appointment.status)
                            }}
                          >
                            {appointment.status}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="table-cell-content">
                          {appointment.doctorSpecialization || 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="actions-grid">
          <a href="/patient/booking" className="action-card">
            <div className="action-icon" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}>
              <i data-feather="calendar"></i>
            </div>
            <div className="action-content">
              <div className="action-title">Book Appointment</div>
              <div className="action-subtitle">Schedule a new visit</div>
            </div>
            <i data-feather="chevron-right" className="action-arrow"></i>
          </a>
          <a href="/patient/history" className="action-card">
            <div className="action-icon" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
              <i data-feather="clock"></i>
            </div>
            <div className="action-content">
              <div className="action-title">View History</div>
              <div className="action-subtitle">Past appointments</div>
            </div>
            <i data-feather="chevron-right" className="action-arrow"></i>
          </a>
          <a href="/patient/feedbacks" className="action-card">
            <div className="action-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}>
              <i data-feather="star"></i>
            </div>
            <div className="action-content">
              <div className="action-title">Đánh giá của tôi</div>
              <div className="action-subtitle">Xem & chỉnh sửa phản hồi</div>
            </div>
            <i data-feather="chevron-right" className="action-arrow"></i>
          </a>
          <a href="/patient/doctors" className="action-card">
            <div className="action-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
              <i data-feather="search"></i>
            </div>
            <div className="action-content">
              <div className="action-title">Find Doctors</div>
              <div className="action-subtitle">Browse specialists</div>
            </div>
            <i data-feather="chevron-right" className="action-arrow"></i>
          </a>
          <a href="/patient/treatments" className="action-card">
            <div className="action-icon" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
              <i data-feather="activity"></i>
            </div>
            <div className="action-content">
              <div className="action-title">My Treatments</div>
              <div className="action-subtitle">Treatment records</div>
            </div>
            <i data-feather="chevron-right" className="action-arrow"></i>
          </a>
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientDashboard;
