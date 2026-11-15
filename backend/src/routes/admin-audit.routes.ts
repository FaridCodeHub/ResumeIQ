import { Router } from 'express';
import { getAdminAuditLogsController } from '../controllers/admin-audit.routes.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.get(
  '/',
  authenticate,
  authorizeRoles('admin'),
  getAdminAuditLogsController,
);

export default router;