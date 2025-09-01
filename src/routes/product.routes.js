import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  seller,
  updateProduct,
} from '../controllers/product.controllers.js';
import { authorizeRoles, verifyJwt } from '../middlewares/verifyJwt.js';

const router = Router();

// PUBLIC ROUTES
router.get('/', getProducts);
// THIS IS TO GET PRODUCTS BY SELLER PRIVATE ROUTE
router.get(
  '/seller-products',
  verifyJwt,
  authorizeRoles('Seller', 'Admin'),
  seller
);
router.get('/:id', getProduct);

// PRIVATE ROUTES
router.post('/', verifyJwt, authorizeRoles('Admin', 'Seller'), createProduct);
router.put(
  '/:id',
  verifyJwt,
  authorizeRoles('Admin', 'Seller'),
  updateProduct
);
router.delete(
  '/:id',
  verifyJwt,
  authorizeRoles('Admin', 'Seller'),
  deleteProduct
);

export default router;