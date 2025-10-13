import { BaseEntity, ContactInfo } from './common';

// User and authentication types
export interface User extends BaseEntity {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  roles: Role[];
  profile?: UserProfile;
}

export interface UserProfile extends BaseEntity {
  userId: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  preferences: UserPreferences;
  contactInfo?: ContactInfo;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  dueDateReminders: boolean;
  holdNotifications: boolean;
  overdueNotices: boolean;
}

export interface PrivacyPreferences {
  showReadingHistory: boolean;
  allowRecommendations: boolean;
  shareUsageData: boolean;
}

export interface Role extends BaseEntity {
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
}

export interface Permission extends BaseEntity {
  name: string;
  resource: string;
  action: string;
  description: string;
}

// Authentication
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// JWT payload
export interface JwtPayload {
  sub: string; // user ID
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

// Session
export interface Session extends BaseEntity {
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}
