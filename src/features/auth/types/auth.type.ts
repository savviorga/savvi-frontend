export interface User {
  id: string;
  name: string;
  email: string;
  twoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

/** Con 2FA activo, el login no da sesión: envía un código al email. */
export interface TwoFactorChallenge {
  requiresTwoFactor: true;
  twoFactorToken: string;
  expiresIn: number;
}

/** `POST /auth/login` */
export type LoginResponse =
  | (AuthResponse & { requiresTwoFactor: false })
  | TwoFactorChallenge;

export interface VerifyTwoFactorDto {
  twoFactorToken: string;
  code: string;
}

export interface ResendTwoFactorDto {
  twoFactorToken: string;
}

export interface CodeSentResponse {
  message: string;
  expiresIn: number;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface VerifyResetCodeDto {
  email: string;
  code: string;
}

export interface VerifyResetCodeResponse {
  resetToken: string;
  expiresIn: number;
}

export interface ResetPasswordDto {
  resetToken: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}
