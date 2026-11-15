import type { Request, Response } from 'express';
import { getAdminAuditLogs } from '../services/analysis/admin-audit.service.js';

export async function getAdminAuditLogsController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);

    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 20),
    );

    const action =
      typeof req.query.action === 'string'
        ? req.query.action
        : undefined;

    const entityType =
      typeof req.query.entityType === 'string'
        ? req.query.entityType
        : undefined;

    const result = await getAdminAuditLogs({
      page,
      limit,
      action: action as any,
      entityType: entityType as any,
    });

    res.status(200).json({
      success: true,
      message: 'Audit logs retrieved successfully.',
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get admin audit logs error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs.',
    });
  }
}