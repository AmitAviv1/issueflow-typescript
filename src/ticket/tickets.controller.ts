import { TicketsService } from './tickets.service';
import { Ticket } from './ticket.entity';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';


@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  findByProject(@Query('projectId') projectId: string): Promise<Ticket[]> {
    return this.ticketsService.findByProject(Number(projectId));
  }

  @Roles('ADMIN')
  @Get('deleted')
  findDeleted(@Query('projectId') projectId: string): Promise<Ticket[]> {
    return this.ticketsService.findDeleted(Number(projectId));
  }

  @Get('export')
  async exportCsv(@Query('projectId') projectId: string, @Res() res: Response) {
    const csv = await this.ticketsService.exportToCsv(Number(projectId));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tickets.csv');
    res.send(csv);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.importFromCsv(Number(projectId), file.buffer, user.id);
  }

  @Get(':ticketId')
  findOne(@Param('ticketId') ticketId: string): Promise<Ticket | null> {
    return this.ticketsService.findOne(Number(ticketId));
  }

  @Post()
  create(@Body() body: CreateTicketDto, @CurrentUser() user: AuthUser): Promise<Ticket> {
    return this.ticketsService.create(body, user.id);
  }

  @Patch(':ticketId')
  update(
    @Param('ticketId') ticketId: string,
    @Body() body: UpdateTicketDto,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.ticketsService.update(Number(ticketId), body, user.id);
  }

  @Delete(':ticketId')
  softDelete(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.ticketsService.softDelete(Number(ticketId), user.id);
  }

  @Roles('ADMIN')
  @Post(':ticketId/restore')
  restore(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.ticketsService.restore(Number(ticketId), user.id);
  }
}
