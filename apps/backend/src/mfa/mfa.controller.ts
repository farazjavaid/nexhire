import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('mfa')
export class MfaController {
  constructor(private mfaService: MfaService) {}

  @Get('status')
  @UseGuards(JwtGuard)
  async getMfaStatus(@Request() req: any) {
    return this.mfaService.getMfaStatus(req.user.userId);
  }

  @Post('totp/setup')
  @UseGuards(JwtGuard)
  async setupTotp(@Request() req: any) {
    return this.mfaService.setupTotp(req.user.userId);
  }

  @Post('totp/activate')
  @UseGuards(JwtGuard)
  async activateTotp(@Request() req: any, @Body() body: { code: string }) {
    return this.mfaService.activateTotp(req.user.userId, body.code);
  }

  @Post('email/setup')
  @UseGuards(JwtGuard)
  async setupEmail(@Request() req: any) {
    return this.mfaService.setupEmail(req.user.userId);
  }

  @Post('email/activate')
  @UseGuards(JwtGuard)
  async activateEmail(@Request() req: any, @Body() body: { code: string }) {
    return this.mfaService.activateEmail(req.user.userId, body.code);
  }

  @Post('disable')
  @UseGuards(JwtGuard)
  async disableMfa(@Request() req: any, @Body() body: { password?: string; code?: string; factorType?: 'totp' | 'email' }) {
    return this.mfaService.disableMfa(req.user.userId, body.password, body.code, body.factorType);
  }
}
