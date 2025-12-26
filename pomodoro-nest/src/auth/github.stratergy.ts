// src/auth/google.strategy.ts
import { Strategy } from 'passport-google-oauth20';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'google') {

    constructor(private userService: UsersService,
        private configService: ConfigService
    ) {
        super({
            clientID: configService.get('GITHUB_CLIENT_ID') || process.env.GITHUB_CLIENT_ID,
            clientSecret: configService.get('GITHUB_CLIENT_SECRET') || process.env.GITHUB_CLIENT_SECRET,
            callbackURL: configService.get('GITHUB_CALLBACK_URL') || process.env.GITHUB_CALLBACK_URL,
            scope: ['public_profile'],
        })
    }


    async validate(accessToken: string, refreshToken: string, profile: any, done: Function): Promise<any> {
    // This method is called after GitHub authenticates the user
    // Perform user validation/creation in your database here
    // The 'profile' object contains the user's GitHub data
 const {emails, displayName}= profile;
    const user = {
            email: emails[0],
            password: '',
            firstName: displayName.split(" ")[0],
            lastName: displayName.split(" ")[1]
        }
    done(null, user); // Pass the user object to Passport
  }
}