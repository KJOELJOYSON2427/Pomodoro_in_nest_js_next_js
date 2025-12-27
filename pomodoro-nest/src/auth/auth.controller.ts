import { Body, Controller, Post, Req, UseGuards, Get, Res, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDTO } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import { AuthGuard } from '@nestjs/passport';
import { twoFAService } from './2fa.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UsersService,
        private twoFaService: twoFAService
    ) { }

    @Post('register')
    async register(
        @Body() createUserDto: CreateUserDto
    ): Promise<{ token: string }> {
        const token = await this.authService.register(createUserDto);
        return { token }; // Return the generated JWT token
    }

    @Post('login')
    async login(
        @Body() loginDTO: LoginDTO,
        @Res({ passthrough: true }) res: any
    ): Promise<{ message: string; twoFactorRequired?: boolean; userId?: number }> {
        const result = await this.authService.login(loginDTO);


        // 🔐 2FA ENABLED → STOP HERE
  if (result.twoFactorRequired) {
    return {
      twoFactorRequired: true,
      userId: result.userId,
      message: 'Two-factor authentication required',
    };
  }
        // return { token }; // Return the generated JWT token
        res.cookie('access_token', result.token, {
            httpOnly: true,
            sameSite: 'lax', // Use 'lax' for CSRF protection
            secure: process.env.NODE_ENV === 'production', // Set to true in production
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            path: '/', // Cookie path
        });
        return { message: 'Login successful, token set in cookie' };
    }

    @Get('profile')
    @UseGuards(AuthGuard('jwt')) // Use JWT guard to protect this route
    async profile(
        @Req() req: any
    ): Promise<{ email: string }> {
        const user = await this.userService.findUserByEmail(req.user.email);
        if (!user) {
            throw new Error('User not found');
        }
        return { email: user.email };
    }

    @Post('logout')
    async logout(
        @Res({ passthrough: true }) res: any
    ): Promise<{ message: string }> {
        res.clearCookie('access_token'); // Clear the cookie
        return { message: 'Logout successful, cookie cleared' };
    }


    @Get('google')
    @UseGuards(AuthGuard('google'))
    googleLogin() {
        // This route does almost nothing — Guard redirects to Google
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleRedirect(@Req() req,

        @Res({
            passthrough: true
        }) res) {
        // Passport already validated → user data in req.user
        // Now you create/issue your own JWT
        const user = req.user;

        const token = await this.authService.loginWithGoogle(user);


        // return { token }; // Return the generated JWT token
        res.cookie('access_token', token, {
            httpOnly: true,
            sameSite: 'lax', // Use 'lax' for CSRF protection
            secure: process.env.NODE_ENV === 'production', // Set to true in production
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            path: '/', // Cookie path
        });
        return res.redirect('http://localhost:3000/dashboard');
    }

    @Get('github')
    @UseGuards(AuthGuard('github'))
    githubLogin() {
        // This route does almost nothing — Guard redirects to Github
    }

    @Get('github/callback')
    @UseGuards(AuthGuard('github'))
    async githubRedirect(@Req() req,
        @Res({
            passthrough: true
        }) res) {
        // Passport already validated → user data in req.user
        // Now you create/issue your own JWT
        const user = req.user;

        const token = await this.authService.loginWithGithub(user);

        // return { token }; // Return the generated JWT token
        res.cookie('access_token', token, {
            httpOnly: true,
            sameSite: 'lax', // Use 'lax' for CSRF protection
            secure: process.env.NODE_ENV === 'production', // Set to true in production
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            path: '/', // Cookie path
        });
        return res.redirect('http://localhost:3000/dashboard');
    }


    @Post('/2fa/generate')
    @UseGuards(AuthGuard('jwt'))
    generate2FA(@Req() req) {
    return this.twoFaService.generateTwoFactorSecret(req.user.id);
  }

  @Post('/2fa/verify')
  @UseGuards(AuthGuard('jwt'))
  async verify2FA(@Req() req, @Body('code') code: string):Promise<{
    message: string;
}> {
     await this.authService.verifyTwoFactorCode(req.user, code);

       return {
    message: 'OTP verified successfully',
  };
}


@Post('/2fa/enable')
@UseGuards(AuthGuard('jwt'))
async enable2FA(@Req() req) :Promise<{
    message: string;
}>{
  return this.authService.enableTwoFactor(req.user.email);
}

}