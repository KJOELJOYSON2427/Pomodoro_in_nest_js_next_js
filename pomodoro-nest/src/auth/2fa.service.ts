import { BadRequestException, Injectable } from '@nestjs/common';


import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class twoFAService {



    constructor(private userService: UsersService) {

    }
    async generateTwoFactorSecret(id: number) {
        const secret = speakeasy.generateSecret({
            name: `PomodoroApp(${id})`,
            length: 20,
        });

        await this.saveTwoFactorSecret(id, secret.base32);

        const otpauthUrl = secret.otpauth_url;

        const qrCodeDataURL = await qrcode.toDataURL(otpauthUrl);

        return {
            qrcode: qrCodeDataURL
        }
    }

    // Save secret temporarily (NOT yet enabled)
    async saveTwoFactorSecret(id: number, secret: string) {
        await this.userService.update(id, {
            twoFactorSecret: secret,
            isTwoFactorEnabled: false,
            isTwoFactorVerified: false,
        });
    }


    async verifyTwoFactorCode(userSecret: string, code: string): Promise<boolean> {

        const isValid = speakeasy.totp.verify({
            secret: userSecret,
            encodeURIng: 'base32',
            token: code,
            window: 1, // Allow a 1-step window (30 seconds before or after)
        });
        return isValid;

    }
}



