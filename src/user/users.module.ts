import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Comment } from '../comment/comment.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';


@Module({
  imports: [TypeOrmModule.forFeature([User, Comment]), AuditLogModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
