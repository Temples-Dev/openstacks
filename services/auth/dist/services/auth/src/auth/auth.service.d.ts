import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Session } from './entities/session.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginResponse } from '@shellnexa/types';
export declare class AuthService {
    private readonly userRepository;
    private readonly sessionRepository;
    private readonly jwtService;
    private readonly configService;
    constructor(userRepository: Repository<User>, sessionRepository: Repository<Session>, jwtService: JwtService, configService: ConfigService);
    validateUser(username: string, password: string): Promise<User | null>;
    login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResponse>;
    register(registerDto: RegisterDto): Promise<User>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        expiresIn: number;
    }>;
    logout(refreshToken: string): Promise<{
        success: boolean;
    }>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{
        success: boolean;
    }>;
    verifyEmail(token: string): Promise<{
        success: boolean;
    }>;
}
