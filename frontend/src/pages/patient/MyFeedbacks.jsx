import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import PatientLayout from '../../components/patient/PatientLayout';
import { patientService } from '../../services/patientService';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatDate } from '../../utils/formatDate';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  AppPage,
  PageHeader,
  BtnPrimary,
  BtnSecondary,
  Modal,
  StarRating,
  Textarea,
  FormField,
  EmptyState,
} from '../../components/shell/DashboardPrimitives';

const MyFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await patientService.getFeedbacks();
      setFeedbacks(data);
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách phản hồi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (feedback) => {
    setSelectedFeedback(feedback);
    setEditData({ rating: feedback.rating, comment: feedback.comment || '' });
    setShowEditModal(true);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      await patientService.updateFeedback(selectedFeedback.id, editData);
      toast.success('Cập nhật phản hồi thành công!', { position: 'top-right' });
      setShowEditModal(false);
      setSelectedFeedback(null);
      loadFeedbacks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật phản hồi', { position: 'top-right' });
    }
  };

  const getStatusDisplay = (status) => ({
    PENDING: 'Chưa đọc',
    READ: 'Đã đọc',
    REPLIED: 'Đã phản hồi',
  }[status] || status);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'READ': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'REPLIED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <PatientLayout>
      <AppPage>
        <PageHeader
          title="Phản hồi của tôi"
          subtitle="Xem và chỉnh sửa các đánh giá đã gửi"
        />
        {error && <ErrorMessage message={error} onClose={() => setError('')} />}

        <div className="app-card overflow-hidden">
          {loading ? (
            <Loading />
          ) : feedbacks.length === 0 ? (
            <EmptyState title="Bạn chưa gửi phản hồi nào" />
          ) : (
            <div className="divide-y divide-neutral-100">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="p-5 sm:p-6 hover:bg-neutral-50/80 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-neutral-900">{feedback.doctorName}</h3>
                        <span className="text-amber-400 text-sm">{'★'.repeat(feedback.rating)}</span>
                        <span className={`app-badge border ${getStatusColor(feedback.status)}`}>
                          {getStatusDisplay(feedback.status)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">Gửi lúc: {formatDate(feedback.createdAt)}</p>
                      <p className="text-sm text-neutral-700 bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                        {feedback.comment || 'Không có nhận xét'}
                      </p>
                      {feedback.doctorReply && (
                        <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4">
                          <p className="text-xs font-semibold text-sky-800 mb-1">Phản hồi từ bác sĩ</p>
                          <p className="text-sm text-neutral-700">{feedback.doctorReply}</p>
                          {feedback.doctorRepliedAt && (
                            <p className="text-xs text-neutral-500 mt-2">{formatDate(feedback.doctorRepliedAt)}</p>
                          )}
                        </div>
                      )}
                    </div>
                    {feedback.canEdit ? (
                      <BtnSecondary onClick={() => handleEdit(feedback)} className="shrink-0">
                        <Pencil className="w-4 h-4" />
                        Chỉnh sửa
                      </BtnSecondary>
                    ) : (
                      <p className="text-xs text-neutral-400 shrink-0">
                        {feedback.doctorReply ? 'Đã có phản hồi bác sĩ' : 'Hết thời hạn chỉnh sửa'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal
          open={showEditModal && !!selectedFeedback}
          onClose={() => { setShowEditModal(false); setSelectedFeedback(null); }}
          title="Chỉnh sửa phản hồi"
          footer={
            <>
              <BtnSecondary onClick={() => { setShowEditModal(false); setSelectedFeedback(null); }}>Hủy</BtnSecondary>
              <BtnPrimary onClick={handleSubmitEdit}>Cập nhật</BtnPrimary>
            </>
          }
        >
          {selectedFeedback && (
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <p className="text-sm text-neutral-600">
                <strong>Bác sĩ:</strong> {selectedFeedback.doctorName}
              </p>
              <FormField label="Đánh giá" required>
                <StarRating value={editData.rating} onChange={(rating) => setEditData({ ...editData, rating })} />
              </FormField>
              <FormField label="Nhận xét">
                <Textarea
                  value={editData.comment}
                  onChange={(e) => setEditData({ ...editData, comment: e.target.value })}
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                />
              </FormField>
            </form>
          )}
        </Modal>
      </AppPage>
      <ToastContainer />
    </PatientLayout>
  );
};

export default MyFeedbacks;
