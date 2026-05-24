import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Attachment } from './attachment.entity';
import { Ticket } from '../ticket/ticket.entity';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentsRepository: Repository<Attachment>,
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
  ) {}

  async create(ticketId: number, filename: string, contentType: string, path: string): Promise<Attachment> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId, deletedAt: IsNull() },
    });
    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

    const attachment = this.attachmentsRepository.create({
      ticketId,
      filename,
      contentType,
      path,
    });
    return this.attachmentsRepository.save(attachment);
  }

  async remove(id: number): Promise<void> {
    const result = await this.attachmentsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Attachment ${id} not found`);
    }
  }
}
