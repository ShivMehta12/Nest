import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user, identity } = context.switchToHttp().getRequest();
    const currentUser = user || identity;

    if (!currentUser) {
      throw new ForbiddenException('User authentication required for role verification');
    }

    const hasRole = requiredRoles.some((role) => currentUser.role === role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Requires one of the following roles: [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
