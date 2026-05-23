import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { Ticket } from '../ticket/ticket.entity';
import { User } from '../user/user.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Project, Ticket, User]), AuditLogModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
