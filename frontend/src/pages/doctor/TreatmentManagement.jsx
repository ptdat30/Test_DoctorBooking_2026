import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import DoctorLayout from '../../components/doctor/DoctorLayout';
import { doctorService } from '../../services/doctorService';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import TreatmentForm from '../../components/doctor/TreatmentForm';
import { formatDate } from '../../utils/formatDate';
import {
  AppPage,
  PageHeader,
  EmptyState,
  BtnPrimary,
  BtnSecondary,
  BtnDanger,
} from '../../components/shell/DashboardPrimitives';

const TreatmentManagement = () => {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);

  useEffect(() => {
    loadTreatments();
  }, []);

  const loadTreatments = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getTreatments();
      setTreatments(data);
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách điều trị');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTreatment(null);
    setShowForm(true);
  };

  const handleEdit = (treatment) => {
    setEditingTreatment(treatment);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa hồ sơ điều trị này?')) return;
    try {
      await doctorService.deleteTreatment(id);
      loadTreatments();
    } catch {
      setError('Không thể xóa hồ sơ điều trị');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTreatment(null);
    loadTreatments();
  };

  if (loading && treatments.length === 0) {
    return (
      <DoctorLayout>
        <Loading />
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <AppPage>
        <PageHeader
          title="Quản lý điều trị"
          subtitle={`${treatments.length} hồ sơ`}
          actions={
            <BtnPrimary onClick={handleCreate}>
              <Plus className="w-4 h-4" />
              Thêm điều trị
            </BtnPrimary>
          }
        />

        <ErrorMessage message={error} onClose={() => setError('')} />

        {showForm && (
          <TreatmentForm
            treatment={editingTreatment}
            onClose={handleFormClose}
            onSuccess={handleFormClose}
          />
        )}

        <div className="app-card overflow-hidden">
          {treatments.length === 0 ? (
            <EmptyState title="Chưa có hồ sơ điều trị" description="Thêm hồ sơ mới cho bệnh nhân" />
          ) : (
            <div className="overflow-x-auto">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Bệnh nhân</th>
                    <th>Chẩn đoán</th>
                    <th>Ngày</th>
                    <th>Tái khám</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {treatments.map((t) => (
                    <tr key={t.id}>
                      <td className="font-medium text-neutral-900">{t.patientName}</td>
                      <td className="max-w-xs truncate">{t.diagnosis || '—'}</td>
                      <td>{formatDate(t.createdAt)}</td>
                      <td>{t.followUpDate ? formatDate(t.followUpDate) : '—'}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <BtnSecondary className="!py-1.5 !px-3 !text-xs" onClick={() => handleEdit(t)}>
                            Sửa
                          </BtnSecondary>
                          <BtnDanger className="!py-1.5 !px-3 !text-xs" onClick={() => handleDelete(t.id)}>
                            Xóa
                          </BtnDanger>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppPage>
    </DoctorLayout>
  );
};

export default TreatmentManagement;
