import { Controller, Post, Get, Body, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtGuard } from '../common/guards/jwt.guard';
import { GoogleGuard } from '../common/guards/google.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  async logout(@Request() req: any) {
    return this.authService.logout(req.user.userId);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.userId);
  }

  @Get('google')
  @UseGuards(GoogleGuard)
  async googleAuth() {
    // This route is for initiating Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleAuthCallback(@Request() req: any, @Res() res: Response) {
    const result = await this.authService.googleAuth(req.user);
    console.log('✅ Google OAuth callback - User:', result.data.email);

    // Set HttpOnly secure cookie for backend requests
    res.cookie('auth_token', result.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Build callback URL with token and user data (frontend will extract and store)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const callbackUrl = new URL(`${frontendUrl}/auth/oauth-callback`);
    callbackUrl.searchParams.set('token', result.data.token);
    callbackUrl.searchParams.set('user', JSON.stringify({
      id: result.data.id,
      email: result.data.email,
      name: result.data.name,
    }));

    const redirectUrl = callbackUrl.toString();
    console.log('🔄 Redirecting to:', redirectUrl.substring(0, 100) + '...');
    res.redirect(redirectUrl);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.password);
  }
}
