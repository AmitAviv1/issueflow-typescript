import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Comment } from '../comment/comment.entity';
import { AuditLogService } from '../audit-log/audit-log.service';

const mockUser = {
  id: 1,
  username: 'jdoe',
  email: 'jdoe@example.com',
  fullName: 'John Doe',
  role: 'DEVELOPER',
};

const mockUserRepository = {
  find: jest.fn().mockResolvedValue([mockUser]),
  findOne: jest.fn().mockResolvedValue(mockUser),
  create: jest.fn().mockReturnValue(mockUser),
  save: jest.fn().mockResolvedValue(mockUser),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
};

const mockCommentRepository = {
  createQueryBuilder: jest.fn().mockReturnValue({
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  }),
};

const mockAuditLogService = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockUserRepository.findOne.mockResolvedValue(mockUser);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Comment), useValue: mockCommentRepository },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should return all users', async () => {
    const result = await service.findAll();
    expect(result).toEqual([mockUser]);
    expect(mockUserRepository.find).toHaveBeenCalled();
  });

  it('should return one user by id', async () => {
    const result = await service.findOne(1);
    expect(result).toEqual(mockUser);
    expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('should throw NotFoundException when user missing', async () => {
    mockUserRepository.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should create a user and log it', async () => {
    const result = await service.create({
      username: 'jdoe',
      email: 'jdoe@example.com',
      fullName: 'John Doe',
      role: 'DEVELOPER' as any,
    });
    expect(result).toEqual(mockUser);
    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(mockAuditLogService.log).toHaveBeenCalledWith('CREATE', 'USER', 1, 0);
  });

  it('should update a user', async () => {
    await service.update(1, { fullName: 'Jane Doe' });
    expect(mockUserRepository.update).toHaveBeenCalledWith(1, { fullName: 'Jane Doe' });
  });

  it('should throw NotFoundException when updating a missing user', async () => {
    mockUserRepository.update.mockResolvedValueOnce({ affected: 0 });
    await expect(service.update(999, { fullName: 'Nobody' })).rejects.toThrow(NotFoundException);
  });

  it('should delete a user', async () => {
    await service.remove(1);
    expect(mockUserRepository.delete).toHaveBeenCalledWith(1);
  });

  it('should return mentions for a user', async () => {
    const result = await service.getMentions(1);
    expect(result).toEqual({ data: [], total: 0, page: 1 });
  });
});
