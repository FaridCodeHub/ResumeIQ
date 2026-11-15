import type { PoolClient } from 'pg';
import { pool } from '../../config/db.js';
export type AdminAuditAction =
  | 'skill_created'
  | 'skill_updated'
  | 'skill_activated'
  | 'skill_deactivated'
  | 'skill_alias_added'
  | 'review_approved'
  | 'review_mapped'
  | 'review_rejected';

export type AdminAuditEntity = 'skill' | 'skill_review';

interface CreateAdminAuditLogInput {
  adminUserId: string;
  action: AdminAuditAction;
  entityType: AdminAuditEntity;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  description?: string | null;
}

export async function createAdminAuditLog(
  client: PoolClient,
  input: CreateAdminAuditLogInput,
): Promise<void> {
  await client.query(
    `
      INSERT INTO admin_audit_logs (
        admin_user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      input.adminUserId,
      input.action,
      input.entityType,
      input.entityId,
      input.oldValues
        ? JSON.stringify(input.oldValues)
        : null,
      input.newValues
        ? JSON.stringify(input.newValues)
        : null,
      input.description ?? null,
    ],
  );
}

export interface GetAdminAuditLogsInput {
  page: number;
  limit: number;
  action?: AdminAuditAction;
  entityType?: AdminAuditEntity;
}

export async function getAdminAuditLogs(input: GetAdminAuditLogsInput) {
  const { page, limit, action, entityType } = input;

  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (action) {
    values.push(action);
    conditions.push(`a.action = $${values.length}`);
  }

  if (entityType) {
    values.push(entityType);
    conditions.push(`a.entity_type = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const countResult = await pool.query(
    `
      SELECT COUNT(*)::INTEGER AS total
      FROM admin_audit_logs a
      ${whereClause}
    `,
    values,
  );

  const total = countResult.rows[0].total as number;

  const dataValues = [...values, limit, offset];

  const logsResult = await pool.query(
    `
      SELECT
        a.audit_id,
        a.admin_user_id,
        u.name AS admin_name,
        u.email AS admin_email,
        a.action,
        a.entity_type,
        a.entity_id,
        a.old_values,
        a.new_values,
        a.description,
        a.created_at
      FROM admin_audit_logs a
      LEFT JOIN users u ON u.user_id = a.admin_user_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${dataValues.length - 1}
      OFFSET $${dataValues.length}
    `,
    dataValues,
  );

  return {
    logs: logsResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}