import { Router } from 'express';
import {
  createUser,
  getCurrentUser,
  getUser,
  getUsers,
  deleteUser,
  updateUser,
} from '../controllers/user.controllers.js';
import { authorizeRoles, verifyJwt } from '../middlewares/verifyJwt.js';

const router = Router();

// CREATE USER
router.post('/admin/create', verifyJwt, authorizeRoles('Admin'), createUser);
// GET CURRENT USER
router.get('/me', verifyJwt, getCurrentUser);
// GET USERS
router.get('/admin', verifyJwt, authorizeRoles('Admin'), getUsers);
// GET A SINGLE USER
router.get('/:id', verifyJwt, getUser);
// UPDATE USER
router.put('/admin/:id', verifyJwt, authorizeRoles('Admin'), updateUser);
// DELETE USER
router.delete('/admin/:id', verifyJwt, authorizeRoles('Admin'), deleteUser);

export default router;