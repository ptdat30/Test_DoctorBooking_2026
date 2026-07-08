import HealthWallet from '../../components/patient/HealthWallet';
import PatientLayout from '../../components/patient/PatientLayout';
import { AppPage, PageHeader } from '../../components/shell/DashboardPrimitives';

const HealthWalletPage = () => (
  <PatientLayout>
    <AppPage>
      <PageHeader title="Ví sức khỏe" subtitle="Số dư, điểm tích lũy và lịch sử giao dịch" />
      <HealthWallet />
    </AppPage>
  </PatientLayout>
);

export default HealthWalletPage;
