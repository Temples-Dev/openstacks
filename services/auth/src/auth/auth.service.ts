import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../users/entities/user.entity';
import { Session } from './entities/session.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginResponse, JwtPayload } from '@openstacks/types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: [{ username }, { email: username }],
      relations: ['roles', 'roles.permissions'],
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Generate tokens
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles.map(role => role.name),
      permissions: user.permissions,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh', jti: uuidv4() },
      { expiresIn: loginDto.rememberMe ? '30d' : '7d' }
    );

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (loginDto.rememberMe ? 30 : 7));

    const session = this.sessionRepository.create({
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
    });

    await this.sessionRepository.save(session);

    // Remove sensitive data
    delete user.passwordHash;

    return {
      user: user as any,
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  async register(registerDto: RegisterDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { username: registerDto.username },
        { email: registerDto.email },
      ],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      ...registerDto,
      passwordHash,
      emailVerificationToken: uuidv4(),
    });

    const savedUser = await this.userRepository.save(user);

    // TODO: Send email verification
    
    delete savedUser.passwordHash;
    return savedUser;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if session exists and is active
      const session = await this.sessionRepository.findOne({
        where: { refreshToken, isActive: true },
        relations: ['user', 'user.roles', 'user.roles.permissions'],
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session expired');
      }

      const user = session.user;
      if (!user.isActive) {
        throw new UnauthorizedException('User account is disabled');
      }

      // Generate new access token
      const newPayload = {
        sub: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles.map(role => role.name),
        permissions: user.permissions,
      };

      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '1h' });

      // Update session with new token
      await this.sessionRepository.update(session.id, {
        token: accessToken,
      });

      return {
        accessToken,
        expiresIn: 3600,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<{ success: boolean }> {
    await this.sessionRepository.update(
      { refreshToken },
      { isActive: false }
    );

    return { success: true };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ success: boolean }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

    // Update password
    await this.userRepository.update(userId, {
      passwordHash: newPasswordHash,
    });

    // Invalidate all sessions for security
    await this.sessionRepository.update(
      { userId },
      { isActive: false }
    );

    return { success: true };
  }

  async verifyEmail(token: string): Promise<{ success: boolean }> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.userRepository.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
    });

    return { success: true };
  }
}
