import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { Ticket } from './ticket.entity';
import { User } from '../user/user.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { DependenciesService } from '../dependency/dependencies.service';

const mockTicket = {
  id: 1,
  title: 'Fix login bug',
  description: 'Login fails',
  status: 'TODO',
  priority: 'HIGH',
  type: 'BUG',
  projectId: 1,
  assigneeId: 1,
  dueDate: null,
  isOverdue: false,
  deletedAt: null,
  version: 1,
};

const mockTicketRepository = {
  find: jest.fn().mockResolvedValue([mockTicket]),
  findOne: jest.fn().mockResolvedValue(mockTicket),
  create: jest.fn().mockReturnValue(mockTicket),
  save: jest.fn().mockResolvedValue(mockTicket),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
  count: jest.fn().mockResolvedValue(0),
};

const mockUserRepository = {
  find: jest.fn().mockResolvedValue([{ id: 1, username: 'jdoe', role: 'DEVELOPER' }]),
};

const mockAuditLogService = {
  log: jest.fn().mockResolvedValue(undefined),
};

const mockDependenciesService = {
  findDependencies: jest.fn().mockResolvedValue([]),
};

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockTicketRepository.findOne.mockResolvedValue(mockTicket);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: getRepositoryToken(Ticket), useValue: mockTicketRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: DependenciesService, useValue: mockDependenciesService },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  it('should return tickets by project', async () => {
    const result = await service.findByProject(1);
    expect(result).toEqual([mockTicket]);
  });

  it('should return one ticket by id', async () => {
    const result = await service.findOne(1);
    expect(result).toEqual(mockTicket);
  });

  it('should throw NotFoundException when ticket missing', async () => {
    mockTicketRepository.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should create a ticket and log it', async () => {
    const result = await service.create({
      title: 'Fix login bug',
      status: 'TODO',
      priority: 'HIGH',
      type: 'BUG',
      projectId: 1,
      assigneeId: 1,
    } as any);
    expect(result).toEqual(mockTicket);
    expect(mockAuditLogService.log).toHaveBeenCalledWith('CREATE', 'TICKET', 1, 0);
  });

  it('should auto-assign when no assigneeId provided and log AUTO_ASSIGN', async () => {
    await service.create({
      title: 'Auto assign',
      status: 'TODO',
      priority: 'MEDIUM',
      type: 'FEATURE',
      projectId: 1,
    } as any);
    expect(mockUserRepository.find).toHaveBeenCalledWith({
      where: { role: 'DEVELOPER' },
      order: { id: 'ASC' },
    });
    expect(mockAuditLogService.log).toHaveBeenCalledWith('AUTO_ASSIGN', 'TICKET', 1, 0, 'SYSTEM');
  });

  it('should reject updating a ticket that is DONE', async () => {
    mockTicketRepository.findOne.mockResolvedValueOnce({ ...mockTicket, status: 'DONE' });
    await expect(service.update(1, { title: 'new title' })).rejects.toThrow(BadRequestException);
  });

  it('should reject a backward status transition', async () => {
    mockTicketRepository.findOne.mockResolvedValueOnce({ ...mockTicket, status: 'IN_REVIEW' });
    await expect(service.update(1, { status: 'TODO' as any })).rejects.toThrow(BadRequestException);
  });

  it('should reject moving to DONE with unresolved blockers', async () => {
    mockTicketRepository.findOne.mockResolvedValueOnce({ ...mockTicket, status: 'IN_REVIEW' });
    mockDependenciesService.findDependencies.mockResolvedValueOnce([
      { blockedBy: { status: 'IN_PROGRESS' } },
    ]);
    await expect(service.update(1, { status: 'DONE' as any })).rejects.toThrow(BadRequestException);
  });

  it('should allow a valid forward status transition', async () => {
    mockTicketRepository.findOne.mockResolvedValueOnce({ ...mockTicket, status: 'TODO' });
    await service.update(1, { status: 'IN_PROGRESS' as any });
    expect(mockTicketRepository.save).toHaveBeenCalled();
    expect(mockAuditLogService.log).toHaveBeenCalledWith('UPDATE', 'TICKET', 1, 0);
  });

  it('should soft delete a ticket and log it', async () => {
    await service.softDelete(1);
    expect(mockTicketRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ deletedAt: expect.any(Date) }),
    );
    expect(mockAuditLogService.log).toHaveBeenCalledWith('DELETE', 'TICKET', 1, 0);
  });

  it('should restore a ticket and log it', async () => {
    await service.restore(1);
    expect(mockTicketRepository.update).toHaveBeenCalledWith(1, { deletedAt: null });
    expect(mockAuditLogService.log).toHaveBeenCalledWith('RESTORE', 'TICKET', 1, 0);
  });
});
