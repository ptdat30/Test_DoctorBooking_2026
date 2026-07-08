import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Wallet, Star, Plus, Gift, ArrowDownLeft, ArrowUpRight, CreditCard } from 'lucide-react';
import { patientService } from '../../services/patientService';
import { vouchers, loyaltyTiers, pointHistory } from '../../mockData/patient/healthWallet';
import { TabBar, ChoiceCard } from '../shell/PatientPageUI';
import { BtnPrimary, BtnSecondary, Modal, Input, StatusBadge } from '../shell/DashboardPrimitives';
import Loading from '../common/Loading';

const HealthWallet = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [walletData, setWalletData] = useState({
    balance: 0,
    loyaltyPoints: 0,
    loyaltyTier: 'BRONZE'
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);


  // Load wallet data
  useEffect(() => {
    loadWalletData();
    loadTransactions();
    
    // Check if should open transactions tab from query param
    const tabParam = searchParams.get('tab');
    if (tabParam === 'transactions') {
      setActiveTab('transactions');
    }
    
    // Check if should refresh
    const refreshParam = searchParams.get('refresh');
    if (refreshParam === 'true') {
      loadTransactions();
      loadWalletData();
      // Clear refresh param
      navigate('/patient/wallet?tab=transactions', { replace: true });
    }
  }, []);

  // Refresh transactions when tab changes to transactions
  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab]);

  const loadWalletData = async () => {
    try {
      const data = await patientService.getWallet();
      setWalletData({
        balance: data.balance || 0,
        loyaltyPoints: data.loyaltyPoints || 0,
        loyaltyTier: data.loyaltyTier || 'BRONZE'
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const data = await patientService.getTransactions(0, 50);
      // Sort by created date descending (newest first)
      const sortedTransactions = (data.transactions || []).sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setTransactions(sortedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const currentTier = loyaltyTiers.find(tier => 
    walletData.loyaltyPoints >= tier.minPoints && 
    (tier.maxPoints === Infinity || walletData.loyaltyPoints <= tier.maxPoints)
  ) || loyaltyTiers[0];

  const availableVouchers = vouchers.filter(v => !v.isRedeemed);
  const redeemedVouchers = vouchers.filter(v => v.isRedeemed);

  // Helper function to determine amount prefix based on transaction type and status
  const getAmountPrefix = (transaction) => {
    // Chỉ hiển thị dấu + khi giao dịch THÀNH CÔNG và là loại nạp tiền/hoàn tiền
    if (transaction.status === 'COMPLETED') {
      if (transaction.transactionType === 'DEPOSIT' || transaction.transactionType === 'REFUND') {
        return '+';
      }
      if (transaction.transactionType === 'PAYMENT' || transaction.transactionType === 'WITHDRAWAL') {
        return '-';
      }
    }
    // Với PENDING hoặc FAILED, không hiển thị dấu +/-
    return '';
  };

  // Helper function to determine CSS class for amount
  const getAmountClass = (transaction) => {
    if (transaction.status === 'COMPLETED') {
      if (transaction.transactionType === 'DEPOSIT' || transaction.transactionType === 'REFUND') {
        return 'positive';
      }
      if (transaction.transactionType === 'PAYMENT' || transaction.transactionType === 'WITHDRAWAL') {
        return 'negative';
      }
    }
    if (transaction.status === 'FAILED') {
      return 'failed';
    }
    if (transaction.status === 'PENDING') {
      return 'pending';
    }
    return '';
  };


  const walletTabs = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'vouchers', label: `Voucher (${availableVouchers.length})` },
    { id: 'points', label: 'Điểm tích lũy' },
    { id: 'transactions', label: 'Lịch sử giao dịch' },
  ];

  if (loading) {
    return <Loading message="Đang tải thông tin ví..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="app-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Số dư</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">
            {Number(walletData.balance).toLocaleString('vi-VN')} VNĐ
          </p>
        </div>
        <div className="app-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Điểm tích lũy</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">
            {walletData.loyaltyPoints.toLocaleString('vi-VN')} điểm
          </p>
          <p className="text-xs text-neutral-500 mt-1">Hạng {currentTier.name}</p>
        </div>
        <div className="app-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Hạng thành viên</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{currentTier.name}</p>
          <p className="text-xs text-neutral-500 mt-1">
            {walletData.loyaltyPoints < (currentTier.maxPoints || Infinity)
              ? `Còn ${((currentTier.maxPoints || Infinity) - walletData.loyaltyPoints).toLocaleString('vi-VN')} điểm để lên hạng`
              : 'Đã đạt hạng cao nhất'}
          </p>
        </div>
      </div>

      <div className="app-card overflow-hidden">
        <div className="px-5 sm:px-6 pt-4">
          <TabBar tabs={walletTabs} active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="p-5 sm:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-neutral-900 mb-3">Quyền lợi hạng {currentTier.name}</h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  {currentTier.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-3">Thao tác nhanh</h3>
                <div className="flex flex-wrap gap-2">
                  <BtnPrimary onClick={() => setShowTopUpModal(true)}>
                    <Plus className="w-4 h-4" />
                    Nạp tiền
                  </BtnPrimary>
                  <BtnSecondary onClick={() => setActiveTab('vouchers')}>
                    <Gift className="w-4 h-4" />
                    Xem voucher
                  </BtnSecondary>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vouchers' && (
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold text-neutral-900 mb-4">Voucher có sẵn</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableVouchers.map((voucher) => (
                    <div key={voucher.id} className="rounded-xl border border-neutral-200 p-4">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="font-semibold text-neutral-900">{voucher.title}</h4>
                        <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                          {voucher.discountType === 'percentage'
                            ? `-${voucher.discountValue}%`
                            : `-${voucher.discountValue.toLocaleString('vi-VN')} VNĐ`}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 mb-3">{voucher.description}</p>
                      <p className="text-xs text-neutral-400 mb-3">Mã: <strong className="text-neutral-700">{voucher.code}</strong></p>
                      {voucher.pointsRequired > 0 && (
                        <p className="text-xs text-neutral-500 mb-3">Đổi {voucher.pointsRequired} điểm</p>
                      )}
                      <BtnSecondary className="w-full">Sử dụng ngay</BtnSecondary>
                    </div>
                  ))}
                </div>
              </div>
              {redeemedVouchers.length > 0 && (
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-4">Voucher đã sử dụng</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {redeemedVouchers.map((voucher) => (
                      <div key={voucher.id} className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 opacity-75">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-neutral-700">{voucher.title}</h4>
                          <span className="text-xs font-medium text-neutral-500 bg-white px-2 py-0.5 rounded-lg border">Đã dùng</span>
                        </div>
                        <p className="text-sm text-neutral-500">{voucher.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'points' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Tổng điểm hiện tại</p>
                <p className="text-3xl font-bold text-neutral-900 mt-1">{walletData.loyaltyPoints.toLocaleString('vi-VN')}</p>
                <div className="mt-4 h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neutral-900 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (walletData.loyaltyPoints / (currentTier.maxPoints || 10000)) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  {walletData.loyaltyPoints < (currentTier.maxPoints || Infinity)
                    ? `Còn ${((currentTier.maxPoints || Infinity) - walletData.loyaltyPoints).toLocaleString('vi-VN')} điểm để lên hạng tiếp theo`
                    : 'Đã đạt hạng cao nhất'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-3">Lịch sử tích điểm</h3>
                <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
                  {pointHistory.map((point) => (
                    <div key={point.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                      <div>
                        <p className="font-medium text-neutral-900">{point.type === 'earned' ? 'Tích điểm' : 'Sử dụng điểm'}</p>
                        <p className="text-neutral-500 text-xs mt-0.5">{point.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-semibold ${point.type === 'earned' ? 'text-emerald-600' : 'text-neutral-600'}`}>
                          {point.type === 'earned' ? '+' : ''}{point.points.toLocaleString('vi-VN')} điểm
                        </p>
                        <p className="text-xs text-neutral-400">{new Date(point.date).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              {transactionsLoading ? (
                <div className="py-12 text-center text-sm text-neutral-400">Đang tải lịch sử giao dịch...</div>
              ) : transactions.length === 0 ? (
                <p className="text-center text-neutral-400 py-12 text-sm">Chưa có giao dịch nào</p>
              ) : (
                <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
                  {transactions.map((transaction) => {
                    const isPositive = getAmountClass(transaction) === 'positive';
                    const isNegative = getAmountClass(transaction) === 'negative';
                    return (
                      <div key={transaction.id} className="flex items-center gap-4 p-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isPositive ? 'bg-emerald-50 text-emerald-600' : isNegative ? 'bg-red-50 text-red-600' : 'bg-neutral-100 text-neutral-500'
                        }`}>
                          {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : isNegative ? <ArrowUpRight className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-neutral-900 text-sm truncate">{transaction.description}</p>
                            <StatusBadge status={transaction.status || 'PENDING'} />
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {new Date(transaction.createdAt).toLocaleString('vi-VN')}
                            {transaction.paymentMethod && ` · ${transaction.paymentMethod}`}
                          </p>
                          {transaction.pointsEarned > 0 && (
                            <p className="text-xs text-amber-600 mt-0.5">+{transaction.pointsEarned} điểm</p>
                          )}
                        </div>
                        <p className={`font-semibold text-sm shrink-0 ${
                          isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-neutral-500'
                        }`}>
                          {getAmountPrefix(transaction)}
                          {Number(transaction.amount).toLocaleString('vi-VN')} VNĐ
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <TopUpModal
        open={showTopUpModal}
        amount={topUpAmount}
        paymentMethod={paymentMethod}
        onAmountChange={setTopUpAmount}
        onPaymentMethodChange={setPaymentMethod}
        onConfirm={async () => {
          setTopUpLoading(true);
          try {
            const numAmount = parseInt(topUpAmount.replace(/\./g, ''));
            const response = await patientService.topUp(numAmount, paymentMethod);
            await loadTransactions();
            if (response.paymentUrl) {
              setTimeout(() => { window.location.href = response.paymentUrl; }, 500);
            } else {
              setTopUpLoading(false);
              alert('Không thể tạo link thanh toán. Vui lòng thử lại.');
            }
          } catch (error) {
            console.error('Error creating top-up:', error);
            setTopUpLoading(false);
            alert('Có lỗi xảy ra khi tạo yêu cầu nạp tiền. Vui lòng thử lại.');
          }
        }}
        loading={topUpLoading}
        onClose={() => {
          setShowTopUpModal(false);
          setTopUpAmount('');
          setPaymentMethod('VNPAY');
        }}
      />
    </div>
  );
};

// Top-up Modal Component
const TopUpModal = ({ open, amount, paymentMethod, onAmountChange, onPaymentMethodChange, onConfirm, onClose, loading = false }) => {
  const quickAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000];
  const minAmount = 10000;
  const maxAmount = 50000000;

  const handleAmountSelect = (selectedAmount) => {
    const formatted = selectedAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    onAmountChange(formatted);
  };

  const handleConfirm = () => {
    const numAmount = parseInt(amount.replace(/\./g, ''));
    if (!numAmount || numAmount < minAmount || numAmount > maxAmount) {
      alert(`Số tiền phải từ ${minAmount.toLocaleString('vi-VN')} VNĐ đến ${maxAmount.toLocaleString('vi-VN')} VNĐ`);
      return;
    }
    onConfirm();
  };

  const formatAmount = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const numAmount = parseInt(amount.replace(/\./g, '') || 0);
  const amountValid = numAmount >= minAmount && numAmount <= maxAmount;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nạp tiền vào ví"
      footer={
        <>
          <BtnSecondary onClick={onClose} disabled={loading}>Hủy</BtnSecondary>
          <BtnPrimary onClick={handleConfirm} disabled={loading || !amountValid}>
            {loading ? 'Đang chuyển sang VNPAY...' : 'Xác nhận'}
          </BtnPrimary>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">Bạn muốn nạp bao nhiêu?</label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Nhập số tiền"
              value={amount}
              onChange={(e) => onAmountChange(formatAmount(e.target.value))}
              maxLength={15}
              className="pr-14"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">VNĐ</span>
          </div>
          {amount && (
            <p className="text-sm font-semibold text-neutral-900 mt-2">
              {numAmount.toLocaleString('vi-VN')} VNĐ
            </p>
          )}
          <p className="text-xs text-neutral-400 mt-2">
            Số tiền từ {minAmount.toLocaleString('vi-VN')} VNĐ đến {maxAmount.toLocaleString('vi-VN')} VNĐ
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {quickAmounts.map((quickAmount) => {
              const formatted = quickAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
              const isActive = amount === formatted || numAmount === quickAmount;
              return (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => handleAmountSelect(quickAmount)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    isActive ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {quickAmount.toLocaleString('vi-VN')} VNĐ
                </button>
              );
            })}
          </div>
        </div>

        {amountValid && (
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-3">Chọn phương thức thanh toán</label>
            <div className="space-y-2">
              <ChoiceCard selected={paymentMethod === 'VNPAY'}>
                <input type="radio" name="topupPayment" value="VNPAY" checked={paymentMethod === 'VNPAY'} onChange={(e) => onPaymentMethodChange(e.target.value)} className="sr-only" />
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-neutral-600" />
                  <div>
                    <p className="font-semibold text-sm">VNPAY</p>
                    <p className="text-xs text-neutral-500">Thẻ ATM / QR Code ngân hàng</p>
                  </div>
                </div>
              </ChoiceCard>
              <ChoiceCard selected={paymentMethod === 'MOMO'}>
                <input type="radio" name="topupPayment" value="MOMO" checked={paymentMethod === 'MOMO'} onChange={(e) => onPaymentMethodChange(e.target.value)} className="sr-only" />
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-neutral-600" />
                  <div>
                    <p className="font-semibold text-sm">Ví Momo</p>
                    <p className="text-xs text-neutral-500">Thanh toán qua ví điện tử Momo</p>
                  </div>
                </div>
              </ChoiceCard>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default HealthWallet;


