export interface JwtPayload {
  sub: string;
  cedula: string;
  role: string;
  iat?: number;
  exp?: number;
}
