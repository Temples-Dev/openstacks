import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, req: any): Promise<import("@shellnexa/types").LoginResponse>;
    register(registerDto: RegisterDto): Promise<import("../users/entities/user.entity").User>;
    refresh(body: {
        refreshToken: string;
    }): Promise<{
        accessToken: string;
        expiresIn: number;
    }>;
    logout(body: {
        refreshToken: string;
    }): Promise<{
        success: boolean;
    }>;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        success: boolean;
    }>;
    verifyEmail(token: string): Promise<{
        success: boolean;
    }>;
    getProfile(req: any): Promise<{
        user: any;
    }>;
}
