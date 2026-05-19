import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { vouchers, loyaltyTiers } from '../../mockData/patient/healthWallet';
import './HealthWallet.css';

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

  useEffect(() => {
    if (showTopUpModal && window.feather) {
      window.feather.replace();
    }
  }, [showTopUpModal]);

  // Show loading spinner when initially loading wallet data
  if (loading) {
    return (
      <div className="health-wallet">
        <div className="wallet-loading">
          <div className="loading-spinner-large"></div>
          <p>Đang tải thông tin ví...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="health-wallet">
      <div className="wallet-header">
        <h2>Ví Sức khỏe & Tích điểm</h2>
      </div>

      {/* Overview Cards */}
      <div className="wallet-overview">
        <div className="wallet-card balance">
          <div className="card-icon"></div>
          <div className="card-content">
            <h3>Số dư</h3>
            <p className="card-value">{Number(walletData.balance).toLocaleString('vi-VN')} VNĐ</p>
          </div>
        </div>

        <div className="wallet-card points">
          <div className="card-icon">★</div>
          <div className="card-content">
            <h3>Điểm tích lũy</h3>
            <p className="card-value">{walletData.loyaltyPoints.toLocaleString('vi-VN')} điểm</p>
            <p className="card-subtitle">{currentTier.icon} Hạng {currentTier.name}</p>
          </div>
        </div>

        <div className="wallet-card tier">
          <div className="card-icon">{currentTier.icon}</div>
          <div className="card-content">
            <h3>Hạng thành viên</h3>
            <p className="card-value">{currentTier.name}</p>
            <p className="card-subtitle">
              {walletData.loyaltyPoints < (currentTier.maxPoints || Infinity)
                ? `Còn ${((currentTier.maxPoints || Infinity) - walletData.loyaltyPoints).toLocaleString('vi-VN')} điểm để lên hạng tiếp theo`
                : 'Đã đạt hạng cao nhất'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="wallet-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Tổng quan
        </button>
        <button
          className={`tab-btn ${activeTab === 'vouchers' ? 'active' : ''}`}
          onClick={() => setActiveTab('vouchers')}
        >
          Voucher ({availableVouchers.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'points' ? 'active' : ''}`}
          onClick={() => setActiveTab('points')}
        >
          Điểm tích lũy
        </button>
        <button
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Lịch sử giao dịch
        </button>
      </div>

      {/* Tab Content */}
      <div className="wallet-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="loyalty-benefits">
              <h3>Quyền lợi hạng {currentTier.name}</h3>
              <ul>
                {currentTier.benefits.map((benefit, idx) => (
                  <li key={idx}> {benefit}</li>
                ))}
              </ul>
            </div>

            <div className="quick-actions">
              <h3>Thao tác nhanh</h3>
              <div className="action-buttons">
                <button className="action-btn" onClick={() => setShowTopUpModal(true)}>Nạp tiền</button>
                <button className="action-btn">Đổi điểm</button>
                <button className="action-btn" onClick={() => setActiveTab('vouchers')}>Xem voucher</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vouchers' && (
          <div className="vouchers-content">
            <div className="vouchers-section">
              <h3>Voucher có sẵn</h3>
              <div className="vouchers-grid">
                {availableVouchers.map((voucher) => (
                  <div key={voucher.id} className="voucher-card">
                    <div className="voucher-header">
                      <h4>{voucher.title}</h4>
                      {voucher.discountType === 'percentage' ? (
                        <span className="voucher-discount">-{voucher.discountValue}%</span>
                      ) : (
                        <span className="voucher-discount">-{voucher.discountValue.toLocaleString('vi-VN')} VNĐ</span>
                      )}
                    </div>
                    <p className="voucher-description">{voucher.description}</p>
                    <div className="voucher-code">
                      <span>Mã: <strong>{voucher.code}</strong></span>
                    </div>
                    {voucher.pointsRequired > 0 && (
                      <div className="voucher-points">
                        Đổi {voucher.pointsRequired} điểm
                      </div>
                    )}
                    <button className="voucher-btn">Sử dụng ngay</button>
                  </div>
                ))}
              </div>
            </div>

            {redeemedVouchers.length > 0 && (
              <div className="vouchers-section">
                <h3>Voucher đã sử dụng</h3>
                <div className="vouchers-grid">
                  {redeemedVouchers.map((voucher) => (
                    <div key={voucher.id} className="voucher-card redeemed">
                      <div className="voucher-header">
                        <h4>{voucher.title}</h4>
                        <span className="redeemed-badge">Đã dùng</span>
                      </div>
                      <p className="voucher-description">{voucher.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'points' && (
          <div className="points-content">
            <div className="points-summary">
              <div className="points-card">
                <h3>Tổng điểm hiện tại</h3>
                <p className="points-value">{walletData.loyaltyPoints.toLocaleString('vi-VN')}</p>
              </div>
              <div className="points-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${(walletData.loyaltyPoints / (currentTier.maxPoints || 10000)) * 100}%`,
                      maxWidth: '100%'
                    }}
                  ></div>
                </div>
                <p>
                  {walletData.loyaltyPoints < (currentTier.maxPoints || Infinity)
                    ? `Còn ${((currentTier.maxPoints || Infinity) - walletData.loyaltyPoints).toLocaleString('vi-VN')} điểm để lên hạng ${loyaltyTiers[loyaltyTiers.indexOf(currentTier) + 1]?.name || ''}`
                    : 'Đã đạt hạng cao nhất'}
                </p>
              </div>
            </div>

            <div className="points-history">
              <h3>Lịch sử tích điểm</h3>
              <div className="points-list">
                {pointHistory.map((point) => (
                  <div key={point.id} className="point-item">
                    <div className="point-info">
                      <span className="point-type">{point.type === 'earned' ? 'Tích điểm' : 'Sử dụng điểm'}</span>
                      <span className="point-description">{point.description}</span>
                    </div>
                    <div className={`point-amount ${point.type}`}>
                      {point.type === 'earned' ? '+' : ''}{point.points.toLocaleString('vi-VN')} điểm
                    </div>
                    <div className="point-date">
                      {new Date(point.date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions-content">
            {transactionsLoading ? (
              <div className="transactions-loading">
                <div className="loading-spinner-medium"></div>
                <p>Đang tải lịch sử giao dịch...</p>
              </div>
            ) : (
              <div className="transactions-list">
                {transactions.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                    Chưa có giao dịch nào
                  </p>
                ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-icon">
                      {transaction.transactionType === 'PAYMENT' && ''}
                      {transaction.transactionType === 'REWARD' && '🎁'}
                      {transaction.transactionType === 'REFUND' && '↩️'}
                      {transaction.transactionType === 'DEPOSIT' && ''}
                      {transaction.transactionType === 'WITHDRAWAL' && '💸'}
                    </div>
                    <div className="transaction-details">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h4 style={{ margin: 0 }}>{transaction.description}</h4>
                        <span className={`transaction-status-badge status-${transaction.status?.toLowerCase() || 'pending'}`}>
                          {transaction.status === 'COMPLETED' && ' Hoàn thành'}
                          {transaction.status === 'PENDING' && ' Đang xử lý'}
                          {transaction.status === 'FAILED' && '✗ Thất bại'}
                          {transaction.status === 'CANCELLED' && '✕ Đã hủy'}
                          {!transaction.status && ' Đang xử lý'}
                        </span>
                      </div>
                      <span className="transaction-date">
                        {new Date(transaction.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {transaction.paymentMethod && (
                        <span className="transaction-method" style={{ fontSize: '0.85rem', color: '#888', marginLeft: '0.5rem' }}>
                          • {transaction.paymentMethod}
                        </span>
                      )}
                      {transaction.pointsEarned > 0 && (
                        <span className="transaction-points">
                          +{transaction.pointsEarned} điểm
                        </span>
                      )}
                    </div>
                    <div className={`transaction-amount ${getAmountClass(transaction)}`}>
                      {getAmountPrefix(transaction)}
                      {Number(transaction.amount).toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top-up Modal */}
      {showTopUpModal && (
        <TopUpModal
          amount={topUpAmount}
          paymentMethod={paymentMethod}
          onAmountChange={setTopUpAmount}
          onPaymentMethodChange={setPaymentMethod}
          onConfirm={async () => {
            setTopUpLoading(true);
            try {
              const numAmount = parseInt(topUpAmount.replace(/\./g, ''));
              const response = await patientService.topUp(numAmount, paymentMethod);
              
              // Transaction đã được tạo với status PENDING ở backend
              // Refresh transactions để hiển thị transaction mới
              await loadTransactions();
              
              // Redirect to VNPAY payment page
              if (response.paymentUrl) {
                // Show loading for a moment before redirect
                setTimeout(() => {
                  window.location.href = response.paymentUrl;
                }, 500);
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
      )}
    </div>
  );
};

// Top-up Modal Component
const TopUpModal = ({ amount, paymentMethod, onAmountChange, onPaymentMethodChange, onConfirm, onClose, loading = false }) => {
  const quickAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000];
  const minAmount = 10000;
  const maxAmount = 50000000;

  useEffect(() => {
    // Initialize Feather Icons when modal is rendered
    if (window.feather) {
      window.feather.replace();
    }
  }, []);

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
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, '');
    // Format with dots as thousand separators
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountInput = (e) => {
    const formatted = formatAmount(e.target.value);
    onAmountChange(formatted);
  };

  return (
    <div className="topup-modal-overlay" onClick={onClose}>
      <div className="topup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="topup-modal-header">
          <h2>Nạp tiền vào ví</h2>
          <button className="topup-modal-close" onClick={onClose}>
            <i data-feather="x"></i>
          </button>
        </div>

        <div className="topup-modal-content">
          {/* Step 1: Nhập số tiền */}
          <div className="topup-step">
            <label className="topup-label">Bạn muốn nạp bao nhiêu?</label>
            <div className="topup-amount-input-wrapper">
              <input
                type="text"
                className="topup-amount-input"
                placeholder="Nhập số tiền"
                value={amount}
                onChange={handleAmountInput}
                maxLength={15}
              />
              <span className="topup-currency">VNĐ</span>
            </div>
            {amount && (
              <p className="topup-amount-display">
                {parseInt(amount.replace(/\./g, '') || 0).toLocaleString('vi-VN')} VNĐ
              </p>
            )}
            <p className="topup-amount-hint">
              Số tiền từ {minAmount.toLocaleString('vi-VN')} VNĐ đến {maxAmount.toLocaleString('vi-VN')} VNĐ
            </p>

            {/* Quick amount buttons */}
            <div className="topup-quick-amounts">
              {quickAmounts.map((quickAmount) => {
                const formatted = quickAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                const isActive = amount === formatted || parseInt(amount.replace(/\./g, '') || 0) === quickAmount;
                return (
                  <button
                    key={quickAmount}
                    className={`topup-quick-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleAmountSelect(quickAmount)}
                  >
                    {quickAmount.toLocaleString('vi-VN')} VNĐ
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Chọn phương thức thanh toán */}
          {amount && parseInt(amount.replace(/\./g, '')) >= minAmount && (
            <div className="topup-step">
              <label className="topup-label">Chọn phương thức thanh toán</label>
              <div className="topup-payment-methods">
                <label className={`topup-payment-option ${paymentMethod === 'VNPAY' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPAY"
                    checked={paymentMethod === 'VNPAY'}
                    onChange={(e) => onPaymentMethodChange(e.target.value)}
                  />
                  <div className="payment-option-content">
                    <div className="payment-option-icon">🏦</div>
                    <div className="payment-option-info">
                      <h4>VNPAY</h4>
                      <p>Thẻ ATM / QR Code ngân hàng</p>
                    </div>
                  </div>
                </label>

                <label className={`topup-payment-option ${paymentMethod === 'MOMO' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="MOMO"
                    checked={paymentMethod === 'MOMO'}
                    onChange={(e) => onPaymentMethodChange(e.target.value)}
                  />
                  <div className="payment-option-content">
                    <div className="payment-option-icon">💜</div>
                    <div className="payment-option-info">
                      <h4>Ví Momo</h4>
                      <p>Thanh toán qua ví điện tử Momo</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="topup-modal-footer">
          <button 
            className="topup-btn-cancel" 
            onClick={onClose}
            disabled={loading}
            style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            Hủy
          </button>
          <button
            className="topup-btn-confirm"
            onClick={handleConfirm}
            disabled={loading || !amount || parseInt(amount.replace(/\./g, '')) < minAmount || parseInt(amount.replace(/\./g, '')) > maxAmount}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <div className="loading-spinner-small"></div>
                Đang chuyển sang VNPAY...
              </span>
            ) : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthWallet;


