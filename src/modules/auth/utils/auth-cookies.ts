import type { FastifyReply } from 'fastify';
import { AuthCookieSameSite } from '../types/auth-cookie.type';
import { AuthTokens } from '../types/auth-token.type';
import {
  ACCESS_COOKIE_NAME,
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_COOKIE_SAME_SITE_VALUES,
  JWT_SECRET_MIN_LENGTH,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_SECONDS,
} from '../constants/auth.constants';

const getCookiesOptions = () => {
  const sameSite = process.env.AUTH_COOKIE_SAME_SITE ?? 'lax';

  if (!AUTH_COOKIE_SAME_SITE_VALUES.includes(sameSite as AuthCookieSameSite)) {
    throw new Error('Invalid AUTH_COOKIE_SAME_SITE configuration');
  }

  if (sameSite === 'none' && process.env.NODE_ENV !== 'production') {
    throw new Error(
      'SameSite=None requires a secure HTTP cookie configuration',
    );
  }

  const secure = process.env.NODE_ENV === 'production';

  if (sameSite === 'none' && !secure) {
    throw new Error('SameSite=None requires Secure=True');
  }

  return {
    httpOnly: true,
    secure,
    sameSite: sameSite as 'strict' | 'lax' | 'none',
    ...(process.env.AUTH_COOKIE_DOMAIN
      ? { domain: process.env.AUTH_COOKIE_DOMAIN }
      : {}),
  };
};

export const setAuthCookies = (
  reply: FastifyReply,
  tokens: AuthTokens,
): void => {
  const options = getCookiesOptions();

  reply.setCookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
    ...options,
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });

  reply.setCookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    ...options,
    path: '/auth',
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
};

export const clearAuthCookies = (reply: FastifyReply): void => {
  const options = getCookiesOptions();

  reply.clearCookie(ACCESS_COOKIE_NAME, {
    ...options,
    path: '/',
  });

  reply.clearCookie(REFRESH_COOKIE_NAME, {
    ...options,
    path: '/auth',
  });
};

export const getRequiredSecret = (name: string): string => {
  const secret = process.env[name];

  if (!secret || secret.length < JWT_SECRET_MIN_LENGTH) {
    throw new Error(
      `${name} must be configured with at least ${JWT_SECRET_MIN_LENGTH} length`,
    );
  }

  return secret;
};

export const getJwtSecrets = (): {
  accessSecret: string;
  refreshSecret: string;
} => {
  const accessSecret = getRequiredSecret('JWT_ACCESS_SECRET');
  const refreshSecret = getRequiredSecret('JWT_REFRESH_SECRET');

  if (accessSecret === refreshSecret) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
    );
  }

  return { accessSecret, refreshSecret };
};
