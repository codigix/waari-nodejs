
// const express = require('express');
// const router = express.Router();
// const AccountController = require('../controllers/accounts/AccountController');

// // Verify controller methods are available
// console.log('AccountController methods:', {
//   accountLogin: typeof AccountController.accountLogin,
//   confirmPayList: typeof AccountController.confirmPayList,
//   // Add other methods as needed
// });

// // Account login
// router.post('/account-login', (req, res) => AccountController.accountLogin(req, res));

// // Confirmed payments listing
// router.get('/confirm-pay-list', (req, res) => AccountController.confirmPayList(req, res));

// // Pending payments listing
// router.get('/pay-pending-list', (req, res) => AccountController.payPendingList(req, res));

// // Update payment status
// router.post('/update-pay-status', (req, res) => AccountController.updatePayStatus(req, res));

// // View new payment
// router.post('/view-new-pay', (req, res) => AccountController.viewNewPay(req, res));

// // View new payment details
// router.post('/view-new-pay-details', (req, res) => AccountController.viewNewPayDetails(req, res));

// // View receipt
// router.post('/view-receipt', (req, res) => AccountController.viewReceipt(req, res));

// // View invoice (group tour)
// router.post('/view-invoice', (req, res) => AccountController.viewInvoice(req, res));

// // Pending card purchase
// router.get('/pending-card-purchase', (req, res) => AccountController.pendingCardPurchase(req, res));

// // Update card payment status
// router.post('/update-card-pays', (req, res) => AccountController.updateCardPays(req, res));

// // Account dashboard
// router.get('/account-dashboard', (req, res) => AccountController.accountDashboard(req, res));

// // View invoice (custom tour)
// router.post('/view-invoice-ct', (req, res) => AccountController.viewInvoiceCt(req, res));

// module.exports = router;

const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/accounts/AccountController');
const AccCTController = require('../controllers/accounts/AccTCController'); // Import the new controller

// Verify controller methods are available
console.log('AccountController methods:', {
  accountLogin: typeof AccountController.accountLogin,
  confirmPayList: typeof AccountController.confirmPayList,
  // Add other methods as needed
});

console.log('AccCTController methods:', {
  confirmPayListCT: typeof AccCTController.confirmPayListCT
});

// Account login
router.post('/account-login', (req, res) => AccountController.accountLogin(req, res));

// Confirmed payments listing
router.get('/confirm-pay-list', (req, res) => AccountController.confirmPayList(req, res));

// **Custom Tour Confirmed payments listing**
router.get('/confirm-pay-list-ct', (req, res) => AccCTController.confirmPayListCT(req, res));

// Pending payments listing
router.get('/pay-pending-list', (req, res) => AccountController.payPendingList(req, res));

// Update payment status
router.post('/update-pay-status', (req, res) => AccountController.updatePayStatus(req, res));

// View new payment
router.post('/view-new-pay', (req, res) => AccountController.viewNewPay(req, res));

// View new payment details
router.post('/view-new-pay-details', (req, res) => AccountController.viewNewPayDetails(req, res));

// View receipt
router.post('/view-receipt', (req, res) => AccountController.viewReceipt(req, res));

// View invoice (group tour)
router.post('/view-invoice', (req, res) => AccountController.viewInvoice(req, res));

// Pending card purchase
router.get('/pending-card-purchase', (req, res) => AccountController.pendingCardPurchase(req, res));

// Update card payment status
router.post('/update-card-pays', (req, res) => AccountController.updateCardPays(req, res));

// Account dashboard
router.get('/account-dashboard', (req, res) => AccountController.accountDashboard(req, res));

// View invoice (custom tour)
router.post('/view-invoice-ct', (req, res) => AccountController.viewInvoiceCt(req, res));

module.exports = router;
