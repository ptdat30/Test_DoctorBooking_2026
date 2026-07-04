import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import PatientLayout from '../../components/patient/PatientLayout';
import { patientService } from '../../services/patientService';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatDate } from '../../utils/formatDate';
import {
  AppPage,
  PageHeader,
  EmptyState,
  BtnPrimary,
  BtnSecondary,
  Modal,
} from '../../components/shell/DashboardPrimitives';

const TreatmentHistory = () => {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  useEffect(() => {
    loadTreatments();
  }, []);

  const loadTreatments = async () => {
    try {
      setLoading(true);
      const data = await patientService.getTreatments();
      setTreatments(data);
      setError('');
    } catch (err) {
      setError('Không thể tải hồ sơ điều trị');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const treatment = await patientService.getTreatmentById(id);
      setSelectedTreatment(treatment);
    } catch {
      setError('Không thể tải chi tiết điều trị');
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
      <AppPage>
        <PageHeader
          title="Điều trị của tôi"
          subtitle={`${treatments.length} hồ sơ điều trị`}
        />
        <ErrorMessage message={error} onClose={() => setError('')} />

        <div className="app-card overflow-hidden">
          {treatments.length === 0 ? (
            <EmptyState icon={Activity} title="Chưa có hồ sơ điều trị" />
          ) : (
            <div className="overflow-x-auto">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Bác sĩ</th>
                    <th>Ngày</th>
                    <th>Chẩn đoán</th>
                    <th>Tái khám</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {treatments.map((t) => (
                    <tr key={t.id}>
                      <td className="font-medium text-neutral-900">{t.doctorName}</td>
                      <td>{formatDate(t.createdAt)}</td>
                      <td className="max-w-xs truncate">{t.diagnosis || '—'}</td>
                      <td>{t.followUpDate ? formatDate(t.followUpDate) : '—'}</td>
                      <td className="text-right">
                        <BtnSecondary
                          className="!py-1.5 !px-3 !text-xs"
                          onClick={() => handleViewDetails(t.id)}
                        >
                          Chi tiết
                        </BtnSecondary>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal
          open={!!selectedTreatment}
          onClose={() => setSelectedTreatment(null)}
          title="Chi tiết điều trị"
          footer={<BtnSecondary onClick={() => setSelectedTreatment(null)}>Đóng</BtnSecondary>}
        >
          {selectedTreatment && (
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-neutral-500">Bác sĩ</dt>
                <dd className="font-medium text-neutral-900 mt-0.5">{selectedTreatment.doctorName}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Ngày</dt>
                <dd className="mt-0.5">{formatDate(selectedTreatment.createdAt)}</dd>
              </div>
              {selectedTreatment.diagnosis && (
                <div>
                  <dt className="text-neutral-500">Chẩn đoán</dt>
                  <dd className="mt-0.5 text-neutral-700 leading-relaxed">{selectedTreatment.diagnosis}</dd>
                </div>
              )}
              {selectedTreatment.prescription && (
                <div>
                  <dt className="text-neutral-500">Đơn thuốc</dt>
                  <dd className="mt-0.5 text-neutral-700 leading-relaxed">{selectedTreatment.prescription}</dd>
                </div>
              )}
              {selectedTreatment.treatmentNotes && (
                <div>
                  <dt className="text-neutral-500">Ghi chú</dt>
                  <dd className="mt-0.5 text-neutral-700 leading-relaxed">{selectedTreatment.treatmentNotes}</dd>
                </div>
              )}
              {selectedTreatment.followUpDate && (
                <div>
                  <dt className="text-neutral-500">Tái khám</dt>
                  <dd className="mt-0.5">{formatDate(selectedTreatment.followUpDate)}</dd>
                </div>
              )}
            </dl>
          )}
        </Modal>
      </AppPage>
    </PatientLayout>
  );
};

export default TreatmentHistory;
