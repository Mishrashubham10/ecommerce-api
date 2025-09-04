import { Router } from 'express';
import {
  getMe,
  login,
  logout,
  registerAdmin,
  registerCustomer,
  registerSeller,
} from '../controllers/auth.controllers.js';
import { verifyJwt, authorizeRoles } from '../middlewares/verifyJwt.js';

const router = Router();

// Public
router.post('/register/customer', registerCustomer);
router.post('/login', login);
router.post('/logout', logout);

// Protected (admin only)
router.post(
  '/register/seller',
  verifyJwt,
  authorizeRoles('Admin'),
  registerSeller
);
router.post(
  '/register/admin',
  verifyJwt,
  authorizeRoles('Admin'),
  registerAdmin
);

// Protected route to get current user
router.get('/me', verifyJwt, getMe);

export default router;