import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDTO } from './dto/login.dto';
import { User } from 'src/users/entities/user.entity';
import { twoFAService } from './2fa.service';


@Injectable()
export class AuthService {
   


    constructor(private readonly usersService: UsersService,
        private readonly jwtService: JwtService, // Assuming you have JwtService injected for token generation
        private readonly twoFAService: twoFAService
    ) { }
    async register(createUserDTO: CreateUserDto) {

        // encyrpt the user password here
        // For example, using bcrypt:
        const hashedPassword = await bcrypt.hash(createUserDTO.password, 10);
        createUserDTO.password = hashedPassword;

        const user = await this.usersService.createUser(createUserDTO);
        return this.jwtService.sign({ id: user.id, email: user.email }); // Generate JWT token after user creation
    }

    async login(loginDTO: LoginDTO) {
        const user = await this.usersService.findUserByEmail(loginDTO.email);
        // if user does not exist or password is incorrect, throw an error
        if (!user || !(await bcrypt.compare(loginDTO.password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // 🔐 2FA ENABLED → NO TOKEN
        if (user.isTwoFactorEnabled) {
            return {
                twoFactorRequired: true,
                userId: user.id,
            };
        }
        // eslint-disable-next-line prettier/prettier
        // 🔑 2FA NOT ENABLED → ISSUE TOKEN
        const token = this.jwtService.sign({
            sub: user.id,
            email: user.email,
        });

        return {
            token,
            twoFactorRequired: false,
        };
    }


    async loginWithGoogle(userData: User) {
        let user = await this.usersService.findUserByEmail(userData.email);
        if (!user) {
            user = await this.usersService.createUser(userData);
        }

        return this.jwtService.sign({ id: user.id, email: user.email })
    }

    async loginWithGithub(userData: User) {
        let user = await this.usersService.findUserByEmail(userData.email);
        if (!user) {
            user = await this.usersService.createUser(userData);
        }

        return this.jwtService.sign({ id: user.id, email: user.email })
    }

    async verifyTwoFactorCode(userData: User, code: string) {
        const user = await this.usersService.findUserByEmail(userData.email);

        if (!user || !user.twoFactorSecret) {
            throw new BadRequestException('2FA not initiated');
        }
        
        console.log("user.twoFactorSecret:", user.twoFactorSecret);
        const isValid = await this.twoFAService.verifyTwoFactorCode(
            user.twoFactorSecret,
            code,
        );
        console.log("isValid", isValid);
        

        if (!isValid) {
            throw new BadRequestException('Invalid 2FA code');
        }

        // ✅ MARK AS VERIFIED
        await this.usersService.updateTwoFactorVerify(user.id, {
            isTwoFactorVerified: true,
        });

        return {
            message: 'OTP verified successfully',
        };
    }


    async enableTwoFactor(email: string) {

        const user = await this.usersService.findUserByEmail(email);

        if (!user) {
            throw new BadRequestException('User not found');
        }
        if (!user.twoFactorSecret) {
            throw new BadRequestException('2FA secret not found. Generate secret first.');
        }
        // 🔐 ENABLE 2FA HERE
        await this.usersService.updateTwoFactorStatus(user.id, true);

        return {
            message: 'Two-factor authentication enabled',
        };
    }

     async generateJwt(user: User) {
        const token = this.jwtService.sign({
            sub: user.id,
            email: user.email,
        });

        return {
            token,
        }
    }

}