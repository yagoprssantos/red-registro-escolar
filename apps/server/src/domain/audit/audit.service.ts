import { createEntityRow, listEntityRows } from "../../db";

export class AuditService {
  static async log(params: {
    userId: number | null;
    action: string;
    entity: string;
    entityId?: number;
    changes?: string;
    schoolId?: number;
    ipAddress?: string;
  }) {
    try {
      await createEntityRow("auditLogs", {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        changes: params.changes || null,
        schoolId: params.schoolId || null,
        ipAddress: params.ipAddress || null,
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  }

  static async listLogs(
    schoolId: number,
    filters?: {
      userId?: number;
      entity?: string;
      action?: string;
    }
  ) {
    const filterObj: Record<string, string | number | boolean | null | undefined> = { schoolId };
    if (filters?.userId) filterObj.userId = filters.userId;
    if (filters?.entity) filterObj.entity = filters.entity;
    if (filters?.action) filterObj.action = filters.action;

    return await listEntityRows("auditLogs", {
      filters: filterObj,
      limit: 100,
      orderBy: "createdAt",
      orderDirection: "desc",
    });
  }
}
