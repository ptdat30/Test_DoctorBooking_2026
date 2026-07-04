import { useNavigate } from 'react-router-dom';
import PatientLayout from '../../components/patient/PatientLayout';
import HealthAIChat from '../../components/patient/HealthAIChat';
import { AppPage, PageHeader } from '../../components/shell/DashboardPrimitives';

const HealthAIPage = () => {
  const navigate = useNavigate();

  return (
    <PatientLayout>
      <AppPage className="!space-y-4">
        <PageHeader title="Trợ lý AI" subtitle="Hỏi đáp sức khỏe — không thay thế tư vấn y khoa" />
        <div className="app-card overflow-hidden min-h-[calc(100vh-14rem)]">
          <HealthAIChat onClose={() => navigate('/patient/dashboard')} isFullPage />
        </div>
      </AppPage>
    </PatientLayout>
  );
};

export default HealthAIPage;
