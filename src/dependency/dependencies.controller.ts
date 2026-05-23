import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { DependenciesService } from './dependencies.service';
import { CreateDependencyDto } from './dto/create-dependency.dto';

@Controller('tickets/:ticketId/dependencies')
export class DependenciesController {
  constructor(private readonly dependenciesService: DependenciesService) {}

  @Post()
  addDependency(
    @Param('ticketId') ticketId: string,
    @Body() body: CreateDependencyDto,
  ) {
    return this.dependenciesService.addDependency(Number(ticketId), body.blockedBy);
  }

  @Get()
  findDependencies(@Param('ticketId') ticketId: string) {
    return this.dependenciesService.findDependencies(Number(ticketId));
  }

  @Delete(':blockerId')
  removeDependency(
    @Param('ticketId') ticketId: string,
    @Param('blockerId') blockerId: string,
  ) {
    return this.dependenciesService.removeDependency(Number(ticketId), Number(blockerId));
  }
}
