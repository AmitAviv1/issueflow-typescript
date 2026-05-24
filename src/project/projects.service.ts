import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Project } from './project.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { Ticket } from '../ticket/ticket.entity';
import { User } from '../user/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private auditLogService: AuditLogService,
  ) {}

  findAll(): Promise<Project[]> {
    return this.projectsRepository.find({ where: { deletedAt: IsNull() } });
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async create(dto: CreateProjectDto, performedBy: number = 0): Promise<Project> {
    const owner = await this.usersRepository.findOne({ where: { id: dto.ownerId } });
    if (!owner) {
      throw new NotFoundException(`Owner user ${dto.ownerId} not found`);
    }
    const newProject = this.projectsRepository.create(dto);
    const saved = await this.projectsRepository.save(newProject);
    await this.auditLogService.log('CREATE', 'PROJECT', saved.id, performedBy);
    return saved;
  }

  async update(id: number, dto: UpdateProjectDto, performedBy: number = 0): Promise<void> {
    const result = await this.projectsRepository.update(id, dto);
    if (result.affected === 0) throw new NotFoundException(`Project ${id} not found`);
    await this.auditLogService.log('UPDATE', 'PROJECT', id, performedBy);
  }

  async softDelete(id: number, performedBy: number = 0): Promise<void> {
    const project = await this.projectsRepository.findOne({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    if (project.deletedAt) {
      throw new BadRequestException(`Project ${id} is already deleted`);
    }
    await this.projectsRepository.update(id, { deletedAt: new Date() });
    await this.auditLogService.log('DELETE', 'PROJECT', id, performedBy);
  }

  findDeleted(): Promise<Project[]> {
    return this.projectsRepository.find({ where: { deletedAt: Not(IsNull()) } });
  }

  async restore(id: number, performedBy: number = 0): Promise<void> {
    const project = await this.projectsRepository.findOne({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    if (!project.deletedAt) {
      throw new BadRequestException(`Project ${id} is not deleted, nothing to restore`);
    }
    await this.projectsRepository.update(id, { deletedAt: null });
    await this.auditLogService.log('RESTORE', 'PROJECT', id, performedBy);
  }

  async getWorkload(projectId: number) {
    const developers = await this.usersRepository.find({
      where: { role: 'DEVELOPER' },
      order: { id: 'ASC' },
    });

    const workload = [];
    for (const dev of developers) {
      const openTicketCount = await this.ticketsRepository.count({
        where: {
          assigneeId: dev.id,
          projectId,
          status: Not('DONE'),
          deletedAt: IsNull(),
        },
      });
      workload.push({
        userId: dev.id,
        username: dev.username,
        openTicketCount,
      });
    }

    workload.sort((a, b) => a.openTicketCount - b.openTicketCount);
    return workload;
  }
}
