import { JwtTokenType } from './auth-token.type';

export type JwtPayload = {
  sub: string;
  email: string;
  tokenType: JwtTokenType;
  iat?: number;
  exp?: number;
};
