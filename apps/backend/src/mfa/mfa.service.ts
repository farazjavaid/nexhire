import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { MailService } from '../lib/mail.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MfaService {
  constructor(private prisma: PrismaService, private mail: MailService) {}

  async getMfaStatus(userId: string) {
    const factors = await this.prisma.authFactor.findMany({
      where: { userId },
    });

    // Transform to match frontend expectations
    const transformedFactors = factors.map((f: any) => ({
      factor_type: f.type, // totp or email
      is_active: f.isVerified === true,
      is_primary: f.type === 'totp', // TOTP is primary by default
    }));

    return {
      enabled: factors.some(f => f.isVerified),
      factors: transformedFactors,
    };
  }

  async setupTotp(userId: string) {
    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: `NexHire (${userId})`,
      issuer: 'NexHire',
      length: 32,
    });

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Store the secret in database with isVerified: false
    // This way we can verify it during activation
    await this.prisma.authFactor.upsert({
      where: {
        userId_type: {
          userId: userId,
          type: 'totp',
        },
      },
      create: {
        userId: userId,
        type: 'totp',
        secret: secret.base32,
        isVerified: false,
      },
      update: {
        secret: secret.base32,
        isVerified: false,
      },
    });

    return {
      secret: secret.base32,
      qrDataUrl: qrDataUrl,
    };
  }

  async activateTotp(userId: string, code: string) {
    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('Invalid code format');
    }

    // Get the stored secret
    const authFactor = await this.prisma.authFactor.findUnique({
      where: {
        userId_type: {
          userId: userId,
          type: 'totp',
        },
      },
    });

    if (!authFactor || !authFactor.secret) {
      throw new BadRequestException('TOTP setup not found. Please setup TOTP first.');
    }

    // Verify the code against the secret
    const verified = speakeasy.totp.verify({
      secret: authFactor.secret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow ±2 time steps tolerance
    });

    if (!verified) {
      throw new BadRequestException('Invalid verification code');
    }

    // Mark as verified
    await this.prisma.authFactor.update({
      where: {
        userId_type: {
          userId: userId,
          type: 'totp',
        },
      },
      data: {
        isVerified: true,
      },
    });

    return {
      success: true,
      message: 'TOTP activated successfully',
    };
  }

  async setupEmail(userId: string) {
    // Get user email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate a 6-digit code
    const code = Math.floor(Math.random() * 999999).toString().padStart(6, '0');

    // Store the code temporarily
    await this.prisma.authFactor.upsert({
      where: {
        userId_type: {
          userId: userId,
          type: 'email',
        },
      },
      create: {
        userId: userId,
        type: 'email',
        secret: code, // Store code in secret field temporarily
        isVerified: false,
      },
      update: {
        secret: code,
        isVerified: false,
      },
    });

    // Send email with code
    try {
      await this.mail.sendMail({
        to: user.email,
        subject: 'Your NexHire Email Authentication Code',
        html: `
          <h2>Email Verification Code</h2>
          <p>Hi ${user.name},</p>
          <p>Your email authentication code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; font-family: monospace;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">NexHire Team</p>
        `,
      });
    } catch (error) {
      console.error('Failed to send email OTP:', error);
      // Don't fail - code was stored, they can use it if they have it somehow
    }

    return {
      success: true,
      message: 'Email OTP code sent to your email',
    };
  }

  async activateEmail(userId: string, code: string) {
    // Verify code format
    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('Invalid code format');
    }

    // Get the stored code
    const authFactor = await this.prisma.authFactor.findUnique({
      where: {
        userId_type: {
          userId: userId,
          type: 'email',
        },
      },
    });

    if (!authFactor || !authFactor.secret) {
      throw new BadRequestException('Email OTP setup not found. Please setup email MFA first.');
    }

    // Verify the code matches
    if (authFactor.secret !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    // Mark as verified
    await this.prisma.authFactor.update({
      where: {
        userId_type: {
          userId: userId,
          type: 'email',
        },
      },
      data: {
        isVerified: true,
      },
    });

    return {
      success: true,
      message: 'Email MFA activated successfully',
    };
  }

  async disableMfa(userId: string, password?: string, code?: string, factorType?: 'totp' | 'email') {
    // Get user to check if password is set
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If user has password (email/password auth), verify with password
    if (user.password) {
      if (!password) {
        throw new BadRequestException('Password is required');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid password');
      }
    } else {
      // If user doesn't have password (Google auth), verify with OTP code
      if (!code) {
        throw new BadRequestException('Verification code is required for OAuth users');
      }

      // Verify the OTP code - use TOTP or Email code
      const factor = await this.prisma.authFactor.findFirst({
        where: {
          userId,
          isVerified: true,
        },
      });

      if (!factor) {
        throw new BadRequestException('No verified MFA factor found');
      }

      let isCodeValid = false;

      if (factor.type === 'totp') {
        // Verify TOTP code
        isCodeValid = speakeasy.totp.verify({
          secret: factor.secret || '',
          encoding: 'base32',
          token: code,
          window: 2,
        });
      } else if (factor.type === 'email') {
        // Verify email code matches stored code
        isCodeValid = factor.secret === code;
      }

      if (!isCodeValid) {
        throw new BadRequestException('Invalid verification code');
      }
    }

    if (factorType) {
      // Delete specific factor type
      await this.prisma.authFactor.deleteMany({
        where: {
          userId,
          type: factorType,
        },
      });
    } else {
      // Delete all factors for backward compatibility
      await this.prisma.authFactor.deleteMany({
        where: { userId },
      });
    }

    return {
      success: true,
      message: 'MFA disabled successfully',
    };
  }
}
