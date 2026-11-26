import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PUBLIC_ROUTES } from '../../public-routes';
import { Users } from '../../modules/users/users.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if route is decorated with @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const path = request.route?.path || request.path;

    // 2. Check legacy PUBLIC_ROUTES
    if (
      PUBLIC_ROUTES.some(
        (route) =>
          route.method.toUpperCase() === method.toUpperCase() &&
          (route.path === path || request.path.endsWith(route.path)),
      )
    ) {
      return true;
    }

    // 3. Extract and verify JWT Bearer token
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      const secret = this.configService.get<string>(
        'JWT_SECRET',
        'super_secret_nest_jwt_key_2026_change_in_production',
      );

      const payload = await this.jwtService.verifyAsync(token, { secret });

      const userId = payload.sub || payload.id;
      const user = await this.usersRepository.findOne({
        where: { id: userId, isDeleted: false },
      });

      if (!user) {
        throw new UnauthorizedException('User account not found or has been removed');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account has been deactivated');
      }

      // Attach user to both request.user and request.identity (backwards compatibility)
      request['user'] = user;
      request['identity'] = user;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
