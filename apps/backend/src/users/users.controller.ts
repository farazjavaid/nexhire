import { Controller, Get, Patch, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtGuard } from '../common/guards/jwt.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtGuard)
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtGuard)
  async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Post('me/verify-email/send')
  @UseGuards(JwtGuard)
  async sendEmailVerification(@Request() req: any) {
    // TODO: Send email verification link
    return { success: true, message: 'Email verification link sent - to be implemented' };
  }

  @Get('verify-email')
  async verifyEmail(@Param('token') token: string) {
    return this.usersService.verifyEmail(token);
  }

  // ============ ADMIN ENDPOINTS ============

  @Get('admin/search')
  @UseGuards(JwtGuard, AdminGuard)
  async searchUser(@Query('email') email: string) {
    return this.usersService.searchUser(email);
  }

  @Post(':userId/roles')
  @UseGuards(JwtGuard, AdminGuard)
  async assignRole(@Param('userId') userId: string, @Body() body: { role: string }) {
    await this.usersService.assignRole(userId, body.role);
    return { success: true, message: `Role '${body.role}' assigned` };
  }

  @Delete(':userId/roles/:role')
  @UseGuards(JwtGuard, AdminGuard)
  async revokeRole(@Param('userId') userId: string, @Param('role') role: string) {
    await this.usersService.revokeRole(userId, role);
    return { success: true, message: `Role '${role}' revoked` };
  }

  @Get('admin/interviewers/pending')
  @UseGuards(JwtGuard, AdminGuard)
  async getPendingInterviewers() {
    return this.usersService.getPendingInterviewers();
  }

  @Patch(':userId/interviewer/approve')
  @UseGuards(JwtGuard, AdminGuard)
  async approveInterviewer(@Param('userId') userId: string) {
    return this.usersService.approveInterviewer(userId);
  }

  @Patch(':userId/interviewer/reject')
  @UseGuards(JwtGuard, AdminGuard)
  async rejectInterviewer(@Param('userId') userId: string) {
    return this.usersService.rejectInterviewer(userId);
  }
}
