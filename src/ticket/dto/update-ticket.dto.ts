import { IsEnum, IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';
import { TicketPriority, TicketStatus } from './create-ticket.dto';

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsNumber()
  @IsOptional()
  assigneeId?: number;

  @IsISO8601()
  @IsOptional()
  dueDate?: string;
}
