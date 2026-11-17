import { query } from './db.js';

/**
 * Fire-and-forget audit trail. Never fails the caller's request: an audit
 * problem is logged but the primary operation still succeeds.
 */
export async function writeAudit(req, { action, entity, entityId = null, diff = null }) {
  try {
    await query(
      `insert into public.audit_logs (actor_id, actor_email, action, entity, entity_id, diff, ip)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.admin?.id || null,
        req.admin?.email || null,
        action,
        entity,
        entityId === null ? null : String(entityId),
        diff ? JSON.stringify(diff) : null,
        req.ip || null,
      ]
    );
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
}