import { Router } from 'express';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  getMyOrders,
  trackOrder,
  updateMyOrder,
  cancelOrder,
} from '../controllers/order.controllers.js';
import { authorizeRoles, verifyJwt } from '../middlewares/verifyJwt.js';

const router = Router();

// ROUTES & CONTROLLERS
router.get('/', verifyJwt, authorizeRoles('Admin'), getOrders);
router.put('/:orderId', verifyJwt, authorizeRoles('Admin', 'Seller'), updateOrder);
router.delete('/:orderId', verifyJwt, authorizeRoles('Admin'), deleteOrder);

// ONLY FOR CUSTOMERS
router.get('/my-orders', verifyJwt, getMyOrders);
router.post('/', verifyJwt, createOrder);
router.put('/cancel/:orderId', verifyJwt, cancelOrder);
router.put('/update/:orderId', verifyJwt, updateMyOrder);
router.get('/track/:orderId', verifyJwt, trackOrder);
router.get('/:orderId', verifyJwt, getOrder);

export default router;