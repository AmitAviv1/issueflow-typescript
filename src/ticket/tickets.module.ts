import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './ticket.entity';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { User } from '../user/user.entity';
import { DependenciesModule } from '../dependency/dependencies.module';


@Module({
imports: [TypeOrmModule.forFeature([Ticket, User]), AuditLogModule, DependenciesModule],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
