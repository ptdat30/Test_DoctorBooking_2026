import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import PatientLayout from '../../components/patient/PatientLayout';
import { AppPage, BtnPrimary, BtnSecondary } from '../../components/shell/DashboardPrimitives';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [result, setResult] = useState(null);

  const getErrorMessage = (code) => {
    const errorMessages = {
      '07': 'Giao dịch bị nghi ngờ gian lận.',
      '09': 'Thẻ/tài khoản chưa đăng ký Internet Banking.',
      '10': 'Xác thực thông tin không đúng quá 3 lần.',
      '11': 'Hết hạn chờ thanh toán.',
      '12': 'Thẻ/tài khoản bị khóa.',
      '13': 'Nhập sai OTP quá 3 lần.',
      '24': 'Bạn đã hủy giao dịch.',
      '51': 'Tài khoản không đủ số dư.',
      '65': 'Vượt hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng đang bảo trì.',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần.',
      '97': 'Checksum không hợp lệ.',
      '99': 'Lỗi không xác định.',
    };
    return errorMessages[code] || 'Thanh toán thất bại. Vui lòng thử lại.';
  };

  const formatPayDate = (dateStr) => {
    if (!dateStr || dateStr.length < 14) return dateStr;
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const minute = dateStr.substring(10, 12);
    const second = dateStr.substring(12, 14);
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  };

  useEffect(() => {
    const code = searchParams.get('code');
    const message = searchParams.get('message');
    const transactionId = searchParams.get('transactionId');
    const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
    const vnp_TransactionNo = searchParams.get('vnp_TransactionNo');
    const vnp_Amount = searchParams.get('vnp_Amount');
    const vnp_TxnRef = searchParams.get('vnp_TxnRef');
    const vnp_OrderInfo = searchParams.get('vnp_OrderInfo');
    const vnp_BankCode = searchParams.get('vnp_BankCode');
    const vnp_PayDate = searchParams.get('vnp_PayDate');

    const isSuccess = code === '00' || vnp_ResponseCode === '00';
    const amount = vnp_Amount ? parseInt(vnp_Amount, 10) / 100 : null;

    setResult({
      success: isSuccess,
      code: code || vnp_ResponseCode || 'UNKNOWN',
      message: message || (isSuccess ? 'Thanh toán thành công' : getErrorMessage(vnp_ResponseCode || code)),
      transactionId: transactionId || vnp_TxnRef,
      transactionNo: vnp_TransactionNo,
      amount,
      orderInfo: vnp_OrderInfo,
      bankCode: vnp_BankCode,
      payDate: vnp_PayDate,
    });
  }, [searchParams]);

  useEffect(() => {
    if (!result?.success) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/patient/wallet');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [result?.success, navigate]);

  const handleBackToWallet = () => {
    if (result?.success) navigate('/patient/wallet');
    else navigate('/patient/wallet?action=deposit');
  };

  if (!result) {
    return (
      <PatientLayout>
        <AppPage className="flex items-center justify-center min-h-[40vh]">
          <p className="text-sm text-neutral-500">Đang xử lý kết quả thanh toán...</p>
        </AppPage>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <AppPage className="max-w-lg mx-auto">
        <div className="app-card p-6 sm:p-8 text-center space-y-6">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${result.success ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {result.success ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>

          <div>
            <h1 className="text-xl font-bold text-neutral-900">
              {result.success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
            </h1>
            <p className="text-sm text-neutral-500 mt-2">{result.message}</p>
          </div>

          <div className="text-left rounded-xl border border-neutral-100 bg-neutral-50 p-4 space-y-2 text-sm">
            {result.transactionId && (
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Mã giao dịch</span>
                <span className="font-medium">{result.transactionId}</span>
              </div>
            )}
            {result.transactionNo && (
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Mã VNPAY</span>
                <span className="font-medium">{result.transactionNo}</span>
              </div>
            )}
            {result.amount && (
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Số tiền</span>
                <span className="font-medium">{result.amount.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            )}
            {result.bankCode && (
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Ngân hàng</span>
                <span className="font-medium">{result.bankCode}</span>
              </div>
            )}
            {result.payDate && (
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Thời gian</span>
                <span className="font-medium">{formatPayDate(result.payDate)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {result.success && countdown > 0 && (
              <p className="text-xs text-neutral-500">Chuyển về ví sau {countdown}s...</p>
            )}
            <BtnPrimary className="w-full" onClick={handleBackToWallet}>
              {result.success ? 'Quay về ví' : 'Thử lại'}
            </BtnPrimary>
            {result.success && (
              <BtnSecondary
                className="w-full"
                onClick={() => {
                  navigate('/patient/wallet?tab=transactions&refresh=true');
                  setTimeout(() => window.location.reload(), 100);
                }}
              >
                Xem lịch sử giao dịch
              </BtnSecondary>
            )}
          </div>
        </div>
      </AppPage>
    </PatientLayout>
  );
};

export default PaymentResultPage;
