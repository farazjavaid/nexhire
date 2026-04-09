import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
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
      throw new NotFoundException('User not found');
    }

    // Transform roles array to extract just the role names
    const roleNames = user.roles.map(ur => ur.role.name);

    return {
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.profile?.phone || null,
        isEmailVerified: user.emailVerified ? true : false,
        isPhoneVerified: false,
        status: 'active',
        lastLoginAt: null,
        interestKeywords: [],
        createdAt: user.createdAt.toISOString(),
        roles: roleNames,
        profile: {
          firstName: user.name.split(' ')[0],
          lastName: user.name.split(' ').slice(1).join(' ') || '',
          preferredName: null,
          avatarUrl: user.profile?.profileImage || null,
          bio: user.profile?.bio || null,
          experienceYears: null,
          linkedinUrl: null,
          timezone: user.profile?.dateOfBirth ? 'UTC' : 'UTC',
          profileVisibility: 'private',
          resumeDocumentId: null,
          resumeFileName: null,
        },
      },
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    // Update user basic info
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        profile: {
          upsert: {
            create: {
              phone: data.phone,
              dateOfBirth: data.dateOfBirth,
              gender: data.gender,
              location: data.location,
              bio: data.bio,
              profileImage: data.profileImage,
              interestKeywords: data.interestKeywords,
            },
            update: {
              phone: data.phone,
              dateOfBirth: data.dateOfBirth,
              gender: data.gender,
              location: data.location,
              bio: data.bio,
              profileImage: data.profileImage,
              interestKeywords: data.interestKeywords,
            },
          },
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

    // Transform roles array to extract just the role names
    const roleNames = updatedUser.roles.map(ur => ur.role.name);

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phoneNumber: updatedUser.profile?.phone || null,
        isEmailVerified: updatedUser.emailVerified ? true : false,
        isPhoneVerified: false,
        status: 'active',
        lastLoginAt: null,
        interestKeywords: [],
        createdAt: updatedUser.createdAt.toISOString(),
        roles: roleNames,
        profile: {
          firstName: updatedUser.name.split(' ')[0],
          lastName: updatedUser.name.split(' ').slice(1).join(' ') || '',
          preferredName: null,
          avatarUrl: updatedUser.profile?.profileImage || null,
          bio: updatedUser.profile?.bio || null,
          experienceYears: null,
          linkedinUrl: null,
          timezone: updatedUser.profile?.dateOfBirth ? 'UTC' : 'UTC',
          profileVisibility: 'private',
          resumeDocumentId: null,
          resumeFileName: null,
        },
      },
    };
  }

  async verifyEmail(token: string) {
    // TODO: Verify email token and update emailVerified
    return {
      success: true,
      message: 'Email verified successfully - to be implemented',
    };
  }

  // ============ ADMIN ENDPOINTS ============

  async searchUser(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`No user found with email: ${email}`);
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.name.split(' ')[0],
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      status: 'active',
      roles: user.roles.map(ur => ur.role.name),
    };
  }

  async assignRole(userId: string, role: string) {
    const ASSIGNABLE_ROLES = ['org_admin', 'client', 'interviewer', 'candidate', 'internal_employee'];

    if (!ASSIGNABLE_ROLES.includes(role)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }

    // Check user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get or create role
    let roleRecord = await this.prisma.role.findUnique({
      where: { name: role },
    });

    if (!roleRecord) {
      roleRecord = await this.prisma.role.create({
        data: { name: role },
      });
    }

    // Delete existing assignable roles, then create new one
    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        role: {
          name: { in: ASSIGNABLE_ROLES },
        },
      },
    });

    // Create new user role
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId: roleRecord.id,
      },
    });
  }

  async revokeRole(userId: string, role: string) {
    const ASSIGNABLE_ROLES = ['org_admin', 'client', 'interviewer', 'candidate', 'internal_employee'];

    if (role === 'platform_admin') {
      throw new BadRequestException('Cannot revoke platform_admin role this way');
    }

    if (!ASSIGNABLE_ROLES.includes(role)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }

    // Check user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get role
    const roleRecord = await this.prisma.role.findUnique({
      where: { name: role },
    });

    if (!roleRecord) {
      throw new BadRequestException(`User does not have the ${role} role`);
    }

    // Delete user role
    const deleted = await this.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId: roleRecord.id,
      },
    });

    if (deleted.count === 0) {
      throw new BadRequestException(`User does not have the ${role} role`);
    }
  }

  async getPendingInterviewers() {
    const pending = await this.prisma.userRole.findMany({
      where: {
        role: {
          name: 'interviewer',
        },
        status: 'pending', // Only show pending approval
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return pending.map(ur => ({
      userId: ur.user.id,
      email: ur.user.email,
      firstName: ur.user.name.split(' ')[0],
      lastName: ur.user.name.split(' ').slice(1).join(' ') || '',
      avatarUrl: ur.user.profile?.profileImage,
      createdAt: ur.user.createdAt,
      appliedAt: ur.createdAt,
    }));
  }

  async approveInterviewer(userId: string) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          name: 'interviewer',
        },
        status: 'pending', // Only approve pending interviewers
      },
    });

    if (!userRole) {
      throw new NotFoundException('Pending interviewer not found');
    }

    // Update status to approved
    await this.prisma.userRole.update({
      where: { id: userRole.id },
      data: { status: 'approved' },
    });

    return {
      success: true,
      message: 'Interviewer approved',
    };
  }

  async rejectInterviewer(userId: string) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          name: 'interviewer',
        },
        status: 'pending', // Only reject pending interviewers
      },
    });

    if (!userRole) {
      throw new NotFoundException('Pending interviewer not found');
    }

    // Delete the interviewer role
    await this.prisma.userRole.delete({
      where: { id: userRole.id },
    });

    return {
      success: true,
      message: 'Interviewer rejected',
    };
  }
}
