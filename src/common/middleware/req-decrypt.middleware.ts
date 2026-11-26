import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ReqDecryptMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // If request contains encrypted payload, decrypt here
    if (req.body && req.body.encryptedPayload) {
      try {
        // Example decryption hook: can be configured with crypto service
        // req.body = decrypt(req.body.encryptedPayload);
      } catch {
        // Fallback or validation
      }
    }
    next();
  }
}
