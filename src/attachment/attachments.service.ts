import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './attachment.entity';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentsRepository: Repository<Attachment>,
  ) {}

  create(ticketId: number, filename: string, contentType: string, path: string): Promise<Attachment> {
    const attachment = this.attachmentsRepository.create({
      ticketId,
      filename,
      contentType,
      path,
    });
    return this.attachmentsRepository.save(attachment);
  }

  async remove(id: number): Promise<void> {
    await this.attachmentsRepository.delete(id);
  }
}
