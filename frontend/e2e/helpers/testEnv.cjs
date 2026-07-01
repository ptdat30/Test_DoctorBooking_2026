'use strict';

function getTestBaseUrl() {
  return process.env.TEST_BASE_URL || 'http://localhost:5173';
}

function walletPaymentResultUrl(query = '') {
  const base = getTestBaseUrl().replace(/\/$/, '');
  return `${base}/patient/wallet/payment/result${query ? `?${query}` : ''}`;
}

module.exports = {
  getTestBaseUrl,
  walletPaymentResultUrl,
};
