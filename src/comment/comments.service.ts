import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Repository, OptimisticLockVersionMismatchError } from 'typeorm';
import { Comment } from './comment.entity';
import { User } from '../user/user.entity';
import { Ticket } from '../ticket/ticket.entity';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    private auditLogService: AuditLogService,
  ) {}

  findByTicket(ticketId: number): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { ticketId },
      relations: ['mentionedUsers'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(ticketId: number, authorId: number, content: string): Promise<Comment> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId, deletedAt: IsNull() },
    });
    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

    const author = await this.usersRepository.findOne({ where: { id: authorId } });
    if (!author) throw new NotFoundException(`Author user ${authorId} not found`);

    const mentionedUsers = await this.resolveMentions(content);
    const comment = this.commentsRepository.create({ ticketId, authorId, content, mentionedUsers });
    const saved = await this.commentsRepository.save(comment);
    await this.auditLogService.log('CREATE', 'COMMENT', saved.id, authorId);
    return saved;
  }

  async update(id: number, content: string, performedBy: number = 0): Promise<void> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['mentionedUsers'],
    });
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);

    comment.content = content;
    // Re-evaluate mentions: added ones are created, removed ones dropped.
    comment.mentionedUsers = await this.resolveMentions(content);

    try {
      await this.commentsRepository.save(comment);
    } catch (e) {
      if (e instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException(
          'This comment was modified by another user. Please reload and try again.',
        );
      }
      throw e;
    }
    await this.auditLogService.log('UPDATE', 'COMMENT', id, performedBy);
  }

  async remove(id: number, performedBy: number = 0): Promise<void> {
    const result = await this.commentsRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Comment ${id} not found`);
    await this.auditLogService.log('DELETE', 'COMMENT', id, performedBy);
  }

  // Parses @username tokens and resolves them to users (case-insensitive).
  private async resolveMentions(content: string): Promise<User[]> {
    const matches = content.match(/@(\w+)/g) || [];
    const usernames = [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
    if (usernames.length === 0) return [];

    const users = await Promise.all(
      usernames.map((username) =>
        this.usersRepository.findOne({ where: { username: ILike(username) } }),
      ),
    );
    return users.filter((u): u is User => u !== null);
  }
}
