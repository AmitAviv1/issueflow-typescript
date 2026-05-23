import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from './create-user.dto';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
