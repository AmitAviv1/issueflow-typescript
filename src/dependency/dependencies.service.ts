import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Dependency } from './dependency.entity';
import { Ticket } from '../ticket/ticket.entity';

@Injectable()
export class DependenciesService {
  constructor(
    @InjectRepository(Dependency)
    private dependenciesRepository: Repository<Dependency>,
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
  ) {}

  async addDependency(ticketId: number, blockedById: number): Promise<Dependency> {
    if (ticketId === blockedById) {
      throw new BadRequestException('A ticket cannot depend on itself');
    }

    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId, deletedAt: IsNull() },
    });
    const blocker = await this.ticketsRepository.findOne({
      where: { id: blockedById, deletedAt: IsNull() },
    });

    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);
    if (!blocker) throw new NotFoundException(`Blocking ticket ${blockedById} not found`);
    if (ticket.projectId !== blocker.projectId) {
      throw new BadRequestException('Both tickets must belong to the same project');
    }

    const existing = await this.dependenciesRepository.findOne({
      where: { ticketId, blockedById },
    });
    if (existing) {
      throw new ConflictException(
        `Ticket ${ticketId} is already blocked by ticket ${blockedById}`,
      );
    }

    const dependency = this.dependenciesRepository.create({ ticketId, blockedById });
    return this.dependenciesRepository.save(dependency);
  }

  findDependencies(ticketId: number): Promise<Dependency[]> {
    return this.dependenciesRepository.find({
      where: { ticketId },
      relations: ['blockedBy'],
    });
  }

  async removeDependency(ticketId: number, blockedById: number): Promise<void> {
    const result = await this.dependenciesRepository.delete({ ticketId, blockedById });
    if (result.affected === 0) {
      throw new NotFoundException(
        `No dependency found where ticket ${ticketId} is blocked by ticket ${blockedById}`,
      );
    }
  }
}
