import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Comment } from '../comment/comment.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    private auditLogService: AuditLogService,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto, performedBy: number = 0): Promise<User> {
    const newUser = this.usersRepository.create(dto);
    const saved = await this.usersRepository.save(newUser);
    await this.auditLogService.log('CREATE', 'USER', saved.id, performedBy);
    return saved;
  }

  async update(id: number, dto: UpdateUserDto, performedBy: number = 0): Promise<void> {
    const result = await this.usersRepository.update(id, dto);
    if (result.affected === 0) throw new NotFoundException(`User ${id} not found`);
    await this.auditLogService.log('UPDATE', 'USER', id, performedBy);
  }

  async remove(id: number, performedBy: number = 0): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`User ${id} not found`);
    await this.auditLogService.log('DELETE', 'USER', id, performedBy);
  }

  async getMentions(userId: number, page: number = 1, pageSize: number = 10) {
    const [data, total] = await this.commentsRepository
      .createQueryBuilder('comment')
      .innerJoin('comment.mentionedUsers', 'user', 'user.id = :userId', { userId })
      .leftJoinAndSelect('comment.mentionedUsers', 'mentionedUser')
      .orderBy('comment.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page };
  }
}
