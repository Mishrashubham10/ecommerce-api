import { Router } from 'express';
import { authorizeRoles, verifyJwt } from '../middlewares/verifyJwt.js';
import { getProductAuditLogs } from '../controllers/audit-controllers.js';

const router = Router();

// ONLY ADMIN CAN VIEW LOGS
router.get('/', verifyJwt, authorizeRoles('Admin'), getProductAuditLogs);

export default router;