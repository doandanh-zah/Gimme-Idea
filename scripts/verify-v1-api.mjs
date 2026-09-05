const base = process.env.API_URL ?? 'http://127.0.0.1:3011';
const fail = (message) => {
  throw new Error(message);
};
async function request(path, init = {}) {
  const response = await fetch(`${base}${path}`, init);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) fail(`${init.method ?? 'GET'} ${path} returned ${response.status}: ${text}`);
  return body;
}

const mock = await request('/v1/auth/mock', { method: 'POST' });
const headers = { authorization: `Bearer ${mock.accessToken}`, 'content-type': 'application/json' };
const authHeaders = { authorization: `Bearer ${mock.accessToken}` };
const actor = await request('/v1/me/sync', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    username: mock.user.username,
    displayName: mock.user.displayName,
    rewardWalletAddress: mock.wallet.address,
  }),
});
const suffix = Date.now().toString(36);
const problem = await request('/v1/problems', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    title: `Cross-device cold-chain coordination ${suffix}`,
    summary:
      'Small operators cannot share live capacity early enough to protect perishable inventory.',
    description:
      'This integration record proves that a canonical Problem created through one HTTP client is visible to another independent client without browser-local storage.',
    industry: 'Logistics',
    region: 'Vietnam',
    affectedGroups: ['Small operators'],
    evidence: [],
    desiredOutcome: 'Make verified capacity visible.',
    constraints: [],
    successMetrics: [],
    visibility: 'public',
  }),
});
await request(`/v1/problems/${problem.id}/publish`, { method: 'POST', headers: authHeaders });
const secondClientList = await request('/v1/problems?limit=100');
if (!secondClientList.some((item) => item.id === problem.id))
  fail('A second unauthenticated client could not see the published Problem.');
const post = await request('/v1/posts', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    entityType: 'problem',
    entityId: problem.id,
    title: 'Cross-device evidence request',
    body: 'Which public source would best validate this operational constraint?',
  }),
});
const secondClientPosts = await request(`/v1/posts?entityType=problem&entityId=${problem.id}`);
if (!secondClientPosts.some((item) => item.id === post.id))
  fail('A second client could not see the canonical Post.');
const search = await request('/v1/search?q=Maintenance%20Map%20concept');
if (JSON.stringify(search).includes('Maintenance Map concept'))
  fail('Private submission title leaked through public search.');
const direct = await fetch(`${base}/v1/submissions/62000000-0000-4000-8000-000000000003`);
if (direct.status !== 401)
  fail(`Anonymous direct private UUID read returned ${direct.status}, expected 401.`);
const duplicateEvent = {
  signature: '3'.repeat(88),
  eventIndex: 0,
  eventType: 'Funded',
  slot: '1',
  programId: 'BB2bMK8gwrDk3YG3GFECqnwnFigDoxvKDwJZiTXtzCK6',
  commitment: 'observed',
  payload: { untrusted: true },
};
const eventHeaders = {
  'content-type': 'application/json',
  'x-chain-webhook-secret': 'local-chain-webhook-secret-change-me-12345',
};
const firstEvent = await request('/v1/chain/events', {
  method: 'POST',
  headers: eventHeaders,
  body: JSON.stringify(duplicateEvent),
});
const repeatedEvent = await request('/v1/chain/events', {
  method: 'POST',
  headers: eventHeaders,
  body: JSON.stringify(duplicateEvent),
});
if (!firstEvent.accepted || repeatedEvent.accepted) fail('Chain event idempotency failed.');
console.log(
  JSON.stringify(
    {
      ok: true,
      actorId: actor.id,
      problemId: problem.id,
      postId: post.id,
      crossDeviceProblem: true,
      crossDevicePost: true,
      publicSearchPrivateLeak: false,
      anonymousPrivateUuidStatus: direct.status,
      duplicateChainEventIgnored: true,
    },
    null,
    2,
  ),
);
