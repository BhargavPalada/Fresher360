export type UserRoleType = 'ADMIN' | 'USER';

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRoleType;
  is_active: boolean;
}

export interface UpdateUserRolePayload {
  userId: string;
  role: UserRoleType;
}

export interface AdminCreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: UserRoleType;
}
