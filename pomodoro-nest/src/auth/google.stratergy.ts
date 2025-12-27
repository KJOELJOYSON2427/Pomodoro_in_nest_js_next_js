// src/auth/google.strategy.ts
import { Strategy ,Profile} from 'passport-github';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'github') {

    constructor(private userService: UsersService,
        private configService: ConfigService
    ) {
        super({
            clientID: configService.get('GOOGLE_CLIENT_ID') || process.env.GOOGLE_CLIENT_ID,
            clientSecret: configService.get('GOOGLE_CLIENT_SECRET') || process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: configService.get('GOOGLE_CALLBACK_URL') || process.env.GOOGLE_CALLBACK_URL,
            scope: ['email', 'profile'],
        })
    }


    async validate(accessToken: string, refreshToken: string, profile: Profile): Promise<any> {
        // profile = Github user data {id, emails, name, photos, ...}
        const { emails, displayName } = profile;

        const user = {
            email: emails[0],
            password: '',
            firstName: displayName.split(" ")[0],
            lastName: displayName.split(" ")[1]
        }

            return user;
    }
}