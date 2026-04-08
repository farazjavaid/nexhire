import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { MailService } from '../lib/mail.service';
import { CreateOrgDto } from './dto/create-org.dto';

@Injectable()
export class OrganisationsService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async createOrganisation(userId: string, data: CreateOrgDto) {
    // Create organisation with pending status
    const org = await this.prisma.organisation.create({
      data: {
        legalName: data.legalName,
        tradingName: data.tradingName,
        organisationType: data.organisationType,
        industry: data.industry,
        countryCode: data.countryCode,
        timezone: data.timezone || 'UTC',
        website: data.website,
        description: data.description,
        employeeRange: data.employeeRange,
        logoUrl: data.logoUrl,
        status: 'pending',
        creatorId: userId,
        members: {
          create: {
            userId: userId,
            role: 'admin',
            status: 'active',
          },
        },
      },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    // Assign org_admin role to creator
    let orgAdminRole = await this.prisma.role.findUnique({
      where: { name: 'org_admin' },
    });

    if (!orgAdminRole) {
      orgAdminRole = await this.prisma.role.create({
        data: { name: 'org_admin' },
      });
    }

    await this.prisma.userRole.create({
      data: {
        userId,
        roleId: orgAdminRole.id,
      },
    }).catch(() => {
      // Role already assigned, ignore
    });

    // Transform to match response format
    return {
      id: org.id,
      legalName: org.legalName,
      tradingName: org.tradingName,
      organisationType: org.organisationType,
      industry: org.industry,
      countryCode: org.countryCode,
      timezone: org.timezone,
      website: org.website,
      description: org.description,
      employeeRange: org.employeeRange,
      logoUrl: org.logoUrl,
      status: org.status,
      createdAt: org.createdAt,
    };
  }

  async getMyOrganisations(userId: string) {
    const orgs = await this.prisma.organisation.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
        deletedAt: null,
        status: { not: 'deleted' },
      },
      include: {
        members: {
          where: { userId },
          select: { role: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orgs.map((org) => ({
      id: org.id,
      legalName: org.legalName,
      tradingName: org.tradingName,
      organisationType: org.organisationType,
      industry: org.industry,
      logoUrl: org.logoUrl,
      myRole: org.members[0]?.role || 'member',
      myStatus: org.members[0]?.status || 'active',
      createdAt: org.createdAt,
    }));
  }

  async getOrganisationDetails(orgId: string, userId: string) {
    // Check if user is member
    const member = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: {
          organisationId: orgId,
          userId: userId,
        },
      },
    });

    if (!member) {
      throw new BadRequestException('You are not a member of this organisation');
    }

    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        invites: true,
      },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    return {
      id: org.id,
      legalName: org.legalName,
      tradingName: org.tradingName,
      organisationType: org.organisationType,
      industry: org.industry,
      countryCode: org.countryCode,
      timezone: org.timezone,
      website: org.website,
      description: org.description,
      employeeRange: org.employeeRange,
      logoUrl: org.logoUrl,
      status: org.status,
      createdAt: org.createdAt,
    };
  }

  async updateOrganisation(orgId: string, userId: string, data: Partial<CreateOrgDto>) {
    // Check if user is org admin
    const member = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: {
          organisationId: orgId,
          userId: userId,
        },
      },
    });

    if (!member || member.role !== 'admin') {
      throw new BadRequestException('Only organisation admins can update the organisation');
    }

    const org = await this.prisma.organisation.update({
      where: { id: orgId },
      data,
    });

    return {
      success: true,
      message: 'Organisation updated successfully',
      data: org,
    };
  }

  async deleteOrganisation(orgId: string, userId: string) {
    // Check if user is org admin
    const member = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: {
          organisationId: orgId,
          userId: userId,
        },
      },
    });

    if (!member || member.role !== 'admin') {
      throw new BadRequestException('Only organisation admins can delete the organisation');
    }

    // Soft delete with status
    const org = await this.prisma.organisation.update({
      where: { id: orgId },
      data: {
        deletedAt: new Date(),
        status: 'deleted',
      },
    });

    return {
      success: true,
      message: 'Organisation deleted successfully',
      data: org,
    };
  }

  // ============ MEMBERS & INVITES ============

  async getMembers(orgId: string) {
    const members = await this.prisma.organisationMember.findMany({
      where: { organisationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            roles: {
              include: { role: true }
            }
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => {
      // Get interviewer approval status if user has interviewer role
      let approvalStatus = null;
      if (m.role === 'interviewer') {
        const interviewerRole = m.user.roles.find(ur => ur.role.name === 'interviewer');
        if (interviewerRole) {
          approvalStatus = interviewerRole.status;
        }
      }

      return {
        userId: m.userId,
        firstName: m.user.name.split(' ')[0],
        lastName: m.user.name.split(' ').slice(1).join(' ') || '',
        email: m.user.email,
        avatarUrl: null, // TODO: Add profile image
        role: m.role,
        status: m.status,
        joinedAt: m.createdAt,
        createdAt: m.createdAt,
        approvalStatus: approvalStatus, // ✅ Now fetches from UserRole.status
      };
    });
  }

  async updateMember(orgId: string, requestingUserId: string, userId: string, data: { role?: string; status?: string }) {
    // Check if requesting user is org admin
    const requestingMember = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: {
          organisationId: orgId,
          userId: requestingUserId,
        },
      },
    });

    if (!requestingMember || requestingMember.role !== 'admin') {
      throw new BadRequestException('Only organisation admins can change member roles');
    }

    // Find the member to update
    const member = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: {
          organisationId: orgId,
          userId: userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Update organisation member
    await this.prisma.organisationMember.update({
      where: {
        organisationId_userId: {
          organisationId: orgId,
          userId: userId,
        },
      },
      data,
    });

    // If role is being changed to "interviewer", create approval request
    if (data.role === 'interviewer') {
      let interviewerRole = await this.prisma.role.findUnique({
        where: { name: 'interviewer' },
      });

      if (!interviewerRole) {
        interviewerRole = await this.prisma.role.create({
          data: { name: 'interviewer' },
        });
      }

      // Check if user already has interviewer role
      const existingRole = await this.prisma.userRole.findUnique({
        where: {
          userId_roleId: {
            userId: userId,
            roleId: interviewerRole.id,
          },
        },
      });

      if (!existingRole) {
        // Create new pending interviewer role
        await this.prisma.userRole.create({
          data: {
            userId: userId,
            roleId: interviewerRole.id,
            status: 'pending',
          },
        });

        // Notify platform admin
        try {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
          });

          const org = await this.prisma.organisation.findUnique({
            where: { id: orgId },
            select: { legalName: true },
          });

          const adminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'admin@nexyre.com';
          await this.mail.sendMail({
            to: adminEmail,
            subject: `New Interviewer Application: ${user.name}`,
            html: `
              <h2>New Interviewer Application</h2>
              <p><strong>${user.name}</strong> (${user.email}) has been assigned the interviewer role and requires your approval.</p>
              <p>Organization: <strong>${org.legalName}</strong></p>
              <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/interviewers">Review applications</a></p>
            `,
          });
        } catch (error) {
          console.error('Failed to send interviewer notification email:', error);
        }
      } else if (existingRole.status === 'rejected') {
        // If previously rejected, allow re-application
        await this.prisma.userRole.update({
          where: { id: existingRole.id },
          data: { status: 'pending' },
        });

        // Notify platform admin
        try {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
          });

          const org = await this.prisma.organisation.findUnique({
            where: { id: orgId },
            select: { legalName: true },
          });

          const adminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'admin@nexyre.com';
          await this.mail.sendMail({
            to: adminEmail,
            subject: `Interviewer Re-Application: ${user.name}`,
            html: `
              <h2>Interviewer Re-Application</h2>
              <p><strong>${user.name}</strong> (${user.email}) has reapplied for the interviewer role and requires your approval.</p>
              <p>Organization: <strong>${org.legalName}</strong></p>
              <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/interviewers">Review applications</a></p>
            `,
          });
        } catch (error) {
          console.error('Failed to send interviewer re-application email:', error);
        }
      }
      // If already approved, don't change the status
    }
  }

  async removeMember(orgId: string, userId: string) {
    await this.prisma.organisationMember.delete({
      where: {
        organisationId_userId: {
          organisationId: orgId,
          userId: userId,
        },
      },
    });
  }

  async invite(orgId: string, userId: string, body: { email: string; role: string }) {
    // Check org exists and is active
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    if (org.status !== 'active') {
      throw new BadRequestException('Members can only be invited after the organisation is approved and active');
    }

    // Check if user is org admin
    const member = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: {
          organisationId: orgId,
          userId: userId,
        },
      },
    });

    if (!member || member.role !== 'admin') {
      throw new BadRequestException('Only organisation admins can invite members');
    }

    // Check if email already a member
    const existing = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: {
          organisationId: orgId,
          userId: userId, // This will be the email's user ID if exists
        },
      },
    });

    // Check for pending invite
    const pendingInvite = await this.prisma.organisationInvite.findFirst({
      where: {
        organisationId: orgId,
        email: body.email.toLowerCase(),
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (pendingInvite) {
      throw new BadRequestException('An active invite already exists for this email');
    }

    // Generate token
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invite
    const invite = await this.prisma.organisationInvite.create({
      data: {
        organisationId: orgId,
        email: body.email.toLowerCase(),
        role: body.role,
        token: token,
        expiresAt: expiresAt,
      },
    });

    // Send email
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/organisations/invite/${token}`;

    try {
      await this.mail.sendMail({
        to: body.email,
        subject: `You're invited to ${org.legalName}`,
        html: `
          <h2>You're invited to join ${org.legalName}</h2>
          <p>You've been invited to join <strong>${org.legalName}</strong> as an <strong>${body.role}</strong>.</p>
          <p><a href="${inviteUrl}">Accept invitation</a></p>
          <p>This invitation expires in 7 days.</p>
        `,
      });
    } catch (error) {
      // Log error but don't fail - invite was created
      console.error('Failed to send invite email:', error);
    }

    return {
      success: true,
      message: 'Invitation sent successfully',
      data: invite,
    };
  }

  async getInvites(orgId: string) {
    const invites = await this.prisma.organisationInvite.findMany({
      where: {
        organisationId: orgId,
        status: 'pending', // Only show pending invites
      },
      orderBy: { createdAt: 'desc' },
    });

    return invites.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expiresAt,
      acceptedAt: inv.acceptedAt,
      createdAt: inv.createdAt,
      invitedBy: 'Admin', // TODO: Store inviter info
    }));
  }

  async deleteInvite(orgId: string, inviteId: string) {
    const invite = await this.prisma.organisationInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.organisationId !== orgId) {
      throw new NotFoundException('Invite not found');
    }

    await this.prisma.organisationInvite.delete({
      where: { id: inviteId },
    });

    return {
      success: true,
      message: 'Invitation cancelled',
    };
  }

  async getInvitePreview(token: string) {
    const invite = await this.prisma.organisationInvite.findUnique({
      where: { token },
      include: {
        organisation: {
          select: { id: true, legalName: true },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invitation not found');
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    if (invite.acceptedAt) {
      throw new BadRequestException('Invitation has already been accepted');
    }

    return {
      email: invite.email,
      orgName: invite.organisation.legalName,
      role: invite.role,
      expiresAt: invite.expiresAt,
    };
  }

  async acceptInvite(token: string) {
    const invite = await this.prisma.organisationInvite.findUnique({
      where: { token },
      include: {
        organisation: true,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invitation not found');
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    if (invite.acceptedAt) {
      throw new BadRequestException('Invitation has already been accepted');
    }

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already a member
    const existingMember = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: {
          organisationId: invite.organisationId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this organisation');
    }

    // Add as member
    await this.prisma.organisationMember.create({
      data: {
        organisationId: invite.organisationId,
        userId: user.id,
        role: invite.role,
        status: 'active',
      },
    });

    // Mark invite as accepted
    await this.prisma.organisationInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date(), status: 'accepted' },
    });

    // If role is interviewer, assign role with pending approval status
    if (invite.role === 'interviewer') {
      let interviewerRole = await this.prisma.role.findUnique({
        where: { name: 'interviewer' },
      });

      if (!interviewerRole) {
        interviewerRole = await this.prisma.role.create({
          data: { name: 'interviewer' },
        });
      }

      // Check if user already has interviewer role
      const existingRole = await this.prisma.userRole.findUnique({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: interviewerRole.id,
          },
        },
      });

      if (!existingRole) {
        // Create new pending interviewer role
        await this.prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: interviewerRole.id,
            status: 'pending', // Interviewer role needs platform admin approval
          },
        });

        // Notify platform admin about new interviewer application
        try {
          const adminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'admin@nexyre.com';
          await this.mail.sendMail({
            to: adminEmail,
            subject: `New Interviewer Application: ${user.name}`,
            html: `
              <h2>New Interviewer Application</h2>
              <p><strong>${user.name}</strong> (${user.email}) has accepted an interviewer invitation and requires your approval.</p>
              <p>Organization: <strong>${invite.organisation.legalName}</strong></p>
              <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/interviewers">Review applications</a></p>
            `,
          });
        } catch (error) {
          console.error('Failed to send interviewer notification email:', error);
          // Don't fail the entire operation if email fails
        }
      } else if (existingRole.status === 'rejected') {
        // If previously rejected, allow re-application
        await this.prisma.userRole.update({
          where: { id: existingRole.id },
          data: { status: 'pending' },
        });
      }
      // If already pending or approved, do nothing (maintain current status)
    }

    return {
      id: invite.organisation.id,
      legalName: invite.organisation.legalName,
      tradingName: invite.organisation.tradingName,
      organisationType: invite.organisation.organisationType,
      industry: invite.organisation.industry,
      countryCode: invite.organisation.countryCode,
      timezone: invite.organisation.timezone,
      website: invite.organisation.website,
      description: invite.organisation.description,
      employeeRange: invite.organisation.employeeRange,
      logoUrl: invite.organisation.logoUrl,
      status: invite.organisation.status,
      createdAt: invite.organisation.createdAt,
      // Clear indication of what happened
      roleAssigned: invite.role,
      interviewerApprovalRequired: invite.role === 'interviewer', // Platform admin approval needed for interviewers
    };
  }

  // ============ ADMIN ENDPOINTS ============

  async listAllOrganisations() {
    const orgs = await this.prisma.organisation.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        members: true,
        creator: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orgs.map((org) => ({
      id: org.id,
      legalName: org.legalName,
      tradingName: org.tradingName,
      organisationType: org.organisationType,
      status: org.status,
      memberCount: org.members.length,
      createdAt: org.createdAt,
      orgAdminEmail: org.creator.email,
    }));
  }

  async listPendingOrganisations() {
    const orgs = await this.prisma.organisation.findMany({
      where: {
        status: 'pending',
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        members: {
          select: { userId: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return orgs.map((org) => ({
      id: org.id,
      legalName: org.legalName,
      tradingName: org.tradingName,
      organisationType: org.organisationType,
      status: org.status,
      memberCount: org.members.length,
      createdAt: org.createdAt,
      creatorEmail: org.creator.email,
    }));
  }

  async approveOrganisation(orgId: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    if (org.status !== 'pending') {
      throw new BadRequestException('Only pending organisations can be approved');
    }

    const updated = await this.prisma.organisation.update({
      where: { id: orgId },
      data: { status: 'active' },
    });

    return {
      success: true,
      message: 'Organisation approved successfully',
      data: updated,
    };
  }

  async rejectOrganisation(orgId: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    if (org.status !== 'pending') {
      throw new BadRequestException('Only pending organisations can be rejected');
    }

    const updated = await this.prisma.organisation.update({
      where: { id: orgId },
      data: { status: 'rejected' },
    });

    return {
      success: true,
      message: 'Organisation rejected successfully',
      data: updated,
    };
  }

  async suspendOrganisation(orgId: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    const updated = await this.prisma.organisation.update({
      where: { id: orgId },
      data: { status: 'suspended' },
    });

    return {
      success: true,
      message: 'Organisation suspended successfully',
      data: updated,
    };
  }

  async adminDeleteOrganisation(orgId: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    await this.prisma.organisation.update({
      where: { id: orgId },
      data: { deletedAt: new Date(), status: 'deleted' },
    });

    return {
      success: true,
      message: 'Organisation deleted successfully',
    };
  }
}
