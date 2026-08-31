import pg from 'pg';

const client = new pg.Client({
  connectionString:
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});
await client.connect();
const expected: Record<string, number> = {
  problems: 5,
  ideas: 10,
  projects: 3,
  discussions: 10,
  organizations: 2,
  bounties: 2,
  submissions: 3,
};
for (const [table, count] of Object.entries(expected)) {
  const result = await client.query<{ count: string }>(
    `select count(*)::text as count from public.${table}`,
  );
  if (Number(result.rows[0]?.count) !== count)
    throw new Error(`${table}: expected ${count}, received ${result.rows[0]?.count ?? 'missing'}`);
}
const invariant = await client.query<{ invalid: string }>(
  `select count(*)::text as invalid from public.ideas i where i.status='published' and (select count(*) from public.idea_problem_links l where l.idea_id=i.id and l.relationship_type='primary') <> 1`,
);
if (Number(invariant.rows[0]?.invalid) !== 0)
  throw new Error('Published idea primary-problem invariant failed');
const bounties = await client.query<{ status: string }>(
  `select status from public.bounties order by status`,
);
if (
  !bounties.rows.some((row) => row.status === 'unfunded') ||
  !bounties.rows.some((row) => row.status === 'mock_funded')
)
  throw new Error('Expected unfunded and mock-funded dev bounties');
await client.end();
console.log('Seed verified: counts and foundation invariants are valid.');
