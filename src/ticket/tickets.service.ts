import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, OptimisticLockVersionMismatchError } from 'typeorm';
import { Ticket } from './ticket.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { DependenciesService } from '../dependency/dependencies.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
import { User } from '../user/user.entity';

const STATUS_ORDER = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private auditLogService: AuditLogService,
    private dependenciesService: DependenciesService,
  ) {}

  findByProject(projectId: number): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      where: { projectId, deletedAt: IsNull() },
    });
  }

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  async create(dto: CreateTicketDto, performedBy: number = 0): Promise<Ticket> {
    const data: Partial<Ticket> = {
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      type: dto.type,
      projectId: dto.projectId,
      assigneeId: dto.assigneeId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    };

    let autoAssigned = false;
    if (!data.assigneeId && data.projectId) {
      const assignee = await this.findLeastLoadedDeveloper(data.projectId);
      if (assignee) {
        data.assigneeId = assignee.id;
        autoAssigned = true;
      }
    }

    const newTicket = this.ticketsRepository.create(data);
    const saved = await this.ticketsRepository.save(newTicket);
    await this.auditLogService.log('CREATE', 'TICKET', saved.id, performedBy);
    if (autoAssigned) {
      await this.auditLogService.log('AUTO_ASSIGN', 'TICKET', saved.id, 0, 'SYSTEM');
    }
    return saved;
  }

  private async findLeastLoadedDeveloper(projectId: number): Promise<User | null> {
    const developers = await this.usersRepository.find({
      where: { role: 'DEVELOPER' },
      order: { id: 'ASC' },
    });
    if (developers.length === 0) return null;

    let leastLoaded: User | null = null;
    let minTickets = Infinity;

    for (const dev of developers) {
      const count = await this.ticketsRepository.count({
        where: {
          assigneeId: dev.id,
          projectId,
          status: Not('DONE'),
          deletedAt: IsNull(),
        },
      });
      if (count < minTickets) {
        minTickets = count;
        leastLoaded = dev;
      }
    }
    return leastLoaded;
  }

  async update(id: number, dto: UpdateTicketDto, performedBy: number = 0): Promise<void> {
    const ticket = await this.findOne(id);

    if (ticket.status === 'DONE') {
      throw new BadRequestException('Cannot update a ticket that is already DONE');
    }

    if (dto.status !== undefined && dto.status !== ticket.status) {
      const from = STATUS_ORDER.indexOf(ticket.status);
      const to = STATUS_ORDER.indexOf(dto.status);
      if (to < from) {
        throw new BadRequestException(
          `Cannot move status backward from ${ticket.status} to ${dto.status}`,
        );
      }
      if (dto.status === 'DONE') {
        const dependencies = await this.dependenciesService.findDependencies(id);
        const unresolved = dependencies.filter(
          (d) => d.blockedBy && d.blockedBy.status !== 'DONE',
        );
        if (unresolved.length > 0) {
          throw new BadRequestException(
            'Cannot move ticket to DONE: it has unresolved blocking tickets',
          );
        }
      }
    }

    if (dto.title !== undefined) ticket.title = dto.title;
    if (dto.description !== undefined) ticket.description = dto.description;
    if (dto.status !== undefined) ticket.status = dto.status;
    if (dto.priority !== undefined) {
      ticket.priority = dto.priority;
      // A manual priority change resets the auto-escalation state.
      ticket.isOverdue = false;
    }
    if (dto.assigneeId !== undefined) ticket.assigneeId = dto.assigneeId;
    if (dto.dueDate !== undefined) ticket.dueDate = new Date(dto.dueDate);

    try {
      await this.ticketsRepository.save(ticket);
    } catch (e) {
      if (e instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException(
          'This ticket was modified by another user. Please reload and try again.',
        );
      }
      throw e;
    }
    await this.auditLogService.log('UPDATE', 'TICKET', id, performedBy);
  }

  async softDelete(id: number, performedBy: number = 0): Promise<void> {
    const result = await this.ticketsRepository.update(id, { deletedAt: new Date() });
    if (result.affected === 0) throw new NotFoundException(`Ticket ${id} not found`);
    await this.auditLogService.log('DELETE', 'TICKET', id, performedBy);
  }

  findDeleted(projectId: number): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      where: { projectId, deletedAt: Not(IsNull()) },
    });
  }

  async restore(id: number, performedBy: number = 0): Promise<void> {
    const result = await this.ticketsRepository.update(id, { deletedAt: null });
    if (result.affected === 0) throw new NotFoundException(`Ticket ${id} not found`);
    await this.auditLogService.log('RESTORE', 'TICKET', id, performedBy);
  }

  exportToCsv(projectId: number): Promise<string> {
    return this.findByProject(projectId).then((tickets) => {
      return stringify(
        tickets.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          type: t.type,
          assigneeId: t.assigneeId,
        })),
        { header: true },
      );
    });
  }

  async importFromCsv(
    projectId: number,
    fileBuffer: Buffer,
    performedBy: number = 0,
  ): Promise<{ created: number; failed: number; errors: string[] }> {
    const records = parse(fileBuffer, { columns: true, skip_empty_lines: true });
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const record of records) {
      try {
        await this.create(
          {
            title: record.title,
            description: record.description,
            status: record.status || 'TODO',
            priority: record.priority || 'MEDIUM',
            type: record.type || 'FEATURE',
            projectId,
            assigneeId: record.assigneeId ? Number(record.assigneeId) : undefined,
          },
          performedBy,
        );
        created++;
      } catch (e) {
        failed++;
        errors.push(`Row "${record.title}": ${(e as Error).message}`);
      }
    }

    return { created, failed, errors };
  }
}
