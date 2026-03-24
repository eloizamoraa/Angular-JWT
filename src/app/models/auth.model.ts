export type UserRole = 'user' | 'admin';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  role?: string;
  rol?: string;
  username?: string;
  user?: {
    _id?: string;
    id?: string;
    name?: string;
    username?: string;
    email?: string;
    role?: string;
    rol?: string;
  };
}
