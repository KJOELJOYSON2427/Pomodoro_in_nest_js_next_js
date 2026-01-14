import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';

@Injectable()
export class JwtWsGaurd extends AuthGuard('jwt') {
  

  getRequest(context: ExecutionContext) {
      const client = context.switchToWs().getClient();

       // Passport expects something like a "request"
    return {
      headers: {
        cookie: client.handshake.headers.cookie,
        authorization: client.handshake.headers.authorization,
      },
    };



    
  }


  handleRequest(err, user) {
    if (err || !user) {
      throw new WsException('Unauthorized');
    }

    return user;
  }
}
