// src/common/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { PUBLIC_ROUTES } from 'src/public-routes';

// Remove @Injectable() and NestMiddleware implementation
// export function AuthMiddleware(req: Request, res: Response, next: NextFunction) {
//   // Your authentication logic here
//   const token = req.headers['authorization'];
//   const method = req.method;
//   const path = req.path;
//   if (PUBLIC_ROUTES.some(route => route.method === method && route.path === path)) {
//     return next();
//   }
  
//   if (token) {
//     // Process token
    
//     next();
//   } else {
//     // Stop the request or handle authentication failure
//     res.status(401).send({ message: 'Unauthorized' });
//   }
// }