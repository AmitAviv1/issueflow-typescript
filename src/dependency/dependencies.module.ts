import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dependency } from './dependency.entity';
import { DependenciesService } from './dependencies.service';
import { DependenciesController } from './dependencies.controller';
import { Ticket } from '../ticket/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dependency, Ticket])],
  controllers: [DependenciesController],
  providers: [DependenciesService],
  exports: [DependenciesService],
})
export class DependenciesModule {}
