import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@Controller('tickets/:ticketId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  findByTicket(@Param('ticketId') ticketId: string) {
    return this.commentsService.findByTicket(Number(ticketId));
  }

  @Post()
  create(@Param('ticketId') ticketId: string, @Body() body: CreateCommentDto) {
    return this.commentsService.create(Number(ticketId), body.authorId, body.content);
  }

  @Patch(':commentId')
  update(
    @Param('commentId') commentId: string,
    @Body() body: UpdateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commentsService.update(Number(commentId), body.content, user.id);
  }

  @Delete(':commentId')
  remove(@Param('commentId') commentId: string, @CurrentUser() user: AuthUser) {
    return this.commentsService.remove(Number(commentId), user.id);
  }
}
