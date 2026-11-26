import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const secret = this.configService.get<string>(
          'JWT_SECRET',
          'super_secret_nest_jwt_key_2026_change_in_production',
        );
        const decoded = await this.jwtService.verifyAsync(token, { secret });
        req['tokenUser'] = decoded;
      } catch {
        // If token invalid, let guard handle 401 when route is guarded
      }
    }

    next();
  }
}
