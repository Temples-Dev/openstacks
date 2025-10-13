import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, LoginResponse, JwtPayload } from '@shellnexa/types';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async validateUser(username: string, password: string): Promise<any> {
    // TODO: Implement actual user validation against auth service
    // This is a placeholder implementation
    if (username === 'admin' && password === 'password') {
      return {
        id: '1',
        username: 'admin',
        email: 'admin@shellnexa.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
      };
    }
    return null;
  }

  async login(user: any): Promise<LoginResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles || [],
      permissions: user.permissions || [],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d' }
    );

    return {
      user: user as User,
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // TODO: Fetch user from auth service
      const user = await this.getUserById(payload.sub);
      
      const newPayload: JwtPayload = {
        sub: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles || [],
        permissions: user.permissions || [],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const accessToken = this.jwtService.sign(newPayload);

      return {
        accessToken,
        expiresIn: 3600,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<{ success: boolean }> {
    // TODO: Implement token blacklisting
    return { success: true };
  }

  private async getUserById(id: string): Promise<any> {
    // TODO: Implement actual user fetching from auth service
    return {
      id,
      username: 'admin',
      email: 'admin@shellnexa.com',
      firstName: 'Admin',
      lastName: 'User',
      roles: ['admin'],
    };
  }
}
