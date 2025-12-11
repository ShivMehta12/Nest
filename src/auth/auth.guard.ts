
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config'; // <-- Inject ConfigService
import { Request } from 'express';
import { PUBLIC_ROUTES } from 'src/public-routes';
import { Users } from 'src/modules/users/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';



@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    const method = request.method;
    const path = request.route.path;

    if (PUBLIC_ROUTES.some(route => route.method === method && route.path === path)) {
      return true;
    }

    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: this.configService.get<string>('SECRET_KEY'), // <-- Use ConfigService to get SECRET_KEY
        }
      );
      request['identity'] = await this.usersRepository.findOne({ where: { id: payload.id } });
    } catch {
      console.warn('Invalid token');

      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
