import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(): Promise<Project[]> {
    return this.projectsService.findAll();
  }

  @Roles('ADMIN')
  @Get('deleted')
  findDeleted(): Promise<Project[]> {
    return this.projectsService.findDeleted();
  }

  @Get(':projectId/workload')
  getWorkload(@Param('projectId') projectId: string) {
    return this.projectsService.getWorkload(Number(projectId));
  }

  @Get(':projectId')
  findOne(@Param('projectId') projectId: string): Promise<Project | null> {
    return this.projectsService.findOne(Number(projectId));
  }

  @Post()
  create(@Body() body: CreateProjectDto, @CurrentUser() user: AuthUser): Promise<Project> {
    return this.projectsService.create(body, user.id);
  }

  @Patch(':projectId')
  update(
    @Param('projectId') projectId: string,
    @Body() body: UpdateProjectDto,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.projectsService.update(Number(projectId), body, user.id);
  }

  @Delete(':projectId')
  softDelete(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.projectsService.softDelete(Number(projectId), user.id);
  }

  @Roles('ADMIN')
  @Post(':projectId/restore')
  restore(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.projectsService.restore(Number(projectId), user.id);
  }
}
