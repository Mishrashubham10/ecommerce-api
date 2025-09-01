import express from 'express';
import {
  getMonthlySales,
  getOrdersByCategory,
  getTopProducts,
  getTopSellingProducts,
  getTopSpendingUsers,
  getTopUsers,
  getTotalRevenue,
} from '../controllers/analytic-controllers.js';
import { authorizeRoles, verifyJwt } from '../middlewares/verifyJwt.js';

const router = express.Router();

router.get('/revenue', verifyJwt, authorizeRoles('Admin'), getTotalRevenue);
router.get(
  '/top-products',
  verifyJwt,
  authorizeRoles('Admin'),
  getTopSellingProducts
);
router.get(
  '/top-users',
  verifyJwt,
  authorizeRoles('Admin'),
  getTopSpendingUsers
);
router.get(
  '/monthly-sales',
  verifyJwt,
  authorizeRoles('Admin'),
  getMonthlySales
);
// router.get('/top-products', verifyJwt, authorizeRoles('Admin'), getTopProducts);
// router.get('/top-users', verifyJwt, authorizeRoles('Admin'), getTopUsers);
router.get(
  '/orders-by-category',
  verifyJwt,
  authorizeRoles('Admin'),
  getOrdersByCategory
);

export default router;