import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PatientLayout from '../../components/patient/PatientLayout';
import ShellIcon from '../../components/shell/ShellIcon';
import { AppPage, BtnPrimary, BtnSecondary } from '../../components/shell/DashboardPrimitives';

const AppointmentPaymentResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const code = searchParams.get('code');
  const appointmentId = searchParams.get('appointmentId');
  const vnpAmount = searchParams.get('vnp_Amount');
  const vnpTransactionNo = searchParams.get('vnp_TransactionNo');
  const vnpBankCode = searchParams.get('vnp_BankCode');
  const vnpPayDate = searchParams.get('vnp_PayDate');
  
  const isSuccess = code === '00';

  useEffect(() => {
    if (!isSuccess) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/patient/history');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, navigate]);

  const formatPayDate = (dateStr) => {
    if (!dateStr) return '';
    // Format: yyyyMMddHHmmss -> dd/MM/yyyy HH:mm:ss
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const minute = dateStr.substring(10, 12);
    const second = dateStr.substring(12, 14);
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  };

  const getMessage = () => {
    if (isSuccess) {
      return 'Thanh toán phí khám bệnh thành công!';
    }
    
    const errorMessages = {
      '07': 'Trừ tiền thành công nhưng giao dịch bị nghi ngờ',
      '09': 'Thẻ chưa đăng ký dịch vụ Internet Banking',
      '10': 'Xác thực thông tin thẻ không đúng quá 3 lần',
      '11': 'Đã hết hạn chờ thanh toán',
      '12': 'Thẻ bị khóa',
      '13': 'Nhập sai mật khẩu OTP',
      '24': 'Bạn đã hủy giao dịch',
      '51': 'Tài khoản không đủ số dư',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định'
    };

    return errorMessages[code] || 'Thanh toán không thành công';
  };

  return (
    <PatientLayout>
      <AppPage className="max-w-lg mx-auto">
        <div className="app-card p-6 sm:p-8 text-center space-y-6">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <ShellIcon name={isSuccess ? 'check-circle' : 'x-circle'} className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-neutral-900">{getMessage()}</h1>
            <p className="text-sm text-neutral-500 mt-2">
              {isSuccess
                ? 'Lịch hẹn đã thanh toán và đang chờ xác nhận.'
                : 'Lịch hẹn đã hủy do thanh toán không thành công.'}
            </p>
          </div>

          <div className="text-left rounded-xl border border-neutral-100 bg-neutral-50 p-4 space-y-3 text-sm">
            <h3 className="font-semibold text-neutral-900">Chi tiết giao dịch</h3>
            {appointmentId && (
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Mã lịch hẹn</span>
                <span className="font-medium">#{appointmentId}</span>
              </div>
            )}
            {vnpAmount && (
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Số tiền</span>
                <span className="font-medium">{(parseInt(vnpAmount, 10) / 100).toLocaleString('vi-VN')} VNĐ</span>
              </div>
            )}
            {vnpTransactionNo && (
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Mã VNPAY</span>
                <span className="font-medium">{vnpTransactionNo}</span>
              </div>
            )}
            {vnpBankCode && (
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Ngân hàng</span>
                <span className="font-medium">{vnpBankCode}</span>
              </div>
            )}
            {vnpPayDate && (
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Thời gian</span>
                <span className="font-medium">{formatPayDate(vnpPayDate)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {isSuccess && (
              <p className="text-xs text-neutral-500">Chuyển về lịch sử sau {countdown}s...</p>
            )}
            {isSuccess ? (
              <BtnPrimary className="w-full" onClick={() => navigate('/patient/history')}>
                Xem lịch sử đặt lịch
              </BtnPrimary>
            ) : (
              <>
                <BtnPrimary className="w-full" onClick={() => navigate('/patient/booking')}>
                  Đặt lịch lại
                </BtnPrimary>
                <BtnSecondary className="w-full" onClick={() => navigate('/patient/history')}>
                  Xem lịch sử
                </BtnSecondary>
              </>
            )}
          </div>
        </div>
      </AppPage>
    </PatientLayout>
  );
};

export default AppointmentPaymentResult;

