// src/common/interceptors/encryption.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// Import your encryption utility service here (e.g., from 'utils/crypto.service')

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  // If you need an encryption service, inject it here
  // constructor(private readonly cryptoService: CryptoService) {} 
  
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    
    // next.handle() returns the data stream from the controller
    return next.handle().pipe(
      // The 'map' operator receives the data returned by the controller method
      map(data => {
        if (!data) {
          return null; // Don't try to encrypt null
        }
        
        // --- 🔑 ENCRYPTION LOGIC GOES HERE ---
        // const encryptedData = this.cryptoService.encrypt(JSON.stringify(data)); 
        
        // For demonstration, let's just wrap it:
        const encryptedResponse = {
            encrypted: 'This is the encrypted payload based on the controller result.',
            originalLength: JSON.stringify(data).length,
        };
        
        return encryptedResponse; // The encrypted object is sent to the client
      }),
    );
  }
}