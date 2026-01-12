import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {




    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>
    ) { }

    async createUser(data: CreateUserDto): Promise<User> {
        const newUser = this.userRepository.create(data);
        return await this.userRepository.save(newUser);
    }

    // Example method to find a user by email
    async findUserByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }


    //  async update(id: number, secret:string): Promise<User> {
    //     const user = await this.userRepository.findOne({ where: { id } });
    //     if (!user) {
    //         throw new Error("User not found");
    //     }
    //     user.isTwoFactorEnabled=false;
    //     user.twoFactorSecret=secret;
    //     user.isTwoFactorVerified=false;
    //     return await this.userRepository.save(user);
    // }

    async update(id: number, data: Partial<User>): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new Error('User not found');
        }

        Object.assign(user, data);
        return await this.userRepository.save(user);
    }


    async updateTwoFactorStatus(id: number, isTwoFactorEnabled: boolean): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error("User not found");
        }
        user.isTwoFactorEnabled = isTwoFactorEnabled;
        return await this.userRepository.save(user);
    }


    async updateTwoFactorVerify(id: number, updateData: { isTwoFactorVerified: boolean }): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error("User not found");
        }
        user.isTwoFactorVerified = updateData.isTwoFactorVerified;
        return await this.userRepository.save(user);
    }


    async findUserById(id: number) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }
}
