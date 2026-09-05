/** Foundation boundary. Authentication flows are intentionally scheduled for the next milestone. */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrivyClient } from '@privy-io/server-auth';

export type AuthIdentity = {
  provider: 'privy' | 'dev';
  subject: string;
  sessionId: string;
};

export type AuthVerifier = {
  verifyAuthorizationHeader(header: string | undefined): Promise<AuthIdentity>;
};

export class AuthenticationError extends Error {
  readonly statusCode = 401;
  readonly code = 'UNAUTHENTICATED';
}

type DevClaims = { sub: string; sid: string; exp: number; provider: 'dev' };

function bearerToken(header: string | undefined) {
  if (!header) throw new AuthenticationError('Authentication is required.');
  const match = /^Bearer ([^\s]+)$/.exec(header);
  if (!match?.[1]) throw new AuthenticationError('The authorization header is invalid.');
  return match[1];
}

function signDevPayload(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function issueDevAccessToken(subject: string, secret: string, now = Date.now()) {
  if (secret.length < 32) throw new Error('DEV_AUTH_SECRET must contain at least 32 characters.');
  const claims: DevClaims = {
    sub: subject,
    sid: `dev-${crypto.randomUUID()}`,
    exp: Math.floor(now / 1000) + 60 * 60,
    provider: 'dev',
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `dev.${payload}.${signDevPayload(payload, secret)}`;
}

function verifyDevToken(token: string, secret: string, now = Date.now()): AuthIdentity {
  const [prefix, payload, signature, extra] = token.split('.');
  if (prefix !== 'dev' || !payload || !signature || extra) {
    throw new AuthenticationError('The development token is invalid.');
  }
  const expected = Buffer.from(signDevPayload(payload, secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new AuthenticationError('The development token is invalid.');
  }
  let claims: DevClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as DevClaims;
  } catch {
    throw new AuthenticationError('The development token is invalid.');
  }
  if (claims.provider !== 'dev' || !claims.sub || !claims.sid || claims.exp <= now / 1000) {
    throw new AuthenticationError('The development token is expired or invalid.');
  }
  return { provider: 'dev', subject: claims.sub, sessionId: claims.sid };
}

export function createAuthVerifier(options: {
  privyAppId?: string;
  privyAppSecret?: string;
  privyVerificationKey?: string;
  devAuth?: { enabled: boolean; secret: string };
}): AuthVerifier {
  const privy =
    options.privyAppId && options.privyAppSecret
      ? new PrivyClient(options.privyAppId, options.privyAppSecret)
      : null;
  return {
    async verifyAuthorizationHeader(header) {
      const token = bearerToken(header);
      if (token.startsWith('dev.')) {
        if (!options.devAuth?.enabled) {
          throw new AuthenticationError('Development authentication is disabled.');
        }
        return verifyDevToken(token, options.devAuth.secret);
      }
      if (!privy) throw new AuthenticationError('Privy authentication is not configured.');
      try {
        const claims = await privy.verifyAuthToken(token, options.privyVerificationKey);
        if (claims.appId !== options.privyAppId || claims.issuer !== 'privy.io') {
          throw new Error('Unexpected token issuer or audience.');
        }
        return { provider: 'privy', subject: claims.userId, sessionId: claims.sessionId };
      } catch {
        throw new AuthenticationError('The access token is invalid or expired.');
      }
    },
  };
}

export const authFoundationStatus = 'server_verified_v1' as const;
