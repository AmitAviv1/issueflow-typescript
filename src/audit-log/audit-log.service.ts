import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  log(action: string, entityType: string, entityId: number, performedBy: number, actor: string = 'USER'): Promise<AuditLog> {
    const entry = this.auditLogRepository.create({
      action,
      entityType,
      entityId,
      performedBy,
      actor,
    });
    return this.auditLogRepository.save(entry);
  }

  findAll(filters: { entityType?: string; entityId?: number; action?: string; actor?: string }): Promise<AuditLog[]> {
    const where: any = {};
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.action) where.action = filters.action;
    if (filters.actor) where.actor = filters.actor;
    return this.auditLogRepository.find({ where });
  }
}
