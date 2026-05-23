import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Ticket } from '../ticket/ticket.entity';
import { SchedulerService } from './scheduler.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Ticket]),
    AuditLogModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
