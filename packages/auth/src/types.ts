export interface JwtPayload {
  sub: string;
  email?: string | null;
  mobile?: string | null;
  permissions?: string[];
  roles?: string[];
}

export interface JwtRequestUser {
  id: string;
  email?: string | null;
  mobile?: string | null;
  permissions: string[];
  roles: string[];
}
