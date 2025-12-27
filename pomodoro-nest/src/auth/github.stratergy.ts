// src/auth/google.strategy.ts
import { Strategy } from 'passport-github';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {

    constructor(private userService: UsersService,
        private configService: ConfigService
    ) {
        console.log(configService.get('GITHUB_CLIENT_ID'));
        super({
            clientID: configService.get('GITHUB_CLIENT_ID') || process.env.GITHUB_CLIENT_ID,
            clientSecret: configService.get('GITHUB_CLIENT_SECRET') || process.env.GITHUB_CLIENT_SECRET,
            callbackURL: configService.get('GITHUB_CALLBACK_URL') || process.env.GITHUB_CALLBACK_URL,
            scope: ['user:email'],
        })
    }


    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: Function,
    ): Promise<any> {

        const email =
            profile.emails?.[0]?.value ?? null;

        const displayName = profile.displayName ?? '';

        const [firstName, lastName] = displayName.split(' ');

        const user = {
            email,
            password: '',
            firstName: firstName || profile.username,
            lastName: lastName || '',
        };

        done(null, user);
    }

}