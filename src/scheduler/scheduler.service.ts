import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { Ticket } from '../ticket/ticket.entity';
import { AuditLogService } from '../audit-log/audit-log.service';

const PRIORITY_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

@Injectable()
export class SchedulerService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    private auditLogService: AuditLogService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async escalateOverdueTickets() {
    const now = new Date();
    const overdueTickets = await this.ticketsRepository.find({
      where: {
        dueDate: LessThan(now),
        deletedAt: IsNull(),
      },
    });

    for (const ticket of overdueTickets) {
      if (ticket.status === 'DONE') continue;

      const currentIndex = PRIORITY_ORDER.indexOf(ticket.priority);
      if (currentIndex === -1) continue;

      // Already CRITICAL: never escalate further, just flag as overdue.
      if (currentIndex === PRIORITY_ORDER.length - 1) {
        if (!ticket.isOverdue) {
          await this.ticketsRepository.update(ticket.id, { isOverdue: true });
        }
        continue;
      }

      const newPriority = PRIORITY_ORDER[currentIndex + 1];
      const reachedCritical = newPriority === 'CRITICAL';
      await this.ticketsRepository.update(ticket.id, {
        priority: newPriority,
        isOverdue: reachedCritical ? true : ticket.isOverdue,
      });
      await this.auditLogService.log('ESCALATE', 'TICKET', ticket.id, 0, 'SYSTEM');
    }
  }
}
