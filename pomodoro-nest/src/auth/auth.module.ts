import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { GithubStrategy } from './github.stratergy';
import { GoogleStrategy } from './google.stratergy';
import { 2faserviceService } from './2faservice/2faservice.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
      envFilePath: '.env', // Path to your .env file})
    }),
    UsersModule,
    JwtModule.registerAsync({
    imports: [ConfigModule],
   useFactory: (config: ConfigService) => {
  const secret = config.get<string>('JWT_SECRET');
  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment!');
  }

  return {
    secret,   // ← this is the correct key name
    signOptions: {
        expiresIn: parseInt(config.get<string>('JWT_EXPIRATION_SECONDS', '3600'), 10),    
      },
  };
},
    inject: [ConfigService]
   })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy,GithubStrategy, GoogleStrategy, 2faserviceService]
})
export class AuthModule {}
