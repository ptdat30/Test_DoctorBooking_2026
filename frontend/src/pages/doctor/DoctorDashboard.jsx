import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, PlusCircle, FileText, MessageSquare, Settings } from 'lucide-react';
import DoctorLayout from '../../components/doctor/DoctorLayout';
import { doctorService } from '../../services/doctorService';
import Loading from '../../components/common/Loading';
import StatCard from '../../components/common/StatCard';
import SimpleChart from '../../components/common/SimpleChart';
import { formatTime } from '../../utils/formatTime';
import {
  PageHeader,
  AlertError,
  StatusBadge,
  EmptyState,
  QuickActionLink,
} from '../../components/shell/DashboardPrimitives';

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
      label: 'Lịch hôm nay',
      value: stats.todayAppointments,
      color: '#0ea5e9',
      chartType: 'wave',
      trend: { value: Math.abs(stats.appsTrendValue), isPositive: stats.appsTrendValue >= 0 },
      chartData: combined7DaysData.map((d) => ({ value: d.appointments, label: d.label })),
      onClick: () => { window.location.href = '/doctor/appointments'; },
    },
    {
      label: 'Đang chờ',
      value: stats.pendingAppointments,
      color: '#f59e0b',
      chartType: 'bars',
      trend: { value: 0, isNeutral: true },
      chartData: combined7DaysData.map((d) => ({ value: 0, label: d.label })),
      onClick: () => { window.location.href = '/doctor/appointments?status=PENDING'; },
    },
    {
      label: 'Tổng điều trị',
      value: stats.totalTreatments,
      color: '#10b981',
      chartType: 'line',
      trend: { value: Math.abs(stats.treatmentsTrendValue), isPositive: stats.treatmentsTrendValue >= 0 },
      chartData: combined7DaysData.map((d) => ({ value: d.treatments, label: d.label })),
      onClick: () => { window.location.href = '/doctor/treatments'; },
    },
    {
      label: 'Hoàn thành',
      value: stats.completedAppointments,
      color: '#6366f1',
      chartType: 'line',
      trend: { value: 0, isNeutral: true },
      chartData: combined7DaysData.map((d) => ({ value: 0, label: d.label })),
      onClick: () => { window.location.href = '/doctor/appointments?status=COMPLETED'; },
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
      <DoctorLayout>
        <Loading />
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="app-page space-y-8">
        <PageHeader
          badge="Hệ thống hoạt động"
          title="Bảng điều khiển bác sĩ"
          subtitle={`Tổng quan hoạt động · ${dateSubtitle}`}
        />

        {error && (
          <div className="flex items-center justify-between gap-4">
            <AlertError message={error} />
            <button
              type="button"
              onClick={loadStats}
              className="shrink-0 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
            >
              Thử lại
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card, index) => (
            <StatCard key={index} {...card} />
          ))}
        </div>

        <div className="app-card">
          <div className="app-card-header">
            <h2 className="font-semibold text-neutral-900">Hoạt động 7 ngày qua</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Lịch hẹn và điều trị</p>
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
            <h2 className="font-semibold text-neutral-900">Thống kê 6 tháng</h2>
          </div>
          <div className="app-card-body">
            <SimpleChart
              data={monthlyStats}
              type="stacked-bar"
              series={[
                { key: 'appointments', name: 'Lịch hẹn', color: '#6366f1' },
                { key: 'treatments', name: 'Điều trị', color: '#f59e0b' },
              ]}
              height={280}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="app-card lg:col-span-2">
            <div className="app-card-header flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-neutral-900">Lịch sắp tới</h2>
                <p className="text-xs text-neutral-500 mt-0.5">5 lịch hẹn gần nhất</p>
              </div>
              <Link to="/doctor/appointments" className="text-xs font-semibold text-neutral-600 hover:text-neutral-900">
                Xem tất cả →
              </Link>
            </div>
            <div className="divide-y divide-neutral-100">
              {upcomingAppointments.length === 0 ? (
                <EmptyState icon={Calendar} title="Chưa có lịch sắp tới" />
              ) : (
                upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-bold leading-none text-neutral-900">
                        {new Date(appointment.appointmentDate).getDate()}
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-500">
                        T{new Date(appointment.appointmentDate).getMonth() + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-900">{appointment.patientName}</p>
                      <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(appointment.appointmentTime)}
                        {appointment.patientPhone && ` · ${appointment.patientPhone}`}
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 px-1">
              Thao tác nhanh
            </h2>
            <QuickActionLink
              to="/doctor/appointments"
              icon={PlusCircle}
              title="Lịch hẹn"
              description="Quản lý lịch khám"
              accent="blue"
            />
            <QuickActionLink
              to="/doctor/patients"
              icon={FileText}
              title="Bệnh nhân"
              description="Tìm và xem hồ sơ"
              accent="violet"
            />
            <QuickActionLink
              to="/doctor/feedbacks"
              icon={MessageSquare}
              title="Phản hồi"
              description="Đánh giá từ bệnh nhân"
              accent="green"
            />
            <QuickActionLink
              to="/doctor/profile"
              icon={Settings}
              title="Cài đặt hồ sơ"
              description="Thông tin và lịch làm việc"
              accent="amber"
            />
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
