import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { JwtGuard } from '../common/guards/jwt.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('organisations')
export class OrganisationsController {
  constructor(private organisationsService: OrganisationsService) {}

  @Post()
  @UseGuards(JwtGuard)
  async createOrganisation(@Request() req: any, @Body() createOrgDto: CreateOrgDto) {
    return this.organisationsService.createOrganisation(req.user.userId, createOrgDto);
  }

  @Get('mine')
  @UseGuards(JwtGuard)
  async getMyOrganisations(@Request() req: any) {
    return this.organisationsService.getMyOrganisations(req.user.userId);
  }

  @Get('admin')
  @UseGuards(JwtGuard, AdminGuard)
  async listAllOrganisations() {
    return this.organisationsService.listAllOrganisations();
  }

  @Get('pending')
  @UseGuards(JwtGuard, AdminGuard)
  async listPendingOrganisations() {
    return this.organisationsService.listPendingOrganisations();
  }

  @Patch(':id/approve')
  @UseGuards(JwtGuard, AdminGuard)
  async approveOrganisation(@Param('id') orgId: string) {
    return this.organisationsService.approveOrganisation(orgId);
  }

  @Patch(':id/reject')
  @UseGuards(JwtGuard, AdminGuard)
  async rejectOrganisation(@Param('id') orgId: string) {
    return this.organisationsService.rejectOrganisation(orgId);
  }

  @Patch(':id/suspend')
  @UseGuards(JwtGuard, AdminGuard)
  async suspendOrganisation(@Param('id') orgId: string) {
    return this.organisationsService.suspendOrganisation(orgId);
  }

  @Delete(':id/admin-delete')
  @UseGuards(JwtGuard, AdminGuard)
  async adminDeleteOrganisation(@Param('id') orgId: string) {
    return this.organisationsService.adminDeleteOrganisation(orgId);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async getOrganisationDetails(@Param('id') orgId: string, @Request() req: any) {
    return this.organisationsService.getOrganisationDetails(orgId, req.user.userId);
  }

  @Get(':id/members')
  @UseGuards(JwtGuard)
  async getMembers(@Param('id') orgId: string) {
    return this.organisationsService.getMembers(orgId);
  }

  @Post(':id/invite')
  @UseGuards(JwtGuard)
  async invite(@Param('id') orgId: string, @Body() body: { email: string; role: string }, @Request() req: any) {
    return this.organisationsService.invite(orgId, req.user.userId, body);
  }

  @Get(':id/invites')
  @UseGuards(JwtGuard)
  async getInvites(@Param('id') orgId: string) {
    return this.organisationsService.getInvites(orgId);
  }

  @Delete(':id/invites/:inviteId')
  @UseGuards(JwtGuard)
  async deleteInvite(@Param('id') orgId: string, @Param('inviteId') inviteId: string) {
    return this.organisationsService.deleteInvite(orgId, inviteId);
  }

  @Patch(':id/members/:userId')
  @UseGuards(JwtGuard)
  async updateMember(
    @Param('id') orgId: string,
    @Param('userId') userId: string,
    @Request() req: any,
    @Body() body: { role?: string; status?: string }
  ) {
    await this.organisationsService.updateMember(orgId, req.user.userId, userId, body);
    return { success: true };
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtGuard)
  async removeMember(@Param('id') orgId: string, @Param('userId') userId: string) {
    await this.organisationsService.removeMember(orgId, userId);
    return { success: true };
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  async updateOrganisation(@Param('id') orgId: string, @Body() updateOrgDto: Partial<CreateOrgDto>, @Request() req: any) {
    return this.organisationsService.updateOrganisation(orgId, req.user.userId, updateOrgDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  async deleteOrganisation(@Param('id') orgId: string, @Request() req: any) {
    return this.organisationsService.deleteOrganisation(orgId, req.user.userId);
  }

  // Public invite endpoints (no auth required)
  @Get('invite/:token/preview')
  async getInvitePreview(@Param('token') token: string) {
    return this.organisationsService.getInvitePreview(token);
  }

  @Post('invite/:token/accept')
  async acceptInvite(@Param('token') token: string) {
    return this.organisationsService.acceptInvite(token);
  }
}
