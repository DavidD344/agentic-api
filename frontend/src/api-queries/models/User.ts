export enum RoleEnum {
  STUDENT = "STUDENT",
  DOCTOR = "DOCTOR",
}
export interface SessionResponse {
  id: string;
  name: string;
  token: string;
  role: RoleEnum;
  email: string;
}

export interface SignupResponse {
  name: string;
  email: string;
  role: RoleEnum;
  createdAt: string;
  updatedAt: string;
}
export interface User {
  id: string | number;
  name: string;
  email: string;
  role: RoleEnum | string;
  createdAt: string;
  updatedAt: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export interface UpdateUserParams {
  id: string;
  nome: string;
  data_nascimento: string | null;
  cargo: RoleEnum | string;
  foto: string | null;
  cidade: string | null;
  estado: string | null;
}

export interface GetUserByIdParams {
  id: string;
}

export interface CreateUserParams {
  name: string;
  email: string;
  password: string;
  role: RoleEnum;
}
