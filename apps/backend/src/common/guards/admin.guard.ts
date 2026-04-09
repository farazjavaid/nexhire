import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has platform_admin role
    // user.roles is an array of UserRole objects with nested role
    const roles = user.roles || [];
    const hasPlatformAdminRole = roles.some((ur: any) =>
      ur.role?.name === 'platform_admin'
    );

    if (!hasPlatformAdminRole) {
      throw new ForbiddenException('Access denied: Platform admin required');
    }

    return true;
  }
}
