import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as cookie from 'cookie';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          if (!req?.headers?.cookie) return null;

          const cookies = cookie.parse(req.headers.cookie);
          console.log('access_token hhere:', cookies['access_token']);

          return cookies['access_token'] ?? null;
        },
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });

    console.log('JwtStrategy registered');
  }

  async validate(payload: any) {
    console.log('✅ validate called');
    console.log('Payload:', payload);

    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}
