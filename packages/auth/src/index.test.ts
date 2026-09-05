import { describe, expect, it } from 'vitest';
import { AuthenticationError, createAuthVerifier, issueDevAccessToken } from './index.js';

const secret = 'development-only-secret-with-32-chars';

describe('development access tokens', () => {
  it('round trips an authenticated subject', async () => {
    const verifier = createAuthVerifier({ devAuth: { enabled: true, secret } });
    const identity = await verifier.verifyAuthorizationHeader(
      `Bearer ${issueDevAccessToken('builder', secret)}`,
    );
    expect(identity).toMatchObject({ provider: 'dev', subject: 'builder' });
  });

  it('rejects expiry and disabled dev auth', async () => {
    const verifier = createAuthVerifier({ devAuth: { enabled: true, secret } });
    await expect(
      verifier.verifyAuthorizationHeader(`Bearer ${issueDevAccessToken('builder', secret, 0)}`),
    ).rejects.toBeInstanceOf(AuthenticationError);
    await expect(
      createAuthVerifier({ devAuth: { enabled: false, secret } }).verifyAuthorizationHeader(
        `Bearer ${issueDevAccessToken('builder', secret)}`,
      ),
    ).rejects.toBeInstanceOf(AuthenticationError);
  });
});
