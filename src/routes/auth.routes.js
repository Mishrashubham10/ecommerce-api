import { Router } from 'express';
import {
  login,
  logout,
  refresh,
  register,
  registerSeller,
} from '../controllers/auth.controllers.js';

const router = Router();

router.post('/customer/register', register);
router.post('/seller/register', registerSeller);
router.post('/customer/register', register);
router.post('/login', login);
router.get('/refresh', refresh);
router.post('/logout', logout);

export default router;