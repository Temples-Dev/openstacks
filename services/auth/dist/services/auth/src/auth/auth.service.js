"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
const user_entity_1 = require("../users/entities/user.entity");
const session_entity_1 = require("./entities/session.entity");
let AuthService = class AuthService {
    userRepository;
    sessionRepository;
    jwtService;
    configService;
    constructor(userRepository, sessionRepository, jwtService, configService) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async validateUser(username, password) {
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
    async login(loginDto, ipAddress, userAgent) {
        const user = await this.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.userRepository.update(user.id, {
            lastLoginAt: new Date(),
        });
        const payload = {
            sub: user.id,
            username: user.username,
            email: user.email,
            roles: user.roles.map(role => role.name),
            permissions: user.permissions,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign({ sub: user.id, type: 'refresh', jti: (0, uuid_1.v4)() }, { expiresIn: loginDto.rememberMe ? '30d' : '7d' });
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
        delete user.passwordHash;
        return {
            user: user,
            accessToken,
            refreshToken,
            expiresIn: 3600,
        };
    }
    async register(registerDto) {
        const existingUser = await this.userRepository.findOne({
            where: [
                { username: registerDto.username },
                { email: registerDto.email },
            ],
        });
        if (existingUser) {
            throw new common_1.ConflictException('Username or email already exists');
        }
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);
        const user = this.userRepository.create({
            ...registerDto,
            passwordHash,
            emailVerificationToken: (0, uuid_1.v4)(),
        });
        const savedUser = await this.userRepository.save(user);
        delete savedUser.passwordHash;
        return savedUser;
    }
    async refreshToken(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken);
            if (payload.type !== 'refresh') {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const session = await this.sessionRepository.findOne({
                where: { refreshToken, isActive: true },
                relations: ['user', 'user.roles', 'user.roles.permissions'],
            });
            if (!session || session.expiresAt < new Date()) {
                throw new common_1.UnauthorizedException('Session expired');
            }
            const user = session.user;
            if (!user.isActive) {
                throw new common_1.UnauthorizedException('User account is disabled');
            }
            const newPayload = {
                sub: user.id,
                username: user.username,
                email: user.email,
                roles: user.roles.map(role => role.name),
                permissions: user.permissions,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600,
            };
            const accessToken = this.jwtService.sign(newPayload);
            await this.sessionRepository.update(session.id, {
                token: accessToken,
            });
            return {
                accessToken,
                expiresIn: 3600,
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(refreshToken) {
        await this.sessionRepository.update({ refreshToken }, { isActive: false });
        return { success: true };
    }
    async changePassword(userId, changePasswordDto) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);
        await this.userRepository.update(userId, {
            passwordHash: newPasswordHash,
        });
        await this.sessionRepository.update({ userId }, { isActive: false });
        return { success: true };
    }
    async verifyEmail(token) {
        const user = await this.userRepository.findOne({
            where: { emailVerificationToken: token },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid verification token');
        }
        await this.userRepository.update(user.id, {
            emailVerified: true,
            emailVerificationToken: null,
        });
        return { success: true };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map