import { useEffect, useState } from 'react';
import { MessageSquare, Pencil } from 'lucide-react';
import DoctorLayout from '../../components/doctor/DoctorLayout';
import { doctorService } from '../../services/doctorService';
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
  Textarea,
  FormField,
  EmptyState,
  Select,
} from '../../components/shell/DashboardPrimitives';

const DoctorFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    loadFeedbacks();
    loadAverageRating();
  }, [filterRating]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const data = filterRating
        ? await doctorService.getFeedbacksByRating(filterRating)
        : await doctorService.getFeedbacks();
      setFeedbacks(data);
      setError('');
    } catch {
      setError('Không thể tải danh sách phản hồi');
    } finally {
      setLoading(false);
    }
  };

  const loadAverageRating = async () => {
    try {
      const rating = await doctorService.getAverageRating();
      setAverageRating(rating || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = (feedback) => {
    setSelectedFeedback(feedback);
    setReplyText(feedback.doctorReply || '');
    setIsEditingReply(!!feedback.doctorReply);
    setShowReplyModal(true);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi', { position: 'top-right' });
      return;
    }
    try {
      const replyData = { doctorReply: replyText.trim() };
      if (isEditingReply) {
        await doctorService.updateDoctorReply(selectedFeedback.id, replyData);
        toast.success('Cập nhật phản hồi thành công!', { position: 'top-right' });
      } else {
        await doctorService.replyToFeedback(selectedFeedback.id, replyData);
        toast.success('Gửi phản hồi thành công!', { position: 'top-right' });
      }
      setShowReplyModal(false);
      setSelectedFeedback(null);
      setReplyText('');
      loadFeedbacks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi phản hồi', { position: 'top-right' });
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
    <DoctorLayout>
      <AppPage>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <PageHeader
              title="Phản hồi bệnh nhân"
              subtitle="Xem và trả lời đánh giá từ bệnh nhân"
            />
          </div>
          <div className="app-card p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Đánh giá trung bình</p>
            <p className="text-4xl font-bold text-neutral-900 mt-2">{averageRating.toFixed(1)}</p>
            <p className="text-amber-400 mt-1">{'★'.repeat(Math.round(averageRating))}</p>
            <p className="text-xs text-neutral-500 mt-2">{feedbacks.length} đánh giá</p>
          </div>
        </div>

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}

        <div className="app-card p-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-neutral-700">Lọc theo sao:</label>
          <Select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="!w-auto min-w-[140px]"
          >
            <option value="">Tất cả</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} sao</option>
            ))}
          </Select>
          {filterRating && (
            <BtnSecondary className="!py-1.5 !px-3 !text-xs" onClick={() => setFilterRating('')}>
              Xóa lọc
            </BtnSecondary>
          )}
        </div>

        <div className="app-card overflow-hidden">
          {loading ? (
            <Loading />
          ) : feedbacks.length === 0 ? (
            <EmptyState title={filterRating ? 'Không có phản hồi với mức sao này' : 'Chưa có phản hồi'} />
          ) : (
            <div className="divide-y divide-neutral-100">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="p-5 sm:p-6 hover:bg-neutral-50/80 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-neutral-900">{feedback.patientName}</h3>
                        <span className="text-amber-400 text-sm">{'★'.repeat(feedback.rating)}</span>
                        <span className={`app-badge border ${getStatusColor(feedback.status)}`}>
                          {getStatusDisplay(feedback.status)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">{formatDate(feedback.createdAt)}</p>
                      <p className="text-sm text-neutral-700">{feedback.comment || 'Không có nhận xét'}</p>
                      {feedback.doctorReply && (
                        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 mt-2">
                          <p className="text-xs font-semibold text-neutral-600 mb-1">Phản hồi của bạn</p>
                          <p className="text-sm text-neutral-700">{feedback.doctorReply}</p>
                        </div>
                      )}
                    </div>
                    {(feedback.canEdit || !feedback.doctorReply) && (
                      <BtnSecondary onClick={() => handleReply(feedback)} className="shrink-0">
                        {feedback.doctorReply ? (
                          <><Pencil className="w-4 h-4" /> Sửa</>
                        ) : (
                          <><MessageSquare className="w-4 h-4" /> Trả lời</>
                        )}
                      </BtnSecondary>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal
          open={showReplyModal && !!selectedFeedback}
          onClose={() => { setShowReplyModal(false); setSelectedFeedback(null); setReplyText(''); }}
          title={isEditingReply ? 'Chỉnh sửa phản hồi' : 'Trả lời phản hồi'}
          footer={
            <>
              <BtnSecondary onClick={() => { setShowReplyModal(false); setSelectedFeedback(null); setReplyText(''); }}>
                Hủy
              </BtnSecondary>
              <BtnPrimary onClick={handleSubmitReply}>
                {isEditingReply ? 'Cập nhật' : 'Gửi phản hồi'}
              </BtnPrimary>
            </>
          }
        >
          {selectedFeedback && (
            <form onSubmit={handleSubmitReply} className="space-y-4">
              <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4 text-sm">
                <p className="font-medium text-neutral-900">{selectedFeedback.patientName}</p>
                <p className="text-amber-400 my-1">{'★'.repeat(selectedFeedback.rating)}</p>
                <p className="text-neutral-600">{selectedFeedback.comment || 'Không có nhận xét'}</p>
              </div>
              <FormField label="Nội dung phản hồi" required>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập phản hồi cho bệnh nhân..."
                  required
                />
              </FormField>
            </form>
          )}
        </Modal>
      </AppPage>
      <ToastContainer />
    </DoctorLayout>
  );
};

export default DoctorFeedbacks;
