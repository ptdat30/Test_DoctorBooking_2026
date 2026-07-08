import { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, Star, Search, Activity, Inbox } from 'lucide-react';
import PatientLayout from '../../components/patient/PatientLayout';
import { patientService } from '../../services/patientService';
import Loading from '../../components/common/Loading';
import StatCard from '../../components/common/StatCard';
import SimpleChart from '../../components/common/SimpleChart';
import {
  PageHeader,
  AlertError,
  StatusBadge,
  EmptyState,
  QuickActionLink,
} from '../../components/shell/DashboardPrimitives';

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

  const dateSubtitle = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <PatientLayout>
        <Loading />
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="app-page space-y-8">
        <PageHeader
          badge="Hệ thống hoạt động"
          title="Bảng điều khiển"
          subtitle={`Tổng quan sức khỏe và lịch hẹn · ${dateSubtitle}`}
        />

        {error && <AlertError message={error} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card, index) => (
            <StatCard key={index} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="app-card">
            <div className="app-card-header">
              <h2 className="font-semibold text-neutral-900">Xu hướng hoạt động</h2>
              <p className="text-xs text-neutral-500 mt-0.5">7 ngày qua</p>
            </div>
            <div className="app-card-body">
              <SimpleChart
                data={combined7DaysData}
                type="area"
                series={[
                  { key: 'appointments', name: 'Lịch hẹn', color: '#0ea5e9' },
                  { key: 'treatments', name: 'Điều trị', color: '#10b981' },
                ]}
                height={260}
              />
            </div>
          </div>

          <div className="app-card">
            <div className="app-card-header">
              <h2 className="font-semibold text-neutral-900">Hoạt động gần đây</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Lịch hẹn mới nhất</p>
            </div>
            <div className="divide-y divide-neutral-100">
              {recentActivity.length === 0 ? (
                <EmptyState icon={Inbox} title="Chưa có hoạt động" description="Đặt lịch khám để bắt đầu" />
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-900 truncate">{activity.doctorName}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {new Date(activity.appointmentDate).toLocaleDateString('vi-VN')} · {activity.appointmentTime}
                      </p>
                    </div>
                    <StatusBadge status={activity.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="app-card overflow-hidden">
          <div className="app-card-header">
            <h2 className="font-semibold text-neutral-900">Lịch sử đặt lịch</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Các lịch hẹn gần đây</p>
          </div>
          <div className="overflow-x-auto">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Bác sĩ</th>
                  <th>Ngày</th>
                  <th>Giờ</th>
                  <th>Trạng thái</th>
                  <th>Chuyên khoa</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-neutral-400">
                      Chưa có lịch hẹn
                    </td>
                  </tr>
                ) : (
                  recentActivity.map((appointment, index) => (
                    <tr key={index}>
                      <td className="font-medium text-neutral-900">{appointment.doctorName}</td>
                      <td>
                        {new Date(appointment.appointmentDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="font-mono text-xs">{appointment.appointmentTime}</td>
                      <td>
                        <StatusBadge status={appointment.status} />
                      </td>
                      <td>{appointment.doctorSpecialization || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4">
            Thao tác nhanh
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickActionLink
              to="/patient/booking"
              icon={Calendar}
              title="Đặt lịch khám"
              description="Chọn bác sĩ và thời gian"
              accent="blue"
            />
            <QuickActionLink
              to="/patient/history"
              icon={Clock}
              title="Lịch sử đặt lịch"
              description="Xem các lịch đã đặt"
              accent="green"
            />
            <QuickActionLink
              to="/patient/feedbacks"
              icon={Star}
              title="Đánh giá của tôi"
              description="Xem và chỉnh sửa phản hồi"
              accent="amber"
            />
            <QuickActionLink
              to="/patient/doctors"
              icon={Search}
              title="Tìm bác sĩ"
              description="Duyệt danh sách chuyên gia"
              accent="violet"
            />
            <QuickActionLink
              to="/patient/treatments"
              icon={Activity}
              title="Điều trị của tôi"
              description="Hồ sơ điều trị"
              accent="neutral"
            />
          </div>
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientDashboard;
