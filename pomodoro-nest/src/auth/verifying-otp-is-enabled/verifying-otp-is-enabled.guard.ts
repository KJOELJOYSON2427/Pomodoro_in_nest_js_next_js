import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import * as cookie from 'cookie';

@Injectable()
export class VerifyingOtpIsEnabledGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    console.log("came to the request", request.headers.cookie);
    
    if(!request.headers.cookie) throw new UnauthorizedException(
        'No pending user session. Please login first.',
      );
    // Parse cookies from the request headers
    const cookies = cookie.parse(request.headers.cookie); 
    // 1. Get the cookie
    const pendingUserCookie = cookies['pending_user'] ?? null;


    // 2. Cookie doesn't exist → block
    if (!pendingUserCookie) {
      throw new UnauthorizedException(
        'No pending user session. Please login first.',
      );
    }
   

    try{
    
      // 3. Try to parse the cookie value as JSON
      //    Expected format: { userId: number }
      const pendingUser = JSON.parse(pendingUserCookie);

      // 4. Check if it has a valid userId

      if(!pendingUser?.userId || typeof pendingUser.userId !== 'number'){
        throw new Error('Invalid pending user data');
      }

      request['pendingUser'] = pendingUser;
      return true;
    }catch(error){
      // Invalid/malformed cookie → block access
      throw new UnauthorizedException(
        'Invalid or expired pending user session. Please login again.',
      );
    }
  }
}
