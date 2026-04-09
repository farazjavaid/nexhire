import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import crypto from 'crypto';
import { PrismaService } from '../db/prisma.service';
import { PasswordUtil } from '../common/utils/password';
import { JwtPayload } from '../common/utils/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../lib/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mail: MailService,
  ) {}

  async register(data: RegisterDto) {
    const { email, password, name, role } = data;

    // Validate password
    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hash(password);

    // Determine roles to assign
    const rolesToCreate = [];
    const assignedRole = role || 'candidate';

    // If email matches platform admin email, also add platform_admin role
    if (email.toLowerCase() === (process.env.PLATFORM_ADMIN_EMAIL || '').toLowerCase()) {
      rolesToCreate.push({
        role: {
          connectOrCreate: {
            where: { name: 'platform_admin' },
            create: { name: 'platform_admin' },
          },
        },
      });
    }

    // Add primary role
    rolesToCreate.push({
      role: {
        connectOrCreate: {
          where: { name: assignedRole },
          create: { name: assignedRole },
        },
      },
    });

    // Create new user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        profile: {
          create: {},
        },
        roles: {
          create: rolesToCreate,
        },
      },
      include: {
        profile: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Extract role names - only include approved roles
    const roleNames = user.roles
      .filter(ur => ur.status !== 'pending') // Exclude pending roles (e.g., pending interviewers)
      .map(ur => ur.role.name);

    // Generate JWT token with roles
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roles: roleNames,
    });

    // Create session
    await this.prisma.authSession.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        token,
      },
    };
  }

  async login(data: LoginDto) {
    const { email, password } = data;

    // Find user
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await PasswordUtil.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if email matches platform admin email
    if (email.toLowerCase() === (process.env.PLATFORM_ADMIN_EMAIL || '').toLowerCase()) {
      const hasPlatformAdminRole = user.roles.some(ur => ur.role.name === 'platform_admin');

      // If not already a platform admin, add the role
      if (!hasPlatformAdminRole) {
        // Get or create platform_admin role
        let adminRole = await this.prisma.role.findUnique({
          where: { name: 'platform_admin' },
        });

        if (!adminRole) {
          adminRole = await this.prisma.role.create({
            data: { name: 'platform_admin' },
          });
        }

        // Add role to user
        await this.prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: adminRole.id,
          },
        });

        // Refresh user data
        user = await this.prisma.user.findUnique({
          where: { id: user.id },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        });
      }
    }

    // Extract role names - only include approved roles
    const roleNames = user.roles
      .filter(ur => ur.status !== 'pending') // Exclude pending roles (e.g., pending interviewers)
      .map(ur => ur.role.name);

    // Generate JWT token with roles
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roles: roleNames,
    });

    // Create session
    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        token,
        sessionId: session.id,
      },
    };
  }

  async logout(userId: string) {
    // Delete user sessions
    await this.prisma.authSession.deleteMany({
      where: { userId },
    });

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile,
        hasPassword: !!user.password, // true if user has password set, false if OAuth-only
        roles: user.roles.map(ur => ({
          roleId: ur.id,
          roleName: ur.role.name,
          status: ur.status, // 'approved', 'pending', 'rejected'
        })),
      },
    };
  }

  async googleAuth(googleProfile: any) {
    const { googleId, email, firstName, lastName, picture } = googleProfile;

    // Find or create OAuth account
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      // Determine roles for new user
      const rolesToCreate = [];

      // If email matches platform admin email, add platform_admin role
      if (email.toLowerCase() === (process.env.PLATFORM_ADMIN_EMAIL || '').toLowerCase()) {
        rolesToCreate.push({
          role: {
            connectOrCreate: {
              where: { name: 'platform_admin' },
              create: { name: 'platform_admin' },
            },
          },
        });
      }

      // Add default candidate role
      rolesToCreate.push({
        role: {
          connectOrCreate: {
            where: { name: 'candidate' },
            create: { name: 'candidate' },
          },
        },
      });

      // Create new user from Google profile
      user = await this.prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          emailVerified: new Date(), // Google OAuth verifies email
          profile: {
            create: {},
          },
          roles: {
            create: rolesToCreate,
          },
        },
        include: {
          profile: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    } else {
      // Check if existing user should be given platform_admin role
      if (email.toLowerCase() === (process.env.PLATFORM_ADMIN_EMAIL || '').toLowerCase()) {
        const hasPlatformAdminRole = user.roles.some(ur => ur.role.name === 'platform_admin');

        if (!hasPlatformAdminRole) {
          // Get or create platform_admin role
          let adminRole = await this.prisma.role.findUnique({
            where: { name: 'platform_admin' },
          });

          if (!adminRole) {
            adminRole = await this.prisma.role.create({
              data: { name: 'platform_admin' },
            });
          }

          // Add role to user
          await this.prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: adminRole.id,
            },
          });

          // Refresh user data
          user = await this.prisma.user.findUnique({
            where: { id: user.id },
            include: {
              roles: {
                include: {
                  role: true,
                },
              },
            },
          });
        }
      }
    }

    // Create or update OAuth account
    await this.prisma.oAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleId,
        },
      },
      update: {
        email,
        name: `${firstName} ${lastName}`,
        picture,
      },
      create: {
        userId: user.id,
        provider: 'google',
        providerAccountId: googleId,
        email,
        name: `${firstName} ${lastName}`,
        picture,
      },
    });

    // Extract role names - only include approved roles
    const roleNames = user.roles
      .filter(ur => ur.status !== 'pending') // Exclude pending roles (e.g., pending interviewers)
      .map(ur => ur.role.name);

    // Generate JWT token with roles
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roles: roleNames,
    });

    // Create session
    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      success: true,
      message: 'Google authentication successful',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        token,
        sessionId: session.id,
      },
    };
  }

  // Helper method to verify token
  verifyToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify(token);
    } catch {
      return null;
    }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    // Silent return if user doesn't exist or not active (security: no enumeration)
    if (!user || user.status !== 'active') {
      return {
        success: true,
        message: 'If that email is registered, a reset link has been sent.',
      };
    }

    const userId = user.id;

    // Mark existing tokens as used
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: { used: true },
    });

    // Generate raw token and hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60_000); // 30 minutes

    // Store hashed token
    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        token: tokenHash,
        expiresAt,
      },
    });

    // Build reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;

    // Send email
    await this.mail.sendMail({
      to: email,
      subject: 'Reset your Nexyr password',
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to set a new password. This link expires in 30 minutes.</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request this, ignore this email — your password won't change.</p>
      `,
    });

    return {
      success: true,
      message: 'If that email is registered, a reset link has been sent.',
    };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    // Validate password
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Hash the token and find it
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      select: { id: true, userId: true, used: true, expiresAt: true },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset link is invalid or has expired');
    }

    const userId = resetToken.userId;

    // Check password history (last 5)
    const history = await this.prisma.passwordHistory.findMany({
      where: { userId },
      select: { hash: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const entry of history) {
      const reused = await PasswordUtil.compare(newPassword, entry.hash);
      if (reused) {
        throw new BadRequestException('You cannot reuse a recent password');
      }
    }

    // Hash new password
    const hashedPassword = await PasswordUtil.hash(newPassword);

    // Transaction: update password, add to history, mark token used, clear sessions
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordHistory.create({
        data: { userId, hash: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      this.prisma.authSession.deleteMany({
        where: { userId },
      }),
    ]);

    return {
      success: true,
      message: 'Password updated. Please log in with your new password.',
    };
  }
}
