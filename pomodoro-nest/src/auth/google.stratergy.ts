// src/auth/google.strategy.ts
import { Strategy ,Profile} from 'passport-google-oauth20';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { log } from 'console';


@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {

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


    async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {

        console.log('Profile',profile);
        
        const email =
    profile.emails && profile.emails.length > 0
      ? profile.emails[0].value
      : null;

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