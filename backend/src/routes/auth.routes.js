const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  updatePassword
} = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.patch('/update-password', protect, updatePassword);

module.exports = router; 