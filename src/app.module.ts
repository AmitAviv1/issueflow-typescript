import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { User } from './user/user.entity';
import { UsersModule } from './user/users.module';
import { Project } from './project/project.entity';
import { ProjectsModule } from './project/projects.module';
import { Ticket } from './ticket/ticket.entity';
import { TicketsModule } from './ticket/tickets.module';
import { Comment } from './comment/comment.entity';
import { CommentsModule } from './comment/comments.module';
import { AuditLog } from './audit-log/audit-log.entity';
import { AuditLogModule } from './audit-log/audit-log.module';
import { Dependency } from './dependency/dependency.entity';
import { DependenciesModule } from './dependency/dependencies.module';
import { Attachment } from './attachment/attachment.entity';
import { AttachmentsModule } from './attachment/attachments.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AuthModule } from './auth/auth.module';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get('DB_USER', 'issueflow'),
        password: config.get('DB_PASS', 'issueflow'),
        database: config.get('DB_NAME', 'issueflow'),
        entities: [User, Project, Ticket, Comment, AuditLog, Dependency, Attachment],
        synchronize: true,
      }),
    }),
    UsersModule,
    ProjectsModule,
    TicketsModule,
    CommentsModule,
    AuditLogModule,
    DependenciesModule,
    AttachmentsModule,
    SchedulerModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
