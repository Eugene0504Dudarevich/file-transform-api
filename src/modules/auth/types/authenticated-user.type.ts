import type { FastifyRequest } from 'fastify';

export type AuthenticatedUser = {
  id: string;
  email: string;
};

export type AuthenticatedRequest = FastifyRequest & {
  user: AuthenticatedUser;
};
